# Dashboard Sidebar Pages

**Date:** 2026-05-21  
**Plan:** [superpowers/plans/2026-05-21-dashboard-pages.md](../superpowers/plans/2026-05-21-dashboard-pages.md)

## What changed
Built four missing sidebar pages (Collections, Shared, Analytics, Archive) and fixed the Dashboard's data flow. All data comes from the existing `GET /events` store — no new API endpoints.

## Files modified
| File | Change |
|------|--------|
| `apps/client/vitest.config.ts` | Added `@` path alias |
| `apps/client/src/stores/eventsStore.ts` | Added `restoreEvent` action (patches `isActive: true` then updates store immutably) |
| `apps/client/src/stores/eventsStore.test.ts` | New — unit tests for `restoreEvent` |
| `apps/client/src/pages/DashboardPage.tsx` | Wired "View All" to `/events`; filtered recent events to active owned only |
| `apps/client/src/pages/CollectionsPage.tsx` | New — owned active events with search + sort |
| `apps/client/src/pages/SharedPage.tsx` | New — active guest-joined events |
| `apps/client/src/pages/AnalyticsPage.tsx` | New — 4 stat cards + top events table + CSS activity bar chart |
| `apps/client/src/pages/ArchivePage.tsx` | New — browse + restore owned inactive events |
| `apps/client/src/App.tsx` | Added 4 new routes before `/events/:eventId*` family |

## Gotchas / non-obvious decisions
- All pages filter from the shared cached `eventsStore` — no new endpoints needed
- Routes must be registered BEFORE the `/events/:eventId*` catch-all in `App.tsx` to avoid wrong matching
- `restoreEvent` patches server then updates store immutably via spread-map (not refetch)
