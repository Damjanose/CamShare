// apps/mobile/src/api/client.ts
import axios, { type InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import type { AuthResponse } from '@camshare/types';
import { ENV } from '../config/env';

const REFRESH_KEY = 'camshare_refresh_token';

let _accessToken: string | null = null;
let _onUnauthorized: (() => void) | null = null;

export function setAccessToken(token: string | null) {
  _accessToken = token;
}

export function setUnauthorizedHandler(handler: () => void) {
  _onUnauthorized = handler;
}

export const apiClient = axios.create({
  baseURL: ENV.apiUrl,
  headers: { 'Content-Type': 'application/json' },
});

// Separate client for refresh calls — no interceptors, avoids infinite loop
const refreshClient = axios.create({
  baseURL: ENV.apiUrl,
  headers: { 'Content-Type': 'application/json' },
});

// Exported so services/auth.ts can call refresh without going through the interceptor
export function refreshTokens(refreshToken: string) {
  return refreshClient
    .post<AuthResponse>('/auth/refresh', { refreshToken })
    .then((r) => r.data);
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (_accessToken) {
    config.headers.Authorization = `Bearer ${_accessToken}`;
  }
  return config;
});

let isRefreshing = false;
let pendingQueue: Array<(token: string) => void> = [];

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    original._retry = true;

    if (isRefreshing) {
      return new Promise((resolve) => {
        pendingQueue.push((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          resolve(apiClient(original));
        });
      });
    }

    isRefreshing = true;
    try {
      const storedRefresh = await SecureStore.getItemAsync(REFRESH_KEY);
      if (!storedRefresh) throw new Error('no refresh token');

      const data = await refreshTokens(storedRefresh);

      const newAccess = data.tokens.accessToken;
      setAccessToken(newAccess);
      await SecureStore.setItemAsync(REFRESH_KEY, data.tokens.refreshToken);

      pendingQueue.forEach((cb) => cb(newAccess));
      pendingQueue = [];

      original.headers.Authorization = `Bearer ${newAccess}`;
      return apiClient(original);
    } catch {
      pendingQueue = [];
      _onUnauthorized?.();
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  },
);
