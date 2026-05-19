# Dashboard Live Data — Design Spec

**Date:** 2026-05-19  
**Status:** Approved

## Problem

The dashboard is seeded entirely from mock data (`mockEvents`, `mockUser`). The client `Event` type uses field names (`name`, `date`, `coverUrl`) that differ from the API response (`title`, `eventDate`, `coverImageUrl`), and the API returns no guest or photo counts. The storage panel and stat sub-texts are hardcoded strings.

## Goal

Replace all static content on the dashboard with real API data. Align the client `Event` type with the API response shape end-to-end so there is no mapping layer.

---

## Type Ownership

Two separate `Event` type definitions exist and must both be updated:
- **`packages/types/src/index.ts`** — shared API contract, consumed by the API server only
- **`apps/client/src/types/domain.ts`** — client-local type, used by all React components and stores

The client does not import from `packages/types` directly. The client type is updated to mirror the API response shape.

---

## 1. API Layer

### 1a. Shared types (`packages/types/src/index.ts`)

Add `guestCount: number` and `photoCount: number` to the exported `Event` type:

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

`CreateEventInput` and `UpdateEventInput` are unchanged — counts are computed server-side.

### 1b. `apps/api/src/lib/events.ts`

**Verified join paths (from `db/migrations/003_events.sql`):**
- `guestCount`: COUNT of `event_members` where `event_members.event_id = events.id`
- `photoCount`: correlated subquery —
  ```sql
  SELECT COUNT(*) FROM event_photos ep
  INNER JOIN event_channels ec ON ep.channel_id = ec.id
  WHERE ec.event_id = events.id
  ```

**`mapEvent`:** Updated to accept the extended row type including `guest_count` and `photo_count` (both optional, defaulting to 0). Parse as integers: `Number(row.guest_count ?? 0)`.

**Functions to update — all call `mapEvent` and must pass counts:**

- **`listMyEvents`:** Add both correlated scalar subqueries to the SELECT clause. Kysely returns COUNT as a string; cast to integer in `mapEvent`.
- **`getEvent`:** Same two scalar subqueries on the single-row SELECT.
- **`updateEvent`:** Same two scalar subqueries on the UPDATE…RETURNING SELECT.
- **`joinEvent`:** Same two scalar subqueries on the post-join SELECT.
- **`createEvent`:** The inserted row does not have counts readily available. Supply hardcoded defaults directly after insert: `guestCount: 1` (owner added as member in the same transaction) and `photoCount: 0`. No need to re-query.

---

## 2. Client Type (`apps/client/src/types/domain.ts`)

Replace the existing `Event` type:

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

**`User` type:**
- `avatarUrl: string` → `avatarUrl: string | null`. The API does not return an avatar URL; `null` is the correct absence value. Note: existing avatar consumers in `SidebarNav.tsx` and `TopBar.tsx` already null-guard `avatarUrl` — no changes required there.
- `tier: "Free" | "Premium Member"` — kept as-is. `authStore.ts` hardcodes `"Free"` and this is acceptable; it has no API backing and is out of scope to remove.

---

## 3. Events Store (`apps/client/src/stores/eventsStore.ts`)

**Route confirmed:** `GET /events` is registered at `apps/api/src/index.ts`.

State shape:
```ts
type EventsState = {
  events: Event[]
  loading: boolean
  error: string | null
  fetchEvents: () => Promise<void>
  getById: (id: string) => Event | undefined
  addEvent: (input: EventInput) => Promise<Event>
}
```

**`EventInput`:** `Omit<Event, "id" | "guestCount" | "photoCount" | "ownerId" | "createdAt" | "updatedAt" | "isActive">` — yields `{ title, description, eventDate, endDate, coverImageUrl }`. This matches the `POST /events` request body exactly. `location` and `privacy` are absent automatically.

Changes:
- Initialize `events: []`, `loading: false`, `error: null`
- Remove `mockEvents` import and local `ApiEvent` type
- Remove `fromApi(apiEvent, input)` mapping function
- **Add `fetchEvents()`:**
  - Sets `loading: true`, `error: null`
  - On success: `set({ events, loading: false, error: null })`
  - On failure: `set({ loading: false, error: "Failed to load events" })`
- **Update `addEvent`:** calls `POST /events`, prepends returned `Event` to store. No field renaming. `CreateEventPage` uses `created.id` to navigate — `id` present on new type, compatible.
- Remove mock fallback in `addEvent` catch block

---

## 4. Dashboard (`apps/client/src/pages/DashboardPage.tsx`)

- `useEffect(() => { fetchEvents() }, [fetchEvents])` — `fetchEvents` from Zustand is referentially stable, so this is functionally equivalent to `[]` and satisfies exhaustive-deps lint.
- **Loading:** skeleton placeholder cards in place of StatCards and event grid
- **Error:** inline error message + "Retry" button that calls `fetchEvents()` again
- **Remove** the Storage `GlassPanel` (no API for storage quota)
- **Remove** the `"+2 this month"` hardcoded sub-text; show event count only
- `totalMemories` and `totalGuests` derived from real events via `.reduce()`
- **Empty state:** existing "Start a New Memory Chapter" CTA block is sufficient

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
- `event.name` → `event.title` (in JSX and breadcrumb)
- `event.date` → `event.eventDate`
- `event.coverUrl` → `event.coverImageUrl`
- Remove `event.location` display
- Remove `event.inviteCode` fallback (line 34): when `joinToken` is null, show a loading spinner in place of the invite URL. `joinToken` is local `useState` — not an Event field.
- **`PhoneMockup` sub-component** (inline at bottom of file): update its local prop type from `{ name: string; coverUrl: string }` to `{ title: string; coverImageUrl: string }` and update all JSX references inside it.

### `CreateEventPage.tsx`
- Remove `location` and `privacy` form fields from UI and local state
- Update `addEvent(...)` call in `handleSubmit` to use new field names:
  - `name` → `title`
  - `date` → `eventDate`
  - `coverUrl` → `coverImageUrl`
  - Remove `location` and `privacy` from the payload

### `authStore.ts`
- Remove `mockUser` import
- In `toWebUser`: set `avatarUrl: null`

---

## 6. Cleanup

- **Delete `mockEvents.ts`** after `eventsStore.ts` is updated (no longer imported)
- **Delete `mockUser.ts`** after `authStore.ts` is updated (no longer imported). Must be deleted after, not before.
- **Keep `mockPhotos.ts`** — still imported by `photosStore.ts`; gallery live data is out of scope

---

## Out of Scope

- Adding `location` or `privacy` DB columns
- Storage quota API
- Photo store / gallery live data (photos store retains mock seed)
