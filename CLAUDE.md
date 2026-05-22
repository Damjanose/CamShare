# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

CamShare — event photo-sharing monorepo with a React (Vite) client, Express + TypeScript API, PostgreSQL (via Kysely ORM), and Socket.IO for realtime updates.

**Package manager: pnpm 10+**

## Commands

### Root (runs all packages in parallel)
```bash
pnpm install          # install all workspaces
pnpm dev              # start API + client concurrently
pnpm build            # build all workspaces
pnpm lint             # lint all workspaces
pnpm typecheck        # typecheck all workspaces
```

### API only (`apps/api`)
```bash
pnpm --filter @camshare/api dev          # tsx watch src/index.ts
pnpm --filter @camshare/api build        # tsc compile
pnpm --filter @camshare/api typecheck
pnpm --filter @camshare/api db:migrate   # run SQL migrations
pnpm --filter @camshare/api db:seed      # seed default data (admin user etc.)
```

### Client only (`apps/client`)
```bash
pnpm --filter @camshare/client dev       # vite dev server
pnpm --filter @camshare/client build     # tsc + vite build
pnpm --filter @camshare/client test      # vitest run
pnpm --filter @camshare/client typecheck
```

### Database
```bash
docker compose up -d   # start Postgres on host port 5433
```
Default `DATABASE_URL`: `postgres://postgres:postgres@localhost:5433/template_auth_catalog`

## Environment Setup

Copy `.env.example` to `apps/api/.env` and set:
- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`

Optional client env at `apps/client/.env.development`:
- `VITE_API_URL` (default: `http://localhost:3001`)
- `VITE_SOCKET_URL` (default: `http://localhost:3001`)

Default admin credentials: `admin@example.com` / `Admin123!`

## Architecture

### Workspace layout
| Package | Role |
|---|---|
| `apps/api` | Express REST API + Socket.IO server |
| `apps/client` | Vite + React 19 SPA (storefront + admin UI) |
| `packages/types` | Shared TypeScript types consumed by both apps |
| `db` | SQL migrations (`db/migrations/*.sql`) and seed script |

### API (`apps/api/src`)
- **`index.ts`** — Express app wiring: registers all routes with `requireAuth`/`requirePermission` middleware, creates HTTP server, attaches Socket.IO.
- **`handlers/`** — Thin route handlers (auth, cart, categories, notifications, orders, products). Each delegates to a corresponding `lib/` module.
- **`lib/`** — Business logic and Kysely DB queries. `db.ts` defines all Kysely table interfaces and exports the `db` singleton.
- **`middleware/auth.ts`** — `requireAuth` (JWT bearer) and `requirePermission(name)` middleware.
- **`socketServer.ts`** — Socket.IO setup; authenticates connections via JWT in `handshake.auth.token`, joins each socket to a `user:<id>` room.
- **`realtime.ts`** — Module-level `io` singleton with `emitToUser(userId, event, payload)` helper used by order/notification handlers to push events.

### Client (`apps/client/src`)
- **`types/auth-context.tsx`** — `AuthProvider` + `useAuth` hook. Manages `accessToken` (in-memory) and `refreshToken` (localStorage under key `template_refresh_token`). Bootstraps session on mount via `/auth/refresh`.
- **`api/client.ts`** — Axios instance; `AuthProvider` attaches `Authorization` header via interceptor when `accessToken` changes.
- **`config/env.ts`** — `getEnv()` reads `VITE_API_URL` and `VITE_SOCKET_URL` with localhost fallbacks.
- **`lib/socket.ts`** — `connectRealtime(accessToken, onInvalidate)` / `disconnectRealtime()`. Handles `order:created`, `order:status_updated`, `notification:new` events by calling `onInvalidate()` (triggers React Query refetch) and bumping `notificationStore`.
- **`stores/`** — Zustand stores: `authStore` (session ready flag), `cartStore`, `orderStore`, `productStore`, `notificationStore` (unread ping counter), `socketStore` (connected flag).
- **`services/`** — Per-domain API calls (products, orders, auth, cart, notifications, admin) wrapping `apiClient`.
- **`hooks/useSocketLifecycle.ts`** — Connects/disconnects Socket.IO based on `accessToken` from `useAuth`.
- **`App.tsx`** — Route tree using React Router v7. `ProtectedRoute` requires auth; `StaffRoute` requires `admin`, `product.write`, or `order.write` permission.

### Permissions model
Permissions are stored in DB and attached to `User` in `packages/types`. Values: `admin`, `product.read`, `product.write`, `category.read`, `category.write`, `order.read`, `order.write`. Staff detection on the client checks for `admin | product.write | order.write`.

### Shared types (`packages/types/src/index.ts`)
Single source of truth for all domain types: `User`, `Product`, `Category`, `Order*`, `Notification*`, `Cart*`, input types, and `UrgencyBadge` (`"new" | "low_stock" | "sold_out" | "none"`).

### Realtime flow
1. After login, `useSocketLifecycle` calls `connectRealtime(accessToken, invalidate)`.
2. Socket authenticates via JWT in handshake, joins `user:<id>` room server-side.
3. On order status change or new notification, API calls `emitToUser(userId, event, payload)`.
4. Client receives event, calls `onInvalidate()` to refetch React Query queries and pings `notificationStore`.
