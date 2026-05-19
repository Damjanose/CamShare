# CamShare

Event photo-sharing platform. Guests join events via QR code, upload and browse photos organized in channels, and get real-time updates — all with a cinematic dark UI.

**Stack:** React (Vite) web client · Expo React Native mobile app · Express + TypeScript API · PostgreSQL · Socket.IO

---

## What it does

- **Events** — create an event, generate a QR join token, share it with guests
- **Channels** — organize photos within an event by moment or theme (ceremony, reception, etc.)
- **Photo sharing** — guests upload photos to channels; everyone in the event sees them
- **Real-time** — Socket.IO pushes new photos, order status changes, and notifications live
- **E-commerce** — product catalogue, cart, checkout, and order management with staff permissions
- **Admin** — staff roles (`admin`, `product.write`, `order.write`) for managing products and orders

---

## Monorepo layout

| Package | Description |
|---------|-------------|
| `apps/api` | Express REST API + Socket.IO server |
| `apps/client` | Vite + React 19 web SPA (storefront + admin) |
| `apps/mobile` | Expo SDK 54 React Native app (iOS + Android) |
| `packages/types` | Shared TypeScript types consumed by all apps |
| `db` | SQL migrations + seed script |

---

## Prerequisites

- Node.js 20+
- pnpm 10+
- Docker Desktop (for Postgres) — or a local Postgres instance

---

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Environment variables

Copy `.env.example` to `apps/api/.env` and set:

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5433/template_auth_catalog
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
```

Optional web client overrides in `apps/client/.env.development`:

```env
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
```

Optional mobile overrides in `apps/mobile/.env`:

```env
EXPO_PUBLIC_API_URL=http://localhost:3001
EXPO_PUBLIC_SOCKET_URL=http://localhost:3001
```

### 3. Start the database

```bash
docker compose up -d
```

### 4. Migrate and seed

```bash
pnpm --filter @camshare/api db:migrate
pnpm --filter @camshare/api db:seed
```

Seed creates a default admin user:

- **Email:** `admin@example.com`
- **Password:** `Admin123!`

### 5. Start development servers

```bash
pnpm dev          # API + web client in parallel
```

- API + Socket.IO: `http://localhost:3001`
- Web client: `http://localhost:5173`

**Mobile app:**

```bash
cd apps/mobile
npx expo start --clear
```

Scan the QR code with Expo Go or run on a simulator.

---

## Common commands

```bash
pnpm dev              # start API + web client
pnpm build            # build all workspaces
pnpm lint             # lint all workspaces
pnpm typecheck        # typecheck all workspaces

pnpm --filter @camshare/api db:migrate
pnpm --filter @camshare/api db:seed
```

---

## Architecture notes

- **Auth** — JWT access tokens (short-lived, in-memory) + refresh tokens (persisted in `localStorage` on web, `expo-secure-store` on mobile). Silent refresh on 401.
- **Realtime** — Socket.IO authenticates via JWT in the handshake; server emits `order:created`, `order:status_updated`, `notification:new` to per-user rooms.
- **Permissions** — `admin`, `product.read/write`, `category.read/write`, `order.read/write`. Staff routes require `admin | product.write | order.write`.
- **ORM** — [Kysely](https://kysely.dev) for type-safe SQL queries.

See [docs/backend-contract.md](docs/backend-contract.md) for the full API and Socket.IO event reference.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Docker not running | Start Docker Desktop before `docker compose up -d` |
| `role "postgres" does not exist` | Use Docker Postgres or adjust `DATABASE_URL` to your local role |
| JWT errors on startup | Ensure `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are set |
| CORS / wrong API URL | Set `VITE_API_URL` (web) or `EXPO_PUBLIC_API_URL` (mobile) to the API origin |
| Metro bundler cache issues | `npx expo start --clear` |
