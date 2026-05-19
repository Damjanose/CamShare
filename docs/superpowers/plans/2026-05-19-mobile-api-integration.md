# Mobile API Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the mobile app's mock/bare-fetch layer with a full API client (axios + TanStack Query + Zustand + Socket.IO) wired to the real backend.

**Architecture:** An axios singleton (`api/client.ts`) handles auth token injection and refresh. Nine `services/` files cover every API domain. Four Zustand stores manage client state. TanStack Query handles server-state caching. A Socket.IO connection managed by `lib/socket.ts` drives real-time updates.

**Tech Stack:** Expo SDK 54, React Native 0.81.5, React 19, axios, @tanstack/react-query v5, zustand, socket.io-client, expo-secure-store (already installed), @camshare/types (workspace package)

**Spec:** `docs/superpowers/specs/2026-05-19-mobile-api-integration-design.md`

---

### Task 1: Install dependencies

**Files:**
- Modify: `apps/mobile/package.json`

- [ ] **Step 1: Add npm dependencies**

Run from repo root:
```bash
pnpm --filter @camshare/mobile add axios @tanstack/react-query zustand socket.io-client@^4
```

`socket.io-client@^4` is pinned to v4.x — compatible with React Native 0.81.5 and Expo SDK 54. Do not use v5+.

- [ ] **Step 2: Add workspace types package**

```bash
pnpm --filter @camshare/mobile add @camshare/types --workspace
```

- [ ] **Step 3: Verify**

```bash
pnpm --filter @camshare/mobile list axios @tanstack/react-query zustand socket.io-client @camshare/types
```
Expected: all five packages listed with version numbers.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/package.json pnpm-lock.yaml
git commit -m "chore(mobile): add axios, react-query, zustand, socket.io-client, @camshare/types"
```

---

### Task 2: Environment config

**Files:**
- Create: `apps/mobile/src/config/env.ts`

- [ ] **Step 1: Create env.ts**

```ts
// apps/mobile/src/config/env.ts
export const ENV = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001',
  socketUrl: process.env.EXPO_PUBLIC_SOCKET_URL ?? 'http://localhost:3001',
};
```

- [ ] **Step 2: Create apps/mobile/.env.example (committed template)**

```
# apps/mobile/.env.example
EXPO_PUBLIC_API_URL=http://localhost:3001
EXPO_PUBLIC_SOCKET_URL=http://localhost:3001
```

- [ ] **Step 3: Create apps/mobile/.env (local, not committed)**

Copy `.env.example` to `.env`:
```bash
cp apps/mobile/.env.example apps/mobile/.env
```

On a physical device replace `localhost` with your machine's LAN IP (e.g. `192.168.1.x`). Without this, values fall through to `localhost:3001` which works on simulators but fails on real devices.

Check that `apps/mobile/.env` is in `.gitignore`. Add it if not:
```
apps/mobile/.env
```

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/config/env.ts apps/mobile/.env.example
git commit -m "feat(mobile): add env config and .env.example template"
```

---

### Task 3: Axios client with auth interceptors

**Files:**
- Create: `apps/mobile/src/api/client.ts`

The axios instance must:
1. Inject `Authorization: Bearer <token>` on every request via a request interceptor
2. On 401: use a separate non-intercepted axios instance to call `/auth/refresh`, update the token, retry the original request, and call the unauthorized handler if refresh fails (prevents infinite retry loop)
3. Export `setAccessToken` and `setUnauthorizedHandler` so `AuthContext` can wire them up

- [ ] **Step 1: Create api/client.ts**

```ts
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
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/src/api/client.ts
git commit -m "feat(mobile): add axios client with token injection and refresh interceptor"
```

---

### Task 4: Zustand stores

**Files:**
- Create: `apps/mobile/src/stores/authStore.ts`
- Create: `apps/mobile/src/stores/cartStore.ts`
- Create: `apps/mobile/src/stores/notificationStore.ts`
- Create: `apps/mobile/src/stores/socketStore.ts`

- [ ] **Step 1: Create authStore.ts**

```ts
// apps/mobile/src/stores/authStore.ts
import { create } from 'zustand';

type AuthState = {
  sessionReady: boolean;
  setSessionReady: (ready: boolean) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  sessionReady: false,
  setSessionReady: (ready) => set({ sessionReady: ready }),
}));
```

