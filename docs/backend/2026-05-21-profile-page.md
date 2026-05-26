# Profile Page — API Layer

**Date:** 2026-05-21  
**Plan:** [superpowers/plans/2026-05-21-profile-page.md](../superpowers/plans/2026-05-21-profile-page.md)

## What changed
Added two new API endpoints for profile editing: update display name/avatar (`PATCH /auth/me`) and change password (`PATCH /auth/me/password`). Added `avatar_url` column to `user_details`.

## Files modified
| File | Change |
|------|--------|
| `db/migrations/006_user_avatar.sql` | New — `ALTER TABLE user_details ADD COLUMN IF NOT EXISTS avatar_url TEXT` |
| `apps/api/src/lib/db.ts` | Added `avatar_url: string \| null` to `UserDetailsTable` |
| `apps/api/src/lib/auth.ts` | Updated `mapUser` to include `avatar_url`; added `updateMe()`, `changePassword()` |
| `apps/api/src/handlers/auth.ts` | Added `updateMe`, `changePassword` handlers + error case in `handleError` |
| `apps/api/src/index.ts` | Registered `PATCH /auth/me` and `PATCH /auth/me/password` |

## Gotchas / non-obvious decisions
- Avatar upload itself reuses the existing `POST /upload` endpoint — no new upload route
- `packages/types` not modified — client uses its own `apps/client/src/types/domain.ts` User type
- `changePassword` verifies current password before allowing change (prevents session hijacking)
- Migration is `006_` — runs before `007_event_upload_limits`
