import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, connectSocket, disconnectSocket, loadStoredToken, setToken, storeToken, User } from './api';

type AuthState = {
  user: User | null; loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};
const Ctx = createContext<AuthState>(null!);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const t = await loadStoredToken();
        if (t) {
          setToken(t);
          setUser(await api.me());
          connectSocket();
        }
      } catch {
        setToken(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const finish = async (r: { token: string; user: User }) => {
    setToken(r.token);
    await storeToken(r.token);
    setUser(r.user);
    connectSocket();
  };

  return (
    <Ctx.Provider
      value={{
        user, loading,
        signIn: async (e, p) => finish(await api.login(e, p)),
        signUp: async (n, e, p) => finish(await api.register(n, e, p)),
        signOut: async () => {
          disconnectSocket(); setToken(null); await storeToken(null); setUser(null);
        },
      }}>
      {children}
    </Ctx.Provider>
  );
}
