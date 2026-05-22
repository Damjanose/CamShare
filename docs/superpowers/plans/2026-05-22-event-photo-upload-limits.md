# Event Photo Upload Limits Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce per-user photo count and file-size limits set by admin on each event, and replace the mock admin gallery with real API data grouped by uploader with delete.

**Architecture:** Foundation changes (DB migration, Kysely types, shared types) flow outward to the API (events CRUD, upload middleware, photo count guard, member names, admin delete), then to the admin web client (CreateEventPage toggles, EventGalleryPage rewrite), and finally to the mobile app (upload URL, navigation params, GalleryScreen counter + pre-flight).

**Tech Stack:** PostgreSQL + Kysely (API), Express + multer + Zod (API), React 19 + Zustand + Vitest (web client), Expo SDK 54 + React Native + @tanstack/react-query (mobile), pnpm workspaces.

---

## File Map

| File | Change |
|------|--------|
| `db/migrations/007_event_upload_limits.sql` | **Create** — ALTER TABLE events adds two nullable INT columns |
| `apps/api/src/lib/db.ts` | **Modify** — extend EventsTable interface |
| `packages/types/src/index.ts` | **Modify** — Event, CreateEventInput, UpdateEventInput, EventMemberWithName |
| `apps/api/src/handlers/events.ts` | **Modify** — extend createSchema + updateSchema |
| `apps/api/src/lib/events.ts` | **Modify** — mapEvent, createEvent, updateEvent, listMembers |
| `apps/api/src/handlers/upload.ts` | **Modify** — add eventUploadMiddleware alongside existing uploadMiddleware |
| `apps/api/src/index.ts` | **Modify** — swap /upload route to use eventUploadMiddleware |
| `apps/api/src/handlers/eventPhotos.ts` | **Modify** — handle LIMIT_REACHED (429) and pass isAdmin to deletePhoto |
| `apps/api/src/lib/eventPhotos.ts` | **Modify** — addPhoto count check, deletePhoto isAdmin param |
| `apps/client/src/types/domain.ts` | **Modify** — add optional limit fields to Event |
| `apps/client/src/stores/eventsStore.ts` | **Modify** — pass maxPhotosPerUser + maxFileSizeMb in addEvent body |
| `apps/client/src/pages/CreateEventPage.tsx` | **Modify** — enable/disable toggles + wire limits to addEvent |
| `apps/client/src/pages/EventGalleryPage.tsx` | **Modify** — rewrite to use real API data grouped by uploader |
| `apps/mobile/src/services/upload.ts` | **Modify** — append ?eventId= to upload URL |
| `apps/mobile/src/screens/HomeScreen.tsx` | **Modify** — pass maxPhotosPerUser + maxFileSizeMb in navigate call |
| `apps/mobile/src/screens/GalleryScreen.tsx` | **Modify** — useAuth, route params, pre-flight, upload counter, FAB disable |

---

## Task 1: DB Migration + Kysely Interface + Shared Types

**Files:**
- Create: `db/migrations/007_event_upload_limits.sql`
- Modify: `apps/api/src/lib/db.ts`
- Modify: `packages/types/src/index.ts`

- [ ] **Step 1: Create the migration file**

```sql
-- db/migrations/007_event_upload_limits.sql
ALTER TABLE events
  ADD COLUMN max_photos_per_user INT DEFAULT NULL,
  ADD COLUMN max_file_size_mb    INT DEFAULT NULL;
```

- [ ] **Step 2: Run migration**

```bash
pnpm --filter @camshare/api db:migrate
```
Expected: no errors, migration applies cleanly.

- [ ] **Step 3: Extend EventsTable in db.ts**

In `apps/api/src/lib/db.ts`, add two lines to `EventsTable` after `is_active`:
```ts
max_photos_per_user: number | null
max_file_size_mb: number | null
```

- [ ] **Step 4: Update shared Event type**

In `packages/types/src/index.ts`, add to the `Event` type after `photoCount`:
```ts
maxPhotosPerUser: number | null
maxFileSizeMb: number | null
```

- [ ] **Step 5: Update CreateEventInput and UpdateEventInput**

In `packages/types/src/index.ts`, add to `CreateEventInput`:
```ts
maxPhotosPerUser?: number
maxFileSizeMb?: number
```

`UpdateEventInput` is `Partial<CreateEventInput & { isActive: boolean }>` so it picks up the new fields automatically.

- [ ] **Step 6: Add EventMemberWithName type**

In `packages/types/src/index.ts`, add after the `EventMember` type:
```ts
export type EventMemberWithName = EventMember & { fullName: string }
```

- [ ] **Step 7: Typecheck the API package**

```bash
pnpm --filter @camshare/api typecheck
```
Expected: errors about `max_photos_per_user` / `max_file_size_mb` not yet on `mapEvent` — these will be fixed in Task 2.

