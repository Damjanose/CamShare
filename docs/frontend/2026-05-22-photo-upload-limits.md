# Event Photo Upload Limits — Client

**Date:** 2026-05-22  
**Plan:** [superpowers/plans/2026-05-22-event-photo-upload-limits.md](../superpowers/plans/2026-05-22-event-photo-upload-limits.md)

## What changed
Admin can set per-user photo count and file-size limits when creating/editing an event. EventGalleryPage rewritten to use real API data grouped by uploader (replacing mock data).

## Files modified
| File | Change |
|------|--------|
| `apps/client/src/types/domain.ts` | Added optional `maxPhotosPerUser`, `maxFileSizeMb` to `Event` |
| `apps/client/src/stores/eventsStore.ts` | Pass `maxPhotosPerUser` + `maxFileSizeMb` in `addEvent` body |
| `apps/client/src/pages/CreateEventPage.tsx` | Enable/disable toggles + wire limit fields to `addEvent` |
| `apps/client/src/pages/EventGalleryPage.tsx` | Rewritten — uses real API data grouped by uploader name; admin delete button |

## Gotchas / non-obvious decisions
- Gallery now groups photos by uploader using `EventMemberWithName` from the API (see backend session)
- Admin can delete any photo; regular users can only delete their own
- 429 response from upload = limit reached — show user-facing error, not generic failure
