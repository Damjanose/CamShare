# Profile Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/profile` route where authenticated users can update their display name, avatar, and password, backed by two new API endpoints and a DB migration.

**Architecture:** Two layers of changes — (1) DB + Kysely foundation and API lib/handlers/routes, (2) client store + components + routing. Each task is self-contained and typechecks cleanly before the next begins. The avatar upload reuses the existing `POST /upload` endpoint; a new `doUpload` helper in `client.ts` handles FormData without breaking the existing JSON-only `doRequest` path. The client uses its own `apps/client/src/types/domain.ts` User type (which already has `avatarUrl` and `tier`) — `packages/types` is not modified.

**Tech Stack:** PostgreSQL, Kysely, Express, Zod, React 19, Zustand, Vite, Vitest, Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-05-21-profile-page-design.md`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `db/migrations/006_user_avatar.sql` | Create | Add `avatar_url` column to `user_details` |
| `apps/api/src/lib/db.ts` | Modify | Add `avatar_url: string \| null` to `UserDetailsTable` |
| `apps/api/src/lib/auth.ts` | Modify | Update `mapUser`; add `updateMe`, `changePassword` |
| `apps/api/src/handlers/auth.ts` | Modify | Add `updateMe`, `changePassword` handlers + error case |
| `apps/api/src/index.ts` | Modify | Register `PATCH /auth/me` and `PATCH /auth/me/password` |
| `apps/client/src/api/client.ts` | Modify | Add `doUpload` + `apiClient.upload` for FormData uploads |
| `apps/client/src/stores/authStore.ts` | Modify | Extend `ApiAuthResponse`; fix `toWebUser`; add `updateUser` |
| `apps/client/src/stores/authStore.test.ts` | Create | Vitest unit tests for `updateUser` |
| `apps/client/src/components/profile/AvatarPreviewModal.tsx` | Create | Solid-background avatar preview + confirm dialog |
| `apps/client/src/pages/ProfilePage.tsx` | Create | Profile page with Personal Info + Security cards |
| `apps/client/src/App.tsx` | Modify | Add `/profile` route |
| `apps/client/src/components/layout/TopBar.tsx` | Modify | Fix "Profile Settings" link to `/profile` |

---

## Task 1: DB migration + Kysely type

**Files:**
- Create: `db/migrations/006_user_avatar.sql`
- Modify: `apps/api/src/lib/db.ts`

- [ ] **Step 1: Create migration file**

```sql
-- db/migrations/006_user_avatar.sql
ALTER TABLE user_details ADD COLUMN IF NOT EXISTS avatar_url TEXT;
```

- [ ] **Step 2: Run migration**

```bash
pnpm --filter @jewellery/api db:migrate
```

Expected: migration runs without error.

- [ ] **Step 3: Add `avatar_url` to `UserDetailsTable` in `apps/api/src/lib/db.ts`**

In the `UserDetailsTable` interface, add after `full_name`:

```ts
avatar_url: string | null
```

- [ ] **Step 4: Typecheck API**

```bash
pnpm --filter @jewellery/api typecheck
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add db/migrations/006_user_avatar.sql apps/api/src/lib/db.ts
git commit -m "feat: add avatar_url to user_details table and Kysely type"
```

---

## Task 2: API lib — mapUser, updateMe, changePassword

**Files:**
- Modify: `apps/api/src/lib/auth.ts`

- [ ] **Step 1: Update `mapUser` to return `avatarUrl`**

Replace the `mapUser` function:

```ts
const mapUser = async (userId: string, email: string, isActive: boolean) => {
  const details = await db
    .selectFrom("user_details")
    .selectAll()
    .where("user_id", "=", userId)
    .executeTakeFirstOrThrow()
  const permissionRows = await db
    .selectFrom("user_permissions as up")
    .innerJoin("permissions as p", "p.id", "up.permission_id")
    .select("p.name")
    .where("up.user_id", "=", userId)
    .execute()

  return {
    id: userId,
    email,
    isActive,
    fullName: details.full_name,
    avatarUrl: details.avatar_url ?? null,
    permissions: permissionRows.map((row) => row.name as PermissionName),
  }
}
```

- [ ] **Step 2: Add `updateMe` function**

Add after the `me` export:

```ts
export const updateMe = async (
  userId: string,
  input: { fullName?: string; avatarUrl?: string },
) => {
  const update: Partial<{ full_name: string; avatar_url: string; updated_at: Date }> = {
    updated_at: new Date(),
  }
  if (input.fullName !== undefined) update.full_name = input.fullName
  if (input.avatarUrl !== undefined) update.avatar_url = input.avatarUrl

  await db.updateTable("user_details").set(update).where("user_id", "=", userId).execute()

  const user = await db
    .selectFrom("users")
    .select(["id", "email", "is_active"])
    .where("id", "=", userId)
    .executeTakeFirstOrThrow()
  return mapUser(user.id, user.email, user.is_active)
}
```

- [ ] **Step 3: Add `changePassword` function**

Add after `updateMe`:

```ts
export const changePassword = async (
  userId: string,
  input: { currentPassword: string; newPassword: string },
) => {
  const user = await db
    .selectFrom("users")
    .select(["password_hash"])
    .where("id", "=", userId)
    .executeTakeFirstOrThrow()

  const valid = await bcrypt.compare(input.currentPassword, user.password_hash)
  if (!valid) throw new Error("Invalid current password")

  const newHash = await bcrypt.hash(input.newPassword, 10)
  await db.updateTable("users").set({ password_hash: newHash }).where("id", "=", userId).execute()
}
```

- [ ] **Step 4: Typecheck API**

```bash
pnpm --filter @jewellery/api typecheck
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/lib/auth.ts
git commit -m "feat: update mapUser to return avatarUrl; add updateMe and changePassword"
```

---

## Task 3: API handlers + routes

**Files:**
- Modify: `apps/api/src/handlers/auth.ts`
- Modify: `apps/api/src/index.ts`

- [ ] **Step 1: Add Zod schemas in `apps/api/src/handlers/auth.ts`**

Add after the existing `refreshSchema`:

```ts
const updateMeSchema = z
  .object({
    fullName: z.string().min(1).optional(),
    avatarUrl: z.string().min(1).optional(),
  })
  .refine((d) => d.fullName !== undefined || d.avatarUrl !== undefined, {
    message: "At least one field required",
  })

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
})
```

- [ ] **Step 2: Add `updateMe` handler**

Add after the `deleteAccount` export:

```ts
export const updateMe = async (req: Request, res: Response) => {
  if (!req.auth) return res.status(401).json({ message: "Unauthorized" })
  try {
    const input = updateMeSchema.parse(req.body)
    const user = await authService.updateMe(req.auth.userId, input)
    return res.json(user)
  } catch (error) {
    return handleError(res, error)
  }
}
```

- [ ] **Step 3: Add `changePassword` handler**

Add after `updateMe`:

```ts
export const changePassword = async (req: Request, res: Response) => {
  if (!req.auth) return res.status(401).json({ message: "Unauthorized" })
  try {
    const input = changePasswordSchema.parse(req.body)
    await authService.changePassword(req.auth.userId, input)
    return res.status(204).send()
  } catch (error) {
    return handleError(res, error)
  }
}
```

- [ ] **Step 4: Update `handleError` to include the new error message**

In the `handleError` function, add `"Invalid current password"` to the string union so it returns 401 instead of 500:

```ts
error.message === "Email already exists" ||
error.message === "Invalid credentials" ||
error.message === "Invalid refresh token" ||
error.message === "Invalid current password" ||
error.message === "Your account has been permanently deleted."
```

- [ ] **Step 5: Register routes in `apps/api/src/index.ts`**

Add after `app.delete("/account", ...)`:

```ts
app.patch("/auth/me", requireAuth, authHandlers.updateMe)
app.patch("/auth/me/password", requireAuth, authHandlers.changePassword)
```

- [ ] **Step 6: Typecheck API**

```bash
pnpm --filter @jewellery/api typecheck
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/handlers/auth.ts apps/api/src/index.ts
git commit -m "feat: add PATCH /auth/me and PATCH /auth/me/password endpoints"
```

---

## Task 4: authStore — ApiAuthResponse, toWebUser, updateUser

**Files:**
- Create: `apps/client/src/stores/authStore.test.ts`
- Modify: `apps/client/src/stores/authStore.ts`

- [ ] **Step 1: Write failing tests in `apps/client/src/stores/authStore.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