- [ ] **Step 8: Commit**

```bash
git add db/migrations/007_event_upload_limits.sql apps/api/src/lib/db.ts packages/types/src/index.ts
git commit -m "feat: add max_photos_per_user and max_file_size_mb to events schema and types"
```

---

## Task 2: API — Events CRUD (Zod schemas, mapEvent, createEvent, updateEvent)

**Files:**
- Modify: `apps/api/src/handlers/events.ts`
- Modify: `apps/api/src/lib/events.ts`

- [ ] **Step 1: Extend Zod schemas in handlers/events.ts**

In `apps/api/src/handlers/events.ts`, update `createSchema` (after `coverImageUrl`):
```ts
const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  eventDate: z.string().optional(),
  endDate: z.string().optional(),
  coverImageUrl: z.string().url().optional(),
  maxPhotosPerUser: z.number().int().positive().optional(),
  maxFileSizeMb: z.number().int().positive().optional(),
})
```

`updateSchema` is `createSchema.partial().extend({ isActive: z.boolean().optional() })` — it picks up the new fields automatically.

- [ ] **Step 2: Update mapEvent in lib/events.ts**

In the `mapEvent` function, the `row` parameter shape and the return object both need the new fields. Update the row type annotation and the return:
```ts
const mapEvent = (row: {
  // ... existing fields ...
  max_photos_per_user?: number | null
  max_file_size_mb?: number | null
  // ...
}): Event => ({
  // ... existing fields ...
  maxPhotosPerUser: row.max_photos_per_user ?? null,
  maxFileSizeMb: row.max_file_size_mb ?? null,
})
```

- [ ] **Step 3: Pass new fields through createEvent**

In `lib/events.ts` `createEvent`, update the `.values({...})` insert to include:
```ts
max_photos_per_user: input.maxPhotosPerUser ?? null,
max_file_size_mb: input.maxFileSizeMb ?? null,
```

- [ ] **Step 4: Pass new fields through updateEvent**

In `lib/events.ts` `updateEvent`, in the `.set({...})` call, add:
```ts
...(input.maxPhotosPerUser !== undefined && { max_photos_per_user: input.maxPhotosPerUser }),
...(input.maxFileSizeMb !== undefined && { max_file_size_mb: input.maxFileSizeMb }),
```

- [ ] **Step 5: Typecheck**

```bash
pnpm --filter @camshare/api typecheck
```
Expected: clean (no errors on events-related files).

- [ ] **Step 6: Smoke-test with curl**

Ensure the API is running (`pnpm backend`), then:
```bash
# Login first
TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!"}' \
  | jq -r '.tokens.accessToken')

# Create event with limits
curl -s -X POST http://localhost:3001/events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Limit Test","eventDate":"2026-06-01T00:00:00Z","endDate":"2026-07-01T00:00:00Z","maxPhotosPerUser":5,"maxFileSizeMb":2}' \
  | jq '{maxPhotosPerUser,maxFileSizeMb}'
```
Expected:
```json
{ "maxPhotosPerUser": 5, "maxFileSizeMb": 2 }
```

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/handlers/events.ts apps/api/src/lib/events.ts
git commit -m "feat: wire maxPhotosPerUser and maxFileSizeMb through events CRUD"
```

---

## Task 3: API — Dynamic Upload Middleware

**Files:**
- Modify: `apps/api/src/handlers/upload.ts`
- Modify: `apps/api/src/index.ts`

- [ ] **Step 1: Add eventUploadMiddleware to upload.ts**

Replace the entire content of `apps/api/src/handlers/upload.ts` with:

```ts
import { randomUUID } from "node:crypto"
import path from "node:path"
import fs from "node:fs"
import type { Request, Response, RequestHandler } from "express"
import multer from "multer"
import { db } from "../lib/db.js"

const uploadsDir = path.join(process.cwd(), "uploads")
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg"
    cb(null, `${randomUUID()}${ext}`)
  },
})

const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  cb(null, allowedMimeTypes.includes(file.mimetype))
}

// Non-event uploads — hard 10 MB ceiling
export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter,
}).single("file")

// Event-aware upload — respects max_file_size_mb from the event row
export const eventUploadMiddleware: RequestHandler = async (req, res, next) => {
  const eventId = req.query.eventId as string | undefined
  let limitBytes = 10 * 1024 * 1024 // default 10 MB

  if (eventId) {
    const event = await db
      .selectFrom("events")
      .select("max_file_size_mb")
      .where("id", "=", eventId)
      .executeTakeFirst()

    if (event !== undefined) {
      // null means unlimited — use 100 MB ceiling
      limitBytes = event.max_file_size_mb !== null
        ? event.max_file_size_mb * 1024 * 1024
        : 100 * 1024 * 1024
    }
  }

  const upload = multer({ storage, fileFilter, limits: { fileSize: limitBytes } }).single("file")

  upload(req, res, (err) => {
    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      return res.status(422).json({
        message: `File too large (limit: ${limitBytes / 1024 / 1024} MB)`,
      })
    }
    if (err) return next(err)
    next()
  })
}

