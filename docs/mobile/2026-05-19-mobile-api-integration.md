# Mobile API Integration

**Date:** 2026-05-19  
**Plan:** [superpowers/plans/2026-05-19-mobile-api-integration.md](../superpowers/plans/2026-05-19-mobile-api-integration.md)

## What changed
Replaced the mobile app's mock/bare-fetch layer with a full production API client: axios singleton, nine service files, four Zustand stores, TanStack Query for server state, and Socket.IO for real-time updates.

## Files modified
| File | Change |
|------|--------|
| `apps/mobile/package.json` | Added `axios`, `@tanstack/react-query`, `zustand`, `socket.io-client@^4`, `@camshare/types` |
| `apps/mobile/src/api/client.ts` | New — axios singleton with auth token injection + refresh interceptor |
| `apps/mobile/src/services/` | New — 9 files covering auth, events, photos, notifications, and other domains |
| `apps/mobile/src/stores/` | New — 4 Zustand stores for client state |
| `apps/mobile/src/lib/socket.ts` | New — Socket.IO connection with JWT handshake |
| `apps/mobile/app entry` | Wrapped in `QueryClientProvider` |

## Gotchas / non-obvious decisions
- `socket.io-client` pinned to `^4` (not v5) — v5 is incompatible with React Native 0.81.5 + Expo SDK 54
- Token refresh logic lives in axios interceptor in `api/client.ts` — all services use the singleton
- `@camshare/types` is a workspace package (`--workspace` flag required when adding)
- Auth tokens stored in `expo-secure-store` (already installed before this session)
