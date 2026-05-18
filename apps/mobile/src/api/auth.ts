const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

export type User = {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  permissions: string[];
};

export type AuthResponse = {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
};

export async function loginApi(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? 'Invalid email or password');
  }

  return res.json();
}