export const handleUpload = (req: Request, res: Response) => {
  if (!req.auth) return res.status(401).json({ message: "Unauthorized" })
  if (!req.file) return res.status(400).json({ message: "No file uploaded" })
  const baseUrl = `${req.protocol}://${req.get("host")}`
  return res.json({ url: `${baseUrl}/uploads/${req.file.filename}` })
}
```

- [ ] **Step 2: Update the /upload route in index.ts**

In `apps/api/src/index.ts`, change line:
```ts
app.post("/upload", requireAuth, uploadHandlers.uploadMiddleware, uploadHandlers.handleUpload)
```
to:
```ts
app.post("/upload", requireAuth, uploadHandlers.eventUploadMiddleware, uploadHandlers.handleUpload)
```

- [ ] **Step 3: Typecheck**

```bash
pnpm --filter @camshare/api typecheck
```
Expected: clean.

- [ ] **Step 4: Test file-size enforcement**

Using the event created in Task 2 (maxFileSizeMb: 2), save its ID:
```bash
EVENT_ID=$(curl -s http://localhost:3001/events \
  -H "Authorization: Bearer $TOKEN" \
  | jq -r '[.[] | select(.title=="Limit Test")][0].id')

# Upload a small file (should succeed)
dd if=/dev/urandom bs=1024 count=100 2>/dev/null | \
  curl -s -X POST "http://localhost:3001/upload?eventId=$EVENT_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -F "file=@/dev/stdin;filename=test.jpg;type=image/jpeg" \
  | jq .
# Expected: { "url": "http://..." }

# Upload a 3 MB file to a 2 MB limit event (should fail)
dd if=/dev/urandom bs=1024 count=3100 2>/dev/null | \
  curl -s -X POST "http://localhost:3001/upload?eventId=$EVENT_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -F "file=@/dev/stdin;filename=big.jpg;type=image/jpeg" \
  | jq .
# Expected: { "message": "File too large (limit: 2 MB)" }
```

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/handlers/upload.ts apps/api/src/index.ts
git commit -m "feat: add event-aware upload middleware with dynamic file size limit"
```

---

## Task 4: API — Per-User Photo Count Enforcement

**Files:**
- Modify: `apps/api/src/handlers/eventPhotos.ts` ← **update handler FIRST**
- Modify: `apps/api/src/lib/eventPhotos.ts`

- [ ] **Step 1: Update the add handler to handle LIMIT_REACHED (before changing the lib)**

In `apps/api/src/handlers/eventPhotos.ts`, replace the `add` handler:

```ts
export const add = async (req: Request, res: Response) => {
  if (!req.auth) return res.status(401).json({ message: "Unauthorized" })
  try {
    const input = addSchema.parse(req.body)
    const photo = await photos.addPhoto(req.params.channelId, req.auth.userId, input)
    if (photo === "LIMIT_REACHED") return res.status(429).json({ message: "Upload limit reached" })
    if (!photo) return res.status(403).json({ message: "Forbidden" })
    return res.status(201).json(photo)
  } catch (error) {
    return handleError(res, error)
  }
}
```

- [ ] **Step 2: Typecheck to confirm handler compiles before lib change**

```bash
pnpm --filter @camshare/api typecheck
```
Expected: TypeScript may warn about `photo === "LIMIT_REACHED"` being unreachable (since lib still returns `EventPhoto | null`) — that is fine. It must not error.

- [ ] **Step 3: Add photo count check to addPhoto in lib/eventPhotos.ts**

In `apps/api/src/lib/eventPhotos.ts`, update `addPhoto`:

1. Change the return type annotation to `Promise<EventPhoto | null | "LIMIT_REACHED">`.

2. After the `isMember` check (line ~59), add the count guard:
```ts
// Check per-user photo limit
const eventRow = await db
  .selectFrom("events")
  .select("max_photos_per_user")
  .where("id", "=", eventId)
  .executeTakeFirst()

if (eventRow?.max_photos_per_user !== null && eventRow?.max_photos_per_user !== undefined) {
  const countRow = await db
    .selectFrom("event_photos")
    .innerJoin("event_channels", "event_channels.id", "event_photos.channel_id")
    .select(db.fn.countAll<string>().as("cnt"))
    .where("event_channels.event_id", "=", eventId)
    .where("event_photos.uploader_id", "=", userId)
    .executeTakeFirstOrThrow()

  if (Number(countRow.cnt) >= eventRow.max_photos_per_user) {
    return "LIMIT_REACHED"
  }
}
```

