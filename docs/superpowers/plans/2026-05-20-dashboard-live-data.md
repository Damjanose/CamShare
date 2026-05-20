# Dashboard Live Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all mock/hardcoded data on the dashboard with live API data by aligning the `Event` type end-to-end and adding guest/photo counts to the API response.

**Architecture:** Update the shared `Event` type in `packages/types` to include computed counts, rewrite the Kysely queries in `apps/api/src/lib/events.ts` to add correlated subqueries, then cascade the renamed/added fields through the client type, store, and all consuming components.

**Tech Stack:** TypeScript, Kysely (PostgreSQL), React 19, Zustand, Vite + Vitest

---

## File Map

| File | Change |
|------|--------|
| `packages/types/src/index.ts` | Add `guestCount`, `photoCount` to `Event` |
| `apps/api/src/lib/events.ts` | Update `mapEvent` + all five event functions |
| `apps/client/src/types/domain.ts` | Rename/add/remove fields on `Event`; make `User.avatarUrl` nullable |
| `apps/client/src/stores/eventsStore.ts` | Remove mock seed, add `fetchEvents`, update `addEvent` |
| `apps/client/src/stores/authStore.ts` | Remove `mockUser` import, set `avatarUrl: null` |
| `apps/client/src/components/event/EventCard.tsx` | Rename `name→title`, `date→eventDate`, `coverUrl→coverImageUrl` |
| `apps/client/src/pages/EventGalleryPage.tsx` | Rename fields, remove `location` display |
| `apps/client/src/pages/QrInvitePage.tsx` | Rename fields, remove `location`, fix `PhoneMockup` prop type, handle null `joinToken` |
| `apps/client/src/pages/CreateEventPage.tsx` | Remove `location`/`privacy` from form, update `addEvent` call |
| `apps/client/src/pages/DashboardPage.tsx` | Add `fetchEvents` on mount, loading/error states, remove static content |
| `apps/client/src/data/mockEvents.ts` | Delete |
| `apps/client/src/data/mockUser.ts` | Delete |

---

## Task 1: Add counts to shared Event type

**Files:**
- Modify: `packages/types/src/index.ts`

- [ ] **Step 1: Update the `Event` type**

In `packages/types/src/index.ts`, find the `Event` export and add the two count fields plus `createdAt`/`updatedAt` (the API already returns these; the shared type needs them):

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

Also check `CreateEventInput` and `UpdateEventInput` — they must NOT include `guestCount`, `photoCount`, `createdAt`, `updatedAt`, `id`, `ownerId`, or `isActive`. Leave them unchanged if they already exclude these fields.

- [ ] **Step 2: Typecheck the types package**

```bash
pnpm --filter @camshare/types typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add packages/types/src/index.ts
git commit -m "feat(types): add guestCount and photoCount to Event type"
```

---

## Task 2: Update API events library

**Files:**
- Modify: `apps/api/src/lib/events.ts`

The goal is to:
1. Update `mapEvent` to accept and map optional `guest_count`/`photo_count` fields.
2. Add correlated COUNT subqueries to `listMyEvents` and `getEvent`.
3. Add a private `fetchWithCounts` helper for single-event fetches with counts.
4. Use `fetchWithCounts` in `updateEvent` and `joinEvent`.
5. Hardcode `guestCount: 1, photoCount: 0` in `createEvent`.

- [ ] **Step 1: Update `mapEvent`**

Replace the existing `mapEvent` function with this version that accepts optional count fields:

```ts
const mapEvent = (row: {
  id: string
  owner_id: string
  title: string
  description: string | null
  event_date: Date | null
  end_date: Date | null
  cover_image_url: string | null
  is_active: boolean
  created_at: Date
  updated_at: Date
  guest_count?: string
  photo_count?: string
}): Event => ({
  id: row.id,
  ownerId: row.owner_id,
  title: row.title,
  description: row.description,
  eventDate: row.event_date ? iso(row.event_date) : null,
  endDate: row.end_date ? iso(row.end_date) : null,
  coverImageUrl: row.cover_image_url,
  isActive: row.is_active,
  guestCount: Number(row.guest_count ?? 0),
  photoCount: Number(row.photo_count ?? 0),
  createdAt: iso(row.created_at),
  updatedAt: iso(row.updated_at),
})
```