- [ ] **Step 2: Create cartStore.ts**

```ts
// apps/mobile/src/stores/cartStore.ts
import { create } from 'zustand';
import type { CartLine } from '@camshare/types';

type CartState = {
  items: CartLine[];
  count: number;
  setCart: (items: CartLine[]) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>((set) => ({
  items: [],
  count: 0,
  setCart: (items) =>
    set({ items, count: items.reduce((sum, i) => sum + i.quantity, 0) }),
  clear: () => set({ items: [], count: 0 }),
}));
```

- [ ] **Step 3: Create notificationStore.ts**

```ts
// apps/mobile/src/stores/notificationStore.ts
import { create } from 'zustand';

type NotificationState = {
  unreadCount: number;
  bump: () => void;
  reset: () => void;
};

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  bump: () => set((s) => ({ unreadCount: s.unreadCount + 1 })),
  reset: () => set({ unreadCount: 0 }),
}));
```

- [ ] **Step 4: Create socketStore.ts**

```ts
// apps/mobile/src/stores/socketStore.ts
import { create } from 'zustand';

type SocketState = {
  connected: boolean;
  setConnected: (v: boolean) => void;
};

export const useSocketStore = create<SocketState>((set) => ({
  connected: false,
  setConnected: (connected) => set({ connected }),
}));
```

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/stores/
git commit -m "feat(mobile): add zustand stores (auth, cart, notifications, socket)"
```

---

### Task 5: Auth service and rewrite AuthContext

**Files:**
- Create: `apps/mobile/src/services/auth.ts`
- Rewrite: `apps/mobile/src/context/AuthContext.tsx`
- Delete: `apps/mobile/src/api/auth.ts` (superseded)

The new `AuthContext`:
- Bootstraps session on mount by reading `camshare_refresh_token` from SecureStore and calling `/auth/refresh`
- Calls `setAccessToken` + `setUnauthorizedHandler` from `api/client.ts`
- Sets `authStore.sessionReady = true` after bootstrap (success or failure)
- Exposes `login`, `register`, `logout`, `user`, `accessToken`

- [ ] **Step 1: Create services/auth.ts**

```ts
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

  // Uses refreshTokens (non-intercepted) to avoid triggering the 401 interceptor
  refresh: (refreshToken: string) =>
    refreshTokens(refreshToken),
};
```

- [ ] **Step 2: Rewrite context/AuthContext.tsx**

```tsx
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
  logout: () => Promise<void>;
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

  const logout = async () => {
    try { await authService.logout(); } catch { /* ignore — clear locally regardless */ }
    await clearSession();
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
```

- [ ] **Step 3: Delete old api/auth.ts**

The spec architecture diagram listed `api/auth.ts` as "replace existing bare fetch file", implying a file at that path would still exist. In this plan the auth logic lives at `services/auth.ts` (domain-service pattern) and `api/client.ts` (axios instance). The `api/auth.ts` file is fully superseded and has no remaining callers after this task — delete it rather than keeping an empty shim:

```bash
git rm apps/mobile/src/api/auth.ts
```

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/services/auth.ts apps/mobile/src/context/AuthContext.tsx
git commit -m "feat(mobile): real JWT auth with expo-secure-store bootstrap and token refresh"
```

---

### Task 6: Event, channel, and photo services

**Files:**
- Create: `apps/mobile/src/services/events.ts`
- Create: `apps/mobile/src/services/channels.ts`
- Create: `apps/mobile/src/services/photos.ts`

- [ ] **Step 1: Create services/events.ts**

```ts
// apps/mobile/src/services/events.ts
import { apiClient } from '../api/client';
import type {
  Event,
  EventMember,
  CreateEventInput,
  UpdateEventInput,
  JoinEventInput,
} from '@camshare/types';

export const eventsService = {
  list: () =>
    apiClient.get<Event[]>('/events').then((r) => r.data),

  get: (id: string) =>
    apiClient.get<Event>(`/events/${id}`).then((r) => r.data),

  create: (input: CreateEventInput) =>
    apiClient.post<Event>('/events', input).then((r) => r.data),

  update: (id: string, input: UpdateEventInput) =>
    apiClient.patch<Event>(`/events/${id}`, input).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/events/${id}`).then((r) => r.data),

  // Returns the joined Event (the event you become a member of)
  join: (input: JoinEventInput) =>
    apiClient.post<Event>('/events/join', input).then((r) => r.data),

  createJoinToken: (id: string) =>
    apiClient.post<{ token: string }>(`/events/${id}/join-token`).then((r) => r.data),

  getMembers: (id: string) =>
    apiClient.get<EventMember[]>(`/events/${id}/members`).then((r) => r.data),
};
```

- [ ] **Step 2: Create services/channels.ts**

```ts
// apps/mobile/src/services/channels.ts
import { apiClient } from '../api/client';
import type { EventChannel, CreateChannelInput } from '@camshare/types';