- [ ] **Step 4: Typecheck**

```bash
pnpm --filter @camshare/api typecheck
```
Expected: clean.

- [ ] **Step 5: Smoke-test the count limit**

Using the event with `maxPhotosPerUser: 5` from Task 2:
```bash
# Upload a photo (need a real URL from the upload endpoint)
PHOTO_URL=$(curl -s -X POST "http://localhost:3001/upload?eventId=$EVENT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/dev/urandom;filename=t.jpg;type=image/jpeg" \
  | jq -r '.url')

# Get the first channel
CHANNEL_ID=$(curl -s "http://localhost:3001/events/$EVENT_ID/channels" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.[0].id')

# Add 5 photos then try a 6th
for i in 1 2 3 4 5; do
  curl -s -X POST "http://localhost:3001/events/$EVENT_ID/channels/$CHANNEL_ID/photos" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"url\":\"$PHOTO_URL\"}" | jq -r '.id // .message'
done

# 6th should fail
curl -s -X POST "http://localhost:3001/events/$EVENT_ID/channels/$CHANNEL_ID/photos" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"url\":\"$PHOTO_URL\"}" | jq .
# Expected: { "message": "Upload limit reached" }
```

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/handlers/eventPhotos.ts apps/api/src/lib/eventPhotos.ts
git commit -m "feat: enforce per-user photo count limit and return 429 when exceeded"
```

---

## Task 5: API — Member Names + Admin Delete

**Files:**
- Modify: `apps/api/src/lib/events.ts`
- Modify: `apps/api/src/handlers/eventPhotos.ts`
- Modify: `apps/api/src/lib/eventPhotos.ts`

- [ ] **Step 1: Update listMembers to join user_details**

In `apps/api/src/lib/events.ts`:

1. Update the import at the top to include `EventMemberWithName`:
```ts
import type { Event, EventMember, EventMemberWithName, CreateEventInput, UpdateEventInput } from "@camshare/types"
```

2. Replace the `listMembers` function body:
```ts
export const listMembers = async (eventId: string, userId: string): Promise<EventMemberWithName[] | null> => {
  const member = await isMember(eventId, userId)
  if (!member) return null

  const rows = await db
    .selectFrom("event_members")
    .innerJoin("user_details", "user_details.user_id", "event_members.user_id")
    .select([
      "event_members.event_id",
      "event_members.user_id",
      "event_members.joined_at",
      "user_details.full_name",
    ])
    .where("event_members.event_id", "=", eventId)
    .orderBy("event_members.joined_at asc")
    .execute()

  return rows.map((r) => ({
    eventId: r.event_id,
    userId: r.user_id,
    joinedAt: iso(r.joined_at),
    fullName: r.full_name,
  }))
}
```

- [ ] **Step 2: Update deletePhoto to accept isAdmin**

In `apps/api/src/lib/eventPhotos.ts`, change the `deletePhoto` signature and add the isAdmin branch (keeping existing owner check):
```ts
export const deletePhoto = async (photoId: string, userId: string, isAdmin = false): Promise<boolean> => {
  const photo = await db.selectFrom("event_photos").selectAll().where("id", "=", photoId).executeTakeFirst()
  if (!photo) return false

  const eventId = await getChannelEventId(photo.channel_id)
  if (!eventId) return false

  const isUploader = photo.uploader_id === userId
  let isOwner = false
  if (!isUploader && !isAdmin) {
    const event = await db.selectFrom("events").select("owner_id").where("id", "=", eventId).executeTakeFirst()
    isOwner = !!event && event.owner_id === userId
  }

  if (!isUploader && !isOwner && !isAdmin) return false

  await db.deleteFrom("event_photos").where("id", "=", photoId).execute()
  emitToEvent(eventId, "event:photo_deleted", { photoId, channelId: photo.channel_id })

  return true
}
```

- [ ] **Step 3: Pass isAdmin in the delete handler**

In `apps/api/src/handlers/eventPhotos.ts`, replace `remove`:
```ts
export const remove = async (req: Request, res: Response) => {
  if (!req.auth) return res.status(401).json({ message: "Unauthorized" })
  const isAdmin = req.auth.permissions.includes("admin")
  const ok = await photos.deletePhoto(req.params.photoId, req.auth.userId, isAdmin)
  if (!ok) return res.status(404).json({ message: "Photo not found" })
  return res.status(204).send()
}
```

- [ ] **Step 4: Typecheck**

```bash
pnpm --filter @camshare/api typecheck
```
Expected: clean.

- [ ] **Step 5: Smoke-test members with names**

```bash
curl -s "http://localhost:3001/events/$EVENT_ID/members" \
  -H "Authorization: Bearer $TOKEN" | jq '.[0]'
