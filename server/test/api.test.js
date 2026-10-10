import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WebSocket } from 'ws';
import { createApp } from '../src/app.js';
import { openDb } from '../src/db.js';

test('register, direct chat, group chat, messages, websocket push', async () => {
  const { server } = createApp(openDb(':memory:'));
  await new Promise((r) => server.listen(0, r));
  const base = `http://localhost:${server.address().port}`;
  const call = async (method, path, body, token) => {
    const res = await fetch(base + path, {
      method, headers: { 'content-type': 'application/json', ...(token && { authorization: `Bearer ${token}` }) },
      body: body && JSON.stringify(body),
    });
    return { status: res.status, body: await res.json() };
  };

  const a = (await call('POST', '/auth/register', { email: 'a@x.io', password: 'secret1', name: 'Аня' })).body;
  const b = (await call('POST', '/auth/register', { email: 'b@x.io', password: 'secret1', name: 'Боб' })).body;
  const c = (await call('POST', '/auth/register', { email: 'c@x.io', password: 'secret1', name: 'Вика' })).body;
  assert.equal((await call('POST', '/auth/register', { email: 'a@x.io', password: 'secret1', name: 'x' })).status, 409);
  assert.equal((await call('POST', '/auth/login', { email: 'a@x.io', password: 'wrong!!' })).status, 401);
  assert.equal((await call('POST', '/auth/login', { email: 'A@x.io', password: 'secret1' })).status, 200);

  const found = await call('GET', '/users?q=Боб', null, a.token);
  assert.equal(found.body[0].id, b.user.id);

  const ws = new WebSocket(`${base.replace('http', 'ws')}/ws?token=${b.token}`);
  await new Promise((r) => ws.on('open', r));
  const incoming = new Promise((r) => ws.on('message', (d) => { const m = JSON.parse(d); if (m.type === 'message') r(m); }));

  const chat = await call('POST', '/chats', { type: 'direct', userId: b.user.id }, a.token);
  const again = await call('POST', '/chats', { type: 'direct', userId: a.user.id }, b.token);
  assert.equal(again.body.id, chat.body.id);

  await call('POST', `/chats/${chat.body.id}/messages`, { text: 'Привет!' }, a.token);
  assert.equal((await incoming).message.text, 'Привет!');

  let list = (await call('GET', '/chats', null, b.token)).body;
  assert.equal(list[0].title, 'Аня');
  assert.equal(list[0].unread, 1);
  await call('POST', `/chats/${chat.body.id}/read`, {}, b.token);
  list = (await call('GET', '/chats', null, b.token)).body;
  assert.equal(list[0].unread, 0);

  assert.equal((await call('GET', `/chats/${chat.body.id}/messages`, null, c.token)).status, 403);

  const group = await call('POST', '/chats', { type: 'group', title: 'Команда', memberIds: [b.user.id, c.user.id] }, a.token);
  await call('POST', `/chats/${group.body.id}/messages`, { text: 'всем привет' }, a.token);
  const msgs = await call('GET', `/chats/${group.body.id}/messages`, null, c.token);
  assert.equal(msgs.body.length, 1);

  ws.close();
  server.close();
});
