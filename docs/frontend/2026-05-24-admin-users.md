# Admin Users List Page

**Date:** 2026-05-24  
**Plan:** [superpowers/plans/2026-05-24-admin-users-list.md](../superpowers/plans/2026-05-24-admin-users-list.md)

## What changed
Added admin-only `/admin/users` page listing all registered users. Surfaced `permissions[]` from auth response to derive `isAdmin` on the client.

## Files modified
| File | Change |
|------|--------|
| `apps/client/src/types/domain.ts` | Added `isAdmin: boolean` to `User` type |
| `apps/client/src/stores/authStore.ts` | Threaded `permissions` through `toWebUser()` to derive `isAdmin` |
| `apps/client/src/stores/authStore.test.ts` | Added `isAdmin` tests; updated `mockUser()` |
| `apps/client/src/auth/AdminRoute.tsx` | New — route guard redirecting non-admins |
| `apps/client/src/services/adminService.ts` | New — `listUsers()` API call wrapping `GET /admin/users` |
| `apps/client/src/pages/UsersPage.tsx` | New — table with loading/error/data states |
| `apps/client/src/components/layout/SidebarNav.tsx` | Show "Users" item only when `user.isAdmin` |
| `apps/client/src/App.tsx` | Registered `/admin/users` route wrapped in `AdminRoute` |

## Gotchas / non-obvious decisions
- `permissions[]` was already in the API auth response but `toWebUser()` was discarding it — no API change needed
- `isAdmin` is derived (`permissions.includes('admin')`), not stored separately on backend
