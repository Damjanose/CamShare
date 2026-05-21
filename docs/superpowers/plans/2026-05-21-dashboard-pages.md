# Dashboard Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build four missing sidebar pages (Collections, Shared, Analytics, Archive) and fix the Dashboard, using client-side filtering of the existing eventsStore with no new API endpoints.

**Architecture:** All data comes from the existing `GET /events` endpoint via `useEventsStore`. Each page applies a client-side filter to the shared cached events array. A new `restoreEvent` action patches `isActive: true` server-side then updates the store immutably via spread-map. No new API endpoints required.

**Tech Stack:** React 19, Zustand 5, React Router v7, Tailwind CSS (custom MD3 tokens), Vitest 3

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `apps/client/vitest.config.ts` | **Modify** | Add `@` path alias (file already exists with env + include) |
| `apps/client/src/stores/eventsStore.ts` | Modify | Add `restoreEvent` to `EventsState` type + `create` body |
| `apps/client/src/stores/eventsStore.test.ts` | Create | Unit tests for `restoreEvent` store action |
| `apps/client/src/App.tsx` | Modify | Add 4 routes before `/events/:eventId*` family |
| `apps/client/src/pages/DashboardPage.tsx` | Modify | Wire "View All" to `/events`; filter recent events to active owned |
| `apps/client/src/pages/CollectionsPage.tsx` | Create | Browse owned active events with search + sort |
| `apps/client/src/pages/SharedPage.tsx` | Create | Browse active guest-joined events |
| `apps/client/src/pages/AnalyticsPage.tsx` | Create | 4 stat cards + top events table + CSS activity bar chart |
| `apps/client/src/pages/ArchivePage.tsx` | Create | Browse + restore owned inactive events |

---

## Task 1: Add `restoreEvent` to eventsStore

**Files:**
- Modify: `apps/client/vitest.config.ts`
- Create: `apps/client/src/stores/eventsStore.test.ts`
- Modify: `apps/client/src/stores/eventsStore.ts`

- [ ] **Step 1: Add `@` alias to vitest.config.ts**

The file already exists at `apps/client/vitest.config.ts` with this content:
```ts
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
})
```

Add the `resolve.alias` block and `path` import so `@/…` resolves in tests. The full file after modification:

```ts
import { defineConfig } from "vitest/config"
import path from "node:path"

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

- [ ] **Step 2: Write the failing test**

Create `apps/client/src/stores/eventsStore.test.ts`. Uses `useEventsStore.getState()` / `.setState()` — no React DOM needed.

```ts
import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/api/client", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}))

import { apiClient } from "@/api/client"
import { useEventsStore } from "./eventsStore"

const mockEvent = (overrides = {}) => ({
  id: "evt-1",
  ownerId: "user-1",
  title: "Test Event",
  description: null,
  eventDate: null,
  endDate: null,
  coverImageUrl: null,
  isActive: false,
  guestCount: 0,
  photoCount: 0,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
  ...overrides,
})

describe("eventsStore.restoreEvent", () => {
  beforeEach(() => {
    useEventsStore.setState({ events: [mockEvent()], loading: false, error: null })
    vi.clearAllMocks()
  })

  it("sets isActive to true in store on success", async () => {
    vi.mocked(apiClient.patch).mockResolvedValue(undefined as unknown)
    await useEventsStore.getState().restoreEvent("evt-1")
    expect(useEventsStore.getState().events[0].isActive).toBe(true)
    expect(apiClient.patch).toHaveBeenCalledWith("/events/evt-1", { isActive: true })
  })

  it("does not mutate store on API error", async () => {
    vi.mocked(apiClient.patch).mockRejectedValue(new Error("Network error"))
    await expect(useEventsStore.getState().restoreEvent("evt-1")).rejects.toThrow("Network error")
    expect(useEventsStore.getState().events[0].isActive).toBe(false)
  })
})
```

Note: `mockResolvedValue(undefined as unknown)` is required because `apiClient.patch` is generic (`Promise<T>`) and TypeScript strict mode won't accept a bare `undefined` without the cast.

- [ ] **Step 3: Run to verify test fails**

```bash
pnpm --filter @camshare/client test
```

Expected output: FAIL — `restoreEvent is not a function` (or similar — action doesn't exist yet)

- [ ] **Step 4: Add `restoreEvent` to eventsStore**

In `apps/client/src/stores/eventsStore.ts`:

**a.** In the `EventsState` type block, add after the `addEvent` line:
```ts
  restoreEvent: (id: string) => Promise<void>
