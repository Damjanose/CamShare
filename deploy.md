# CamShare — Deployment Guide

## Prerequisites

- Docker + Docker Compose installed on the server
- Node.js 22+, pnpm 10+, and EAS CLI (`npm i -g eas-cli`) on your local machine
- Domain `camshare.uplisoft.com` pointing to your server IP
- Expo account logged in: `eas login`

---

## Environment Variables Reference

All env vars across every app, with their development and production values.

### API — `apps/api/.env`

| Variable | Development | Production |
|----------|-------------|------------|
| `DATABASE_URL` | `postgres://postgres:postgres@localhost:5433/template_auth_catalog` | `postgres://postgres:<POSTGRES_PASSWORD>@postgres:5432/template_auth_catalog` |
| `JWT_ACCESS_SECRET` | `dev-access-secret-change-in-production` | strong random string (32+ chars) |
| `JWT_REFRESH_SECRET` | `dev-refresh-secret-change-in-production` | strong random string (32+ chars) |
| `API_PORT` | `3001` | `3001` |
| `NODE_ENV` | _(unset, defaults to `development`)_ | `production` (set by docker-compose) |

> In production, `DATABASE_URL` uses the Docker internal hostname `postgres` (not `localhost`). `NODE_ENV` and `PORT` are injected by `docker-compose.yml` — you do not need them in the server `.env` file.

### Client — `apps/client/.env.*`

| Variable | Development (`.env.example`) | Production (`.env.production`) |
|----------|------------------------------|-------------------------------|
| `VITE_API_URL` | `http://localhost:3001` | `https://camshare.uplisoft.com/api` |
| `VITE_SOCKET_URL` | `http://localhost:3001` | `https://camshare.uplisoft.com` |

> For testing on a physical device over LAN, use your machine's local IP instead of `localhost`, e.g. `http://10.81.202.106:3001`. The production values are baked into the nginx Docker image at build time as `--build-arg`s.

### Mobile — `apps/mobile/.env`

| Variable | Development (fallback in code) | Production (`.env` / `eas.json`) |
|----------|-------------------------------|----------------------------------|
| `EXPO_PUBLIC_API_URL` | `http://localhost:3001` | `https://camshare.uplisoft.com/api` |
| `EXPO_PUBLIC_SOCKET_URL` | `http://localhost:3001` | `https://camshare.uplisoft.com` |

> Development fallbacks are defined in `apps/mobile/src/` via `process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001'`. For EAS builds the production values are set inside `eas.json` under each profile's `env` block — no manual `.env` file needed for cloud builds.

### Root Docker — `.env` (repo root, server only)

| Variable | Development | Production |
|----------|-------------|------------|
| `POSTGRES_PASSWORD` | `postgres` (docker-compose default) | strong password |

---

## 1. Backend (API)

The API runs inside Docker via `docker-compose.yml`. It connects to a Postgres container and is proxied by nginx.

### 1.1 — Environment

On the server, create a `.env` file at the repo root:

```bash
POSTGRES_PASSWORD=your_secure_password
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
```

### 1.2 — First deploy (with SSL)

```bash
# Clone the repo on your server
git clone <repo-url> /opt/camshare
cd /opt/camshare

# Obtain Let's Encrypt certificates (nginx must be stopped beforehand)
chmod +x init-letsencrypt.sh
./init-letsencrypt.sh

# Build and start all services
docker compose up -d --build
```

### 1.3 — Run database migrations + seed

```bash
# Wait for postgres to be healthy, then run from your local machine:
pnpm --filter @camshare/api db:migrate
pnpm --filter @camshare/api db:seed
```

Or exec into the running container:

```bash
docker compose exec api node -e "/* run migrations manually */"
```

### 1.4 — Subsequent deploys

```bash
cd /opt/camshare
git pull
docker compose up -d --build api
```

To rebuild only if API source changed:

```bash
docker compose build api && docker compose up -d api
```

### 1.5 — Verify

```bash
curl https://camshare.uplisoft.com/api/health
docker compose logs -f api
```

---

## 2. Frontend (Client)