vi.mock("@/api/client", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
  setTokens: vi.fn(),
  clearTokens: vi.fn(),
}))

import { useAuthStore } from "./authStore"
import type { User } from "@/types/domain"

const mockUser = (): User => ({
  id: "user-1",
  fullName: "Alice",
  email: "alice@example.com",
  avatarUrl: null,
  tier: "Free",
})

describe("authStore.updateUser", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: mockUser(), accessToken: "tok", sessionReady: true })
  })

  afterEach(() => {
    useAuthStore.setState({ user: null, accessToken: null, sessionReady: false })
    localStorage.clear()
  })

  it("merges patch into user state", () => {
    useAuthStore.getState().updateUser({ fullName: "Bob" })
    expect(useAuthStore.getState().user?.fullName).toBe("Bob")
  })

  it("does not overwrite unpatched fields", () => {
    useAuthStore.getState().updateUser({ avatarUrl: "http://example.com/avatar.jpg" })
    expect(useAuthStore.getState().user?.fullName).toBe("Alice")
    expect(useAuthStore.getState().user?.avatarUrl).toBe("http://example.com/avatar.jpg")
  })

  it("persists updated user to localStorage", () => {
    useAuthStore.getState().updateUser({ fullName: "Charlie" })
    const stored = JSON.parse(localStorage.getItem("aeterna_session_user") ?? "null")
    expect(stored?.fullName).toBe("Charlie")
  })

  it("does nothing when user is null", () => {
    useAuthStore.setState({ user: null })
    useAuthStore.getState().updateUser({ fullName: "Ghost" })
    expect(useAuthStore.getState().user).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
pnpm --filter @jewellery/client test
```

Expected: tests fail because `updateUser` does not exist yet.

- [ ] **Step 3: Update `apps/client/src/stores/authStore.ts`**

Make three changes:

**3a. Extend `ApiAuthResponse` user shape** (add `avatarUrl`):

```ts
type ApiAuthResponse = {
  user: { id: string; fullName: string; email: string; avatarUrl: string | null }
  tokens: { accessToken: string; refreshToken: string }
}
```

**3b. Fix `toWebUser` to read `avatarUrl` from API response**:

```ts
const toWebUser = (u: ApiAuthResponse["user"]): User => ({
  id: u.id,
  fullName: u.fullName,
  email: u.email,
  avatarUrl: u.avatarUrl,
  tier: "Free",
})
```

**3c. Add `updateUser` to `AuthState` type and implementation**:

In the `AuthState` type, add:
```ts
updateUser: (patch: Partial<User>) => void
```

In the `create<AuthState>((set) => ({...}))` body, add:
```ts
updateUser: (patch) => {
  set((s) => {
    if (!s.user) return s
    const updated = { ...s.user, ...patch }
    persistUser(updated)
    return { user: updated }
  })
},
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
pnpm --filter @jewellery/client test
```

Expected: all 4 `authStore.updateUser` tests pass.

- [ ] **Step 5: Typecheck client**

```bash
pnpm --filter @jewellery/client typecheck
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add apps/client/src/stores/authStore.ts apps/client/src/stores/authStore.test.ts
git commit -m "feat: extend authStore with updateUser action and avatarUrl in ApiAuthResponse"
```

---

## Task 5: `apiClient.upload` helper

**Files:**
- Modify: `apps/client/src/api/client.ts`

- [ ] **Step 1: Add `doUpload` function and `upload` method to `apiClient`**

After the `doRequest` function definition, add:

```ts
const doUpload = async <T>(path: string, formData: FormData, retried = false): Promise<T> => {
  const headers: Record<string, string> = {}
  if (_accessToken) headers["Authorization"] = `Bearer ${_accessToken}`

  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers,
    body: formData,
  })

  if (res.status === 401 && !retried) {
    const refreshed = await tryRefresh()
    if (refreshed) return doUpload(path, formData, true)
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message ?? `HTTP ${res.status}`)
  }

  return res.json() as Promise<T>
}
```

Then add `upload` to the exported `apiClient` object:

```ts
export const apiClient = {
  get: <T>(path: string) => doRequest<T>("GET", path),
  post: <T>(path: string, body?: unknown) => doRequest<T>("POST", path, body),
  patch: <T>(path: string, body?: unknown) => doRequest<T>("PATCH", path, body),
  delete: <T>(path: string) => doRequest<T>("DELETE", path),
  upload: <T>(path: string, formData: FormData) => doUpload<T>(path, formData),
}
```

- [ ] **Step 2: Typecheck client**

```bash
pnpm --filter @jewellery/client typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/client/src/api/client.ts
git commit -m "feat: add upload method to apiClient for FormData requests"
```

---

## Task 6: AvatarPreviewModal component

**Files:**
- Create: `apps/client/src/components/profile/AvatarPreviewModal.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { useEffect, useRef, useState } from "react"
import { Icon } from "@/components/primitives/Icon"
import { Button } from "@/components/primitives/Button"
import { apiClient } from "@/api/client"

