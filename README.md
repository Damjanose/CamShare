# Jewellery e-commerce (full stack)

Monorepo: **React (Vite) client**, **Express + TypeScript API**, **PostgreSQL** (Docker or local), with **Socket.IO** for order/notification hints.

## Prerequisites

- Node.js 20+
- pnpm 10+
- Docker Desktop (recommended) or local Postgres

## First-time setup

### 1) Install

```bash
pnpm install
```

### 2) Environment

Copy [.env.example](.env.example) to `apps/api/.env` and set at minimum:

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`

Optional: `apps/client/.env.development` (see [.env.example](.env.example) for `VITE_*` defaults).

### 3) Database

**Docker (recommended)**

```bash
docker compose up -d
```

Use in `apps/api/.env`:

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5433/template_auth_catalog
```

**Local Postgres** — create DB `template_auth_catalog` and point `DATABASE_URL` at your role.

### 4) Migrate & seed

```bash
pnpm --filter @jewellery/api db:migrate
pnpm --filter @jewellery/api db:seed
```

### 5) Development

```bash
pnpm dev
```

- API + Socket.IO: `http://localhost:3001`
- Client: `http://localhost:5173`

## Default admin

- Email: `admin@example.com`
- Password: `Admin123!`

## Features

- Public **catalogue** (categories, products, featured filter, product images, urgency badges, stock).
- **Cart** and **checkout** (MVP: simulated payment choice + shipping text).
- **Orders** with status timeline and staff transitions (`order.write` or `admin`).
- **Notifications** persisted + pushed over **Socket.IO** (`order:created`, `order:status_updated`, `notification:new`).
- **Admin** UI for products and orders (staff permissions).

## API & realtime contract

See [docs/backend-contract.md](docs/backend-contract.md).

## QA

See [docs/qa-checklist.md](docs/qa-checklist.md).

## Troubleshooting

- **Docker not running** — start Docker Desktop before `docker compose up -d`.
- **`role "postgres" does not exist`** — use Docker Postgres or adjust `DATABASE_URL` to your local role.
- **JWT errors** — ensure `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are set in `apps/api/.env`.
- **CORS / API URL** — set `VITE_API_URL` to the API origin if not using localhost:3001.

## Packages

| Package | Description |
|---------|-------------|
| `apps/client` | Vite + React storefront & admin UI |
| `apps/api` | Express API + Socket.IO |
| `packages/types` | Shared TypeScript types |
| `db` | SQL migrations + seed script |
