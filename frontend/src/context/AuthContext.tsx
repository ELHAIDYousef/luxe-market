import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '../types';
import api from '../services/api';

interface AuthCtx {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isLoading: boolean;   // ← NEW: true while rehydrating, prevents premature redirects
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx | null>(null);

const TOKEN_KEY   = 'lx_token';
const REFRESH_KEY = 'lx_refresh';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,      setUser]      = useState<User | null>(null);
  const [token,     setToken]     = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // starts true — rehydrating

  // ── Rehydrate session from localStorage on app mount ──────────────────────
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      // No token at all — not logged in, done loading
      setIsLoading(false);
      return;
    }
    setToken(stored);
    // Validate token by fetching the user profile
    api.get('/auth/me')
      .then(res => {
        setUser(mapApiUser(res.data));
        setIsLoading(false);
      })
      .catch(() => {
        // Access token expired — try refresh
        const refresh = localStorage.getItem(REFRESH_KEY);
        if (!refresh) {
          _clearSession();
          setIsLoading(false);
          return;
        }
        api.post('/auth/refresh', { refresh_token: refresh })
          .then(res => {
            const { access_token, user: u } = res.data;
            localStorage.setItem(TOKEN_KEY, access_token);
            setToken(access_token);
            setUser(mapApiUser(u));
          })
          .catch(() => _clearSession())
          .finally(() => setIsLoading(false));
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const _clearSession = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    setUser(null);
    setToken(null);
  };

  const login = async (email: string, password: string): Promise<string | null> => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { access_token, refresh_token, user: u } = res.data;
      localStorage.setItem(TOKEN_KEY, access_token);
      localStorage.setItem(REFRESH_KEY, refresh_token);
      setToken(access_token);
      setUser(mapApiUser(u));
      return u.role;
    } catch {
      return null;
    }
  };

  const logout = () => {
    _clearSession();
    window.location.href = '/login';
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(mapApiUser(res.data));
    } catch {
      logout();
    }
  };

  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = isSuperAdmin || user?.role === 'admin' || user?.role === 'editor';

  return (
    <AuthContext.Provider value={{
      user, token, isAuthenticated: !!user,
      isAdmin, isSuperAdmin, isLoading,
      login, logout, refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

function mapApiUser(data: any): User {
  return {
    id:          data.id,
    name:        data.name,
    email:       data.email,
    role:        data.role,
    status:      data.status,
    avatar:      data.avatar_url ?? undefined,
    lastLogin:   data.last_login ?? undefined,
    memberSince: data.member_since ?? undefined,
  };
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
