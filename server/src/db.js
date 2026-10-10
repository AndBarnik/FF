import { DatabaseSync } from 'node:sqlite';

export function openDb(path = process.env.DB_PATH || 'messenger.db') {
  const db = new DatabaseSync(path);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK (type IN ('direct','group')),
      title TEXT,
      created_by INTEGER NOT NULL REFERENCES users(id),
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS chat_members (
      chat_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id),
      last_read_id INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (chat_id, user_id)
    );
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
      sender_id INTEGER NOT NULL REFERENCES users(id),
      kind TEXT NOT NULL DEFAULT 'text',
      text TEXT,
      media_url TEXT,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_messages_chat ON messages(chat_id, id);
  `);
  return db;
}
