# Dashboard Live Data

**Date:** 2026-05-20  
**Plan:** [superpowers/plans/2026-05-20-dashboard-live-data.md](../superpowers/plans/2026-05-20-dashboard-live-data.md)

## What changed
Replaced all mock/hardcoded dashboard data with live API data. Aligned client `Event` type with API response shape (field renames + new count fields). Deleted mock data files.

## Files modified
| File | Change |
|------|--------|
| `apps/client/src/types/domain.ts` | Renamed `name→title`, `date→eventDate`, `coverUrl→coverImageUrl`; added `guestCount`, `photoCount`; made `User.avatarUrl` nullable |
| `apps/client/src/stores/eventsStore.ts` | Removed mock seed; added `fetchEvents`; updated `addEvent` |
| `apps/client/src/stores/authStore.ts` | Removed `mockUser` import; set `avatarUrl: null` |
| `apps/client/src/components/event/EventCard.tsx` | Updated to renamed field names |
| `apps/client/src/pages/EventGalleryPage.tsx` | Updated field names; removed `location` display |
| `apps/client/src/pages/QrInvitePage.tsx` | Updated field names; removed `location`; fixed `PhoneMockup` prop type; handle null `joinToken` |
| `apps/client/src/pages/CreateEventPage.tsx` | Removed `location`/`privacy` from form; updated `addEvent` call |
| `apps/client/src/pages/DashboardPage.tsx` | Added `fetchEvents` on mount; loading/error states; removed static content |
| `apps/client/src/data/mockEvents.ts` | Deleted |
| `apps/client/src/data/mockUser.ts` | Deleted |

## Gotchas / non-obvious decisions
- `joinToken` can be null for some events — `QrInvitePage` must guard against this
- Field renames were a breaking cascade: every component consuming `Event` needed updating in one pass
- `location` and `privacy` fields removed from form because API doesn't support them
