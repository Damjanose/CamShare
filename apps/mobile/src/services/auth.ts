// apps/mobile/src/services/auth.ts
import { apiClient, refreshTokens } from '../api/client';
import type { AuthResponse, LoginInput, RegisterInput, User } from '@camshare/types';

export const authService = {
  login: (input: LoginInput) =>
    apiClient.post<AuthResponse>('/auth/login', input).then((r) => r.data),

  register: (input: RegisterInput) =>
    apiClient.post<AuthResponse>('/auth/register', input).then((r) => r.data),

  logout: () =>
    apiClient.post('/auth/logout').then((r) => r.data),

  me: () =>
    apiClient.get<User>('/auth/me').then((r) => r.data),

  deleteAccount: () =>
    apiClient.delete('/account').then((r) => r.data),

  // Uses refreshTokens (non-intercepted) to avoid triggering the 401 interceptor
  refresh: (refreshToken: string) =>
    refreshTokens(refreshToken),

  googleLogin: (idToken: string | null, accessToken: string) =>
    apiClient
      .post<AuthResponse>('/auth/google', idToken ? { idToken } : { accessToken })
      .then((r) => r.data),

  appleLogin: (identityToken: string, fullName?: string | null) =>
    apiClient.post<AuthResponse>('/auth/apple', { identityToken, fullName }).then((r) => r.data),
};
