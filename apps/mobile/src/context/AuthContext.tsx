// apps/mobile/src/context/AuthContext.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import type { User, LoginInput, RegisterInput } from '@camshare/types';
import { setAccessToken, setUnauthorizedHandler } from '../api/client';
import { authService } from '../services/auth';
import { useAuthStore } from '../stores/authStore';

const REFRESH_KEY = 'camshare_refresh_token';

type AuthContextValue = {
  user: User | null;
  accessToken: string | null;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  googleLogin: (googleAccessToken: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setToken] = useState<string | null>(null);
  const setSessionReady = useAuthStore((s) => s.setSessionReady);

  const applySession = async (access: string, refresh: string, authUser: User) => {
    setAccessToken(access);
    setToken(access);
    setUser(authUser);
    await SecureStore.setItemAsync(REFRESH_KEY, refresh);
  };

  const clearSession = async () => {
    setAccessToken(null);
    setToken(null);
    setUser(null);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
  };

  useEffect(() => {
    setUnauthorizedHandler(() => { clearSession(); });

    const bootstrap = async () => {
      try {
        const stored = await SecureStore.getItemAsync(REFRESH_KEY);
        if (stored) {
          const data = await authService.refresh(stored);
          await applySession(data.tokens.accessToken, data.tokens.refreshToken, data.user);
        }
      } catch {
        await SecureStore.deleteItemAsync(REFRESH_KEY);
      } finally {
        setSessionReady(true);
      }
    };

    bootstrap();
  }, []);

  const login = async (input: LoginInput) => {
    const data = await authService.login(input);
    await applySession(data.tokens.accessToken, data.tokens.refreshToken, data.user);
  };

  const register = async (input: RegisterInput) => {
    const data = await authService.register(input);
    await applySession(data.tokens.accessToken, data.tokens.refreshToken, data.user);
  };

  const googleLogin = async (googleAccessToken: string) => {
    const data = await authService.googleLogin(googleAccessToken);
    await applySession(data.tokens.accessToken, data.tokens.refreshToken, data.user);
  };

  const logout = async () => {
    try { await authService.logout(); } catch { /* ignore — clear locally regardless */ }
    await clearSession();
  };

  const deleteAccount = async () => {
    await authService.deleteAccount();
    try { await clearSession(); } catch { /* SecureStore error — account already deleted server-side */ }
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, login, register, googleLogin, logout, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
