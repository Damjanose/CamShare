# Admin Users Endpoint

**Date:** 2026-05-24  
**Plan:** [superpowers/plans/2026-05-24-admin-users-list.md](../superpowers/plans/2026-05-24-admin-users-list.md)

## What changed
Added `GET /admin/users` endpoint (admin-only) that joins `users` + `user_details` and returns id, email, full name, join date.

## Files modified
| File | Change |
|------|--------|
| `apps/api/src/lib/admin.ts` | New — `listUsers()` Kysely query, returns `AdminUserDto[]` |
| `apps/api/src/handlers/admin.ts` | New — Express handler calling `listUsers()` |
| `apps/api/src/index.ts` | Registered `GET /admin/users` behind `requirePermission('admin')` |

## Gotchas / non-obvious decisions
- API already returned `permissions[]` in auth response but client was stripping it — threading `permissions` through `toWebUser()` was the fix (see frontend session)
- Soft-deleted users excluded via `where("u.deleted_at", "is", null)` 
- Results ordered newest-first (`orderBy created_at desc`)
- No test runner on API side — verification is TypeScript typecheck only
