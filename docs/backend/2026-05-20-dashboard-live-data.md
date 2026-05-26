# Dashboard Live Data — Events Query

**Date:** 2026-05-20  
**Plan:** [superpowers/plans/2026-05-20-dashboard-live-data.md](../superpowers/plans/2026-05-20-dashboard-live-data.md)

## What changed
Added correlated subqueries to all event Kysely queries to return `guestCount` and `photoCount` as computed fields. Updated shared `Event` type in `packages/types`.

## Files modified
| File | Change |
|------|--------|
| `packages/types/src/index.ts` | Added `guestCount`, `photoCount`, `createdAt`, `updatedAt` to `Event` |
| `apps/api/src/lib/events.ts` | Updated `mapEvent` + all five event functions with correlated subqueries for counts |

## Gotchas / non-obvious decisions
- Counts use correlated subqueries (not joins) to avoid row multiplication on photos
- `createdAt`/`updatedAt` already returned by API but were missing from shared type — added here
- Client-side field renames also needed (`name→title`, `date→eventDate`, `coverUrl→coverImageUrl`) — see frontend session
