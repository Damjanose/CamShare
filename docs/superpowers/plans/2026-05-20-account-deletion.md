# Account Deletion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add soft-delete account deletion to the mobile app, with 30-day recovery on login and lazy hard-delete after expiry.

**Architecture:** A new `deleted_at` column on `users` drives all deletion logic. The API gets a `DELETE /account` endpoint plus modified login logic. The mobile ProfileScreen gets a confirmation flow; no LoginScreen changes are needed since the existing error handler already shows API message strings in a Snackbar.

**Tech Stack:** PostgreSQL (Kysely ORM), Express/TypeScript API, Expo React Native (TypeScript), SecureStore, Axios

---

## File Map

| File | Change |
|---|---|
| `db/migrations/005_account_deletion.sql` | **Create** — adds `deleted_at` column + index |
| `apps/api/src/lib/db.ts` | **Modify** — add `deleted_at: Date \| null` to `UsersTable` |
| `apps/api/src/lib/auth.ts` | **Modify** — add `deleteAccount()` service fn + `deleted_at` check in `login` |
| `apps/api/src/handlers/auth.ts` | **Modify** — add `deleteAccount` handler + new error string in `handleError` |
| `apps/api/src/index.ts` | **Modify** — register `DELETE /account` route |
| `apps/mobile/src/services/auth.ts` | **Modify** — add `deleteAccount` call |
| `apps/mobile/src/context/AuthContext.tsx` | **Modify** — add type, implementation, Provider value |
| `apps/mobile/src/screens/ProfileScreen.tsx` | **Modify** — add Delete Account row with confirmation + loading state |

---

## Task 1: Database — migration file and Kysely type

**Files:**
- Create: `db/migrations/005_account_deletion.sql`
- Modify: `apps/api/src/lib/db.ts`

- [ ] **Step 1: Create the migration file**

  Create `db/migrations/005_account_deletion.sql` with this exact content:

  ```sql
  ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
  CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NOT NULL;
  ```

- [ ] **Step 2: Add `deleted_at` to the Kysely `UsersTable` interface**

  Open `apps/api/src/lib/db.ts`. In `UsersTable`, add one line after `updated_at`:

  ```ts
  export interface UsersTable {
    id: Generated<string>
    email: string
    password_hash: string
    is_active: Generated<boolean>
    created_at: Generated<Date>
    updated_at: Generated<Date>
    deleted_at: Date | null  // add this line
  }
  ```

- [ ] **Step 3: Run the migration**

  Make sure Postgres is running (`docker compose up -d` from the repo root), then:

  ```bash
  pnpm --filter @jewellery/api db:migrate
  ```

  Expected: no errors. If it says "column already exists" that is also fine — the `IF NOT EXISTS` guard handles it.

- [ ] **Step 4: Verify the column exists in the DB**

  ```bash
  docker exec -it $(docker ps -q --filter "ancestor=postgres") psql -U postgres -d template_auth_catalog -c "\d users"
  ```

  Expected: `deleted_at` appears in the column list as `timestamp with time zone`.

- [ ] **Step 5: Run typecheck to confirm no TS errors**

  ```bash
  pnpm --filter @jewellery/api typecheck
  ```

  Expected: exits 0.

- [ ] **Step 6: Commit**

  ```bash
  git add db/migrations/005_account_deletion.sql apps/api/src/lib/db.ts
  git commit -m "feat: add deleted_at column to users for soft-delete"
  ```

---

## Task 2: API — `deleteAccount` service, handler, route, and error string

**Files:**
- Modify: `apps/api/src/lib/auth.ts`
- Modify: `apps/api/src/handlers/auth.ts`
- Modify: `apps/api/src/index.ts`

- [ ] **Step 1: Add `deleteAccount` to the auth service**

  Open `apps/api/src/lib/auth.ts`. Add this function at the bottom of the file (after `logout`):

  ```ts
  export const deleteAccount = async (userId: string) => {
    await db.updateTable('users').set({ deleted_at: new Date() }).where('id', '=', userId).execute()
    await db
      .updateTable('auth_sessions')
      .set({ revoked_at: new Date() })
      .where('user_id', '=', userId)
      .where('revoked_at', 'is', null)
      .execute()
  }
  ```

- [ ] **Step 2: Add the `deleteAccount` handler**

  Open `apps/api/src/handlers/auth.ts`. Add this handler after `logout`:

  ```ts
  export const deleteAccount = async (req: Request, res: Response) => {
    if (!req.auth) {
      return res.status(401).json({ message: "Unauthorized" })
    }
    try {
      await authService.deleteAccount(req.auth.userId)
      return res.status(204).send()
    } catch (error) {
      return handleError(res, error)
    }
  }
  ```