- [ ] **Step 2: Add `fetchWithCounts` private helper**

Add this helper after `mapEvent`. It selects a single event row with both counts included:

```ts
const fetchWithCounts = (eventId: string) =>
  db
    .selectFrom("events")
    .selectAll("events")
    .select((eb) => [
      eb
        .selectFrom("event_members")
        .whereRef("event_members.event_id", "=", "events.id")
        .select(eb.fn.countAll<string>())
        .as("guest_count"),
      eb
        .selectFrom("event_photos")
        .innerJoin("event_channels", "event_channels.id", "event_photos.channel_id")
        .whereRef("event_channels.event_id", "=", "events.id")
        .select(eb.fn.countAll<string>())
        .as("photo_count"),
    ])
    .where("events.id", "=", eventId)
    .executeTakeFirst()
```

- [ ] **Step 3: Update `listMyEvents`**

Replace the existing query body with one that includes count subqueries. The existing join uses `event_members` to filter by user — alias it to avoid ambiguity with the subquery:

```ts
export const listMyEvents = async (userId: string): Promise<Event[]> => {
  await db
    .deleteFrom("events")
    .where("end_date", "is not", null)
    .where("end_date", "<", new Date())
    .execute()

  const rows = await db
    .selectFrom("events")
    .innerJoin("event_members as em", "em.event_id", "events.id")
    .where("em.user_id", "=", userId)
    .selectAll("events")
    .select((eb) => [
      eb
        .selectFrom("event_members")
        .whereRef("event_members.event_id", "=", "events.id")
        .select(eb.fn.countAll<string>())
        .as("guest_count"),
      eb
        .selectFrom("event_photos")
        .innerJoin("event_channels", "event_channels.id", "event_photos.channel_id")
        .whereRef("event_channels.event_id", "=", "events.id")
        .select(eb.fn.countAll<string>())
        .as("photo_count"),
    ])
    .orderBy("events.created_at desc")
    .execute()

  return rows.map(mapEvent)
}
```

- [ ] **Step 4: Update `getEvent`**

Replace the existing query with `fetchWithCounts`:

```ts
export const getEvent = async (eventId: string, userId: string): Promise<Event | null> => {
  const member = await isMember(eventId, userId)
  if (!member) return null

  const row = await fetchWithCounts(eventId)
  return row ? mapEvent(row) : null
}
```

- [ ] **Step 5: Update `updateEvent`**

After the UPDATE, use `fetchWithCounts` to return the full event with counts:

```ts
export const updateEvent = async (
  eventId: string,
  userId: string,
  input: UpdateEventInput,
): Promise<Event | null> => {
  const row = await db
    .selectFrom("events")
    .select(["id", "owner_id"])
    .where("id", "=", eventId)
    .executeTakeFirst()
  if (!row || row.owner_id !== userId) return null

  await db
    .updateTable("events")
    .set({
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.eventDate !== undefined && { event_date: input.eventDate ? new Date(input.eventDate) : null }),
      ...(input.endDate !== undefined && { end_date: input.endDate ? new Date(input.endDate) : null }),
      ...(input.coverImageUrl !== undefined && { cover_image_url: input.coverImageUrl }),
      ...(input.isActive !== undefined && { is_active: input.isActive }),
      updated_at: new Date(),
    })
    .where("id", "=", eventId)
    .execute()

  const updated = await fetchWithCounts(eventId)
  return updated ? mapEvent(updated) : null
}
```

- [ ] **Step 6: Update `createEvent`**

After the insert + member add, call `mapEvent` with hardcoded counts (owner is the first member, no photos yet):

```ts
export const createEvent = async (ownerId: string, input: CreateEventInput): Promise<Event> => {
  const event = await db.transaction().execute(async (trx) => {
    const row = await trx
      .insertInto("events")
      .values({
        owner_id: ownerId,
        title: input.title,
        description: input.description ?? null,
        event_date: input.eventDate ? new Date(input.eventDate) : null,
        end_date: input.endDate ? new Date(input.endDate) : null,
        cover_image_url: input.coverImageUrl ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    await trx.insertInto("event_members").values({ event_id: row.id, user_id: ownerId }).execute()

    return row
  })

  return mapEvent({ ...event, guest_count: "1", photo_count: "0" })
}
```