# Expected: { "eventId": "...", "userId": "...", "joinedAt": "...", "fullName": "Admin User" }
```

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/lib/events.ts apps/api/src/handlers/eventPhotos.ts apps/api/src/lib/eventPhotos.ts
git commit -m "feat: member names in listMembers, admin can delete any photo"
```

---

## Task 6: Web Client — Types + eventsStore

**Files:**
- Modify: `apps/client/src/types/domain.ts` ← update FIRST
- Modify: `apps/client/src/stores/eventsStore.ts`

- [ ] **Step 1: Add optional limit fields to domain.ts Event**

In `apps/client/src/types/domain.ts`, update the `Event` type:
```ts
export type Event = {
  id: string
  ownerId: string
  title: string
  description: string | null
  eventDate: string | null
  endDate: string | null
  coverImageUrl: string | null
  isActive: boolean
  guestCount: number
  photoCount: number
  maxPhotosPerUser?: number | null
  maxFileSizeMb?: number | null
  createdAt: string
  updatedAt: string
}
```

- [ ] **Step 2: Update eventsStore addEvent body to include new fields**

In `apps/client/src/stores/eventsStore.ts`, update the `addEvent` function body:
```ts
addEvent: async (input) => {
  const event = await apiClient.post<Event>("/events", {
    title: input.title,
    description: input.description || undefined,
    eventDate: input.eventDate || undefined,
    endDate: input.endDate || undefined,
    coverImageUrl: input.coverImageUrl || undefined,
    maxPhotosPerUser: input.maxPhotosPerUser ?? undefined,
    maxFileSizeMb: input.maxFileSizeMb ?? undefined,
  })
  set({ events: [event, ...get().events] })
  return event
},
```

- [ ] **Step 3: Run existing store tests**

```bash
pnpm --filter @camshare/client test
```
Expected: all tests pass (the new fields are optional so existing `mockEvent()` in `eventsStore.test.ts` still compiles fine).

- [ ] **Step 4: Typecheck**

```bash
pnpm --filter @camshare/client typecheck
```
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add apps/client/src/types/domain.ts apps/client/src/stores/eventsStore.ts
git commit -m "feat: add optional upload limit fields to web client Event type and eventsStore"
```

---

## Task 7: Web Client — CreateEventPage Toggles

**Files:**
- Modify: `apps/client/src/pages/CreateEventPage.tsx`

- [ ] **Step 1: Add toggle state and conditional slider rendering**

In `apps/client/src/pages/CreateEventPage.tsx`:

1. Add two new state variables after the existing slider states:
```ts
const [photoLimitEnabled, setPhotoLimitEnabled] = useState(true)
const [fileSizeLimitEnabled, setFileSizeLimitEnabled] = useState(true)
```

2. In `handleSubmit`, pass limits conditionally:
```ts
const created = await addEvent({
  title: name,
  description,
  eventDate: date || null,
  endDate: endDate || null,
  coverImageUrl: coverPreview ?? DEFAULT_COVER,
  maxPhotosPerUser: photoLimitEnabled ? photoLimit : undefined,
  maxFileSizeMb: fileSizeLimitEnabled ? fileSize : undefined,
})
```

3. In the "Limits" `GlassPanel`, add `ToggleRow` components before each slider and conditionally show sliders. Replace the two slider blocks:

```tsx
{/* Photo limit */}
<ToggleRow
  title="Enable Photo Limit"
  description="Set a maximum number of uploads per guest."
  checked={photoLimitEnabled}
  onChange={setPhotoLimitEnabled}
/>
{photoLimitEnabled && (
  <div>
    <div className="flex justify-between mb-4">
      <label className="font-label-md text-label-md text-on-surface uppercase tracking-widest">
        Photos per Guest
      </label>
      <span className="text-primary font-bold">{photoLimit}</span>
    </div>
    <input
      type="range"
      min={10}
      max={200}
      value={photoLimit}
      onChange={(e) => setPhotoLimit(Number(e.target.value))}
      className="w-full h-1 bg-surface-variant rounded-lg appearance-none cursor-pointer accent-primary"
    />
  </div>
)}

{/* File size limit */}
<ToggleRow
  title="Enable File Size Limit"
  description="Restrict the maximum size of each uploaded photo."
  checked={fileSizeLimitEnabled}
  onChange={setFileSizeLimitEnabled}
/>
{fileSizeLimitEnabled && (
  <div>
    <div className="flex justify-between mb-4">
      <label className="font-label-md text-label-md text-on-surface uppercase tracking-widest">
        Max File Size
      </label>
      <span className="text-primary font-bold">{fileSize} MB</span>
    </div>
    <input
      type="range"
      min={5}
      max={100}
      step={5}
      value={fileSize}
      onChange={(e) => setFileSize(Number(e.target.value))}
      className="w-full h-1 bg-surface-variant rounded-lg appearance-none cursor-pointer accent-primary"
    />
  </div>
)}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter @camshare/client typecheck
```
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add apps/client/src/pages/CreateEventPage.tsx
git commit -m "feat: add enable/disable toggles for photo count and file size limits in CreateEventPage"
```