- [ ] **Step 3: Add the new error string to `handleError`**

  In `apps/api/src/handlers/auth.ts`, find the `handleError` function. The existing known-error condition currently reads:

  ```ts
  if (error instanceof Error && (error.message === "Email already exists" || error.message === "Invalid credentials" || error.message === "Invalid refresh token")) {
  ```

  Replace it with:

  ```ts
  if (
    error instanceof Error &&
    (
      error.message === "Email already exists" ||
      error.message === "Invalid credentials" ||
      error.message === "Invalid refresh token" ||
      error.message === "Your account has been permanently deleted."
    )
  ) {
  ```

- [ ] **Step 4: Register the route**

  Open `apps/api/src/index.ts`. Add this line after the existing `/auth/logout` line:

  ```ts
  app.delete('/account', requireAuth, authHandlers.deleteAccount)
  ```

- [ ] **Step 5: Start the API and smoke-test with curl**

  ```bash
  pnpm --filter @jewellery/api dev
  ```

  In a second terminal, log in to get a token:

  ```bash
  TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@example.com","password":"Admin123!"}' \
    | jq -r '.tokens.accessToken')
  echo $TOKEN
  ```

  Call the delete endpoint:

  ```bash
  curl -s -o /dev/null -w "%{http_code}" -X DELETE http://localhost:3001/account \
    -H "Authorization: Bearer $TOKEN"
  ```

  Expected: `204`

  Verify `deleted_at` is set in the DB:

  ```bash
  docker exec -it $(docker ps -q --filter "ancestor=postgres") psql -U postgres -d template_auth_catalog \
    -c "SELECT email, deleted_at FROM users WHERE email = 'admin@example.com';"
  ```

  Expected: `deleted_at` is a recent timestamp (not null).

  Verify all sessions were revoked:

  ```bash
  docker exec -it $(docker ps -q --filter "ancestor=postgres") psql -U postgres -d template_auth_catalog \
    -c "SELECT id, revoked_at FROM auth_sessions WHERE user_id = (SELECT id FROM users WHERE email='admin@example.com');"
  ```

  Expected: `revoked_at` is set on all rows.

- [ ] **Step 6: Re-seed admin user so the account is usable again**

  ```bash
  pnpm --filter @jewellery/api db:seed
  ```

  Or manually reset `deleted_at`:

  ```bash
  docker exec -it $(docker ps -q --filter "ancestor=postgres") psql -U postgres -d template_auth_catalog \
    -c "UPDATE users SET deleted_at = NULL WHERE email = 'admin@example.com';"
  ```

- [ ] **Step 7: Typecheck**

  ```bash
  pnpm --filter @jewellery/api typecheck
  ```

  Expected: exits 0.

- [ ] **Step 8: Commit**

  ```bash
  git add apps/api/src/lib/auth.ts apps/api/src/handlers/auth.ts apps/api/src/index.ts
  git commit -m "feat: add DELETE /account endpoint for soft-delete"
  ```

---

## Task 3: API — modified login with `deleted_at` check

**Files:**
- Modify: `apps/api/src/lib/auth.ts`

The `login` function currently does: find user → verify password → create session + tokens. We insert the `deleted_at` check between password verification and session creation.

- [ ] **Step 1: Insert the deleted_at block into `login`**

  Open `apps/api/src/lib/auth.ts`. Find the `login` function. Immediately after the `bcrypt.compare` block (the `if (!valid) throw new Error("Invalid credentials")` line), insert:

  ```ts
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000
  const cutoff = new Date(Date.now() - THIRTY_DAYS_MS)

  if (user.deleted_at !== null) {
    if (user.deleted_at > cutoff) {
      // Still within 30-day recovery window — reactivate silently and continue
      await db.updateTable('users').set({ deleted_at: null }).where('id', '=', user.id).execute()
    } else {
      // Past 30 days — hard delete atomically, then reject login
      await db.transaction().execute(async (trx) => {
        await trx.deleteFrom('orders').where('user_id', '=', user.id).execute()
        await trx.deleteFrom('users').where('id', '=', user.id).execute()
      })
      throw new Error('Your account has been permanently deleted.')
    }
  }
  ```

  The block falls through to the existing session-creation code when reactivating.

