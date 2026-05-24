# Admin Users List Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an admin-only `/admin/users` page (with a sidebar link) that lists all registered users by name, email, and join date — visible only to users with the `admin` permission.

**Architecture:** The API already sends `permissions: PermissionName[]` in every auth response but the client strips it. We thread `permissions` through `toWebUser()` to derive `isAdmin`, add a backend `GET /admin/users` endpoint, then build the page and guard. No changes to the auth response shape on the API side.

**Tech Stack:** Express + Kysely (API), React 19 + Zustand + Vite (client), Vitest + happy-dom (client tests), TypeScript throughout, pnpm workspaces.

**Spec:** `docs/superpowers/specs/2026-05-24-admin-users-list-design.md`

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `apps/api/src/lib/admin.ts` | DB query — joins users + user_details, returns list |
| Create | `apps/api/src/handlers/admin.ts` | Express handler — calls lib, returns JSON |
| Modify | `apps/api/src/index.ts` | Register `GET /admin/users` route |
| Modify | `apps/client/src/types/domain.ts` | Add `isAdmin: boolean` to `User` type |
| Modify | `apps/client/src/stores/authStore.ts` | Thread `permissions` through `toWebUser()` |
| Modify | `apps/client/src/stores/authStore.test.ts` | Add `isAdmin` tests; update `mockUser()` |
| Create | `apps/client/src/auth/AdminRoute.tsx` | Route guard — redirects non-admins |
| Create | `apps/client/src/services/adminService.ts` | `listUsers()` API call |
| Create | `apps/client/src/pages/UsersPage.tsx` | Table page with loading/error/data states |
| Modify | `apps/client/src/components/layout/SidebarNav.tsx` | Show "Users" item when `user.isAdmin` |
| Modify | `apps/client/src/App.tsx` | Register `/admin/users` route |

---

## Task 1: Backend lib — `listUsers()`

**Files:**
- Create: `apps/api/src/lib/admin.ts`

The API has no test runner configured. Verification is via TypeScript typecheck.

- [ ] **Step 1.1: Create the lib file**

```ts
// apps/api/src/lib/admin.ts
import { db } from "./db.js"

const iso = (d: Date) => d.toISOString()

export type AdminUserDto = {
  id: string
  fullName: string
  email: string
  createdAt: string
}

export const listUsers = async (): Promise<AdminUserDto[]> => {
  const rows = await db
    .selectFrom("users as u")
    .innerJoin("user_details as ud", "ud.user_id", "u.id")
    .select(["u.id", "u.email", "u.created_at", "ud.full_name"])
    .where("u.deleted_at", "is", null)
    .orderBy("u.created_at", "desc")
    .execute()

  return rows.map((row) => ({
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    createdAt: iso(row.created_at),
  }))
}
```

- [ ] **Step 1.2: Typecheck**

Run from repo root:
```bash
pnpm --filter @camshare/api typecheck
```
Expected: no errors.

---

## Task 2: Backend handler

**Files:**
- Create: `apps/api/src/handlers/admin.ts`

- [ ] **Step 2.1: Create the handler file**

```ts
// apps/api/src/handlers/admin.ts
import type { Request, Response } from "express"
import * as admin from "../lib/admin.js"

export const listUsers = async (_req: Request, res: Response) => {
  try {
    const users = await admin.listUsers()
    return res.json(users)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: "Internal server error" })
  }
}
```

- [ ] **Step 2.2: Typecheck**

```bash
pnpm --filter @camshare/api typecheck
```
Expected: no errors.

---

## Task 3: Register the API route

**Files:**
- Modify: `apps/api/src/index.ts`

- [ ] **Step 3.1: Import the admin handler**

Add at the top of `apps/api/src/index.ts` alongside the other handler imports:
```ts
import * as adminHandlers from "./handlers/admin.js"
```

- [ ] **Step 3.2: Register the route**

Add after the notifications routes block (before the upload route) in `apps/api/src/index.ts`:
```ts
app.get("/admin/users", requireAuth, requirePermission("admin"), adminHandlers.listUsers)
```

- [ ] **Step 3.3: Typecheck**

```bash
pnpm --filter @camshare/api typecheck
```
Expected: no errors.

- [ ] **Step 3.4: Smoke-test the endpoint**

Start the API and database if not running:
```bash
docker compose up -d
pnpm --filter @camshare/api dev
```

In a second terminal, log in to get a token:
```bash
curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!"}' | grep -o '"accessToken":"[^"]*"'
```

Then call the endpoint (replace `<token>` with the access token):
```bash
curl -s http://localhost:3001/admin/users \
  -H "Authorization: Bearer <token>"
```
Expected: JSON array of user objects, each with `id`, `fullName`, `email`, `createdAt`.

- [ ] **Step 3.5: Commit**

```bash
git add apps/api/src/lib/admin.ts apps/api/src/handlers/admin.ts apps/api/src/index.ts
git commit -m "feat(api): add GET /admin/users endpoint"
```

---

## Task 4: Client domain type