The React/Vite SPA is built inside the nginx Docker image and served as static files. It is deployed together with the backend using the same `docker-compose` stack.

### 2.1 — Build args

The nginx `Dockerfile` accepts two build args (defaults already set to production):

| Arg | Default |
|-----|---------|
| `VITE_API_URL` | `https://camshare.uplisoft.com/api` |
| `VITE_SOCKET_URL` | `https://camshare.uplisoft.com` |

### 2.2 — Deploy

The nginx service builds the client and serves it automatically:

```bash
docker compose up -d --build nginx
```

To override the API URL:

```bash
docker compose build \
  --build-arg VITE_API_URL=https://camshare.uplisoft.com/api \
  --build-arg VITE_SOCKET_URL=https://camshare.uplisoft.com \
  nginx
docker compose up -d nginx
```

### 2.3 — Verify

Open `https://camshare.uplisoft.com` in a browser. The SPA loads, `/api/*` requests proxy to the API container, and `/socket.io/` upgrades to WebSocket.

---

## 3. Android

Android builds are handled by **EAS Build** and submitted to the Google Play Console.

### 3.1 — Prerequisites

- EAS CLI: `npm i -g eas-cli`
- Logged in: `eas login` (account: `damjanoda`)
- `google-play-service-account.json` placed at `apps/mobile/google-play-service-account.json`

### 3.2 — Build (App Bundle for Play Store)

```bash
cd apps/mobile

# Production AAB (App Bundle)
eas build --platform android --profile production
```

This produces a signed `.aab` using EAS cloud builders. No local Android SDK required.

For a preview APK (internal distribution / testing):

```bash
eas build --platform android --profile preview
```

### 3.3 — Submit to Google Play

After the build completes, submit directly from EAS:

```bash
eas submit --platform android --profile production
```

This uploads the AAB to the **internal** track on Google Play using the service account key.

To promote from internal → production, do so manually in the [Google Play Console](https://play.google.com/console).

### 3.4 — Version bump

Update `version` in `apps/mobile/app.json` before each release. EAS reads the version from remote (`appVersionSource: remote` in `eas.json`).

---

## 4. iOS

iOS builds are handled by **EAS Build** and submitted to the Apple App Store via App Store Connect.

### 4.1 — Prerequisites

- EAS CLI: `npm i -g eas-cli`
- Logged in: `eas login` (account: `damjanoda`)
- `asc-api-key.p8` placed at `apps/mobile/asc-api-key.p8`
- Apple Team ID: `R72R8C56GK`, App ID: `6772641876`

### 4.2 — Build (Release for App Store)

```bash
cd apps/mobile

# Production IPA (Release configuration)
eas build --platform ios --profile production
```

EAS manages provisioning profiles and signing certificates automatically. No Xcode required on your machine.

For a preview / internal TestFlight build:

```bash
eas build --platform ios --profile preview
```

### 4.3 — Submit to App Store Connect

After the build finishes:

```bash
eas submit --platform ios --profile production
```

This uploads the IPA to App Store Connect using the `.p8` API key. The build will appear in **TestFlight** first — promote it to App Store review from [App Store Connect](https://appstoreconnect.apple.com).

### 4.4 — Version bump

Increment `version` in `apps/mobile/app.json` before each release. EAS manages the build number remotely.

---

## Quick Reference

| Target | Command | Notes |
|--------|---------|-------|
| API (server) | `docker compose up -d --build api` | Run on the VPS |
| Frontend (server) | `docker compose up -d --build nginx` | Run on the VPS |
| Both (server) | `docker compose up -d --build` | Full stack rebuild |
| Android build | `eas build --platform android --profile production` | Run locally |
| Android submit | `eas submit --platform android --profile production` | Run locally |
| iOS build | `eas build --platform ios --profile production` | Run locally |
| iOS submit | `eas submit --platform ios --profile production` | Run locally |
| DB migrate | `pnpm --filter @camshare/api db:migrate` | Run locally against server DB |
| SSL renew | `docker compose run --rm certbot renew` | Handled automatically by certbot container |