- [ ] **Step 7: Update `joinEvent`**

After inserting the member, use `fetchWithCounts` for the return value:

```ts
export const joinEvent = async (token: string, userId: string): Promise<Event | null> => {
  const tokenRow = await db
    .selectFrom("event_join_tokens")
    .select(["event_id", "expires_at"])
    .where("token", "=", token)
    .executeTakeFirst()

  if (!tokenRow) return null
  if (tokenRow.expires_at && tokenRow.expires_at < new Date()) return null

  await db
    .insertInto("event_members")
    .values({ event_id: tokenRow.event_id, user_id: userId })
    .onConflict((oc) => oc.columns(["event_id", "user_id"]).doNothing())
    .execute()

  const eventRow = await fetchWithCounts(tokenRow.event_id)
  if (!eventRow) return null
  const event = mapEvent(eventRow)

  const joinerDetails = await db
    .selectFrom("user_details")
    .select("full_name")
    .where("user_id", "=", userId)
    .executeTakeFirst()

  const payload = {
    userId,
    eventId: tokenRow.event_id,
    fullName: joinerDetails?.full_name ?? "Someone",
  }

  emitToEvent(tokenRow.event_id, "event:member_joined", payload)
  emitToUser(eventRow.owner_id, "event:member_joined", payload)

  return event
}
```

- [ ] **Step 8: Typecheck the API**

```bash
pnpm --filter @camshare/api typecheck
```

Expected: no errors. Fix any TypeScript complaints before proceeding.

- [ ] **Step 9: Commit**

```bash
git add apps/api/src/lib/events.ts
git commit -m "feat(api): add guestCount and photoCount to event responses"
```

---

## Task 3: Update client domain types

**Files:**
- Modify: `apps/client/src/types/domain.ts`

- [ ] **Step 1: Replace the `Event` type**

Replace the entire `Event` type with the API-aligned version:

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

- [ ] **Step 2: Update `User.avatarUrl`**

Change `avatarUrl: string` to `avatarUrl: string | null` in the `User` type. The existing components (`SidebarNav`, `TopBar`) already null-guard this field — no changes needed there.

- [ ] **Step 3: Typecheck the client (expect errors)**

```bash
pnpm --filter @camshare/client typecheck
```

Expected: many errors in files that use the old field names. These are fixed in subsequent tasks. Note which files are flagged — they should match the file map at the top of this plan.

- [ ] **Step 4: Commit the type change**

```bash
git add apps/client/src/types/domain.ts
git commit -m "feat(client): align Event type with API response shape"
```

---

## Task 4: Update events store

**Files:**
- Modify: `apps/client/src/stores/eventsStore.ts`

- [ ] **Step 1: Rewrite the store**

Replace the entire file content with:

```ts
import { create } from "zustand"
import type { Event } from "@/types/domain"
import { apiClient } from "@/api/client"

type EventInput = Omit<Event, "id" | "guestCount" | "photoCount" | "ownerId" | "createdAt" | "updatedAt" | "isActive">

type EventsState = {
  events: Event[]
  loading: boolean
  error: string | null
  fetchEvents: () => Promise<void>
  getById: (id: string) => Event | undefined
  addEvent: (input: EventInput) => Promise<Event>
}

export const useEventsStore = create<EventsState>((set, get) => ({
  events: [],
  loading: false,
  error: null,

  fetchEvents: async () => {
    set({ loading: true, error: null })
    try {
      const events = await apiClient.get<Event[]>("/events")
      set({ events, loading: false })
    } catch {
      set({ loading: false, error: "Failed to load events" })
    }
  },

  getById: (id) => get().events.find((e) => e.id === id),

  addEvent: async (input) => {
    const event = await apiClient.post<Event>("/events", {
      title: input.title,
      description: input.description || undefined,
      eventDate: input.eventDate || undefined,
      endDate: input.endDate || undefined,
      coverImageUrl: input.coverImageUrl || undefined,
    })
    set({ events: [event, ...get().events] })
    return event
  },
}))
```

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter @camshare/client typecheck
```

Expected: errors in store-consuming files. The store itself should be clean.

- [ ] **Step 3: Commit**

```bash
git add apps/client/src/stores/eventsStore.ts
git commit -m "feat(client): connect events store to API, remove mock seed"
```

---

## Task 5: Update auth store and delete mock files

**Files:**
- Modify: `apps/client/src/stores/authStore.ts`
- Delete: `apps/client/src/data/mockEvents.ts`
- Delete: `apps/client/src/data/mockUser.ts`

- [ ] **Step 1: Update `authStore.ts`**

Remove the `mockUser` import at the top of the file.

Find the `toWebUser` function and change `avatarUrl: mockUser.avatarUrl` to `avatarUrl: null`:

```ts
const toWebUser = (u: ApiAuthResponse["user"]): User => ({
  id: u.id,
  fullName: u.fullName,
  email: u.email,
  avatarUrl: null,
  tier: "Free",
})
```

- [ ] **Step 2: Delete mock data files**

```bash
rm apps/client/src/data/mockEvents.ts
rm apps/client/src/data/mockUser.ts
```

- [ ] **Step 3: Typecheck**

```bash
pnpm --filter @camshare/client typecheck
```

Expected: no new errors from these changes (old errors remain from Tasks 3+).

- [ ] **Step 4: Commit**

```bash
git add apps/client/src/stores/authStore.ts
git rm apps/client/src/data/mockEvents.ts apps/client/src/data/mockUser.ts
git commit -m "feat(client): remove mockUser, set avatarUrl null from API user"
```

---

## Task 6: Update EventCard component

**Files:**
- Modify: `apps/client/src/components/event/EventCard.tsx`

- [ ] **Step 1: Rename three field references**

In `EventCard.tsx`, make these three replacements:
- `event.coverUrl` → `event.coverImageUrl` (in the `<img src>` and `alt`)
- `event.date` → `event.eventDate` (in the `formatDate(...)` call)
- `event.name` → `event.title` (in the `<h3>` and `alt`)

The `guestCount` and `photoCount` fields are unchanged — they already exist on the new type.

- [ ] **Step 2: Handle nullable `eventDate`**

`event.eventDate` is now `string | null`. Update the `formatDate` call to handle null:

```tsx
{event.eventDate ? formatDate(event.eventDate) : "Date TBD"}
```

- [ ] **Step 3: Handle nullable `coverImageUrl`**

`event.coverImageUrl` is now `string | null`. The `<img>` needs a fallback:

```tsx
<img
  src={event.coverImageUrl ?? ""}
  alt={event.title}
  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
/>
```

- [ ] **Step 4: Typecheck**

```bash
pnpm --filter @camshare/client typecheck
```

Expected: fewer errors — EventCard errors resolved.

- [ ] **Step 5: Commit**

```bash
git add apps/client/src/components/event/EventCard.tsx
git commit -m "fix(client): update EventCard to use aligned Event field names"
```

---

## Task 7: Update EventGalleryPage

**Files:**
- Modify: `apps/client/src/pages/EventGalleryPage.tsx`

- [ ] **Step 1: Rename field references**

In `EventGalleryPage.tsx`:
- `event.name` → `event.title` (in the `<h1>`)
- `event.date` → `event.eventDate` (in the `formatDate(...)` call)

- [ ] **Step 2: Remove location display**

Delete these lines (the location span and its separator dot):

```tsx
<span className="w-1 h-1 bg-outline-variant rounded-full" />
<span className="flex items-center gap-1 font-label-md text-label-md">
  <Icon name="location_on" className="text-sm" />
  {event.location}
