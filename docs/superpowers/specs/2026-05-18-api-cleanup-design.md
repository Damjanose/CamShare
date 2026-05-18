# API Cleanup — Design Spec
**Date:** 2026-05-18
**Branch:** frontend

## Goal

Strip all jewelry/e-commerce domain code from `apps/api` and `packages/types`, leaving a clean Express + TypeScript + PostgreSQL + Socket.IO authentication template ready for a new application.

## What's Kept

| File / Module | Reason |
|---|---|
| `src/handlers/auth.ts` | Generic JWT auth handler |
| `src/lib/auth.ts` | Register/login/refresh/logout logic (simplified) |
| `src/lib/tokens.ts` | JWT sign/verify/hash utilities |
| `src/lib/db.ts` | Kysely singleton (auth tables only) |
| `src/middleware/auth.ts` | `requireAuth` middleware (simplified) |
| `src/socketServer.ts` | Socket.IO JWT auth + room setup |
| `src/realtime.ts` | `emitToUser` helper |
| `src/types/express.ts` | `req.auth` augmentation (simplified) |
| `src/index.ts` | Express app (auth routes + health only) |
| `db/migrations/001_init.sql` | Auth tables only (rewritten) |
| `db/migrations/run.ts` | Migration runner |
| `db/migrations/seed.ts` | Admin user seed (simplified) |

## What's Deleted

| File | Reason |
|---|---|
| `src/handlers/cart.ts` | Jewelry domain |
| `src/handlers/categories.ts` | Jewelry domain |
| `src/handlers/orders.ts` | Jewelry domain |
| `src/handlers/products.ts` | Jewelry domain |
| `src/handlers/notifications.ts` | Jewelry domain |
| `src/lib/cart.ts` | Jewelry domain |
| `src/lib/categories.ts` | Jewelry domain |
| `src/lib/orders.ts` | Jewelry domain |
| `src/lib/products.ts` | Jewelry domain |
| `src/lib/notifications.ts` | Jewelry domain |
| `src/lib/serializers.ts` | Jewelry domain |
| `db/migrations/002_commerce.sql` | All jewelry commerce tables |

## Changes to Existing Files

### `packages/types/src/index.ts`
Keep only: `User` (no permissions field), `AuthTokens`, `AuthResponse`, `LoginInput`, `RegisterInput`.

### `packages/types/package.json` + `apps/api/package.json`
Rename `@jewellery/types` → `@app/types`, `@jewellery/api` → `@app/api`. Update all workspace references.

### `apps/api/src/lib/db.ts`
Remove `CategoriesTable`, `ProductsTable`, `ProductImagesTable`, `CartsTable`, `CartItemsTable`, `OrdersTable`, `OrderItemsTable`, `OrderStatusEventsTable`, `NotificationsTable`, `PermissionsTable`, `UserPermissionsTable`. Keep `UsersTable`, `UserDetailsTable`, `AuthSessionsTable`.

### `apps/api/src/lib/auth.ts`
Remove the "grant product.read / category.read permissions on register" block. Remove all permission-related queries. `mapUser` returns user without permissions field.

### `apps/api/src/middleware/auth.ts`
Remove the DB permissions lookup in `requireAuth`. Remove `requirePermission` export entirely. `req.auth` carries only `userId`, `sessionId`, `email`.

### `apps/api/src/types/express.ts`
Remove `PermissionName` import. Simplify `req.auth` to `{ userId, sessionId, email }`.

### `apps/api/src/index.ts`
Remove all domain route imports and route registrations. Keep: health, auth routes.

### `db/migrations/001_init.sql`
Remove `categories` and `products` table DDL + their index. Remove `permissions` and `user_permissions` table DDL + their index. Keep: users, user_details, auth_sessions + their indexes.

### `db/migrations/seed.ts`
Remove permissions seeding, domain data (categories, products). Keep: admin user insert only.

## Database Schema (After)

```
users            — id, email, password_hash, is_active, created_at, updated_at
user_details     — user_id (FK), full_name, created_at, updated_at
auth_sessions    — id, user_id (FK), refresh_token_hash, user_agent, ip_address, expires_at, revoked_at, created_at
```

## API Surface (After)

```
GET  /health
POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/logout      (requireAuth)
GET  /auth/me          (requireAuth)
```

## Package Naming

All `@jewellery/*` references updated to `@app/*` throughout `package.json` files and source imports:
- `packages/types/package.json`: `@jewellery/types` → `@app/types`
- `apps/api/package.json`: `@jewellery/api` → `@app/api`, dependency `@jewellery/types` → `@app/types`
- `db/package.json`: `@jewellery/db` → `@app/db`
- Any source file importing from `@jewellery/types` → `@app/types`

## Out of Scope

- `apps/client` — not touched in this cleanup
- `apps/mobile` — not touched in this cleanup
- Adding any new functionality
