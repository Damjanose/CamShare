# Fix Mixed Content: Photo URLs HTTP vs HTTPS

**Date:** 2026-05-31  
**Commit:** `d05d6da`

## Problem

Photos were not loading on `https://camshare.uplisoft.com`. Two root causes:

1. **Wrong protocol stored** — `handleUpload` built the file URL using `req.protocol + req.get("host")`. Behind nginx (reverse proxy), Express receives HTTP from nginx, so `req.protocol` returned `"http"` even when the user connected over HTTPS. Result: `http://camshare.uplisoft.com/uploads/...` stored in DB, triggering browser mixed-content blocking.

2. **Local IP baked into URL** — Photos uploaded from the mobile app on LAN stored the device's local API IP (e.g. `http://172.20.10.6:3001/uploads/...`). These are permanently unreachable from production.

## What changed

| File | Change |
|------|--------|
| `apps/api/src/index.ts` | Added `app.set("trust proxy", 1)` so `req.protocol` reads `X-Forwarded-Proto` from nginx |
| `apps/api/src/handlers/upload.ts` | Upload URL now uses `process.env.API_BASE_URL` if set, falls back to dynamic host |
| `apps/api/src/lib/eventPhotos.ts` | `normalizePhotoUrl()` rewrites any stored host to `API_BASE_URL` at response time |
| `db/migrations/010_fix_http_urls.sql` | One-time migration replacing `http://camshare.uplisoft.com` with `https://` in all URL columns |

## How the fix works

`normalizePhotoUrl` extracts just the filename from whatever URL is stored in the DB, then prepends `API_BASE_URL`. This means any legacy URL — wrong protocol, wrong IP, wrong domain — is corrected on every API response without a DB migration.

## Required server action

Set in `apps/api/.env` on production:
```
API_BASE_URL=https://camshare.uplisoft.com
```

Then run: `pnpm --filter @camshare/api db:migrate`

## Gotchas

- Without `API_BASE_URL` set, `normalizePhotoUrl` is a no-op (returns stored URL as-is) — photos will still fail until the env var is added
- Local dev is unaffected: no `API_BASE_URL` means fallback to `req.protocol + host` as before
- LAN-uploaded photos (172.x.x.x) will work once `API_BASE_URL` is set; the actual files must exist in `uploads/` on the production server
