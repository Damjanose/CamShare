# Dashboard Pages Design

**Date:** 2026-05-21  
**Scope:** Fill in the four missing pages linked from the sidebar, plus a minor Dashboard fix.

---

## Overview

CamShare's sidebar links to five routes. Only Dashboard has a page. This spec covers building the four missing pages and fixing one broken element on Dashboard.

Pages in scope:
- `/dashboard` — fix "View All" button
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

Add a single new action to `apps/client/src/stores/eventsStore.ts`:

```ts
restoreEvent: async (id: string) => Promise<void>
```

Implementation: `PATCH /events/:id { isActive: true }`, then update the matching event in store state (`isActive: true`).

### Client-side filters

| Page | Filter |
|---|---|
| Collections | `ownerId === user.id && isActive === true` |
| Shared | `ownerId !== user.id` |
| Archive | `ownerId === user.id && isActive === false` |
| Analytics | all owned events (`ownerId === user.id`) |

---

## Routes

Add to `App.tsx` inside `<AppShell>` (protected):

```
/events     → CollectionsPage
/shared     → SharedPage
/analytics  → AnalyticsPage
/archive    → ArchivePage
```

---

## Pages

### Dashboard fix

Change the "View All" `<button>` (line ~98 in DashboardPage.tsx) to `<Link to="/events">`. The stat cards and recent-events grid stay unchanged. The "Recent Events" section shows only `ownerId === user.id && isActive === true` events (at most 3).

---

### Collections (`/events`)

**Purpose:** Browse all events the user owns.

**Layout:**
1. Page header: title "Collections", subtitle, "Create Event" link button (top-right)
2. Controls row: search input (filters by title, client-side) + sort dropdown (Newest / Oldest / Most Photos)
3. Event grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8`, uses existing `EventCard`
4. Empty state: illustrated placeholder + "Create your first event" CTA

**Behaviour:**
- Calls `fetchEvents()` on mount if store is empty
- Filters: `ownerId === user.id && isActive`
- Search: case-insensitive substring match on `event.title`
- Sort options: by `createdAt` desc (Newest), `createdAt` asc (Oldest), `photoCount` desc (Most Photos)
- Loading skeleton: 6 pulse cards in same grid

**Components used:** `EventCard`, `StatCard`, `Icon`, `GlassPanel`

---

### Shared (`/shared`)

**Purpose:** Browse events the user joined as a guest.

**Layout:**
1. Page header: title "Shared With Me"
2. Event grid: same grid layout as Collections, uses `EventCard`
3. Each card shows a small host-name byline — requires host name lookup

**Host name concern:** The `Event` type includes `ownerId` (UUID) but no owner display name. Since we cannot look up owner names without extra API work, display "Shared event" as a static badge on each card instead. This keeps the page fully functional without new endpoints.

**Behaviour:**
- Calls `fetchEvents()` on mount if store is empty
- Filters: `ownerId !== user.id`
- Loading and empty states matching Collections pattern
- Empty state: "You haven't been invited to any events yet." + explanation text

---

### Analytics (`/analytics`)

**Purpose:** Account-level overview of the user's photo-sharing activity.

**Data source:** Computed client-side from eventsStore, filtered to owned events.

**Layout:**
1. Page header: title "Analytics"
2. Stat row (4 cards): Total Events, Total Photos, Total Guests, Avg Photos/Event
3. "Top Events" section: table of owned events sorted by photoCount desc, showing rank, title, date, photos, guests
4. "Activity" section: CSS bar chart — one bar per owned event, bar width proportional to photoCount relative to max

**Bar chart implementation:** No external library. Each bar is a `div` with `width: (photoCount / maxPhotoCount * 100)%` and a gold gradient background. Labels show event title (truncated) and count.

**Empty state:** If no owned events, show a single illustrated placeholder card prompting to create an event.

---

### Archive (`/archive`)

**Purpose:** View and restore events the user owns that have `isActive: false`.

**Layout:**
1. Page header: title "Archive", subtitle
2. Event grid: same grid as Collections
3. Each EventCard gets a "Restore" overlay button — absolute-positioned at bottom of card, appears on hover

**Restore interaction:**
- Clicking "Restore" calls `restoreEvent(id)` on eventsStore
- Optimistic: remove the card from the archive grid immediately
- On error: re-add the card and show an inline error
- After restore, the event reappears in Collections

**Empty state:** "Nothing here yet. Archived events will appear here." — no CTA since archiving is done from the event detail page.

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
apps/client/src/App.tsx                 — add 4 routes
apps/client/src/pages/DashboardPage.tsx — fix "View All" button + filter to active owned events
```

---

## Design Constraints

- No external chart or table libraries — use existing primitives only
- Follow existing Tailwind token usage: `text-primary`, `font-display-lg`, `rounded-3xl`, etc.
- Skeleton loading states: `animate-pulse bg-surface-container-high rounded-3xl`
- All pages wrapped in `<>` fragment (AppShell provides the outer padding/margin)
- Match the gold/glassmorphism aesthetic of DashboardPage exactly
