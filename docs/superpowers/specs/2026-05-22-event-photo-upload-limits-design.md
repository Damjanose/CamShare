# Event Photo Upload Limits — Design Spec

**Date:** 2026-05-22  
**Status:** Approved (revised after spec review — iteration 4)

---

## Overview

Allow mobile users to upload photos from their device inside an event gallery. Each event enforces per-user photo count and per-file size limits set by the admin at event creation time. The admin views all uploaded photos in the web gallery, grouped by uploader, and can delete individual photos.

---

## Requirements

| # | Requirement |
|---|---|
| R1 | Mobile `+` FAB opens the device image picker and uploads the selected photo |
| R2 | Admin sets `maxPhotosPerUser` (per guest) and `maxFileSizeMb` per event; both are optional (null = unlimited) |
| R3 | Upload is rejected if the file exceeds `maxFileSizeMb`; client pre-flight before network call |
| R4 | Upload is rejected if the user has already reached `maxPhotosPerUser` for that event |
| R5 | Mobile gallery shows an upload counter `"X / Y uploads"` and disables the FAB at the limit |
| R6 | Admin gallery displays all event photos grouped by uploader with guest name and count |
| R7 | Admin can delete any individual photo from the event gallery |

---

## Data Model

### Migration `007_event_upload_limits.sql`

The next available migration number is `007` (existing migrations run `001`–`006`):

```sql
ALTER TABLE events
  ADD COLUMN max_photos_per_user INT DEFAULT NULL,
  ADD COLUMN max_file_size_mb    INT DEFAULT NULL;
```

`NULL` on either column means unlimited.

### Kysely table interface (`apps/api/src/lib/db.ts`)

Extend `EventsTable` with:
```ts
max_photos_per_user: number | null
max_file_size_mb: number | null
```
Without this, Kysely selects and updates referencing these columns are TypeScript errors.

### Shared types (`packages/types/src/index.ts`)

Add to `Event`:
```ts
maxPhotosPerUser: number | null
maxFileSizeMb: number | null
```

Add to `CreateEventInput` and `UpdateEventInput`:
```ts
maxPhotosPerUser?: number
maxFileSizeMb?: number
```

Add new type:
```ts
export type EventMemberWithName = EventMember & { fullName: string }
```

### Web client local type (`apps/client/src/types/domain.ts`) — update this before `eventsStore.ts`

The web client's local `Event` type must gain **optional** fields:
```ts
maxPhotosPerUser?: number | null
maxFileSizeMb?: number | null
```

They must be `?` optional (not just `| null`) because `eventsStore.ts` derives `EventInput` as `Omit<Event, "id" | ...>` and `CreateEventPage.tsx` constructs an object literal that does not include these fields when the sliders are disabled. Without `?`, TypeScript will require both fields on every `addEvent` call site.

---

## API

### Zod schemas (`apps/api/src/handlers/events.ts`)

`createSchema` and `updateSchema` must be extended with:
```ts
maxPhotosPerUser: z.number().int().positive().optional(),
maxFileSizeMb: z.number().int().positive().optional(),
```
Without this, Zod strips the fields before they reach the lib functions.

### Events CRUD (`apps/api/src/lib/events.ts` + `handlers/events.ts`)

- `mapEvent` includes `maxPhotosPerUser` and `maxFileSizeMb` from the DB row.
- `createEvent` and `updateEvent` accept and persist both fields from input.
- All `GET /events` and `GET /events/:id` responses include the new fields.

### Upload middleware — two instances (`apps/api/src/handlers/upload.ts`)

The current single `uploadMiddleware` must be replaced by two exports:

1. **`uploadMiddleware`** — unchanged, 10 MB limit, for non-event uploads.
2. **`eventUploadMiddleware`** — an async-aware Express middleware with this shape:

```ts
export const eventUploadMiddleware: RequestHandler = async (req, res, next) => {
  const eventId = req.query.eventId as string | undefined
  let limitBytes = 10 * 1024 * 1024  // default 10 MB

  if (eventId) {
    const event = await db.selectFrom("events")
      .select("max_file_size_mb")
      .where("id", "=", eventId)
      .executeTakeFirst()
    // null means unlimited — use a generous ceiling of 100 MB
    // undefined means event not found — fall back to default 10 MB
    if (event !== undefined) {
      limitBytes = event.max_file_size_mb !== null
        ? event.max_file_size_mb * 1024 * 1024
        : 100 * 1024 * 1024
    }
  }

  const upload = multer({ storage, fileFilter, limits: { fileSize: limitBytes } }).single("file")

  upload(req, res, (err) => {
    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      return res.status(422).json({ message: `File too large (limit: ${limitBytes / 1024 / 1024} MB)` })
    }
    if (err) return next(err)
    next()
  })
}
```