**Files:**
- Modify: `apps/client/src/types/domain.ts`

This must happen before the auth store change so that the `User` type is complete when `toWebUser()` is updated.

- [ ] **Step 4.1: Add `isAdmin` to `User`**

In `apps/client/src/types/domain.ts`, change the `User` type:
```ts
export type User = {
  id: string
  fullName: string
  email: string
  avatarUrl: string | null
  tier: "Free" | "Premium Member"
  isAdmin: boolean          // ← add this line
}
```

- [ ] **Step 4.2: Typecheck to see what breaks**

```bash
pnpm --filter @camshare/client typecheck
```
Expected: errors in `authStore.ts` (where `User` is constructed) and `authStore.test.ts` (where `mockUser()` is defined). These are the exact files you fix next.

---

## Task 5: Auth store — thread `permissions` → `isAdmin`

**Files:**
- Modify: `apps/client/src/stores/authStore.ts`
- Modify: `apps/client/src/stores/authStore.test.ts`

### 5a — Write failing tests first

- [ ] **Step 5a.1: Update `mockUser()` in the test file**

In `apps/client/src/stores/authStore.test.ts`, update `mockUser()` to include `isAdmin`:
```ts
const mockUser = (): User => ({
  id: "user-1",
  fullName: "Alice",
  email: "alice@example.com",
  avatarUrl: null,
  tier: "Free",
  isAdmin: false,           // ← add this
})
```

- [ ] **Step 5a.2: Add two new test cases**

Append these two `it` blocks inside the `describe("authStore.updateUser", ...)` block in `authStore.test.ts`:
```ts
it("preserves isAdmin across updateUser patch", () => {
  useAuthStore.setState({ user: { ...mockUser(), isAdmin: true } })
  useAuthStore.getState().updateUser({ fullName: "Bob" })
  expect(useAuthStore.getState().user?.isAdmin).toBe(true)
})

it("sets isAdmin false for non-admin user", () => {
  useAuthStore.setState({ user: mockUser() })
  expect(useAuthStore.getState().user?.isAdmin).toBe(false)
})
```

- [ ] **Step 5a.3: Run tests — expect compile/type failure**

```bash
pnpm --filter @camshare/client test
```
Expected: errors because `authStore.ts` still builds `User` without `isAdmin`.

### 5b — Implement the fix

- [ ] **Step 5b.1: Update `ApiAuthResponse` type in `authStore.ts`**

In `apps/client/src/stores/authStore.ts`, change `ApiAuthResponse`:
```ts
type ApiAuthResponse = {
  user: {
    id: string
    fullName: string
    email: string
    avatarUrl: string | null
    permissions: string[]   // ← add this
  }
  tokens: { accessToken: string; refreshToken: string }
}
```

- [ ] **Step 5b.2: Update `toWebUser()` in `authStore.ts`**

```ts
const toWebUser = (u: ApiAuthResponse["user"]): User => ({
  id: u.id,
  fullName: u.fullName,
  email: u.email,
  avatarUrl: u.avatarUrl,
  tier: "Free",
  isAdmin: u.permissions.includes("admin"),   // ← add this
})
```

- [ ] **Step 5b.3: Run tests — expect all pass**

```bash
pnpm --filter @camshare/client test
```
Expected: all tests pass (including the two new ones and the four existing ones).

- [ ] **Step 5b.4: Typecheck**

```bash
pnpm --filter @camshare/client typecheck
```
Expected: no errors.

- [ ] **Step 5b.5: Commit**

```bash
git add apps/client/src/types/domain.ts apps/client/src/stores/authStore.ts apps/client/src/stores/authStore.test.ts
git commit -m "feat(client): add isAdmin to User, derived from auth response permissions"
```

---

## Task 6: `AdminRoute` guard

**Files:**
- Create: `apps/client/src/auth/AdminRoute.tsx`

- [ ] **Step 6.1: Create the component**

```tsx
// apps/client/src/auth/AdminRoute.tsx
import { Navigate } from "react-router-dom"
import type { ReactElement } from "react"
import { useAuth } from "./AuthContext"

export const AdminRoute = ({ children }: { children: ReactElement }) => {
  const { user } = useAuth()
  if (!user?.isAdmin) return <Navigate to="/dashboard" replace />
  return children
}
```

- [ ] **Step 6.2: Typecheck**

```bash
pnpm --filter @camshare/client typecheck
```
Expected: no errors.

---

## Task 7: `adminService`

**Files:**
- Create: `apps/client/src/services/adminService.ts`

- [ ] **Step 7.1: Create the service file**

```ts
// apps/client/src/services/adminService.ts
import { apiClient } from "@/api/client"

export type AdminUser = {
  id: string
  fullName: string
  email: string
  createdAt: string
}

export const listUsers = (): Promise<AdminUser[]> =>
  apiClient.get<AdminUser[]>("/admin/users")
```

`apiClient.get<T>()` returns `Promise<T>` with JSON already unwrapped — do not access `.data` on the result.

- [ ] **Step 7.2: Typecheck**

