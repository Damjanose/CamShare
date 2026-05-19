# Dashboard Live Data — Design Spec

**Date:** 2026-05-19  
**Status:** Approved

## Problem

The dashboard is seeded entirely from mock data (`mockEvents`, `mockUser`). The client `Event` type uses field names (`name`, `date`, `coverUrl`) that differ from the API response (`title`, `eventDate`, `coverImageUrl`), and the API returns no guest or photo counts. The storage panel and stat sub-texts are hardcoded strings.

## Goal

Replace all static content on the dashboard with real API data. Align the client `Event` type with the API shape end-to-end so there is no mapping layer.

---

## 1. API Layer

### 1a. Shared types (`packages/types/src/index.ts`)

Add `guestCount` and `photoCount` to the exported `Event` type:

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
  createdAt: string
  updatedAt: string
}
```

`CreateEventInput` and `UpdateEventInput` are unchanged — counts are computed, never written by the client.

### 1b. `apps/api/src/lib/events.ts`

Update `mapEvent` signature to accept `guestCount` and `photoCount` parameters.

Update `listMyEvents` to compute counts in a single query using Kysely:
- `guestCount`: `COUNT` of rows in `event_members` where `event_id = events.id`
- `photoCount`: `COUNT` of rows in `event_photos` joined through `event_channels` where `event_channels.event_id = events.id`

Update `getEvent` similarly.

---

## 2. Client Type (`apps/client/src/types/domain.ts`)

Replace the existing `Event` type with one that mirrors the API exactly:

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
  createdAt: string
  updatedAt: string
}
```

Fields removed: `name`, `date`, `coverUrl`, `location`, `privacy`, `inviteCode`.  
These never existed in the database schema and were mock-only.

---

## 3. Events Store (`apps/client/src/stores/eventsStore.ts`)

- Remove `mockEvents` import and initialization (`events: []` on startup)
- Remove the `fromApi(apiEvent, input)` mapper (was specific to create-only flow)
- Add `loading: boolean` state field
- Add `fetchEvents(): Promise<void>` action — calls `GET /events`, sets `events` and clears `loading`
- Update `addEvent` to return and prepend the raw API `Event` (no field renaming needed)

---

## 4. Dashboard (`apps/client/src/pages/DashboardPage.tsx`)

- Call `fetchEvents()` in a `useEffect` on mount
- Show a skeleton loading state while `loading` is true
- **Remove** the Storage `GlassPanel` (no API backing)
- **Remove** the `"+2 this month"` hardcoded sub-text; stat shows count only
- Show an empty state (the existing "Start a New Memory Chapter" CTA is sufficient)
- `totalMemories` and `totalGuests` are derived from real event data

---

## 5. Components and Pages

### `EventCard.tsx`
- `event.name` → `event.title`
- `event.date` → `event.eventDate`
- `event.coverUrl` → `event.coverImageUrl`

### `EventGalleryPage.tsx`
- `event.name` → `event.title`
- `event.date` → `event.eventDate`
- Remove `event.location` display

### `QrInvitePage.tsx`
- `event.name` → `event.title`
- `event.date` → `event.eventDate`
- Remove `event.location` display
- Remove `event.coverUrl` → `event.coverImageUrl`
- Remove `event.inviteCode` fallback (already fetches join token from API)

### `CreateEventPage.tsx`
- Remove `location` and `privacy` form fields (no DB columns for them)
- Remove them from the form state and submission payload

### `authStore.ts`
- Remove `mockUser` import
- Use `null` for `avatarUrl` in `toWebUser` (the `User` type already supports `string`)

---

## 6. Cleanup

- `apps/client/src/data/mockEvents.ts` — delete (no longer imported)
- `apps/client/src/data/mockUser.ts` — delete (no longer imported)
- `apps/client/src/data/mockPhotos.ts` — delete if no longer imported elsewhere

---

## Out of Scope

- Adding `location` or `privacy` to the DB schema
- Storage quota API
- Photo store / gallery live data (separate concern)