Key points:
- Multer errors do **not** propagate via `try/catch` in async middleware — they come back through the callback argument. The callback pattern above is required.
- When `eventId` is absent: 10 MB limit.
- When `eventId` is present but event is not found: 10 MB limit.
- When event is found with `max_file_size_mb = null` (unlimited): 100 MB ceiling.
- When event is found with a numeric limit: use that value.

`apps/api/src/index.ts` must update the `/upload` route to use `eventUploadMiddleware`:
```ts
app.post("/upload", requireAuth, eventUploadMiddleware, uploadHandlers.handleUpload)
```

### Add photo — return type and handler

**Important: update the handler (`handlers/eventPhotos.ts`) before updating the lib.** If the lib returns `"LIMIT_REACHED"` before the handler checks for it, the truthy string falls through the existing `if (!photo)` guard and gets serialized as `res.status(201).json("LIMIT_REACHED")`.

`lib/eventPhotos.ts` `addPhoto` return type widened to:
```ts
Promise<EventPhoto | null | "LIMIT_REACHED">
```

Before inserting, if the event has `max_photos_per_user`:
- Count photos by `userId` across all channels of the event (join `event_photos` → `event_channels` by `event_id`).
- If count >= limit: return `"LIMIT_REACHED"`.

`handlers/eventPhotos.ts` `add` must check all three cases explicitly:
```ts
if (photo === "LIMIT_REACHED") return res.status(429).json({ message: "Upload limit reached" })
if (!photo) return res.status(403).json({ message: "Forbidden" })
return res.status(201).json(photo)
```

### Member name resolution (`apps/api/src/lib/events.ts` + `handlers/events.ts`)

`listMembers` must join `user_details` and return `EventMemberWithName[]`:
```ts
import type { EventMember, EventMemberWithName } from "@camshare/types"  // update import
```

```ts
const rows = await db
  .selectFrom("event_members")
  .innerJoin("user_details", "user_details.user_id", "event_members.user_id")
  .select([
    "event_members.event_id",
    "event_members.user_id",
    "event_members.joined_at",
    "user_details.full_name",
  ])
  .where("event_id", "=", eventId)
  .orderBy("event_members.joined_at asc")
  .execute()

return rows.map((r) => ({
  eventId: r.event_id,
  userId: r.user_id,
  joinedAt: iso(r.joined_at),
  fullName: r.full_name,
}))
```

The `handlers/events.ts` `getMembers` return type updates automatically once the lib return type changes — TypeScript will flag any mismatch.

The `/events/:eventId/members` endpoint remains accessible to all event members (no new permission guard). This is intentional — members can see who else is in the event. The admin gallery page is separately protected by the `StaffRoute` in the React client.

### Admin delete authorization (`apps/api/src/lib/eventPhotos.ts`)

`req.auth.permissions` is already populated by `requireAuth` middleware (confirmed in `apps/api/src/types/express.ts` and `apps/api/src/middleware/auth.ts`). The `deletePhoto` handler at `apps/api/src/handlers/eventPhotos.ts` can pass `isAdmin`:

```ts
export const remove = async (req: Request, res: Response) => {
  if (!req.auth) return res.status(401).json({ message: "Unauthorized" })
  const isAdmin = req.auth.permissions.includes("admin")
  const ok = await photos.deletePhoto(req.params.photoId, req.auth.userId, isAdmin)
  if (!ok) return res.status(404).json({ message: "Photo not found" })
  return res.status(204).send()
}
```

`deletePhoto` signature becomes:
```ts
export const deletePhoto = async (photoId: string, userId: string, isAdmin = false): Promise<boolean>
```

Authorization inside: the existing `isUploader` and `isOwner` checks are **kept unchanged** — `isAdmin` is added as a third OR branch. Do not remove the existing owner lookup.

---

## Mobile App

### `services/upload.ts`
- Append `?eventId=${eventId}` to the `/upload` POST URL.

### `GalleryScreen.tsx`

**Auth context:**
- Add `const { user } = useAuth()` — needed for `myUploadCount` calculation.

**Route param type:**
- Update `Props` to accept `maxPhotosPerUser: number | null` and `maxFileSizeMb: number | null` alongside `eventId` and `eventTitle`.
- Note: `route` is typed `any`, so missing params fail silently at runtime. The type declaration and the `HomeScreen` navigation call must be updated simultaneously.

**`HomeScreen.tsx` navigation call:**
```ts
navigation.navigate('Gallery', {
  eventId: event.id,
  eventTitle: event.title,
  maxPhotosPerUser: event.maxPhotosPerUser ?? null,
  maxFileSizeMb: event.maxFileSizeMb ?? null,
})
```

