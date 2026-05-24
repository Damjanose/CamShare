# Admin Users List — Design Spec

**Date:** 2026-05-24  
**Status:** Approved  

---

## Overview

Add a new admin-only sidebar item and page (`/admin/users`) that lists all registered users (name, email, joined date). Only users with the `admin` permission can see or access it.

The client already receives `permissions: PermissionName[]` on every auth response (via `mapUser()` in `lib/auth.ts` and `AuthResponse` in `@camshare/types`), but `authStore.ts` strips it. The fix is to thread `permissions` through `toWebUser()` and derive `isAdmin` from it — no backend auth changes required.

---

## Backend

### 1. New lib — `apps/api/src/lib/admin.ts`

```ts
export const listUsers = async (): Promise<
  { id: string; fullName: string; email: string; createdAt: string }[]
> => { ... }
```

- Joins `users` + `user_details`
- Filters out soft-deleted rows: `where users.deleted_at IS NULL`
- Orders by `users.created_at DESC`
- Maps `created_at` (Date) to ISO string

### 2. New handler — `apps/api/src/handlers/admin.ts`

Thin Express handler that calls `lib/admin.listUsers()` and returns the result as JSON. Catches errors and returns 500.

### 3. Route — `apps/api/src/index.ts`

```
GET /admin/users   requireAuth + requirePermission("admin")   adminHandlers.listUsers
```

---

## Frontend

### Change order matters — do these in sequence:

**Step 1 — Domain type first** (`apps/client/src/types/domain.ts`)

Add `isAdmin: boolean` to `User`. This must happen first because `AuthContext` exposes `user: User | null`, and `AdminRoute` reads `user.isAdmin` — it must typecheck.

**Step 2 — Auth store** (`apps/client/src/stores/authStore.ts`)

`toWebUser()` is the single function called by all three auth paths (`login`, `register`, `bootstrap`). One change covers all:

- Add `permissions: string[]` to `ApiAuthResponse["user"]`
- Update `toWebUser()`: add `isAdmin: u.permissions.includes("admin")`

`updateUser(patch)` already does `{ ...s.user, ...patch }` (shallow merge) — `isAdmin` is preserved automatically; no change needed there.

**Stale localStorage:** `loadUser()` reads the stored `User` on initial mount. Users who logged in before this deploy won't have `isAdmin` in localStorage. However, `AuthProvider` returns `null` until `sessionReady` is true, and `bootstrap()` always calls `/auth/refresh` before setting `sessionReady`. By the time any route (including `AdminRoute`) renders, `toWebUser()` has already been called with fresh data from the API, overwriting any stale localStorage value. This is safe — no migration needed.

**Step 3 — Admin route guard** (`apps/client/src/auth/AdminRoute.tsx`)

New component mirroring `ProtectedRoute`:

```tsx
import { Navigate } from "react-router-dom"
import type { ReactElement } from "react"
import { useAuth } from "./AuthContext"

export const AdminRoute = ({ children }: { children: ReactElement }) => {
  const { user } = useAuth()
  if (!user?.isAdmin) return <Navigate to="/dashboard" replace />
  return children
}
```

A non-admin authenticated user hits `/admin/users` → `AdminRoute` immediately redirects to `/dashboard`. No flash of the users page because `AuthProvider` gates rendering on `sessionReady`.

**Step 4 — Admin service** (`apps/client/src/services/adminService.ts`)

```ts
type AdminUser = {
  id: string
  fullName: string
  email: string
  createdAt: string
}

export const listUsers = (): Promise<AdminUser[]> =>
  apiClient.get<AdminUser[]>("/admin/users")
```

`apiClient.get<T>()` returns `Promise<T>` with JSON already unwrapped. Do not access `.data` in the page component.

**Step 5 — Users page** (`apps/client/src/pages/UsersPage.tsx`)

- `useState<AdminUser[]>` + `useEffect` fetch on mount; use the result directly (no `.data`)
- Three render states: loading skeleton (3 placeholder rows), error message + retry button, populated table
- Table columns: **Name · Email · Joined** (format `createdAt` as `MMM D, YYYY`)
- Styled to match `AnalyticsPage`: white `rounded-3xl` card, `border-outline-variant/30` row dividers, `font-display-lg` page header, `font-label-md` column headers

**Step 6 — Sidebar** (`apps/client/src/components/layout/SidebarNav.tsx`)

`items` is currently a module-level `const`. Move it to a plain inline array inside the component body (after `useAuth()`) — no `useMemo` needed, this is a tiny static-ish array with no expensive computation:

```tsx
const items: SidebarItem[] = [
  { to: "/dashboard", label: "Memories", icon: "auto_awesome", end: true },
  { to: "/events", label: "Collections", icon: "collections" },
  { to: "/shared", label: "Shared", icon: "group" },
  { to: "/analytics", label: "Analytics", icon: "analytics" },
  { to: "/archive", label: "Archive", icon: "inventory_2" },
  ...(user?.isAdmin ? [{ to: "/admin/users", label: "Users", icon: "person_search" }] : []),
]
```

**Step 7 — App router** (`apps/client/src/App.tsx`)

Import `AdminRoute` and `UsersPage`. Add inside the existing `ProtectedRoute + AppShell` group:

```tsx
<Route path="/admin/users" element={<AdminRoute><UsersPage /></AdminRoute>} />
```

---

## Data Flow

```
bootstrap / login / register
  → API mapUser() returns { ..., permissions: ["admin", ...] }
  → authStore.toWebUser() reads permissions → isAdmin: true/false
  → stored in authStore state + localStorage (overwrites stale entry)

SidebarNav renders
  → reads user.isAdmin → includes or omits "Users" item

User navigates to /admin/users
  → AdminRoute checks user.isAdmin → allows or redirects to /dashboard

UsersPage mounts
  → listUsers() → GET /admin/users (Bearer token)
  → requireAuth + requirePermission("admin") on API
  → lib/admin.listUsers() joins users + user_details
  → returns [{ id, fullName, email, createdAt }]
  → UsersPage renders table (result used directly)
```

---

## Error Handling

- `AdminRoute` silently redirects non-admins to `/dashboard`; safe because `AuthProvider` gates on `sessionReady`
- `UsersPage` shows error message + retry button on fetch failure
- API returns `403` for non-admin direct requests

---

## Out of Scope

Pagination, search/filter, user management actions (delete, promote), column sorting.
