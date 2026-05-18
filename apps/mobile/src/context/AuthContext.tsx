import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useState, type ReactNode } from 'react';
import { loginApi, type User } from '../api/auth';

const REFRESH_TOKEN_KEY = 'secure_store_refresh_token';

type AuthContextValue = {
  user: User | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  googleLogin: () => Promise<void>;
  appleLogin: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  async function login(email: string, password: string) {
    const { user, tokens } = await loginApi(email, password);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken);
    setAccessToken(tokens.accessToken);
    setUser(user);
  }

  async function logout() {
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    setAccessToken(null);
    setUser(null);
  }

  async function googleLogin() {
    // TODO: implement Google OAuth via expo-auth-session
    console.warn('Google login not yet implemented');
  }

  async function appleLogin() {
    // TODO: implement Apple OAuth via expo-auth-session
    console.warn('Apple login not yet implemented');
  }

  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout, googleLogin, appleLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