---

## Task 8: Web Client — EventGalleryPage Rewrite

**Files:**
- Modify: `apps/client/src/pages/EventGalleryPage.tsx`

The current page uses a mock `photosStore` with a local `Photo` type. Replace it entirely with real API calls using `apiClient` from `@/api/client`, `EventPhoto` and `EventMemberWithName` from `@camshare/types`.

- [ ] **Step 1: Rewrite EventGalleryPage.tsx**

Replace the entire file content with:

```tsx
import { useMemo, useState } from "react"
import { Link, Navigate, useParams } from "react-router-dom"
import { GalleryItem } from "@/components/event/GalleryItem"
import { LightboxModal } from "@/components/event/LightboxModal"
import { MasonryGrid } from "@/components/primitives/MasonryGrid"
import { Button } from "@/components/primitives/Button"
import { Icon } from "@/components/primitives/Icon"
import { useEventsStore } from "@/stores/eventsStore"
import { apiClient } from "@/api/client"
import type { EventChannel, EventPhoto, EventMemberWithName } from "@camshare/types"
import { useEffect } from "react"

const formatDate = (iso: string): string => {
  const d = new Date(iso)
  return `${String(d.getUTCDate()).padStart(2, "0")}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${d.getUTCFullYear()}`
}

function useEventGallery(eventId: string) {
  const [channels, setChannels] = useState<EventChannel[]>([])
  const [photos, setPhotos] = useState<EventPhoto[]>([])
  const [members, setMembers] = useState<EventMemberWithName[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = async () => {
    if (!eventId) return
    try {
      setLoading(true)
      const [chs, mems] = await Promise.all([
        apiClient.get<EventChannel[]>(`/events/${eventId}/channels`),
        apiClient.get<EventMemberWithName[]>(`/events/${eventId}/members`),
      ])
      setChannels(chs)
      setMembers(mems)

      const photoArrays = await Promise.all(
        chs.map((ch) =>
          apiClient.get<EventPhoto[]>(`/events/${eventId}/channels/${ch.id}/photos`)
        )
      )
      setPhotos(photoArrays.flat())
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load gallery")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { reload() }, [eventId])

  const deletePhoto = async (photo: EventPhoto) => {
    await apiClient.delete(`/events/${eventId}/channels/${photo.channelId}/photos/${photo.id}`)
    setPhotos((prev) => prev.filter((p) => p.id !== photo.id))
  }

  return { channels, photos, members, loading, error, deletePhoto }
}

export const EventGalleryPage = () => {
  const { eventId } = useParams<{ eventId: string }>()
  const event = useEventsStore((s) => s.events.find((e) => e.id === eventId))
  const [lightboxPhoto, setLightboxPhoto] = useState<EventPhoto | null>(null)

  const { photos, members, loading, error, deletePhoto } = useEventGallery(eventId ?? "")

  const nameMap = useMemo(
    () => Object.fromEntries(members.map((m) => [m.userId, m.fullName])),
    [members]
  )

  const grouped = useMemo(() => {
    const map = new Map<string, EventPhoto[]>()
    for (const photo of photos) {
      const arr = map.get(photo.uploaderId) ?? []
      arr.push(photo)
      map.set(photo.uploaderId, arr)
    }
    return map
  }, [photos])

  if (!event) return <Navigate to="/dashboard" replace />

  return (
    <div className="max-w-container-max mx-auto">
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary mb-2">{event.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-on-surface-variant">
            <span className="flex items-center gap-1 font-label-md text-label-md">
              <Icon name="calendar_today" className="text-sm" />
              {event.eventDate ? formatDate(event.eventDate) : "Date TBD"}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Link to={`/events/${event.id}/invite`}>
            <Button variant="ghost">
              <Icon name="qr_code" /> Share QR
            </Button>
          </Link>
        </div>
      </section>

      {loading ? (
        <div className="text-center py-24 text-on-surface-variant">Loading…</div>
      ) : error ? (
        <div className="text-center py-24 text-error">{error}</div>
      ) : photos.length === 0 ? (
        <div className="text-center py-24 border-2 border-dashed border-outline-variant/40 rounded-3xl">
          <Icon name="image_search" className="text-5xl text-primary mb-4 block" />
          <p className="font-headline-md text-on-surface mb-2">No memories yet</p>
          <p className="text-on-surface-variant">
            Share the QR with your guests to start collecting moments.
          </p>
        </div>
      ) : (
        <>
          {Array.from(grouped.entries()).map(([uploaderId, uploaderPhotos]) => (
            <section key={uploaderId} className="mb-12">
              <div className="flex items-center gap-3 mb-6 pb-3 border-b border-outline-variant/30">
                <Icon name="person" className="text-primary" />
                <h2 className="font-headline-md text-on-surface">
                  {nameMap[uploaderId] ?? "Unknown Guest"}
                </h2>
                <span className="text-on-surface-variant font-label-md">
                  ({uploaderPhotos.length} {uploaderPhotos.length === 1 ? "photo" : "photos"})
                </span>
              </div>
              <MasonryGrid>
                {uploaderPhotos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    <GalleryItem
                      photo={{ id: photo.id, url: photo.url } as never}
                      onOpen={() => setLightboxPhoto(photo)}
                    />
                    <button
                      type="button"
                      onClick={() => deletePhoto(photo)}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-error/80 text-on-error flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete photo"
                    >
                      <Icon name="delete" className="text-sm" />
                    </button>
                  </div>
                ))}
              </MasonryGrid>
            </section>
          ))}
        </>
      )}

      <LightboxModal
        photo={lightboxPhoto as never}
        onClose={() => setLightboxPhoto(null)}
      />
    </div>
  )
}
```

