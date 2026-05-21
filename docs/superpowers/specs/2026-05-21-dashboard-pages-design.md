# Dashboard Pages Design

**Date:** 2026-05-21  
**Scope:** Fill in the four missing pages linked from the sidebar, plus a minor Dashboard fix.

---

## Overview

CamShare's sidebar links to five routes. Only Dashboard has a page. This spec covers building the four missing pages and fixing one broken element on Dashboard.

Pages in scope:
- `/dashboard` — fix "View All" button + filter recent events
- `/events` — Collections
- `/shared` — Shared (events you joined as guest)
- `/analytics` — Analytics (account-level stats)
- `/archive` — Archive (inactive events, with restore)

---

## Data Layer

### Existing API

`GET /events` returns **all events the authenticated user is a member of** — both events they own and events they joined as a guest. It returns both active (`isActive: true`) and inactive (`isActive: false`) events.

`PATCH /events/:eventId` with `{ isActive: true }` restores an archived event. Only the owner can do this (enforced server-side).

### No new API endpoints required

All four pages derive their data by filtering the existing eventsStore.

### eventsStore additions

Add a single new action to `apps/client/src/stores/eventsStore.ts`. Update **both** the `EventsState` TypeScript interface and the `create` implementation body:

```ts
// In EventsState type:
restoreEvent: (id: string) => Promise<void>

// In create body (immutable spread-map — do NOT mutate the array in place):
restoreEvent: async (id) => {
  await apiClient.patch(`/events/${id}`, { isActive: true })
  set({ events: get().events.map((e) => e.id === id ? { ...e, isActive: true } : e) })
},
```

If the API call throws, `set()` is never called — state stays unchanged and the error propagates to the calling component.

### Client-side filters

| Page | Filter |
|---|---|
| Collections | `ownerId === user.id && isActive === true` |
| Shared | `ownerId !== user.id && isActive === true` |
| Archive | `ownerId === user.id && isActive === false` |
| Analytics | `ownerId === user.id` (active and inactive — stats intentionally include archived events) |

---

## Routes

Add to `App.tsx` inside `<AppShell>` (protected). The `/events` route **must be declared before all `/events/:eventId*` routes** (`/events/new`, `/events/:eventId`, `/events/:eventId/invite`) to prevent the dynamic segment from matching the bare `/events` path:

```
/events     → CollectionsPage      ← insert BEFORE /events/new and /events/:eventId*
/shared     → SharedPage
/analytics  → AnalyticsPage
/archive    → ArchivePage
```

---

## Pages

### Dashboard fix

Two changes to `DashboardPage.tsx`:

1. Change the "View All" `<button>` to `<Link to="/events">`.
2. Change `events.slice(0, 3)` to `events.filter(e => e.ownerId === user.id && e.isActive).slice(0, 3)` so the "Recent Events" grid shows only active owned events.

The three StatCards (`Total Events`, `Total Memories`, `Active Guests`) continue to count **all events the user is a member of** (owned + guest, active + inactive). This is intentional — the stat cards represent the user's full network activity, not just events they created.

---

### Collections (`/events`)

**Purpose:** Browse all active events the user owns.

