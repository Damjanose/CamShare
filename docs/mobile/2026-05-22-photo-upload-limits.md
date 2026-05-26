# Event Photo Upload Limits — Mobile

**Date:** 2026-05-22  
**Plan:** [superpowers/plans/2026-05-22-event-photo-upload-limits.md](../superpowers/plans/2026-05-22-event-photo-upload-limits.md)

## What changed
Mobile upload now targets a specific event (appends `?eventId=` to URL), receives limit params from the HomeScreen navigation call, and enforces them with a pre-flight count check and FAB disable when at limit.

## Files modified
| File | Change |
|------|--------|
| `apps/mobile/src/services/upload.ts` | Appends `?eventId=` to upload URL |
| `apps/mobile/src/screens/HomeScreen.tsx` | Passes `maxPhotosPerUser` + `maxFileSizeMb` in `navigate` call to GalleryScreen |
| `apps/mobile/src/screens/GalleryScreen.tsx` | Added `useAuth`, route params, pre-flight count check, upload counter, FAB disabled when at limit |

## Gotchas / non-obvious decisions
- Pre-flight check happens client-side before upload starts (counts existing photos vs limit)
- FAB is disabled (not hidden) when at limit — user sees it but can't tap
- `maxPhotosPerUser` / `maxFileSizeMb` flow through navigation params from HomeScreen, not fetched separately
