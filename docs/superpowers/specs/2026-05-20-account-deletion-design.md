# Account Deletion Design

**Date:** 2026-05-20
**Scope:** Mobile app (Expo) + API (Express/Kysely/PostgreSQL)

## Overview

Users can delete their account from the ProfileScreen. Deletion is soft — a `deleted_at` timestamp is set and all sessions are revoked. Within 30 days, logging in again silently reactivates the account. After 30 days, the next login attempt triggers a hard delete inside a DB transaction and returns a user-friendly error message shown as a Snackbar on the login screen. No LoginScreen code changes are needed — the existing generic error handler already surfaces any API message string via Snackbar.

## Database

**Migration:** `db/migrations/005_account_deletion.sql`

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NOT NULL;
```

- `is_active` is left untouched — it remains for admin-controlled suspension.
- `deleted_at` is the sole indicator of user-initiated deletion.
- The partial index keeps the login check fast without scanning all rows.
- `IF NOT EXISTS` guards match the style of migration `002_commerce.sql` for safe re-runs.

**Kysely type update:** `apps/api/src/lib/db.ts` — add `deleted_at: Date | null` to `UsersTable`:

```ts
export interface UsersTable {
  id: Generated<string>
  email: string
  password_hash: string
  is_active: Generated<boolean>
  created_at: Generated<Date>
  updated_at: Generated<Date>
  deleted_at: Date | null   // add this
}
```

## API

### New endpoint: `DELETE /account`

The endpoint is at `/account`, **not** `/auth/account`. The Axios response interceptor in `apps/mobile/src/api/client.ts` skips silent token refresh for all `/auth/*` routes — placing this endpoint under `/auth/` would mean an expired access token causes a naked 401 instead of a transparent refresh-and-retry.

- **Auth:** `requireAuth`
- **Route:** `app.delete('/account', requireAuth, authHandlers.deleteAccount)` in `index.ts`
- **Handler:** `apps/api/src/handlers/auth.ts` → `deleteAccount`
  - Wrapped in `try/catch` delegating to `handleError`, consistent with `register`, `login`, `refresh`, and `me`. (`logout` is the one handler that does not use this pattern.)
  - Calls `authService.deleteAccount(req.auth.userId)`.
  - Returns 204 on success.

- **Service:** `apps/api/src/lib/auth.ts` → `deleteAccount(userId: string)`

  ```ts
  export const deleteAccount = async (userId: string) => {
    await db.updateTable('users').set({ deleted_at: new Date() }).where('id', '=', userId).execute()
    await db.updateTable('auth_sessions')
      .set({ revoked_at: new Date() })
      .where('user_id', '=', userId)
      .where('revoked_at', 'is', null)
      .execute()
  }
  ```

### Modified login (`lib/auth.ts`)

The existing `login` uses `.selectAll()` on `users` and has no `is_active` gate. Once the migration runs and `UsersTable` is updated, `user.deleted_at` is available immediately.

Insert the following block **immediately after `bcrypt.compare` succeeds** (line 83 of the current file) and before token/session creation:

```ts
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000
const cutoff = new Date(Date.now() - THIRTY_DAYS_MS)

if (user.deleted_at !== null) {
  if (user.deleted_at > cutoff) {
    // deleted_at is more recent than 30 days ago — still within the recovery window
    await db.updateTable('users').set({ deleted_at: null }).where('id', '=', user.id).execute()
    // fall through to normal token creation
  } else {
    // deleted_at is older than 30 days — hard delete atomically, then reject
    await db.transaction().execute(async (trx) => {
      await trx.deleteFrom('orders').where('user_id', '=', user.id).execute()
      // order_items and order_status_events cascade from orders automatically
      await trx.deleteFrom('users').where('id', '=', user.id).execute()
      // Cascade from users covers:
      //   user_details, user_permissions, auth_sessions, carts, notifications
      //   events (via owner_id) → event_join_tokens, event_channels → event_photos
      //   event_members
      //   event_photos where uploader_id = user.id (even in events owned by others)
    })
    throw new Error('Your account has been permanently deleted.')
  }
}
```

The transaction ensures the multi-step delete is atomic (all-or-nothing). The `orders.user_id ON DELETE RESTRICT` constraint means orders must be deleted first. If a concurrent order insert arrives after the orders-delete but before the user-delete, the `RESTRICT` FK causes the user-delete to fail and the entire transaction rolls back — which is the correct safe outcome.

**Known data-loss side effect:** `event_photos.uploader_id` has `ON DELETE CASCADE`, so deleting a user also deletes any photos they uploaded to events owned by other users. This is by design given the current schema.

### Error handling (`handlers/auth.ts`)

Add `"Your account has been permanently deleted."` to the exact-string-match list in `handleError`. The current condition:

```ts
error.message === "Email already exists" || error.message === "Invalid credentials" || error.message === "Invalid refresh token"
```

becomes:

```ts
error.message === "Email already exists" ||
error.message === "Invalid credentials" ||
error.message === "Invalid refresh token" ||
error.message === "Your account has been permanently deleted."
```

Returns `HTTP 401 { "message": "Your account has been permanently deleted." }`.

The LoginScreen's existing error handler (`setError(e?.response?.data?.message ?? e.message)`) surfaces this in the Snackbar with no code changes needed.

### Refresh path

No changes needed. `deleteAccount` revokes all active sessions. A subsequent `refresh` call will fail the session lookup (`.where("revoked_at", "is", null)` finds nothing) and throw "Invalid refresh token" — same path as any expired session. The `bootstrap()` in `AuthContext` catches this and clears local state.

## Mobile

### `apps/mobile/src/services/auth.ts`

Add:

```ts
deleteAccount: () => apiClient.delete('/account').then((r) => r.data),
```

### `apps/mobile/src/context/AuthContext.tsx`

Three changes:

1. Add `deleteAccount: () => Promise<void>` to the `AuthContextValue` type.

2. Add the implementation inside `AuthProvider` — `clearSession` is the local closure defined in the same component scope, not an import:

   ```ts
   const deleteAccount = async () => {
     await authService.deleteAccount()  // throws on network/server failure — do NOT catch here
     try { await clearSession() } catch { /* clearSession failing means SecureStore errored — account
       is already deleted on the server, so swallow and let the auth guard handle navigation */ }
   }
   ```

3. Add `deleteAccount` to the `AuthContext.Provider` value object:

   ```tsx
   <AuthContext.Provider value={{ user, accessToken, login, register, logout, deleteAccount }}>
   ```

### `apps/mobile/src/screens/ProfileScreen.tsx`

- Destructure `deleteAccount` from `useAuth()`.
- Add `const [deleting, setDeleting] = useState(false)`.
- Add a "Delete Account" destructive `SettingRow` below "Sign Out".
- On press, show `Alert.alert`:
  - **Title:** "Delete Account"
  - **Message:** "Your account will be scheduled for deletion. Log back in within 30 days to recover it."
  - **Buttons:** Cancel (default) | Delete (destructive style)
- On confirm:

  ```ts
  try {
    setDeleting(true)
    await deleteAccount()
    // Navigation is handled by the auth guard when clearSession clears the user state.
    // Do NOT add an explicit navigation.navigate() call — it would conflict with the guard.
  } catch {
    setDeleting(false)
    Alert.alert('Error', 'Failed to delete account. Please try again.')
  }
  // Note: no `finally { setDeleting(false) }` — the component unmounts on success
  // so calling setState after would be a no-op. Reset only on error path.
  ```

- Disable the "Delete Account" row while `deleting` is true to prevent double-taps. The `settings` array is constructed inside the component body, so its `onPress` closures do not automatically reflect changing state. Use `disabled={deleting}` and `opacity: deleting ? 0.4 : 1` directly on the "Delete Account" `TouchableOpacity` at the render site rather than relying on the array structure.

### `apps/mobile/src/screens/LoginScreen.tsx`

**No changes needed.** The existing catch block already does:

```ts
} catch (e: any) {
  setError(e?.response?.data?.message ?? e.message)
}
```

And `<Snackbar message={error} onDismiss={() => setError(null)} />` renders it. The message `"Your account has been permanently deleted."` appears automatically.

## Data flow

```
User taps "Delete Account"
  → Alert confirmation
  → DELETE /account  (sets deleted_at, revokes all sessions)
  → clearSession()  (clears SecureStore + local state)
  → Auth guard detects user = null → redirects to LoginScreen

User tries to log in (within 30 days)
  → API clears deleted_at, issues tokens
  → Normal session established (silent reactivation)

User tries to log in (after 30 days)
  → API: transaction deletes orders then hard-deletes user (full cascade)
  → Returns 401 { message: "Your account has been permanently deleted." }
  → Snackbar shown automatically via existing LoginScreen error handler
```

## What is NOT in scope

- Email notification on deletion or before purge.
- Admin UI for managing deleted accounts.
- Web client changes.
- Recovery via support contact.