- [ ] **Step 2: Test the reactivation path**

  First, manually soft-delete an account using the API (Task 2 smoke test step 5 approach), then try to log in again:

  ```bash
  # Soft-delete the account
  TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@example.com","password":"Admin123!"}' \
    | jq -r '.tokens.accessToken')

  curl -s -o /dev/null -w "%{http_code}" -X DELETE http://localhost:3001/account \
    -H "Authorization: Bearer $TOKEN"
  # Expected: 204

  # Now log in again — should succeed (reactivation)
  curl -s -X POST http://localhost:3001/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@example.com","password":"Admin123!"}' \
    | jq '.user'
  # Expected: user object returned (not an error)

  # Verify deleted_at is now NULL
  docker exec -it $(docker ps -q --filter "ancestor=postgres") psql -U postgres -d template_auth_catalog \
    -c "SELECT email, deleted_at FROM users WHERE email = 'admin@example.com';"
  # Expected: deleted_at is NULL
  ```

- [ ] **Step 3: Test the hard-delete path**

  Manually set `deleted_at` to 31 days ago in the DB, then attempt login:

  ```bash
  docker exec -it $(docker ps -q --filter "ancestor=postgres") psql -U postgres -d template_auth_catalog \
    -c "UPDATE users SET deleted_at = NOW() - INTERVAL '31 days' WHERE email = 'admin@example.com';"

  curl -s -X POST http://localhost:3001/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@example.com","password":"Admin123!"}' \
    | jq .
  # Expected: {"message": "Your account has been permanently deleted."}

  # Verify user row is gone
  docker exec -it $(docker ps -q --filter "ancestor=postgres") psql -U postgres -d template_auth_catalog \
    -c "SELECT id FROM users WHERE email = 'admin@example.com';"
  # Expected: 0 rows returned
  ```

- [ ] **Step 4: Re-seed the admin user**

  ```bash
  pnpm --filter @jewellery/api db:seed
  ```

- [ ] **Step 5: Typecheck**

  ```bash
  pnpm --filter @jewellery/api typecheck
  ```

  Expected: exits 0.

- [ ] **Step 6: Commit**

  ```bash
  git add apps/api/src/lib/auth.ts
  git commit -m "feat: check deleted_at on login — reactivate within 30d, hard-delete after"
  ```

---

## Task 4: Mobile — service and AuthContext

**Files:**
- Modify: `apps/mobile/src/services/auth.ts`
- Modify: `apps/mobile/src/context/AuthContext.tsx`

- [ ] **Step 1: Add `deleteAccount` to the auth service**

  Open `apps/mobile/src/services/auth.ts`. The file is an object export. Add one line inside the object, after `me`:

  ```ts
  deleteAccount: () => apiClient.delete('/account').then((r) => r.data),
  ```

- [ ] **Step 2: Add `deleteAccount` to `AuthContextValue` type**

  Open `apps/mobile/src/context/AuthContext.tsx`. Find the `AuthContextValue` type and add:

  ```ts
  type AuthContextValue = {
    user: User | null;
    accessToken: string | null;
    login: (input: LoginInput) => Promise<void>;
    register: (input: RegisterInput) => Promise<void>;
    logout: () => Promise<void>;
    deleteAccount: () => Promise<void>;  // add this line
  };
  ```

- [ ] **Step 3: Add `deleteAccount` implementation inside `AuthProvider`**

  Inside the `AuthProvider` component function body, after the `logout` function, add:

  ```ts
  const deleteAccount = async () => {
    await authService.deleteAccount()
    // clearSession is the local closure defined above in this component
    try { await clearSession() } catch { /* SecureStore error — account already deleted server-side */ }
  }
  ```

  Note: `authService.deleteAccount()` throws on network/server failure. Do NOT wrap it in try/catch here — let the error propagate to the caller (ProfileScreen) so it can show a retry prompt.

- [ ] **Step 4: Pass `deleteAccount` in the Provider value object**

  Find the `return` statement in `AuthProvider`:

  ```tsx
  return (
    <AuthContext.Provider value={{ user, accessToken, login, register, logout }}>
  ```

  Update it to:

  ```tsx
  return (
    <AuthContext.Provider value={{ user, accessToken, login, register, logout, deleteAccount }}>
  ```

- [ ] **Step 5: Typecheck the mobile app**

  ```bash
  pnpm --filter @camshare/mobile typecheck
  ```

  If the filter name differs, check `apps/mobile/package.json` for the `"name"` field and use that.

  Expected: exits 0.

- [ ] **Step 6: Commit**

  ```bash
  git add apps/mobile/src/services/auth.ts apps/mobile/src/context/AuthContext.tsx
  git commit -m "feat(mobile): wire deleteAccount through AuthContext"
  ```

---

## Task 5: Mobile — ProfileScreen Delete Account UI

**Files:**
- Modify: `apps/mobile/src/screens/ProfileScreen.tsx`

