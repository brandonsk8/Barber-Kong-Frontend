import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi } from '../api/auth.api.js';
import { getToken, setToken } from '../api/client.js';

const USER_KEY = 'barberkong_user';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  });
  const [ready, setReady] = useState(false);

  // Al montar, si hay token guardado intentamos refrescar el usuario contra /auth/me.
  // Si ese endpoint aún no existe (backend en stub) o falla, seguimos con lo que había
  // en localStorage en vez de forzar un logout — así el frontend no queda bloqueado
  // mientras EP-01 se termina de implementar.
  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      const token = getToken();
      if (token) {
        try {
          const { user: freshUser } = await authApi.me();
          if (!cancelled && freshUser) {
            setUser(freshUser);
            localStorage.setItem(USER_KEY, JSON.stringify(freshUser));
          }
        } catch {
          // silencioso: /auth/me puede no estar implementado todavía
        }
      }
      if (!cancelled) setReady(true);
    }
    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((token, nextUser) => {
    setToken(token);
    setUser(nextUser);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
  }, []);

  const login = useCallback(
    async (credentials) => {
      const res = await authApi.login(credentials);
      if (res.requiresTwoFactor) {
        return { requiresTwoFactor: true, userId: res.userId };
      }
      persist(res.token, res.user);
      return { requiresTwoFactor: false, user: res.user };
    },
    [persist]
  );

  const verifyTwoFactor = useCallback(
    async (data) => {
      const res = await authApi.verifyTwoFactor(data);
      persist(res.token, res.user);
      return res.user;
    },
    [persist]
  );

  const register = useCallback((data) => authApi.register(data), []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(USER_KEY);
  }, []);

  const value = {
    user,
    ready,
    isAuthenticated: Boolean(user),
    login,
    verifyTwoFactor,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
