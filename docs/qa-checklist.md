# QA checklist — jewellery e-commerce monorepo

Run with Docker Postgres (`docker compose up -d`), `.env` in `apps/api/`, then `pnpm --filter @jewellery/api db:migrate` and `db:seed`, then `pnpm dev`.

## Database & API

- [ ] `GET /health` returns 200.
- [ ] `pnpm --filter @jewellery/api db:migrate` applies `001_init.sql` and `002_commerce.sql` without error on a fresh DB.
- [ ] Seed completes; admin login `admin@example.com` / `Admin123!`.

## Catalogue (public, no auth)

- [ ] `GET /categories` returns jewellery categories.
- [ ] `GET /products` returns products with `images`, `urgencyBadge`, `stockQuantity`.
- [ ] `GET /products?featured=true` returns only featured rows.

## Auth

- [ ] Register new user; receives tokens and can call `GET /auth/me`.
- [ ] Logout revokes refresh; subsequent refresh fails gracefully on client.

## Cart & checkout

- [ ] Add to cart (authenticated); `GET /cart` shows lines and subtotal.
- [ ] Checkout with address + payment method creates order `pending`, clears cart, decrements stock.
- [ ] Insufficient stock returns 400.

## Orders

- [ ] Customer `GET /orders` lists only their orders.
- [ ] Admin `GET /orders` lists all orders.
- [ ] `PATCH /orders/:id/status` as admin moves lifecycle; invalid transition returns 400.
- [ ] Order detail includes `timeline` events.

## Notifications

- [ ] After checkout, customer has a notification.
- [ ] After admin status change, customer has a new notification.
- [ ] Mark one read / mark all read works.

## Realtime

- [ ] With two browser sessions (customer), placing an order or admin update triggers socket event and UI refresh (orders/notifications) without full page reload.

## Client UI

- [ ] Home shows featured and new sections.
- [ ] Product detail, cart, checkout, orders, notifications, admin (staff user) all reachable.
- [ ] `pnpm --filter @jewellery/client test` passes.

## Env

- [ ] `VITE_API_URL` / `VITE_SOCKET_URL` override defaults when set.