</span>
```

- [ ] **Step 3: Handle nullable `eventDate`**

```tsx
{event.eventDate ? formatDate(event.eventDate) : "Date TBD"}
```

- [ ] **Step 4: Typecheck**

```bash
pnpm --filter @camshare/client typecheck
```

- [ ] **Step 5: Commit**

```bash
git add apps/client/src/pages/EventGalleryPage.tsx
git commit -m "fix(client): update EventGalleryPage for aligned Event fields"
```

---

## Task 8: Update QrInvitePage

**Files:**
- Modify: `apps/client/src/pages/QrInvitePage.tsx`

- [ ] **Step 1: Rename field references in the header**

Lines using old fields:
- `event.name` (breadcrumb and `<h1>`) → `event.title`
- `event.date` → `event.eventDate`
- Remove `event.location` from the paragraph. Change:
  ```tsx
  {formatLongDate(event.date)} • {event.location}
  ```
  to:
  ```tsx
  {event.eventDate ? formatLongDate(event.eventDate) : "Date TBD"}
  ```

- [ ] **Step 2: Remove `inviteCode` fallback (line ~34)**

Find:
```ts
const inviteUrl = joinToken
  ? `${window.location.origin}/invite/${joinToken}`
  : `${window.location.origin}/invite/${event.inviteCode}`
```

Replace with a loading-aware value:
```ts
const inviteUrl = joinToken ? `${window.location.origin}/invite/${joinToken}` : null
```

- [ ] **Step 3: Guard the QrCard and copy button on null `inviteUrl`**

Wrap the `<QrCard>` and copy-link `<button>` with a null check:

```tsx
{inviteUrl ? (
  <>
    <QrCard
      value={inviteUrl}
      title="Scan to Join the Memory"
      subtitle={`Unique invite code for the private gallery of ${event.title}.`}
    />
    {/* ... copy button ... */}
  </>
) : (
  <div className="flex items-center justify-center h-48 text-on-surface-variant font-body-md">
    Generating invite link…
  </div>
)}
```

- [ ] **Step 4: Update `PhoneMockup` prop type**

Find the `PhoneMockup` component definition (~line 169). Change its prop type and internal references:

```tsx
const PhoneMockup = ({
  event,
  previewPhotos,
}: {
  event: { title: string; coverImageUrl: string | null }
  previewPhotos: string[]
}) => {
```

Inside `PhoneMockup`, replace:
- `event.coverUrl` → `event.coverImageUrl ?? ""`
- `event.name` (in `alt` attribute and the event name text, lines ~206 and ~217) → `event.title`

- [ ] **Step 5: Typecheck**

```bash
pnpm --filter @camshare/client typecheck
```

- [ ] **Step 6: Commit**

```bash
git add apps/client/src/pages/QrInvitePage.tsx
git commit -m "fix(client): update QrInvitePage for aligned Event fields and null joinToken"
```

---

## Task 9: Update CreateEventPage

**Files:**
- Modify: `apps/client/src/pages/CreateEventPage.tsx`

- [ ] **Step 1: Remove `location` and `privacy` state**

Delete these two `useState` declarations:
```ts
const [location, setLocation] = useState("")
const [privacy, setPrivacy] = useState<"public" | "private">("private")
```

- [ ] **Step 2: Remove location field from the form**

Delete the entire `<div>` block containing the location `<input>` and its label (the block with `placeholder="The Glass House, NY"`).

- [ ] **Step 3: Remove the "QR-only Access" toggle row**

Delete the `<ToggleRow>` that binds to `privacy`:
```tsx
<ToggleRow
  title="QR-only Access"
  description="Only users with the physical event QR can view or upload."
  checked={privacy === "private"}
  onChange={(value) => setPrivacy(value ? "private" : "public")}
/>
```

- [ ] **Step 4: Update form state and `addEvent` call**

The current `handleSubmit` uses old field names. Replace the `addEvent` call:

```ts
const created = await addEvent({
  title: name,
  description,
  eventDate: date || null,
  endDate: endDate || null,
  coverImageUrl: coverPreview ?? DEFAULT_COVER,
})
```

The `name` state variable can be renamed to `title` for clarity, or kept as-is and passed as `title: name`. Either is fine — the external API uses `title`.

- [ ] **Step 5: Typecheck**

```bash
pnpm --filter @camshare/client typecheck
```

Expected: clean (or very few errors remaining, all in DashboardPage).

- [ ] **Step 6: Commit**

```bash
git add apps/client/src/pages/CreateEventPage.tsx
git commit -m "fix(client): update CreateEventPage for new Event shape, remove location/privacy"
```

---

## Task 10: Update DashboardPage

**Files:**
- Modify: `apps/client/src/pages/DashboardPage.tsx`

- [ ] **Step 1: Add store selectors and `useEffect`**

Replace the current imports and store usage at the top of the component:

```tsx
import { useEffect } from "react"
import { Link } from "react-router-dom"
import { StatCard } from "@/components/event/StatCard"
import { EventCard } from "@/components/event/EventCard"
import { Icon } from "@/components/primitives/Icon"
import { useAuth } from "@/auth/AuthContext"
import { useEventsStore } from "@/stores/eventsStore"

export const DashboardPage = () => {
  const { user } = useAuth()
  const events = useEventsStore((s) => s.events)
  const loading = useEventsStore((s) => s.loading)
  const error = useEventsStore((s) => s.error)
  const fetchEvents = useEventsStore((s) => s.fetchEvents)

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const totalMemories = events.reduce((sum, e) => sum + e.photoCount, 0)
  const totalGuests = events.reduce((sum, e) => sum + e.guestCount, 0)
```

- [ ] **Step 2: Add loading state**

After the `useEffect`, add a loading guard before the main return:

```tsx
if (loading) {
  return (
    <>
      <header className="mb-12">
        <div className="h-10 w-64 bg-surface-container-high rounded-xl animate-pulse mb-2" />
        <div className="h-5 w-96 bg-surface-container-high rounded-lg animate-pulse" />
      </header>
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-surface-container-high rounded-3xl animate-pulse" />
        ))}
      </section>
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="aspect-[4/5] bg-surface-container-high rounded-3xl animate-pulse" />
        ))}
      </section>
    </>
  )
}
```

- [ ] **Step 3: Add error state**

After the loading guard, add an error guard:

```tsx
if (error) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-6">
      <p className="font-body-lg text-on-surface-variant">{error}</p>
      <button
        type="button"
        onClick={() => fetchEvents()}
        className="px-6 py-2 rounded-full bg-primary text-on-primary font-label-md hover:scale-[1.02] transition-all"
      >
        Retry
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Remove the Storage GlassPanel and hardcoded sub-text**