```

**b.** In the `create<EventsState>((set, get) => ({...}))` body, add after the `addEvent` implementation:
```ts
  restoreEvent: async (id) => {
    await apiClient.patch(`/events/${id}`, { isActive: true })
    set({ events: get().events.map((e) => e.id === id ? { ...e, isActive: true } : e) })
  },
```

`set()` is only called after a successful `patch`. If `patch` throws, the error propagates to the caller and state stays unchanged.

- [ ] **Step 5: Run to verify tests pass**

```bash
pnpm --filter @camshare/client test
```

Expected: 2 tests passing, 0 failing

- [ ] **Step 6: Commit**

```bash
git add apps/client/vitest.config.ts apps/client/src/stores/eventsStore.ts apps/client/src/stores/eventsStore.test.ts
git commit -m "feat: add restoreEvent action to eventsStore"
```

---

## Task 2: Wire routes + fix Dashboard

**Files:**
- Modify: `apps/client/src/App.tsx`
- Modify: `apps/client/src/pages/DashboardPage.tsx`

> **Note:** After this task, the TypeScript compiler will report "Cannot find module" errors for the four new page files until Tasks 3–6 are complete. Do not run `typecheck` until Task 7.

- [ ] **Step 1: Add 4 imports to App.tsx**

At the top of `apps/client/src/App.tsx`, add after the existing page imports:

```ts
import { CollectionsPage } from "@/pages/CollectionsPage"
import { SharedPage } from "@/pages/SharedPage"
import { AnalyticsPage } from "@/pages/AnalyticsPage"
import { ArchivePage } from "@/pages/ArchivePage"
```

- [ ] **Step 2: Insert 4 routes in App.tsx**

Inside the `<ProtectedRoute>` block, insert the four routes **before** `<Route path="/events/new" ...>`. The protected block must read in this exact order:

```tsx
<Route path="/dashboard" element={<DashboardPage />} />
<Route path="/events" element={<CollectionsPage />} />
<Route path="/shared" element={<SharedPage />} />
<Route path="/analytics" element={<AnalyticsPage />} />
<Route path="/archive" element={<ArchivePage />} />
<Route path="/events/new" element={<CreateEventPage />} />
<Route path="/events/:eventId" element={<EventGalleryPage />} />
<Route path="/events/:eventId/invite" element={<QrInvitePage />} />
```

`/events` must appear before all `/events/:eventId*` routes. React Router v7 matches static paths first, but order within the same parent still matters for routes at the same depth.

- [ ] **Step 3: Fix DashboardPage — "View All" button**

In `apps/client/src/pages/DashboardPage.tsx`, `Link` is already imported from `react-router-dom`.

Find the "View All" button (~line 94–99):
```tsx
<button
  type="button"
  className="text-primary font-label-md flex items-center gap-1 hover:underline whitespace-nowrap"
>
  View All <Icon name="arrow_forward" />
</button>
```

Replace with:
```tsx
<Link
  to="/events"
  className="text-primary font-label-md flex items-center gap-1 hover:underline whitespace-nowrap"
>
  View All <Icon name="arrow_forward" />
