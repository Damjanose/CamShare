# Mobile API Integration Design

**Date:** 2026-05-19  
**Scope:** Full API parity for `apps/mobile` — auth, events, channels, photos, products, categories, cart, orders, notifications, and real-time Socket.IO

---

## Overview

Replace the mobile app's bare fetch-based `api/auth.ts` and mock `AuthContext` with a full API client layer matching the web client's architecture. Add TanStack Query for server state, Zustand for client state, and Socket.IO for real-time updates.

---

## Architecture

Mirror the web client (`apps/client/src`) structure inside `apps/mobile/src`:

```
apps/mobile/src/
├── api/
│   ├── client.ts        — axios instance + auth/refresh interceptors
│   └── auth.ts          — replace existing bare fetch file
├── services/
│   ├── auth.ts
│   ├── events.ts
│   ├── channels.ts
│   ├── photos.ts
│   ├── products.ts
│   ├── categories.ts
│   ├── cart.ts
│   ├── orders.ts
│   └── notifications.ts
├── stores/
│   ├── authStore.ts
│   ├── cartStore.ts
│   ├── notificationStore.ts
│   └── socketStore.ts
├── hooks/
│   └── useSocketLifecycle.ts
├── lib/
│   └── socket.ts
├── context/
│   └── AuthContext.tsx   — rewrite with real JWT + expo-secure-store
└── config/
    └── env.ts            — EXPO_PUBLIC_API_URL + EXPO_PUBLIC_SOCKET_URL
```

---

## New Dependencies

- `axios` — HTTP client
- `@tanstack/react-query` — server state / caching
- `zustand` — client state
- `socket.io-client` — real-time connection

---

## Auth Flow & Token Management

- `accessToken` — in-memory only (React state in AuthContext)
- `refreshToken` — persisted in `expo-secure-store` (key: `camshare_refresh_token`)
- On app mount: read refresh token from secure store → call `POST /auth/refresh` → restore session
- Axios request interceptor: attach `Authorization: Bearer <accessToken>` on every request
- Axios response interceptor: catch `401` → call `/auth/refresh` once → retry original request → logout if refresh fails (prevents infinite loops)
- `authStore.sessionReady` flag set after bootstrap completes

---

## Services

One file per domain in `services/`, exporting plain async functions calling the axios client:

| File | Functions |
|------|-----------|
| `auth.ts` | login, register, logout, me, refresh |
| `events.ts` | list, get, create, update, delete, join, createJoinToken, getMembers |
| `channels.ts` | list, create, update, delete |
| `photos.ts` | list, add, delete |
| `products.ts` | list, get, create, update, delete |
| `categories.ts` | list, get, create, update, delete |
| `cart.ts` | get, addItem, updateItem, removeItem |
| `orders.ts` | list, get, checkout, updateStatus |
| `notifications.ts` | list, markRead, markAllRead |

---

## React Query

- `App.tsx` wrapped in `<QueryClientProvider>`
- Screens use `useQuery` / `useMutation` directly with service functions
- Query key conventions: `['events']`, `['events', id]`, `['events', id, 'channels']`, `['cart']`, `['orders']`, etc.

---

## Zustand Stores

| Store | State |
|-------|-------|
| `authStore` | `sessionReady: boolean` |
| `cartStore` | `items: CartLine[]`, `count: number` |
| `notificationStore` | `unreadCount: number` |
| `socketStore` | `connected: boolean` |

---

## Socket.IO Real-time

`lib/socket.ts`:
- `connectRealtime(accessToken, onInvalidate)` — connects with JWT in handshake auth
- `disconnectRealtime()` — cleans up connection
- Listens: `order:created`, `order:status_updated`, `notification:new`
- On event: calls `onInvalidate()` (React Query cache invalidation) + bumps `notificationStore.unreadCount`
- Updates `socketStore.connected`

`hooks/useSocketLifecycle.ts`:
- Called in root navigator
- Connects when `accessToken` is set, disconnects on logout or unmount
- `onInvalidate` calls `queryClient.invalidateQueries()` for relevant keys

---

## config/env.ts

```ts
export const ENV = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001',
  socketUrl: process.env.EXPO_PUBLIC_SOCKET_URL ?? 'http://localhost:3001',
};
```

---

## Error Handling

- Axios interceptor handles 401 refresh globally
- Services throw errors; screens handle via React Query `error` state or `onError` callbacks
- Network errors surface as React Query error state; no silent swallowing