**Pre-flight file size check:**
- `asset.fileSize` is `number | undefined` (may be absent on Android).
- If defined and `maxFileSizeMb` is not null and `asset.fileSize > maxFileSizeMb * 1024 * 1024`: show `Alert` and return without uploading.
- If `asset.fileSize` is undefined: skip client check, let server enforce.

**Upload counter:**
- `myUploadCount` must be computed from the **raw `EventPhoto[]`** data returned by `photoQueries` (i.e. `q.data ?? []`), **before** the `photoToItem` mapping — because `GalleryItem` (the mapped type) does not carry `uploaderId`. The existing `allPhotos` variable is `GalleryItem[]` and cannot be used for this.
- Count items where `photo.uploaderId === user?.id` across all channel query results.
- Render `"X / Y uploads"` label below the FAB when `maxPhotosPerUser` is not null.
- When `myUploadCount >= maxPhotosPerUser`: disable FAB, show `"Limit reached"`.

**Error display:** existing `Alert.alert('Upload failed', message)` pattern, no change.

---

## Admin Web Client

### `apps/client/src/pages/CreateEventPage.tsx`

Add two enable/disable toggles alongside the sliders using the **existing `ToggleRow` component** pattern already in this file:
- `"Enable photo limit"` toggle — state `photoLimitEnabled`, default `true`
- `"Enable file size limit"` toggle — state `fileSizeLimitEnabled`, default `true`

When a toggle is off, its slider is hidden and `undefined` is passed for that field. Pattern:
```ts
const [photoLimitEnabled, setPhotoLimitEnabled] = useState(true)
// ...
// In the Limits panel, render ToggleRow for each, show slider only when enabled
// In handleSubmit:
maxPhotosPerUser: photoLimitEnabled ? photoLimit : undefined,
maxFileSizeMb: fileSizeLimitEnabled ? fileSize : undefined,
```

This is necessary because the sliders always carry a numeric minimum value — without a toggle, every event would always have a non-null limit and the `NULL = unlimited` case would never be reachable from the UI.

### `apps/client/src/stores/eventsStore.ts`

`addEvent` body literal must explicitly include the new fields:
```ts
const event = await apiClient.post<Event>("/events", {
  title: input.title,
  description: input.description || undefined,
  eventDate: input.eventDate || undefined,
  endDate: input.endDate || undefined,
  coverImageUrl: input.coverImageUrl || undefined,
  maxPhotosPerUser: input.maxPhotosPerUser ?? undefined,  // ← new
  maxFileSizeMb: input.maxFileSizeMb ?? undefined,        // ← new
})
```
Fields not in the object literal are silently dropped even if the type allows them.

### `apps/client/src/pages/EventGalleryPage.tsx`

Replace mock `photosStore` with real API data. The existing `Photo` local type (`@/types/domain`) has fields (`favorited`, `takenAt`, `uploaderName`, `isVideo`) that don't exist on `EventPhoto`. The page must be rewritten using `EventPhoto` from `@camshare/types`. The filter tabs (`Gallery`, `Recent`, `Favorites`, `Video`) depend on mock-only fields and are removed.

Replacement page logic:
1. Fetch `GET /events/:eventId/channels` → channel list.
2. Fetch `GET /events/:eventId/channels/:channelId/photos` for each channel → flat `EventPhoto[]`.
3. Fetch `GET /events/:eventId/members` → `EventMemberWithName[]` for name resolution.
4. Group photos by `uploaderId`; resolve name from members list (fallback `"Unknown Guest"`).
5. Render per-uploader sections: `"<Name> (N photos)"` header + masonry grid of thumbnails.
6. Each thumbnail has a delete icon button → `DELETE /events/:eventId/channels/:channelId/photos/:photoId` (channel id from `EventPhoto.channelId`; the route is already registered in `apps/api/src/index.ts` line 83). On success, refetch that channel's photos.
7. Keep existing `"No memories yet"` empty state.

---

## Error States

| Scenario | Mobile | Admin |
|---|---|---|
| File too large (client, fileSize known) | Alert before upload | n/a |
| File too large (server — 422) | Alert with API message | n/a |
| Per-user limit reached (429) | FAB disabled + label | n/a |
| No channel on event | Alert "No album" (existing) | n/a |
| Photo not found on delete | n/a | inline error |

---

## Out of Scope

- Edit event page (web) — limit fields can be added in a follow-up
- Push notification to admin when a guest uploads
- Moderation / approval queue (`autoApprove` toggle UI stub remains unconnected)
- Video upload support