export const channelsService = {
  list: (eventId: string) =>
    apiClient.get<EventChannel[]>(`/events/${eventId}/channels`).then((r) => r.data),

  create: (eventId: string, input: CreateChannelInput) =>
    apiClient.post<EventChannel>(`/events/${eventId}/channels`, input).then((r) => r.data),

  update: (eventId: string, channelId: string, input: Partial<CreateChannelInput>) =>
    apiClient
      .patch<EventChannel>(`/events/${eventId}/channels/${channelId}`, input)
      .then((r) => r.data),

  delete: (eventId: string, channelId: string) =>
    apiClient.delete(`/events/${eventId}/channels/${channelId}`).then((r) => r.data),
};
```

- [ ] **Step 3: Create services/photos.ts**

```ts
// apps/mobile/src/services/photos.ts
import { apiClient } from '../api/client';
import type { EventPhoto, AddPhotoInput } from '@camshare/types';

export const photosService = {
  list: (eventId: string, channelId: string) =>
    apiClient
      .get<EventPhoto[]>(`/events/${eventId}/channels/${channelId}/photos`)
      .then((r) => r.data),

  add: (eventId: string, channelId: string, input: AddPhotoInput) =>
    apiClient
      .post<EventPhoto>(`/events/${eventId}/channels/${channelId}/photos`, input)
      .then((r) => r.data),

  delete: (eventId: string, channelId: string, photoId: string) =>
    apiClient
      .delete(`/events/${eventId}/channels/${channelId}/photos/${photoId}`)
      .then((r) => r.data),
};
```

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/services/events.ts apps/mobile/src/services/channels.ts apps/mobile/src/services/photos.ts
git commit -m "feat(mobile): add events, channels, photos API services"
```

---

### Task 7: Remaining domain services

**Files:**
- Create: `apps/mobile/src/services/products.ts`
- Create: `apps/mobile/src/services/categories.ts`
- Create: `apps/mobile/src/services/cart.ts`
- Create: `apps/mobile/src/services/orders.ts`
- Create: `apps/mobile/src/services/notifications.ts`

- [ ] **Step 1: Create services/products.ts**

```ts
// apps/mobile/src/services/products.ts
import { apiClient } from '../api/client';
import type { Product, CreateProductInput, UpdateProductInput } from '@camshare/types';

export const productsService = {
  list: () =>
    apiClient.get<Product[]>('/products').then((r) => r.data),

  get: (id: string) =>
    apiClient.get<Product>(`/products/${id}`).then((r) => r.data),

  create: (input: CreateProductInput) =>
    apiClient.post<Product>('/products', input).then((r) => r.data),

  update: (id: string, input: UpdateProductInput) =>
    apiClient.patch<Product>(`/products/${id}`, input).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/products/${id}`).then((r) => r.data),
};
```

- [ ] **Step 2: Create services/categories.ts**

```ts
// apps/mobile/src/services/categories.ts
import { apiClient } from '../api/client';
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '@camshare/types';

