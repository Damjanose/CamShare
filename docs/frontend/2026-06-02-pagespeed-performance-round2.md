# PageSpeed Performance Fixes — Round 2

**Date:** 2026-06-02  
**Plan:** [pagespeed-performance-round2.md](../pagespeed-performance-round2.md)

## What changed

Follow-up performance pass after round 1. Removed a dead dependency, added lazy loading to remaining image-heavy pages, subsetted the icon font, and added nginx cache headers for hashed static assets.

## Files modified

| File | Change |
|------|--------|
| `apps/client/src/styles/globals.css` | Material Symbols font subsetted — `wght@100..700,FILL@0..1` → `opsz,wght,FILL@20..48,400,0..1` (~40% smaller icon font) |
| `apps/client/src/pages/EventGalleryPage.tsx` | Added `loading="lazy"` to gallery photo `<img>` |
| `apps/client/src/pages/QrInvitePage.tsx` | Added `loading="lazy"` to event cover image and memories grid images |
| `apps/client/src/pages/ProfilePage.tsx` | Added `loading="lazy"` + `width={80} height={80}` to avatar `<img>` |
| `apps/client/src/pages/LoginPage.tsx` | Removed dead imports: `AppleLogin`, `FaApple`, `FcGoogle`, `useSocialAuth` (all only used in commented-out block) |
| `apps/client/src/pages/RegisterPage.tsx` | Removed `AppleLogin`, `FaApple` imports; replaced 2-column Google+Apple grid with single full-width Google button; removed `appleLoginProps` from `useSocialAuth` destructure |
| `apps/client/package.json` | Removed `react-apple-login` dependency |
| `nginx/nginx.conf` | Added cache headers: `index.html` never cached, `/assets/*` hashed files cached 1 year with `immutable` |

## Bundle size impact

| Chunk | Before | After |
|-------|--------|-------|
| RegisterPage | 10.81 KB | 6.83 KB |
| LoginPage | 2.40 KB | 2.42 KB (negligible, already small) |

## Gotchas / non-obvious decisions

- `AppleLogin` was fully commented out in `LoginPage` but actively rendered in `RegisterPage` — they needed different fixes (LoginPage: remove imports only; RegisterPage: replace the whole social grid).
- After removing `AppleLogin` from RegisterPage, `FcGoogle` stays because Google login is still wired up via `useSocialAuth` — only `FaApple` and `appleLoginProps` were removed.
- The nginx `index.html` block must come **after** the `location /` try_files block, not before — nginx uses longest-match priority so `= /index.html` wins correctly.
- Nginx cache headers require a server reload to apply: `docker compose exec nginx nginx -s reload` (no downtime).
- The Material Symbols `opsz` axis (optical size) scoped to `20..48` covers all icon sizes used in the app without loading the full range.