type Props = {
  file: File | null
  onConfirm: (url: string) => void
  onClose: () => void
}

export const AvatarPreviewModal = ({ file, onConfirm, onClose }: Props) => {
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const objectUrlRef = useRef<string | null>(null)

  useEffect(() => {
    if (!file) return
    const url = URL.createObjectURL(file)
    objectUrlRef.current = url
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  useEffect(() => {
    if (!file) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [file, onClose])

  if (!file) return null

  const handleConfirm = async () => {
    setUploading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append("file", file)
      const { url } = await apiClient.upload<{ url: string }>("/upload", form)
      onConfirm(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed, please try again")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-3xl shadow-2xl p-8 max-w-sm w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-headline-md text-headline-md text-on-surface">
            Confirm Profile Photo
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-primary transition-colors"
            aria-label="Close"
          >
            <Icon name="close" />
          </button>
        </div>

        {preview && (
          <div className="flex justify-center mb-6">
            <img
              src={preview}
              alt="Avatar preview"
              className="w-36 h-36 rounded-full object-cover border-4 border-primary/20 shadow-lg"
            />
          </div>
        )}

        {error && (
          <p className="text-error font-label-md text-sm mb-4">{error}</p>
        )}

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} disabled={uploading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirm} disabled={uploading}>
            {uploading ? "Uploading…" : "Confirm"}
          </Button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck client**

```bash
pnpm --filter @jewellery/client typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/client/src/components/profile/AvatarPreviewModal.tsx
git commit -m "feat: add AvatarPreviewModal with solid opaque background"
```

---

## Task 7: ProfilePage component

**Files:**
- Create: `apps/client/src/pages/ProfilePage.tsx`

- [ ] **Step 1: Create `ProfilePage.tsx`**

```tsx
import { type FormEvent, useRef, useState } from "react"
import { GlassPanel } from "@/components/primitives/GlassPanel"
import { Button } from "@/components/primitives/Button"
import { Icon } from "@/components/primitives/Icon"
import { useAuth } from "@/auth/AuthContext"
import { useAuthStore } from "@/stores/authStore"
import { apiClient } from "@/api/client"
import { AvatarPreviewModal } from "@/components/profile/AvatarPreviewModal"

export const ProfilePage = () => {
  const { user } = useAuth()
  const updateUser = useAuthStore((s) => s.updateUser)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [fullName, setFullName] = useState(user?.fullName ?? "")
  const [nameLoading, setNameLoading] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)
  const [nameSuccess, setNameSuccess] = useState(false)

  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passLoading, setPassLoading] = useState(false)
  const [passError, setPassError] = useState<string | null>(null)
  const [passSuccess, setPassSuccess] = useState(false)

  const passwordMismatch =
    newPassword.length > 0 && confirmPassword.length > 0 && newPassword !== confirmPassword

  const handleNameSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) return
    setNameLoading(true)
    setNameError(null)
    setNameSuccess(false)
    try {
      await apiClient.patch("/auth/me", { fullName })
      updateUser({ fullName })
      setNameSuccess(true)
      setTimeout(() => setNameSuccess(false), 3000)
    } catch (err) {
      setNameError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setNameLoading(false)
    }
  }

  const handleAvatarConfirm = async (url: string) => {
    try {
      await apiClient.patch("/auth/me", { avatarUrl: url })
      updateUser({ avatarUrl: url })
      setAvatarFile(null)
      setNameSuccess(true)
      setTimeout(() => setNameSuccess(false), 3000)
    } catch (err) {
      setNameError(err instanceof Error ? err.message : "Failed to save avatar")
    }
  }

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault()
    if (passwordMismatch) return
    setPassLoading(true)
    setPassError(null)
    setPassSuccess(false)
    try {
      await apiClient.patch("/auth/me/password", { currentPassword, newPassword })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setPassSuccess(true)
      setTimeout(() => setPassSuccess(false), 3000)
    } catch (err) {
      setPassError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setPassLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <header className="mb-12">
        <h1 className="font-display-lg text-display-lg text-primary mb-2">Profile</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          Manage your personal information and security settings.
        </p>
      </header>

      {/* Personal Info */}
      <GlassPanel className="p-8 mb-6">
        <div className="flex items-center gap-3 mb-8 text-primary">
          <Icon name="person" />
          <h2 className="font-headline-md text-headline-md">Personal Info</h2>
        </div>

        <div className="flex items-center gap-6 mb-8">
          <div className="relative group">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/20">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-surface-container flex items-center justify-center">
                  <Icon name="person" className="text-3xl text-on-surface-variant" />
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Change profile photo"
            >
              <Icon name="photo_camera" className="text-white" />
            </button>
          </div>
          <div>
            <p className="font-label-md text-label-md text-on-surface">{user?.fullName}</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="font-label-md text-sm text-primary hover:underline mt-1 block"
            >
              Change photo
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) setAvatarFile(file)
              e.target.value = ""
            }}
          />
        </div>

        <form onSubmit={handleNameSave}>
          <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest block mb-1">
            Full Name
          </label>
          <input
            type="text"
            className="form-underline font-headline-md text-headline-md mb-6 w-full"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

          {nameError && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-error/10 border border-error/20 text-error font-label-md text-sm">
              {nameError}
            </div>
          )}
          {nameSuccess && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-primary/10 border border-primary/20 text-primary font-label-md text-sm">
              Profile updated
            </div>
          )}

          <Button type="submit" variant="primary" disabled={nameLoading || !fullName.trim()}>
            {nameLoading ? "Saving…" : "Save Changes"}
          </Button>
        </form>
      </GlassPanel>

      {/* Security */}
      <GlassPanel className="p-8">
        <div className="flex items-center gap-3 mb-8 text-primary">
          <Icon name="lock" />
          <h2 className="font-headline-md text-headline-md">Security</h2>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-6">
          <div>
            <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest block mb-1">
              Current Password
            </label>
            <input
              type="password"
              className="form-underline font-body-lg text-body-lg w-full"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest block mb-1">
              New Password
            </label>
            <input
              type="password"
              className="form-underline font-body-lg text-body-lg w-full"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <div>
            <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest block mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              className="form-underline font-body-lg text-body-lg w-full"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            {passwordMismatch && (
              <p className="text-error font-label-md text-sm mt-2">Passwords don't match</p>
            )}
          </div>

          {passError && (
            <div className="px-4 py-3 rounded-xl bg-error/10 border border-error/20 text-error font-label-md text-sm">
              {passError}
            </div>
          )}
          {passSuccess && (
            <div className="px-4 py-3 rounded-xl bg-primary/10 border border-primary/20 text-primary font-label-md text-sm">
              Password changed
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            disabled={
              passLoading ||
              passwordMismatch ||
              !currentPassword ||
              !newPassword ||
              !confirmPassword
            }
          >
            {passLoading ? "Updating…" : "Change Password"}
          </Button>
        </form>
      </GlassPanel>

      <AvatarPreviewModal
        file={avatarFile}
        onConfirm={handleAvatarConfirm}
        onClose={() => setAvatarFile(null)}
      />
    </div>
  )
}
```

- [ ] **Step 2: Typecheck client**

```bash
pnpm --filter @jewellery/client typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/client/src/pages/ProfilePage.tsx
git commit -m "feat: add ProfilePage with personal info and security sections"
```

---

## Task 8: Routing + TopBar link

**Files:**
- Modify: `apps/client/src/App.tsx`
- Modify: `apps/client/src/components/layout/TopBar.tsx`

- [ ] **Step 1: Add `/profile` route in `App.tsx`**

Add the import at the top of the file:

```ts
import { ProfilePage } from "@/pages/ProfilePage"
```

Inside the `<ProtectedRoute>` block, add after the `/archive` route:

```tsx
<Route path="/profile" element={<ProfilePage />} />
```

- [ ] **Step 2: Fix "Profile Settings" link in `TopBar.tsx`**

Change the `to` prop of the "Profile Settings" link from `/dashboard` to `/profile`:

```tsx
<Link
  to="/profile"
  onClick={() => setSettingsOpen(false)}
  className="flex items-center justify-between px-4 py-3 text-on-surface hover:bg-surface-container-high/50 transition-colors border-b border-white/10"
>
  <span className="font-label-md text-label-md">Profile Settings</span>
  <Icon name="chevron_right" className="text-on-surface-variant text-body-md" />
</Link>
```

- [ ] **Step 3: Run all tests + typecheck**

```bash
pnpm --filter @jewellery/client test && pnpm --filter @jewellery/client typecheck
```

Expected: all tests pass, no type errors.

- [ ] **Step 4: Commit**

```bash
git add apps/client/src/App.tsx apps/client/src/components/layout/TopBar.tsx
git commit -m "feat: wire /profile route and fix Profile Settings link in TopBar"
```

---

## Final verification

- [ ] Start the dev server: `pnpm dev`
- [ ] Navigate to `/profile` — confirm page loads with Personal Info and Security cards
- [ ] Update full name — confirm success banner appears and sidebar name updates
- [ ] Upload an avatar — confirm modal opens (solid background, not glass), preview shown, confirm uploads and avatar appears
- [ ] Change password — confirm 204 success; verify old password is rejected with correct error message
- [ ] Click "Profile Settings" in the TopBar settings dropdown — confirm it navigates to `/profile`
