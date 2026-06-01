# Session Index

Open this first when debugging. Each row links to a ~30-line summary of what was changed and why.

| Date | App | Feature | Doc |
|------|-----|---------|-----|
| 2026-06-01 | frontend | PageSpeed performance fixes (images, code splitting, preconnect, lazy load) | [frontend/2026-06-01-pagespeed-performance.md](frontend/2026-06-01-pagespeed-performance.md) |
| 2026-05-31 | backend | Fix mixed content: photo URLs HTTP→HTTPS + local-IP normalization | [backend/2026-05-31-mixed-content-photo-urls.md](backend/2026-05-31-mixed-content-photo-urls.md) |
| 2026-05-24 | backend | Admin users endpoint (`GET /admin/users`) | [backend/2026-05-24-admin-users.md](backend/2026-05-24-admin-users.md) |
| 2026-05-24 | frontend | Admin users list page + `isAdmin` permission | [frontend/2026-05-24-admin-users.md](frontend/2026-05-24-admin-users.md) |
| 2026-05-22 | backend | Event photo upload limits (count + file size) | [backend/2026-05-22-photo-upload-limits.md](backend/2026-05-22-photo-upload-limits.md) |
| 2026-05-22 | frontend | Upload limit toggles + EventGalleryPage real data | [frontend/2026-05-22-photo-upload-limits.md](frontend/2026-05-22-photo-upload-limits.md) |
| 2026-05-22 | mobile | Upload limits pre-flight + FAB disable | [mobile/2026-05-22-photo-upload-limits.md](mobile/2026-05-22-photo-upload-limits.md) |
| 2026-05-21 | backend | Profile API — `PATCH /auth/me` + password change | [backend/2026-05-21-profile-page.md](backend/2026-05-21-profile-page.md) |
| 2026-05-21 | frontend | Profile page (name, avatar, password) | [frontend/2026-05-21-profile-page.md](frontend/2026-05-21-profile-page.md) |
| 2026-05-21 | frontend | Dashboard sidebar pages (Collections, Shared, Analytics, Archive) | [frontend/2026-05-21-dashboard-pages.md](frontend/2026-05-21-dashboard-pages.md) |
| 2026-05-20 | frontend | Landing page editorial redesign | [frontend/2026-05-20-landing-editorial-redesign.md](frontend/2026-05-20-landing-editorial-redesign.md) |
| 2026-05-20 | backend | Account deletion soft-delete (`DELETE /account`) | [backend/2026-05-20-account-deletion.md](backend/2026-05-20-account-deletion.md) |
| 2026-05-20 | mobile | Account deletion confirmation flow | [mobile/2026-05-20-account-deletion.md](mobile/2026-05-20-account-deletion.md) |
| 2026-05-20 | backend | Dashboard live data (events query + counts) | [backend/2026-05-20-dashboard-live-data.md](backend/2026-05-20-dashboard-live-data.md) |
| 2026-05-20 | frontend | Dashboard live data (field renames, mock deletion) | [frontend/2026-05-20-dashboard-live-data.md](frontend/2026-05-20-dashboard-live-data.md) |
| 2026-05-19 | mobile | Full API integration (axios, TanStack Query, Zustand, Socket.IO) | [mobile/2026-05-19-mobile-api-integration.md](mobile/2026-05-19-mobile-api-integration.md) |

---

## How to add a new row

At the end of each session:
1. Create `docs/{app}/{date}-{slug}.md` using [this template](superpowers/plans/2026-05-24-admin-users-list.md) as reference (or copy any existing session file and fill in).
2. Add a row here — newest on top.
3. Keep each session file under 40 lines. Link to the full plan for deep context.
