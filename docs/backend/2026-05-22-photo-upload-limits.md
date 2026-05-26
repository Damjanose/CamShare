# Event Photo Upload Limits

**Date:** 2026-05-22  
**Plan:** [superpowers/plans/2026-05-22-event-photo-upload-limits.md](../superpowers/plans/2026-05-22-event-photo-upload-limits.md)

## What changed
Added per-user photo count and file-size limits per event, enforced at upload time. Admin can configure limits when creating/editing an event. Admin can also delete any photo.

## Files modified
| File | Change |
|------|--------|
| `db/migrations/007_event_upload_limits.sql` | New — adds `max_photos_per_user INT`, `max_file_size_mb INT` columns to `events` |
| `apps/api/src/lib/db.ts` | Added two nullable INT columns to `EventsTable` interface |
| `packages/types/src/index.ts` | Added `maxPhotosPerUser`, `maxFileSizeMb` to `Event`, `CreateEventInput`, `UpdateEventInput`; added `EventMemberWithName` |
| `apps/api/src/handlers/events.ts` | Extended `createSchema` + `updateSchema` with new fields |
| `apps/api/src/lib/events.ts` | Updated `mapEvent`, `createEvent`, `updateEvent`, `listMembers` |
| `apps/api/src/handlers/upload.ts` | Added `eventUploadMiddleware` (enforces per-event file-size limit) |
| `apps/api/src/index.ts` | Swapped `/upload` route to use `eventUploadMiddleware` |
| `apps/api/src/handlers/eventPhotos.ts` | Handle 429 `LIMIT_REACHED`; pass `isAdmin` to `deletePhoto` |
| `apps/api/src/lib/eventPhotos.ts` | `addPhoto` checks count against limit; `deletePhoto` accepts `isAdmin` param |

## Gotchas / non-obvious decisions
- 429 status used for limit-reached (not 403) — matches HTTP semantics for rate/quota exceeded
- `isAdmin` passed into `deletePhoto` so admins can delete any photo regardless of ownership
- `listMembers` updated to return names (used by EventGalleryPage to group photos by uploader)
- Migration is `007_` — run after `006_user_avatar`
