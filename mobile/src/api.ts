import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

export const API_URL: string = Constants.expoConfig?.extra?.apiUrl ?? 'http://localhost:3000';
const WS_URL = API_URL.replace(/^http/, 'ws') + '/ws';

export type User = { id: number; name: string; email: string };
export type Message = {
  id: number; chatId: number; senderId: number; kind: string;
  text: string | null; mediaUrl: string | null; createdAt: number;
};
export type Chat = {
  id: number; type: 'direct' | 'group'; title: string; members: User[];
  lastMessage: Message | null; unread: number;
};

let token: string | null = null;
export const setToken = (t: string | null) => { token = t; };
export const loadStoredToken = () => SecureStore.getItemAsync('token');
export const storeToken = (t: string | null) =>
  t ? SecureStore.setItemAsync('token', t) : SecureStore.deleteItemAsync('token');

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(API_URL + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Ошибка ${res.status}`);
  return data as T;
}

export const api = {
  register: (name: string, email: string, password: string) =>
    request<{ token: string; user: User }>('POST', '/auth/register', { name, email, password }),
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('POST', '/auth/login', { email, password }),
  me: () => request<User>('GET', '/me'),
  searchUsers: (q: string) => request<User[]>('GET', `/users?q=${encodeURIComponent(q)}`),
  chats: () => request<Chat[]>('GET', '/chats'),
  createDirect: (userId: number) => request<{ id: number }>('POST', '/chats', { type: 'direct', userId }),
  createGroup: (title: string, memberIds: number[]) =>
    request<{ id: number }>('POST', '/chats', { type: 'group', title, memberIds }),
  messages: (chatId: number) => request<Message[]>('GET', `/chats/${chatId}/messages`),
  send: (chatId: number, text: string) => request<Message>('POST', `/chats/${chatId}/messages`, { text }),
  markRead: (chatId: number) => request<{ ok: boolean }>('POST', `/chats/${chatId}/read`, {}),
};

type Listener = (event: { type: string; message?: Message; chatId?: number }) => void;
const listeners = new Set<Listener>();
let ws: WebSocket | null = null;
let retry: ReturnType<typeof setTimeout> | undefined;

export function connectSocket() {
  disconnectSocket();
  if (!token) return;
  const open = () => {
    ws = new WebSocket(`${WS_URL}?token=${token}`);
    ws.onmessage = (e) => listeners.forEach((l) => l(JSON.parse(String(e.data))));
    ws.onclose = () => { if (token) retry = setTimeout(open, 2000); };
  };
  open();
}
export function disconnectSocket() {
  clearTimeout(retry);
  const s = ws; ws = null;
  if (s) { s.onclose = null; s.close(); }
}
export function onSocketEvent(l: Listener) {
  listeners.add(l);
  return () => { listeners.delete(l); };
}
