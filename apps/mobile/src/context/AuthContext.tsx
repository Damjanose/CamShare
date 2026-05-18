import { createContext, useContext, useState, type ReactNode } from 'react';

type User = {
  id: string;
  name: string;
  email: string;
  permissions: string[];
};

type AuthContextValue = {
  user: User | null;
  accessToken: string | null;
  logout: () => void;
  googleLogin: () => void;
  appleLogin: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const MOCK_USER: User = {
  id: '1',
  name: 'Demo User',
  email: 'demo@example.com',
  permissions: [],
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  function googleLogin() {
    setUser(MOCK_USER);
    setAccessToken('mock-access-token');
  }

  function appleLogin() {
    setUser(MOCK_USER);
    setAccessToken('mock-access-token');
  }

  function logout() {
    setUser(null);
    setAccessToken(null);
  }

  return (
    <AuthContext.Provider value={{ user, accessToken, logout, googleLogin, appleLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