**Layout:**
1. Page header: title "Collections", subtitle, "Create Event" link button (top-right)
2. Controls row: search input (filters by title, client-side) + sort dropdown (Newest / Oldest / Most Photos)
3. Event grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8`, uses existing `EventCard`
4. Empty state: illustrated placeholder + "Create your first event" CTA

**Behaviour:**
- Calls `fetchEvents()` on mount if `events.length === 0 && !loading`. Unlike DashboardPage (which fetches unconditionally on every mount), the new pages treat the store as a session cache — navigating between pages does not re-fetch. This is intentional.
- Note: the server silently deletes events where `end_date < now` on every `GET /events` call. This is pre-existing API behaviour out of scope for this spec.
- Filters: `ownerId === user.id && isActive === true`
- Search: case-insensitive substring match on `event.title`
- Sort options: by `createdAt` desc (Newest), `createdAt` asc (Oldest), `photoCount` desc (Most Photos)
- Loading skeleton: 6 pulse cards in same grid

**Components used:** `EventCard`, `Icon`, `GlassPanel`

---

### Shared (`/shared`)

**Purpose:** Browse active events the user joined as a guest.

**Layout:**
1. Page header: title "Shared With Me"
2. Event grid: same grid layout as Collections, uses `EventCard`

**Host name:** The `Event` type includes `ownerId` (UUID) but no owner display name. Display a static "Shared event" badge on each card rather than looking up the owner — no extra API calls required.

**Behaviour:**
- Calls `fetchEvents()` on mount if `events.length === 0 && !loading`
- Filters: `ownerId !== user.id && isActive === true` (inactive guest events are excluded — the user cannot restore them)
- Loading and empty states matching Collections pattern
- Empty state: "You haven't been invited to any events yet."

---

### Analytics (`/analytics`)

**Purpose:** Account-level overview of the user's photo-sharing activity.

**Data source:** Computed client-side from eventsStore, filtered to `ownerId === user.id` (active and inactive — archiving an event does not erase its history from stats).

**Layout:**
1. Page header: title "Analytics"
2. Stat row (4 cards): Total Events, Total Photos, Total Guests, Avg Photos/Event
3. "Top Events" section: owned events sorted by `photoCount` desc, showing rank, title, date, photos, guests
4. "Activity" section: CSS bar chart — one bar per owned event, bar width proportional to `photoCount` relative to max

**Bar chart implementation:** No external library. Each bar is a `div` with:
```
width: maxPhotoCount > 0 ? `${(photoCount / maxPhotoCount * 100)}%` : '0%'
```
Gold gradient background. Labels show event title (truncated to ~30 chars) and count. Guard against `maxPhotoCount === 0` to avoid `NaN%` or `Infinity%`.

**Empty state:** If no owned events, show a placeholder card prompting to create an event.

---

### Archive (`/archive`)

**Purpose:** View and restore events the user owns that have `isActive: false`.

**Layout:**
1. Page header: title "Archive", subtitle
2. Event grid: same grid as Collections
3. Each EventCard gets a "Restore" overlay button — absolute-positioned, appears on hover

**Restore interaction:**
- The component maintains a local `restoringIds: Set<string>` state to track in-flight restores
- Clicking "Restore" adds the id to `restoringIds` (shows spinner on button), calls `restoreEvent(id)`
- On success: the event's `isActive` becomes `true` in the store, so the Archive filter removes it automatically — no additional local state change needed
- On error: remove id from `restoringIds`, show an inline error message beneath the card
- The `restoreEvent` store action does not mutate state on error, so no rollback is needed in the store

**Empty state:** "Nothing here yet. Archived events will appear here." — no CTA.

---

## New Files

```
apps/client/src/pages/CollectionsPage.tsx
apps/client/src/pages/SharedPage.tsx
apps/client/src/pages/AnalyticsPage.tsx
apps/client/src/pages/ArchivePage.tsx
```

---

## Modified Files

```
apps/client/src/stores/eventsStore.ts   — add restoreEvent action
apps/client/src/App.tsx                 — add 4 routes (before /events/:eventId)
apps/client/src/pages/DashboardPage.tsx — fix "View All" link + filter recent events
```

---

## Design Constraints

- No external chart or table libraries — use existing primitives only
- Follow existing Tailwind token usage: `text-primary`, `font-display-lg`, `rounded-3xl`, etc.
- Skeleton loading states: `animate-pulse bg-surface-container-high rounded-3xl`
- All pages wrapped in `<>` fragment (AppShell provides the outer padding/margin)
- Match the gold/glassmorphism aesthetic of DashboardPage exactly
- `EventCard` uses `coverImageUrl ?? ""` — this is a pre-existing behaviour, not changed by this spec