In the stats section, replace the four-column grid with three StatCards (removing the Storage panel entirely) and remove the `"+2 this month"` sub text:

```tsx
<section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
  <StatCard label="Total Events" value={events.length} />
  <StatCard
    label="Total Memories"
    value={totalMemories >= 1000 ? `${(totalMemories / 1000).toFixed(1)}k` : totalMemories}
    sub="photos & videos"
  />
  <StatCard
    label="Active Guests"
    value={totalGuests}
    sub="collaborators"
    subTone="amethyst"
  />
</section>
```

Also remove the `GlassPanel` import if it is no longer used elsewhere in this file.

- [ ] **Step 5: Typecheck**

```bash
pnpm --filter @camshare/client typecheck
```

Expected: no errors.

- [ ] **Step 6: Full typecheck across all packages**

```bash
pnpm typecheck
```

Expected: clean across API, client, and types. Fix any remaining errors before committing.

- [ ] **Step 7: Commit**

```bash
git add apps/client/src/pages/DashboardPage.tsx
git commit -m "feat(client): connect dashboard to live API data, remove static content"
```

---

## Task 11: Final verification

- [ ] **Step 1: Start the dev stack**

```bash
docker compose up -d   # ensure Postgres is running
pnpm dev               # starts API + client concurrently
```

- [ ] **Step 2: Smoke test the dashboard**

1. Open `http://localhost:5173` in a browser
2. Log in with `admin@example.com` / `Admin123!`
3. Verify the dashboard loads with real data (empty if no events yet — the "Start a New Memory Chapter" CTA should show)
4. Create a new event via the form; verify it appears on the dashboard after creation
5. Verify the EventCard shows the event's `title` and `eventDate` correctly
6. Navigate to the event gallery; verify `event.title` shows in the header (no location line)
7. Navigate to the QR invite page; verify the join token loads and the QR renders

- [ ] **Step 3: Final commit if any fixes were needed**

```bash
git add -p   # stage only verified changes
git commit -m "fix: address smoke test issues"
```