> **Note on GalleryItem / LightboxModal:** These components currently expect the local `Photo` type. They will need to accept any object with at least `id` and `url`. If TypeScript errors on `as never` casts, inspect `apps/client/src/components/event/GalleryItem.tsx` and `LightboxModal.tsx` — the simplest fix is to make their `photo` prop type `{ id: string; url: string; [key: string]: unknown }` or to pass only the required fields.

- [ ] **Step 2: Fix GalleryItem and LightboxModal if needed**

Check `apps/client/src/components/event/GalleryItem.tsx` and `apps/client/src/components/event/LightboxModal.tsx` for the `photo` prop type. If they only use `id` and `url` internally, relax the prop type to avoid `as never`. Example for GalleryItem:
```ts
type Props = {
  photo: { id: string; url: string }
  onOpen: (photo: EventPhoto | { id: string; url: string }) => void
}
```

- [ ] **Step 3: Typecheck**

```bash
pnpm --filter @camshare/client typecheck
```
Fix any remaining type errors. The `as never` casts in the template above are starting points — resolve them properly.

- [ ] **Step 4: Commit**

```bash
git add apps/client/src/pages/EventGalleryPage.tsx apps/client/src/components/event/
git commit -m "feat: rewrite EventGalleryPage with real API data grouped by uploader + delete"
```

---

## Task 9: Mobile — Upload URL + HomeScreen Navigation

**Files:**
- Modify: `apps/mobile/src/services/upload.ts`
- Modify: `apps/mobile/src/screens/HomeScreen.tsx`

- [ ] **Step 1: Append eventId query param to upload URL**

In `apps/mobile/src/services/upload.ts`, update the `apiClient.post` call:
```ts
const { data } = await apiClient.post<{ url: string }>(
  `/upload?eventId=${encodeURIComponent(eventId)}`,
  formData,
  { headers: { 'Content-Type': 'multipart/form-data' } },
);
```

The `eventId` parameter is already in the function signature — no signature change needed.

- [ ] **Step 2: Pass limit params in HomeScreen navigation calls**

In `apps/mobile/src/screens/HomeScreen.tsx`, update both `handleEventPress` and `handleMemoryPress`:
```ts
function handleEventPress(event: Event) {
  navigation.navigate('Gallery', {
    eventId: event.id,
    eventTitle: event.title,
    maxPhotosPerUser: event.maxPhotosPerUser ?? null,
    maxFileSizeMb: event.maxFileSizeMb ?? null,
  });
}

function handleMemoryPress(event: Event) {
  navigation.navigate('Gallery', {
    eventId: event.id,
    eventTitle: event.title,
    maxPhotosPerUser: event.maxPhotosPerUser ?? null,
    maxFileSizeMb: event.maxFileSizeMb ?? null,
  });
}
```

- [ ] **Step 3: Typecheck mobile**

