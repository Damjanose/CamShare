# Backend contract (REST + Socket.IO)

Base URL defaults to `http://localhost:3001`. The Vite client uses `VITE_API_URL` and `VITE_SOCKET_URL` (same origin by default).

## Auth

- **Bearer access token** on protected routes: `Authorization: Bearer <accessJwt>`.
- Access JWT payload includes `sub` (user id), `sid` (session id), `email`.
- **Refresh** body: `{ "refreshToken": string }` → `{ user, tokens }`.

### Auth routes

| Method | Path | Auth | Notes |
|--------|------|------|--------|
| POST | `/auth/register` | No | Creates user with `product.read` + `category.read`. |
| POST | `/auth/login` | No | |
| POST | `/auth/refresh` | No | |
| POST | `/auth/logout` | Yes | Revokes session. |
| GET | `/auth/me` | Yes | |

## Public catalogue

| Method | Path | Notes |
|--------|------|--------|
| GET | `/categories` | |
| GET | `/categories/:id` | |
| GET | `/categories/:id/products` | |
| GET | `/products` | Query: `featured=true`, `categoryId=<uuid>`. |
| GET | `/products/:id` | Includes `images[]`. |

### Product JSON (camelCase)

- `stockQuantity`, `lowStockThreshold`, `urgencyBadge` (`new` \| `low_stock` \| `sold_out` \| `none`), `featured`, `publishedAt`, `images: [{ id, url, sortOrder }]`.

## Cart (authenticated)

| Method | Path | Body |
|--------|------|------|
| GET | `/cart` | |
| POST | `/cart/items` | `{ productId, quantity }` |
| PATCH | `/cart/items/:productId` | `{ quantity }` (0 removes line) |
| DELETE | `/cart/items/:productId` | |

Response: `{ items: CartLine[], subtotal: string }`.

## Orders

| Method | Path | Auth | Notes |
|--------|------|------|--------|
| GET | `/orders` | Yes | Staff (`admin` or `order.write`): all orders. Others: own orders. |
| GET | `/orders/:id` | Yes | Staff or owner. |
| POST | `/orders/checkout` | Yes | `{ shippingAddress, paymentMethod }` → `OrderDetail` (201). |
| PATCH | `/orders/:id/status` | Yes + `order.write` | `{ status, note? }`. Valid transitions: `pending→confirmed|cancelled`, `confirmed→shipped|cancelled`, `shipped→delivered`. |

### Order statuses

`pending` → `confirmed` → `shipped` → `delivered`; `cancelled` from `pending` or `confirmed`.

### Errors

- 400 with `{ "message": string }` for validation, empty cart, insufficient stock, invalid transition.

## Notifications

| Method | Path | Notes |
|--------|------|--------|
| GET | `/notifications` | Latest 100, newest first. |
| PATCH | `/notifications/:id/read` | |
| POST | `/notifications/read-all` | 204 |

## Admin product writes

Requires `product.write` or `admin`:

- `POST /products`, `PATCH /products/:id`, `DELETE /products/:id`

Category writes require `category.write` or `admin`.

## Socket.IO

- Connect to the **same host** as the API (HTTP server also serves Socket.IO).
- **Handshake auth**: `socket = io(url, { auth: { token: accessJwt } })`.
- Server joins socket to room `user:<userId>`.

### Events (server → client)

| Event | Payload | When |
|-------|---------|------|
| `order:created` | `OrderDetail` | After successful checkout. |
| `order:status_updated` | `{ orderId, status, order: OrderDetail }` | After admin status change. |
| `notification:new` | `{ type, orderId?, status? }` (lightweight) | After notification row created for user. |

Clients should treat events as hints and **refetch** or merge by id (idempotent updates).

## Health

`GET /health` → `{ ok: true }`.