- [ ] **Step 1: Add imports and state**

  Open `apps/mobile/src/screens/ProfileScreen.tsx`.

  Add `Alert` to the React Native import (it is not currently imported):

  ```ts
  import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
  ```

  Add `useState` to the React import:

  ```ts
  import { useState } from 'react';
  ```

  Inside `ProfileScreen`, destructure `deleteAccount` from `useAuth()`:

  ```ts
  const { user, logout, deleteAccount } = useAuth();
  ```

  Add the loading state directly below that line:

  ```ts
  const [deleting, setDeleting] = useState(false);
  ```

- [ ] **Step 2: Add the confirmation handler**

  Inside the `ProfileScreen` component body (before the `return`), add:

  ```ts
  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Your account will be scheduled for deletion. Log back in within 30 days to recover it.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await deleteAccount();
              // Auth guard detects user = null and navigates to LoginScreen automatically.
              // Do NOT add navigation.navigate() here — it would conflict with the guard.
            } catch {
              setDeleting(false);
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            }
          },
        },
      ]
    );
  };
  ```

- [ ] **Step 3: Add the "Delete Account" row to the settings list**

  In the `settings` array, add a new entry after the `Sign Out` row:

  ```ts
  const settings: SettingRow[] = [
    { label: 'Notifications', value: 'On' },
    { label: 'Download Quality', value: 'High Res' },
    { label: 'Privacy', value: 'Private' },
    { label: 'Help & Support' },
    { label: 'Sign Out', onPress: logout, destructive: true },
    { label: 'Delete Account', onPress: handleDeleteAccount, destructive: true },
  ];
  ```

- [ ] **Step 4: Disable the row while `deleting` is true**

  The settings list renders rows via a `map` over the `settings` array using a shared `TouchableOpacity`. The `disabled` prop needs to be applied specifically to the "Delete Account" row — not to "Sign Out" or other rows.

  Find the `map` inside the `GlassCard` that renders the `settings` array:

  ```tsx
  {settings.map((row, i) => (
    <TouchableOpacity
      key={row.label}
      onPress={row.onPress}
      activeOpacity={row.onPress ? 0.7 : 1}
      style={[
        styles.settingRow,
        i < settings.length - 1 && styles.settingBorder,
      ]}
    >
  ```

  Update it to apply `disabled` and reduced opacity only when the row is "Delete Account" and `deleting` is true:

  ```tsx
  {settings.map((row, i) => {
    const isDeleteRow = row.label === 'Delete Account';
    const isDisabled = isDeleteRow && deleting;
    return (
      <TouchableOpacity
        key={row.label}
        onPress={row.onPress}
        activeOpacity={row.onPress ? 0.7 : 1}
        disabled={isDisabled}
        style={[
          styles.settingRow,
          i < settings.length - 1 && styles.settingBorder,
          isDisabled && { opacity: 0.4 },
        ]}
      >
  ```

  Close the map with `)}` instead of `))` since you changed the arrow function body to a block.

- [ ] **Step 5: Start the Expo dev server and test on device/simulator**

  ```bash
  cd apps/mobile && npx expo start --clear
  ```

  Manual test checklist:

  1. Log in with a non-admin test account (register one if needed).
  2. Navigate to Profile tab.
  3. Scroll to the bottom — verify "Delete Account" appears in red below "Sign Out".
  4. Tap "Delete Account" → confirm the Alert appears with "Cancel" and "Delete" buttons.
  5. Tap "Cancel" → confirm nothing happens, row is still enabled.
  6. Tap "Delete Account" again → tap "Delete" → confirm you are redirected to LoginScreen.
  7. Attempt to log in with the same credentials → confirm you are logged in successfully (reactivation within 30 days).
  8. Log out.
  9. Manually set `deleted_at` to 31 days ago for that user (psql command from Task 3 Step 3).
  10. Attempt to log in → confirm the Snackbar shows "Your account has been permanently deleted."

- [ ] **Step 6: Typecheck**

  ```bash
  pnpm --filter @camshare/mobile typecheck
  ```

  Expected: exits 0.

- [ ] **Step 7: Commit**

  ```bash
  git add apps/mobile/src/screens/ProfileScreen.tsx
  git commit -m "feat(mobile): add Delete Account option to ProfileScreen"
  ```

---

## Verification Summary

After all tasks are complete, the following flows work end-to-end:

| Flow | Expected result |
|---|---|
| Tap Delete Account → Cancel | Nothing changes |
| Tap Delete Account → Delete | Redirected to LoginScreen |
| Log in after soft-delete (< 30 days) | Login succeeds, account reactivated |
| Log in after hard-delete cutoff (> 30 days) | Snackbar: "Your account has been permanently deleted." |
| Call `DELETE /account` with expired token | Axios interceptor refreshes token and retries transparently |
| Call `DELETE /account` without token | 401 Unauthorized |