```bash
pnpm --filter @camshare/client typecheck
```
Expected: no errors.

---

## Task 8: `UsersPage`

**Files:**
- Create: `apps/client/src/pages/UsersPage.tsx`

- [ ] **Step 8.1: Create the page**

```tsx
// apps/client/src/pages/UsersPage.tsx
import { useEffect, useState } from "react"
import { listUsers, type AdminUser } from "@/services/adminService"

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })

export const UsersPage = () => {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    setError(null)
    listUsers()
      .then(setUsers)
      .catch(() => setError("Failed to load users"))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  if (loading) {
    return (
      <>
        <header className="mb-10">
          <div className="h-10 w-48 bg-surface-container-high rounded-xl animate-pulse mb-2" />
        </header>
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 border-b border-outline-variant/20 px-6 flex items-center gap-4">
              <div className="h-4 w-40 bg-surface-container-high rounded animate-pulse" />
              <div className="h-4 w-56 bg-surface-container-high rounded animate-pulse" />
              <div className="h-4 w-24 bg-surface-container-high rounded animate-pulse ml-auto" />
            </div>
          ))}
        </div>
      </>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-6">
        <p className="font-body-lg text-on-surface-variant">{error}</p>
        <button
          type="button"
          onClick={load}
          className="px-6 py-2 rounded-full bg-champagne-gold text-white font-label-md hover:scale-[1.02] transition-all"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <>
      <header className="mb-10">
        <h1 className="font-display-lg text-display-lg text-primary mb-2">Users</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          All registered accounts — {users.length} total.
        </p>
      </header>

      <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-outline-variant/30">
              <th scope="col" className="text-left px-6 py-4 font-label-md text-on-surface-variant text-caption">Name</th>
              <th scope="col" className="text-left px-6 py-4 font-label-md text-on-surface-variant text-caption hidden sm:table-cell">Email</th>
              <th scope="col" className="text-right px-6 py-4 font-label-md text-on-surface-variant text-caption">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-outline-variant/20 last:border-0 hover:bg-surface-container-lowest/50 transition-colors">
                <td className="px-6 py-4 font-body-md text-on-surface">{u.fullName}</td>
                <td className="px-6 py-4 font-body-md text-on-surface-variant hidden sm:table-cell">{u.email}</td>
                <td className="px-6 py-4 text-right font-body-md text-on-surface-variant">{formatDate(u.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
```

- [ ] **Step 8.2: Typecheck**

```bash
pnpm --filter @camshare/client typecheck
```
Expected: no errors.

---

## Task 9: Sidebar — conditional "Users" item

**Files:**
- Modify: `apps/client/src/components/layout/SidebarNav.tsx`

- [ ] **Step 9.1: Move `items` inside the component**

In `SidebarNav.tsx`, the `items` array is currently a module-level `const`. Delete the module-level declaration and add an inline array inside the `SidebarNav` component body, right after the `const { user } = useAuth()` line (which is already there):

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

No `useMemo` needed — this is a tiny array with no expensive computation.

- [ ] **Step 9.2: Typecheck**

```bash
pnpm --filter @camshare/client typecheck
```
Expected: no errors.

---

## Task 10: App router — register the route

**Files:**
- Modify: `apps/client/src/App.tsx`

- [ ] **Step 10.1: Add imports**

In `apps/client/src/App.tsx`, add two imports alongside the existing page imports:
```ts
import { AdminRoute } from "@/auth/AdminRoute"
import { UsersPage } from "@/pages/UsersPage"
```

- [ ] **Step 10.2: Add the route**

Inside the `ProtectedRoute + AppShell` `<Route>` group (alongside the other protected routes), add:
```tsx
<Route path="/admin/users" element={<AdminRoute><UsersPage /></AdminRoute>} />
```

- [ ] **Step 10.3: Typecheck**

```bash
pnpm --filter @camshare/client typecheck
```
Expected: no errors.

- [ ] **Step 10.4: Run all client tests**

```bash
pnpm --filter @camshare/client test
```
Expected: all tests pass.

- [ ] **Step 10.5: Manual end-to-end verification**

Start the full stack:
```bash
docker compose up -d
pnpm dev
```

Open `http://localhost:5173` in a browser.

1. Log in as `admin@example.com` / `Admin123!`
2. Verify a "Users" item appears in the sidebar
3. Click "Users" — verify the `/admin/users` page loads with a table of users
4. Log out, register a new non-admin account
5. Log in as the new account — verify "Users" does NOT appear in the sidebar
6. Navigate to `http://localhost:5173/admin/users` directly — verify redirect to `/dashboard`

- [ ] **Step 10.6: Commit**

```bash
git add \
  apps/client/src/auth/AdminRoute.tsx \
  apps/client/src/services/adminService.ts \
  apps/client/src/pages/UsersPage.tsx \
  apps/client/src/components/layout/SidebarNav.tsx \
  apps/client/src/App.tsx
git commit -m "feat(client): add admin-only Users page and sidebar link"
```