</Link>
```

- [ ] **Step 4: Fix DashboardPage — filter recent events**

In the same file, find (~line 103):
```tsx
{events.slice(0, 3).map((event) => (
```

Replace with:
```tsx
{events.filter(e => e.ownerId === user?.id && e.isActive).slice(0, 3).map((event) => (
```

`user` is already in scope from `useAuth()`. The `?.id` null-guard is required since `user` is typed `User | null`.

- [ ] **Step 5: Commit**

```bash
git add apps/client/src/App.tsx apps/client/src/pages/DashboardPage.tsx
git commit -m "fix: wire View All link and filter recent events on Dashboard"
```

---

## Task 3: Build CollectionsPage

**Files:**
- Create: `apps/client/src/pages/CollectionsPage.tsx`

- [ ] **Step 1: Create CollectionsPage**

`GlassPanel` wraps the search + sort controls row. When `user` is `null` (impossible behind `ProtectedRoute` but required by TypeScript), `user?.id` is `undefined` and the filter returns no events — safe empty state.

```tsx
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { EventCard } from "@/components/event/EventCard"
import { GlassPanel } from "@/components/primitives/GlassPanel"
import { Icon } from "@/components/primitives/Icon"
import { useEventsStore } from "@/stores/eventsStore"
import { useAuth } from "@/auth/AuthContext"

type SortKey = "newest" | "oldest" | "most_photos"

export const CollectionsPage = () => {
  const { user } = useAuth()
  const events = useEventsStore((s) => s.events)
  const loading = useEventsStore((s) => s.loading)
  const fetchEvents = useEventsStore((s) => s.fetchEvents)

  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<SortKey>("newest")

  useEffect(() => {
    if (events.length === 0 && !loading) fetchEvents()
  }, [events.length, loading, fetchEvents])

  const owned = events.filter((e) => e.ownerId === user?.id && e.isActive)

  const filtered = owned.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase())
  )

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    if (sort === "most_photos") return b.photoCount - a.photoCount
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  if (loading) {
    return (
      <>
        <header className="mb-12">
          <div className="h-10 w-64 bg-surface-container-high rounded-xl animate-pulse mb-2" />
          <div className="h-5 w-96 bg-surface-container-high rounded-lg animate-pulse" />
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-[4/5] bg-surface-container-high rounded-3xl animate-pulse" />
          ))}
        </div>
      </>
    )
  }

  return (
    <>
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <h1 className="font-display-lg text-display-lg text-primary mb-2">Collections</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
            All the events you have created and curated.
          </p>
        </div>
        <Link
          to="/events/new"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-on-primary font-label-md whitespace-nowrap hover:scale-[1.02] transition-transform shadow-md"
        >
          <Icon name="add" /> Create Event
        </Link>
      </header>

      <GlassPanel className="p-4 mb-8">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl" />
            <input
              type="text"
              placeholder="Search events…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-outline-variant font-body-md text-on-surface focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="px-4 py-3 rounded-2xl bg-white border border-outline-variant font-body-md text-on-surface focus:outline-none focus:border-primary transition-colors"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="most_photos">Most Photos</option>
          </select>
        </div>
      </GlassPanel>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-6 text-center">
          <div className="w-20 h-20 rounded-full bg-primary-container/20 flex items-center justify-center">
            <Icon name="collections" className="text-primary text-4xl" />
          </div>
          <div>
            <p className="font-headline-md text-primary mb-2">
              {search ? "No events match your search" : "No collections yet"}
            </p>
            <p className="font-body-md text-on-surface-variant max-w-xs">
              {search
                ? "Try a different search term."
                : "Create your first event to start collecting memories."}
            </p>
          </div>
          {!search && (
            <Link
              to="/events/new"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-primary text-on-primary font-label-md hover:scale-[1.02] transition-transform"
            >
              <Icon name="add_circle" /> Create Event
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sorted.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/client/src/pages/CollectionsPage.tsx
git commit -m "feat: add CollectionsPage"
```

---

## Task 4: Build SharedPage

**Files:**
- Create: `apps/client/src/pages/SharedPage.tsx`

- [ ] **Step 1: Create SharedPage**

Filter is `ownerId !== user?.id && isActive`. When `user` is `null`, `user?.id` is `undefined` and `ownerId !== undefined` would be true for all events — but `ProtectedRoute` prevents unauthenticated renders, so this is a TypeScript safety case only.

```tsx
import { useEffect } from "react"
import { EventCard } from "@/components/event/EventCard"
import { Icon } from "@/components/primitives/Icon"
import { useEventsStore } from "@/stores/eventsStore"
import { useAuth } from "@/auth/AuthContext"

export const SharedPage = () => {
  const { user } = useAuth()
  const events = useEventsStore((s) => s.events)
  const loading = useEventsStore((s) => s.loading)
  const fetchEvents = useEventsStore((s) => s.fetchEvents)

  useEffect(() => {
    if (events.length === 0 && !loading) fetchEvents()
  }, [events.length, loading, fetchEvents])

  if (!user) return null

  const shared = events.filter((e) => e.ownerId !== user.id && e.isActive)

  if (loading) {
    return (
      <>
        <header className="mb-12">
          <div className="h-10 w-64 bg-surface-container-high rounded-xl animate-pulse mb-2" />
          <div className="h-5 w-80 bg-surface-container-high rounded-lg animate-pulse" />
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-[4/5] bg-surface-container-high rounded-3xl animate-pulse" />
          ))}
        </div>
      </>
    )
  }

  return (
    <>
      <header className="mb-10">
        <h1 className="font-display-lg text-display-lg text-primary mb-2">Shared With Me</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
          Events you have been invited to as a guest.
        </p>
      </header>

      {shared.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-6 text-center">
          <div className="w-20 h-20 rounded-full bg-primary-container/20 flex items-center justify-center">
            <Icon name="group" className="text-primary text-4xl" />
          </div>
          <div>
            <p className="font-headline-md text-primary mb-2">No shared events yet</p>
            <p className="font-body-md text-on-surface-variant max-w-xs">
              You haven't been invited to any events yet. Ask a host to share their event QR code with you.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {shared.map((event) => (
            <div key={event.id} className="relative">
              <EventCard event={event} />
              <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/60 text-white font-label-md text-caption backdrop-blur-sm pointer-events-none">
                Shared event
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/client/src/pages/SharedPage.tsx
git commit -m "feat: add SharedPage"
```

---

## Task 5: Build AnalyticsPage

**Files:**
- Create: `apps/client/src/pages/AnalyticsPage.tsx`

- [ ] **Step 1: Create AnalyticsPage**

Stats cover all owned events (active + inactive — archiving an event does not erase its history). The bar chart guards against `maxPhotoCount === 0` to avoid `NaN%`. Both the "Top Events" table and the "Activity" bar chart use `topEvents` (sorted by `photoCount` desc) — the chart therefore renders longest bar first, which is visually coherent.

```tsx
import { useEffect } from "react"
import { Link } from "react-router-dom"
import { StatCard } from "@/components/event/StatCard"
import { Icon } from "@/components/primitives/Icon"
import { useEventsStore } from "@/stores/eventsStore"
import { useAuth } from "@/auth/AuthContext"

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })

export const AnalyticsPage = () => {
  const { user } = useAuth()
  const events = useEventsStore((s) => s.events)
  const loading = useEventsStore((s) => s.loading)
  const fetchEvents = useEventsStore((s) => s.fetchEvents)

  useEffect(() => {
    if (events.length === 0 && !loading) fetchEvents()
  }, [events.length, loading, fetchEvents])

  const owned = events.filter((e) => e.ownerId === user?.id)
  const totalPhotos = owned.reduce((s, e) => s + e.photoCount, 0)
  const totalGuests = owned.reduce((s, e) => s + e.guestCount, 0)
  const avgPhotos = owned.length > 0 ? Math.round(totalPhotos / owned.length) : 0

  const topEvents = [...owned].sort((a, b) => b.photoCount - a.photoCount)
  const maxPhotoCount = owned.reduce((m, e) => Math.max(m, e.photoCount), 0)

  if (loading) {
    return (
      <>
        <header className="mb-12">
          <div className="h-10 w-48 bg-surface-container-high rounded-xl animate-pulse mb-2" />
        </header>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-surface-container-high rounded-3xl animate-pulse" />
          ))}
        </div>
      </>
    )
  }

  if (owned.length === 0) {
    return (
      <>
        <header className="mb-10">
          <h1 className="font-display-lg text-display-lg text-primary mb-2">Analytics</h1>
        </header>
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-6 text-center">
          <div className="w-20 h-20 rounded-full bg-primary-container/20 flex items-center justify-center">
            <Icon name="analytics" className="text-primary text-4xl" />
          </div>
          <div>
            <p className="font-headline-md text-primary mb-2">No data yet</p>
            <p className="font-body-md text-on-surface-variant max-w-xs">
              Create an event to start seeing your activity stats.
            </p>
          </div>
          <Link
            to="/events/new"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-primary text-on-primary font-label-md hover:scale-[1.02] transition-transform"
          >
            <Icon name="add_circle" /> Create Event
          </Link>
        </div>
      </>
    )
  }

  return (
    <>
      <header className="mb-10">
        <h1 className="font-display-lg text-display-lg text-primary mb-2">Analytics</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          An overview of your photo-sharing activity.
        </p>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-14">
        <StatCard label="Total Events" value={owned.length} />
        <StatCard
          label="Total Photos"
          value={totalPhotos >= 1000 ? `${(totalPhotos / 1000).toFixed(1)}k` : totalPhotos}
          sub="uploads"
        />
        <StatCard label="Total Guests" value={totalGuests} sub="collaborators" subTone="amethyst" />
        <StatCard label="Avg Photos / Event" value={avgPhotos} sub="per event" />
      </section>

      <section className="mb-14">
        <h2 className="font-headline-lg text-headline-lg text-primary mb-6">Top Events</h2>
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant/30">
                <th className="text-left px-6 py-4 font-label-md text-on-surface-variant text-caption">#</th>
                <th className="text-left px-6 py-4 font-label-md text-on-surface-variant text-caption">Event</th>
                <th className="text-left px-6 py-4 font-label-md text-on-surface-variant text-caption hidden md:table-cell">Date</th>
                <th className="text-right px-6 py-4 font-label-md text-on-surface-variant text-caption">Photos</th>
                <th className="text-right px-6 py-4 font-label-md text-on-surface-variant text-caption hidden sm:table-cell">Guests</th>
              </tr>
            </thead>
            <tbody>
              {topEvents.map((event, i) => (
                <tr key={event.id} className="border-b border-outline-variant/20 last:border-0 hover:bg-surface-container-lowest/50 transition-colors">
                  <td className="px-6 py-4 font-label-md text-on-surface-variant">{i + 1}</td>
                  <td className="px-6 py-4">
                    <span className="font-body-md text-on-surface">{event.title}</span>
                    {!event.isActive && (
                      <span className="ml-2 px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-md text-caption">archived</span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-body-md text-on-surface-variant hidden md:table-cell">
                    {event.eventDate ? formatDate(event.eventDate) : "—"}
                  </td>
                  <td className="px-6 py-4 text-right font-label-md text-primary">{event.photoCount}</td>
                  <td className="px-6 py-4 text-right font-body-md text-on-surface-variant hidden sm:table-cell">{event.guestCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="font-headline-lg text-headline-lg text-primary mb-6">Activity</h2>
        <div className="bg-white rounded-3xl shadow-sm p-6 space-y-4">
          {topEvents.map((event) => (
            <div key={event.id}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-body-md text-on-surface truncate max-w-[60%]" title={event.title}>
                  {event.title.length > 30 ? `${event.title.slice(0, 30)}…` : event.title}
                </span>
                <span className="font-label-md text-on-surface-variant ml-2 shrink-0">{event.photoCount} photos</span>
              </div>
              <div className="h-3 rounded-full bg-surface-container-high overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: maxPhotoCount > 0 ? `${(event.photoCount / maxPhotoCount) * 100}%` : "0%",
                    background: "linear-gradient(90deg, #735c00, #d4af37)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/client/src/pages/AnalyticsPage.tsx
git commit -m "feat: add AnalyticsPage"
```

---

## Task 6: Build ArchivePage

**Files:**
- Create: `apps/client/src/pages/ArchivePage.tsx`

- [ ] **Step 1: Create ArchivePage**

`restoringIds` tracks in-flight restore calls independently per card. On success, the store sets `isActive: true` and the Archive filter removes the card automatically — no local state cleanup needed. On error, the id is removed from `restoringIds` and an inline message appears below the card.

The Restore button is a sibling element of `EventCard` (not a descendant), so click events do not bubble through the `<Link>` inside `EventCard`. The `e.preventDefault()` call is omitted as it has no effect in this DOM structure.

```tsx
import { useEffect, useState } from "react"
import { EventCard } from "@/components/event/EventCard"
import { Icon } from "@/components/primitives/Icon"
import { useEventsStore } from "@/stores/eventsStore"
import { useAuth } from "@/auth/AuthContext"

export const ArchivePage = () => {
  const { user } = useAuth()
  const events = useEventsStore((s) => s.events)
  const loading = useEventsStore((s) => s.loading)
  const fetchEvents = useEventsStore((s) => s.fetchEvents)
  const restoreEvent = useEventsStore((s) => s.restoreEvent)

  const [restoringIds, setRestoringIds] = useState<Set<string>>(new Set())
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (events.length === 0 && !loading) fetchEvents()
  }, [events.length, loading, fetchEvents])

  if (!user) return null

  const archived = events.filter((e) => e.ownerId === user.id && !e.isActive)

  const handleRestore = async (id: string) => {
    setRestoringIds((prev) => new Set(prev).add(id))
    setErrors((prev) => { const next = { ...prev }; delete next[id]; return next })
    try {
      await restoreEvent(id)
    } catch {
      setErrors((prev) => ({ ...prev, [id]: "Failed to restore. Please try again." }))
    } finally {
      setRestoringIds((prev) => { const next = new Set(prev); next.delete(id); return next })
    }
  }

  if (loading) {
    return (
      <>
        <header className="mb-12">
          <div className="h-10 w-48 bg-surface-container-high rounded-xl animate-pulse mb-2" />
          <div className="h-5 w-72 bg-surface-container-high rounded-lg animate-pulse" />
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-[4/5] bg-surface-container-high rounded-3xl animate-pulse" />
          ))}
        </div>
      </>
    )
  }

  return (
    <>
      <header className="mb-10">
        <h1 className="font-display-lg text-display-lg text-primary mb-2">Archive</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
          Events you have deactivated. Restore any event to make it active again.
        </p>
      </header>

      {archived.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-6 text-center">
          <div className="w-20 h-20 rounded-full bg-primary-container/20 flex items-center justify-center">
            <Icon name="inventory_2" className="text-primary text-4xl" />
          </div>
          <div>
            <p className="font-headline-md text-primary mb-2">Nothing here yet</p>
            <p className="font-body-md text-on-surface-variant max-w-xs">
              Archived events will appear here. Deactivate an event from its settings to archive it.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {archived.map((event) => (
            <div key={event.id} className="flex flex-col gap-2">
              <div className="relative group">
                <EventCard event={event} />
                <div className="absolute inset-0 rounded-3xl bg-black/0 group-hover:bg-black/20 transition-colors duration-300 pointer-events-none" />
                <div className="absolute bottom-6 inset-x-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button
                    type="button"
                    onClick={() => handleRestore(event.id)}
                    disabled={restoringIds.has(event.id)}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-primary font-label-md shadow-lg hover:scale-[1.03] transition-transform disabled:opacity-60 disabled:cursor-not-allowed pointer-events-auto"
                  >
                    {restoringIds.has(event.id) ? (
                      <><Icon name="progress_activity" className="animate-spin" /> Restoring…</>
                    ) : (
                      <><Icon name="restore" /> Restore</>
                    )}
                  </button>
                </div>
              </div>
              {errors[event.id] && (
                <p className="text-error font-label-md text-caption px-2">{errors[event.id]}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/client/src/pages/ArchivePage.tsx
git commit -m "feat: add ArchivePage with restore interaction"
```

---

## Task 7: Final verification

- [ ] **Step 1: Run tests**

```bash
pnpm --filter @camshare/client test
```

Expected: 2 tests passing, 0 failing

- [ ] **Step 2: Typecheck**

Run only after all four page files from Tasks 3–6 exist.

```bash
pnpm --filter @camshare/client typecheck
```

Expected: 0 errors

- [ ] **Step 3: Manual smoke-test in browser**

Start dev server:
```bash
pnpm dev
```

Navigate to each route and verify:

| Route | Check |
|---|---|
| `/dashboard` | "View All" navigates to `/events`; recent grid shows only your active owned events |
| `/events` | Search filters by title; sort dropdown reorders cards; empty state shown when no owned events |
| `/shared` | "Shared event" badge visible on cards; shows only events you didn't create |
| `/analytics` | 4 stat cards show totals; top events table sorted by photos desc; activity bar chart renders without `NaN%` |
| `/archive` | Hover on card reveals Restore button; clicking it removes the card from the grid; error message appears if API fails |