```bash
pnpm --filter @camshare/mobile typecheck 2>/dev/null || cd apps/mobile && npx tsc --noEmit
```
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/services/upload.ts apps/mobile/src/screens/HomeScreen.tsx
git commit -m "feat: pass eventId to upload endpoint and limit params to GalleryScreen"
```

---

## Task 10: Mobile — GalleryScreen Upload Limits UI

**Files:**
- Modify: `apps/mobile/src/screens/GalleryScreen.tsx`

- [ ] **Step 1: Add route params type and useAuth**

At the top of `GalleryScreen.tsx`, add import:
```ts
import { useAuth } from '../context/AuthContext';
```

Update the `Props` type:
```ts
type Props = {
  navigation: any;
  route: {
    params?: {
      eventId?: string;
      eventTitle?: string;
      maxPhotosPerUser?: number | null;
      maxFileSizeMb?: number | null;
    };
  };
  activeTab: NavTab;
  onTabPress: (tab: NavTab) => void;
};
```

Inside `GalleryScreen`, add after existing const declarations:
```ts
const { user } = useAuth();
const currentUserId = user?.id;
const maxPhotosPerUser: number | null = route?.params?.maxPhotosPerUser ?? null;
const maxFileSizeMb: number | null = route?.params?.maxFileSizeMb ?? null;
```

- [ ] **Step 2: Compute myUploadCount from raw EventPhoto data**

`photoQueries` returns `EventPhoto[]` per channel. After `photoQueries` is defined, add:
```ts
const myUploadCount = photoQueries
  .flatMap((q) => q.data ?? [])
  .filter((photo) => photo.uploaderId === currentUserId)
  .length;

const atLimit = maxPhotosPerUser !== null && myUploadCount >= maxPhotosPerUser;
```

Note: `photoQueries[i].data` is `EventPhoto[]` (raw, before `photoToItem` mapping). The `allPhotos` variable below it is `GalleryItem[]` and does NOT have `uploaderId` — only use `photoQueries` data for the count.

- [ ] **Step 3: Add pre-flight file size check to handleUpload**

In `handleUpload`, add before the `ImagePicker.launchImageLibraryAsync` result check:
```ts
if (result.canceled || !result.assets[0]) return;

const asset = result.assets[0];

// Client-side pre-flight size check (fileSize may be undefined on Android)
if (
  asset.fileSize !== undefined &&
  maxFileSizeMb !== null &&
  asset.fileSize > maxFileSizeMb * 1024 * 1024
) {
  Alert.alert('File too large', `Max allowed size is ${maxFileSizeMb} MB`);
  return;
}
```

- [ ] **Step 4: Add upload counter label and disable FAB at limit**

In the FAB section (around line 165), replace the FAB `TouchableOpacity` block with:
```tsx
{!!eventId && (
  <View style={styles.fabContainer}>
    {maxPhotosPerUser !== null && (
      <Text style={[
        styles.uploadCounter,
        atLimit && styles.uploadCounterLimit,
        { bottom: Math.max(insets.bottom, Spacing.navBottom) + Spacing.navHeight + 72 },
      ]}>
        {myUploadCount} / {maxPhotosPerUser} uploads
      </Text>
    )}
    <TouchableOpacity
      style={[
        styles.fab,
        { bottom: Math.max(insets.bottom, Spacing.navBottom) + Spacing.navHeight + 16 },
        (isUploading || atLimit) && styles.fabDisabled,
      ]}
      onPress={atLimit ? undefined : handleUpload}
      disabled={isUploading || atLimit}
      activeOpacity={0.8}
    >
      {isUploading
        ? <ActivityIndicator color={Colors.surface} size="small" />
        : <Text style={styles.fabIcon}>{atLimit ? '✕' : '+'}</Text>}
    </TouchableOpacity>
  </View>
)}
```

Add to the `StyleSheet.create` at the bottom:
```ts
fabContainer: {
  position: 'absolute',
  right: Spacing.marginMain,
  alignItems: 'center',
},
uploadCounter: {
  position: 'absolute',
  right: 0,
  ...TextStyles.labelSm,
  color: Colors.onSurfaceVariant,
  fontSize: 11,
},
uploadCounterLimit: {
  color: Colors.error ?? '#cf6679',
},
```

- [ ] **Step 5: Typecheck mobile**

```bash
cd /Users/elnorrapaj/Documents/CamShare/apps/mobile && npx tsc --noEmit 2>&1 | head -40
```
Fix any type errors.

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/src/screens/GalleryScreen.tsx
git commit -m "feat: upload counter, FAB limit disable, and pre-flight size check in GalleryScreen"
```

---

## Verification Checklist

After all tasks complete, verify end-to-end:

- [ ] Create an event via admin web with photo limit = 3 and file size limit = 1 MB
- [ ] Join the event on mobile, open the gallery — FAB shows `0 / 3 uploads`
- [ ] Upload 3 photos — counter reaches `3 / 3 uploads`, FAB shows ✕ and is disabled
- [ ] Attempt to upload a 4th — FAB is disabled (can't attempt)
- [ ] Attempt to upload a file > 1 MB — Alert fires before upload (if fileSize is available) or API returns 422
- [ ] Open the event in admin web gallery — photos appear grouped under the guest's name
- [ ] Delete a photo from admin gallery — photo disappears from the grid
- [ ] `pnpm typecheck` (all workspaces) — no errors