export const categoriesService = {
  list: () =>
    apiClient.get<Category[]>('/categories').then((r) => r.data),

  get: (id: string) =>
    apiClient.get<Category>(`/categories/${id}`).then((r) => r.data),

  create: (input: CreateCategoryInput) =>
    apiClient.post<Category>('/categories', input).then((r) => r.data),

  update: (id: string, input: UpdateCategoryInput) =>
    apiClient.patch<Category>(`/categories/${id}`, input).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/categories/${id}`).then((r) => r.data),
};
```

- [ ] **Step 3: Create services/cart.ts**

```ts
// apps/mobile/src/services/cart.ts
import { apiClient } from '../api/client';
import type { CartLine, CartResponse } from '@camshare/types';

export const cartService = {
  get: () =>
    apiClient.get<CartResponse>('/cart').then((r) => r.data),

  addItem: (productId: string, quantity: number) =>
    apiClient.post<CartLine>('/cart/items', { productId, quantity }).then((r) => r.data),

  updateItem: (productId: string, quantity: number) =>
    apiClient.patch<CartLine>(`/cart/items/${productId}`, { quantity }).then((r) => r.data),

  removeItem: (productId: string) =>
    apiClient.delete(`/cart/items/${productId}`).then((r) => r.data),
};
```

- [ ] **Step 4: Create services/orders.ts**

```ts
// apps/mobile/src/services/orders.ts
import { apiClient } from '../api/client';
import type {
  OrderSummary,
  OrderDetail,
  CheckoutInput,
  OrderStatus,
} from '@camshare/types';

export const ordersService = {
  list: () =>
    apiClient.get<OrderSummary[]>('/orders').then((r) => r.data),

  get: (id: string) =>
    apiClient.get<OrderDetail>(`/orders/${id}`).then((r) => r.data),

  checkout: (input: CheckoutInput) =>
    apiClient.post<OrderDetail>('/orders/checkout', input).then((r) => r.data),

  updateStatus: (id: string, status: OrderStatus, note?: string) =>
    apiClient
      .patch<OrderDetail>(`/orders/${id}/status`, { status, note })
      .then((r) => r.data),
};
```

- [ ] **Step 5: Create services/notifications.ts**

```ts
// apps/mobile/src/services/notifications.ts
import { apiClient } from '../api/client';
import type { NotificationDto } from '@camshare/types';

export const notificationsService = {
  list: () =>
    apiClient.get<NotificationDto[]>('/notifications').then((r) => r.data),

  markRead: (id: string) =>
    apiClient.patch(`/notifications/${id}/read`).then((r) => r.data),

  markAllRead: () =>
    apiClient.post('/notifications/read-all').then((r) => r.data),
};
```

- [ ] **Step 6: Note on cartStore wiring**

`cartStore.setCart` is designed to be called from any screen that uses `cartService.get()`. The pattern is:

```tsx
const { data } = useQuery({ queryKey: ['cart'], queryFn: cartService.get });
const setCart = useCartStore((s) => s.setCart);

useEffect(() => {
  if (data) setCart(data.items);
}, [data]);
```

No screen currently uses the cart on mobile — this wiring is not needed for this plan. When a cart screen is added in the future, follow this pattern.

- [ ] **Step 7: Commit**

```bash
git add apps/mobile/src/services/products.ts apps/mobile/src/services/categories.ts apps/mobile/src/services/cart.ts apps/mobile/src/services/orders.ts apps/mobile/src/services/notifications.ts
git commit -m "feat(mobile): add products, categories, cart, orders, notifications services"
```

---

### Task 8: Socket.IO real-time

**Files:**
- Create: `apps/mobile/src/lib/socket.ts`
- Create: `apps/mobile/src/hooks/useSocketLifecycle.ts`

- [ ] **Step 1: Create lib/socket.ts**

```ts
// apps/mobile/src/lib/socket.ts
import { io, type Socket } from 'socket.io-client';
import { ENV } from '../config/env';
import { useNotificationStore } from '../stores/notificationStore';
import { useSocketStore } from '../stores/socketStore';

let socket: Socket | null = null;

export function connectRealtime(accessToken: string, onInvalidate: () => void) {
  if (socket?.connected) return;

  socket = io(ENV.socketUrl, {
    auth: { token: accessToken },
    transports: ['websocket'],
  });

  socket.on('connect', () => {
    useSocketStore.getState().setConnected(true);
  });

  socket.on('disconnect', () => {
    useSocketStore.getState().setConnected(false);
  });

  socket.on('order:created', onInvalidate);
  socket.on('order:status_updated', onInvalidate);
  socket.on('notification:new', () => {
    useNotificationStore.getState().bump();
    onInvalidate();
  });
}

export function disconnectRealtime() {
  socket?.disconnect();
  socket = null;
  useSocketStore.getState().setConnected(false);
}
```

- [ ] **Step 2: Create hooks/useSocketLifecycle.ts**

```ts
// apps/mobile/src/hooks/useSocketLifecycle.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { connectRealtime, disconnectRealtime } from '../lib/socket';
import { useAuth } from '../context/AuthContext';

export function useSocketLifecycle() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!accessToken) {
      disconnectRealtime();
      return;
    }

    connectRealtime(accessToken, () => queryClient.invalidateQueries());

    return () => disconnectRealtime();
  }, [accessToken]);
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/lib/socket.ts apps/mobile/src/hooks/useSocketLifecycle.ts
git commit -m "feat(mobile): add Socket.IO connection and useSocketLifecycle hook"
```

---

### Task 9: Wire App.tsx and update screens

**Files:**
- Modify: `apps/mobile/App.tsx`
- Modify: `apps/mobile/src/screens/LoginScreen.tsx`
- Modify: `apps/mobile/src/screens/HomeScreen.tsx`

**Context:** Current `App.tsx` wraps everything in `<SafeAreaProvider><AuthProvider><NavigationContainer>`. We need to:
1. Add `<QueryClientProvider>` as the outermost wrapper
2. Add a `sessionReady` gate so the navigation renders only after bootstrap completes
3. Call `useSocketLifecycle()` inside an inner component that has access to both `AuthContext` and `QueryClient`

- [ ] **Step 1: Modify App.tsx**

Read `apps/mobile/App.tsx` first, then apply these changes.

`Colors` is already imported in `App.tsx` (`import { Colors } from './src/constants/colors'`). Confirm the import exists before adding `AppContent` — it is needed for the loading background.

Add imports after existing imports:
```ts
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './src/stores/authStore';
import { useSocketLifecycle } from './src/hooks/useSocketLifecycle';
```

Add before the `Stack` declaration:
```ts
const queryClient = new QueryClient();
```

Add a new `AppContent` component between `RootNavigator` and `App`:
```tsx
function AppContent() {
  const sessionReady = useAuthStore((s) => s.sessionReady);
  useSocketLifecycle();

  // Hold rendering until bootstrap (token restore) completes
  if (!sessionReady) {
    return <View style={{ flex: 1, backgroundColor: Colors.surface }} />;
  }

  return (
    <NavigationContainer>
      <RootNavigator />
      <StatusBar style="light" backgroundColor="transparent" translucent />
    </NavigationContainer>
  );
}
```

Replace the `App` component return to move `NavigationContainer` inside `AppContent`:
```tsx
export default function App() {
  const [fontsLoaded] = useFonts({ /* same fonts */ });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: Colors.surface }} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
```

- [ ] **Step 2: Update LoginScreen to support email/password login**

Read `apps/mobile/src/screens/LoginScreen.tsx` first to understand the current JSX structure. The screen calls `googleLogin()` and `appleLogin()` from `useAuth()` — both are stubs. Keep them as-is. Add a real email/password form below the OAuth buttons so the app is testable without OAuth.

Changes to make:
1. Merge `useState` into the existing `react` import (don't add a duplicate)
2. Add `Alert` and `TextInput` to the existing `react-native` import
3. The screen already imports `useAuth` — destructure `login` from it alongside the existing `googleLogin`/`appleLogin`
4. Add state: `const [email, setEmail] = useState('')` and `const [password, setPassword] = useState('')`
5. Add handler:
```tsx
const handleEmailLogin = async () => {
  try {
    await login({ email, password });
  } catch (e: any) {
    Alert.alert('Login failed', e?.response?.data?.message ?? e.message);
  }
};
```
6. Add below the existing OAuth buttons in the JSX (before the closing `</View>` of the button group):
```tsx
<TextInput
  placeholder="Email"
  placeholderTextColor="#888"
  autoCapitalize="none"
  keyboardType="email-address"
  value={email}
  onChangeText={setEmail}
  style={{ color: '#fff', borderBottomWidth: 1, borderColor: '#444', marginTop: 24, paddingVertical: 8 }}
/>
<TextInput
  placeholder="Password"
  placeholderTextColor="#888"
  secureTextEntry
  value={password}
  onChangeText={setPassword}
  style={{ color: '#fff', borderBottomWidth: 1, borderColor: '#444', marginTop: 12, paddingVertical: 8 }}
/>
<TouchableOpacity onPress={handleEmailLogin} style={{ marginTop: 16 }}>
  <Text style={{ color: '#f2ca50', textAlign: 'center' }}>Sign in with email</Text>
</TouchableOpacity>
```

- [ ] **Step 3: Update EventCard and PastMemoryCard to accept API Event type**

Read `apps/mobile/src/components/ui/EventCard.tsx` and `apps/mobile/src/components/ui/PastMemoryCard.tsx` first, then apply these changes.

The current card components import `Event` from `../../data/events` which has different field names than the API `Event` type from `@camshare/types`. Update both components:

**In `apps/mobile/src/components/ui/EventCard.tsx`:**
- Replace `import { Event } from '../../data/events'` with `import type { Event } from '@camshare/types'`
- Replace `event.coverUri` with `event.coverImageUrl ?? undefined` (coverImageUrl can be null)
- Replace `event.date` with `event.eventDate ?? ''`
- Remove any usage of `event.location`, `event.tag`, `event.photoCount` — these don't exist on the API type. Either omit them from the display or show empty strings.

**In `apps/mobile/src/components/ui/PastMemoryCard.tsx`:**
- Replace `import { Event } from '../../data/events'` with `import type { Event } from '@camshare/types'`
- Replace `event.coverUri` with `event.coverImageUrl ?? undefined`
- Replace `event.date` with `event.eventDate ?? ''`
- Remove any usage of `event.location`, `event.tag`, `event.photoCount`

- [ ] **Step 4: Update HomeScreen to fetch real events**

In `apps/mobile/src/screens/HomeScreen.tsx`:

Replace the static imports:
```ts
// Remove:
import { ACTIVE_EVENTS, PAST_MEMORIES } from '../data/events';
// (also remove the Event import from data/events if present)

// Add:
import { useQuery } from '@tanstack/react-query';
import { eventsService } from '../services/events';
```

Replace the static data usage with React Query:
```tsx
const { data: events = [], isLoading } = useQuery({
  queryKey: ['events'],
  queryFn: eventsService.list,
});

const activeEvents = events.filter((e) => e.isActive);
const pastEvents = events.filter((e) => !e.isActive);
```

Replace all references to `ACTIVE_EVENTS` with `activeEvents` and `PAST_MEMORIES` with `pastEvents`.

Add a loading indicator — when `isLoading` is true, render a centered `ActivityIndicator` from `react-native` instead of the lists.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/App.tsx apps/mobile/src/screens/LoginScreen.tsx apps/mobile/src/screens/HomeScreen.tsx apps/mobile/src/components/ui/EventCard.tsx apps/mobile/src/components/ui/PastMemoryCard.tsx
git commit -m "feat(mobile): wire QueryClientProvider, session gate, real events in HomeScreen"
```

---

### Task 10: Typecheck

- [ ] **Step 1: Run typecheck**

```bash
pnpm --filter @camshare/mobile typecheck
```
Expected: no errors. Fix any TypeScript errors before proceeding.

- [ ] **Step 2: Commit any fixes**

```bash
git add -p
git commit -m "fix(mobile): typecheck errors from API integration"
```

---

### Task 11: Manual smoke test

- [ ] **Step 1: Start the backend**

```bash
docker compose up -d
pnpm --filter @camshare/api db:migrate
pnpm --filter @camshare/api db:seed
pnpm --filter @camshare/api dev
```

- [ ] **Step 2: Start the mobile app**

```bash
cd apps/mobile && npx expo start --clear
```

- [ ] **Step 3: Verify login works**

Open on a simulator/device. Enter credentials `admin@example.com` / `Admin123!` via the email/password form added in Task 9. Expected: navigates to HomeScreen.

- [ ] **Step 4: Verify HomeScreen shows API data**

HomeScreen should display events from the API (empty list is fine if no events exist). Expected: no crash, no mock data fallback.

- [ ] **Step 5: Verify token persistence**

Close and reopen the app. Expected: session restored without login (bootstrap flow runs, navigates directly to Home).
