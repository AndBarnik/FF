import express from 'express';
import cors from 'cors';
import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';
import { openDb } from './db.js';
import { authMiddleware, hashPassword, signToken, verifyPassword, verifyToken } from './auth.js';

export function createApp(db = openDb()) {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  const sockets = new Map(); // userId -> Set<ws>
  const push = (userIds, payload) => {
    const data = JSON.stringify(payload);
    for (const id of userIds) for (const ws of sockets.get(id) ?? []) ws.send(data);
  };

  const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email });
  const memberIds = (chatId) =>
    db.prepare('SELECT user_id FROM chat_members WHERE chat_id = ?').all(chatId).map((r) => r.user_id);
  const isMember = (chatId, userId) =>
    !!db.prepare('SELECT 1 FROM chat_members WHERE chat_id = ? AND user_id = ?').get(chatId, userId);
  const toMessage = (m) => ({
    id: m.id, chatId: m.chat_id, senderId: m.sender_id, kind: m.kind,
    text: m.text, mediaUrl: m.media_url, createdAt: m.created_at,
  });

  // ---- auth ----
  app.post('/auth/register', (req, res) => {
    const { email, password, name } = req.body ?? {};
    if (!email?.includes('@') || !name?.trim() || (password ?? '').length < 6)
      return res.status(400).json({ error: 'Нужны имя, email и пароль от 6 символов' });
    try {
      const r = db.prepare('INSERT INTO users (email, name, password_hash, created_at) VALUES (?,?,?,?)')
        .run(email.toLowerCase().trim(), name.trim(), hashPassword(password), Date.now());
      const id = Number(r.lastInsertRowid);
      res.json({ token: signToken(id), user: { id, name: name.trim(), email: email.toLowerCase().trim() } });
    } catch {
      res.status(409).json({ error: 'Этот email уже занят' });
    }
  });

  app.post('/auth/login', (req, res) => {
    const { email, password } = req.body ?? {};
    const u = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email ?? '').toLowerCase().trim());
    if (!u || !verifyPassword(String(password ?? ''), u.password_hash))
      return res.status(401).json({ error: 'Неверный email или пароль' });
    res.json({ token: signToken(u.id), user: publicUser(u) });
  });

  app.get('/me', authMiddleware, (req, res) => {
    res.json(publicUser(db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId)));
  });

  app.get('/users', authMiddleware, (req, res) => {
    const q = `%${String(req.query.q ?? '').trim()}%`;
    const rows = db.prepare('SELECT * FROM users WHERE id != ? AND (name LIKE ? OR email LIKE ?) ORDER BY name LIMIT 30')
      .all(req.userId, q, q);
    res.json(rows.map(publicUser));
  });

  // ---- chats ----
  app.get('/chats', authMiddleware, (req, res) => {
    const chats = db.prepare(
      `SELECT c.*, cm.last_read_id FROM chats c JOIN chat_members cm ON cm.chat_id = c.id
       WHERE cm.user_id = ?`).all(req.userId);
    const out = chats.map((c) => {
      const members = db.prepare(
        'SELECT u.* FROM users u JOIN chat_members m ON m.user_id = u.id WHERE m.chat_id = ?').all(c.id).map(publicUser);
      const last = db.prepare('SELECT * FROM messages WHERE chat_id = ? ORDER BY id DESC LIMIT 1').get(c.id);
      const unread = db.prepare(
        'SELECT COUNT(*) n FROM messages WHERE chat_id = ? AND id > ? AND sender_id != ?').get(c.id, c.last_read_id, req.userId).n;
      const other = c.type === 'direct' ? members.find((m) => m.id !== req.userId) : null;
      return {
        id: c.id, type: c.type, title: c.type === 'group' ? c.title : other?.name ?? 'Чат',
        members, lastMessage: last ? toMessage(last) : null, unread,
        sortKey: last?.created_at ?? c.created_at,
      };
    });
    out.sort((a, b) => b.sortKey - a.sortKey);
    res.json(out);
  });

  app.post('/chats', authMiddleware, (req, res) => {
    const { type, userId, title, memberIds: ids } = req.body ?? {};
    const exists = (id) => !!db.prepare('SELECT 1 FROM users WHERE id = ?').get(id);
    let members;
    if (type === 'direct') {
      if (!userId || userId === req.userId || !exists(userId)) return res.status(400).json({ error: 'Неверный пользователь' });
      const existing = db.prepare(
        `SELECT c.id FROM chats c
         JOIN chat_members a ON a.chat_id = c.id AND a.user_id = ?
         JOIN chat_members b ON b.chat_id = c.id AND b.user_id = ?
         WHERE c.type = 'direct'`).get(req.userId, userId);
      if (existing) return res.json({ id: existing.id });
      members = [req.userId, userId];
    } else if (type === 'group') {
      const others = [...new Set(ids ?? [])].filter((id) => id !== req.userId && exists(id));
      if (!title?.trim() || others.length < 1) return res.status(400).json({ error: 'Нужны название и хотя бы один участник' });
      members = [req.userId, ...others];
    } else return res.status(400).json({ error: 'Неверный тип чата' });

    const r = db.prepare('INSERT INTO chats (type, title, created_by, created_at) VALUES (?,?,?,?)')
      .run(type, type === 'group' ? title.trim() : null, req.userId, Date.now());
    const id = Number(r.lastInsertRowid);
    const ins = db.prepare('INSERT INTO chat_members (chat_id, user_id) VALUES (?,?)');
    for (const m of members) ins.run(id, m);
    push(members, { type: 'chat', chatId: id });
    res.status(201).json({ id });
  });

  app.get('/chats/:id/messages', authMiddleware, (req, res) => {
    const chatId = Number(req.params.id);
    if (!isMember(chatId, req.userId)) return res.status(403).json({ error: 'forbidden' });
    const before = Number(req.query.before) || Number.MAX_SAFE_INTEGER;
    const rows = db.prepare('SELECT * FROM messages WHERE chat_id = ? AND id < ? ORDER BY id DESC LIMIT 50')
      .all(chatId, before);
    res.json(rows.reverse().map(toMessage));
  });

  app.post('/chats/:id/messages', authMiddleware, (req, res) => {
    const chatId = Number(req.params.id);
    if (!isMember(chatId, req.userId)) return res.status(403).json({ error: 'forbidden' });
    const text = String(req.body?.text ?? '').trim();
    if (!text || text.length > 4000) return res.status(400).json({ error: 'Пустое или слишком длинное сообщение' });
    const r = db.prepare('INSERT INTO messages (chat_id, sender_id, kind, text, created_at) VALUES (?,?,?,?,?)')
      .run(chatId, req.userId, 'text', text, Date.now());
    const msg = toMessage(db.prepare('SELECT * FROM messages WHERE id = ?').get(r.lastInsertRowid));
    db.prepare('UPDATE chat_members SET last_read_id = ? WHERE chat_id = ? AND user_id = ?').run(msg.id, chatId, req.userId);
    push(memberIds(chatId), { type: 'message', message: msg });
    res.status(201).json(msg);
  });

  app.post('/chats/:id/read', authMiddleware, (req, res) => {
    const chatId = Number(req.params.id);
    if (!isMember(chatId, req.userId)) return res.status(403).json({ error: 'forbidden' });
    db.prepare(
      `UPDATE chat_members SET last_read_id = COALESCE((SELECT MAX(id) FROM messages WHERE chat_id = ?), 0)
       WHERE chat_id = ? AND user_id = ?`).run(chatId, chatId, req.userId);
    res.json({ ok: true });
  });

  // ---- http + websocket ----
  const server = createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });
  wss.on('connection', (ws, req) => {
    const token = new URL(req.url, 'http://x').searchParams.get('token');
    const userId = verifyToken(token);
    if (!userId) return ws.close(4401);
    if (!sockets.has(userId)) sockets.set(userId, new Set());
    sockets.get(userId).add(ws);
    ws.on('close', () => sockets.get(userId)?.delete(ws));
  });

  return { app, server, db };
}
