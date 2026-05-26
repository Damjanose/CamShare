# Profile Page

**Date:** 2026-05-21  
**Plan:** [superpowers/plans/2026-05-21-profile-page.md](../superpowers/plans/2026-05-21-profile-page.md)

## What changed
Added `/profile` route with Personal Info card (name + avatar) and Security card (change password).

## Files modified
| File | Change |
|------|--------|
| `apps/client/src/api/client.ts` | Added `doUpload` helper + `apiClient.upload` for FormData (existing `doRequest` is JSON-only) |
| `apps/client/src/stores/authStore.ts` | Extended `ApiAuthResponse`; fixed `toWebUser`; added `updateUser` action |
| `apps/client/src/stores/authStore.test.ts` | New — Vitest unit tests for `updateUser` |
| `apps/client/src/components/profile/AvatarPreviewModal.tsx` | New — solid-background preview + confirm dialog before uploading |
| `apps/client/src/pages/ProfilePage.tsx` | New — profile page with Personal Info + Security cards |
| `apps/client/src/App.tsx` | Added `/profile` route |
| `apps/client/src/components/layout/TopBar.tsx` | Fixed "Profile Settings" link to point to `/profile` |

## Gotchas / non-obvious decisions
- Avatar upload uses existing `POST /upload` endpoint — no dedicated avatar upload route
- `doUpload` added separately from `doRequest` because multer requires `Content-Type: multipart/form-data` while all other calls are JSON
- Client uses its own `apps/client/src/types/domain.ts` User type — `packages/types` not modified
