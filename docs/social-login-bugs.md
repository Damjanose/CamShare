# Social Login — Known Bugs & Fixes

Issues identified after Google and Apple login was implemented. Listed in fix priority order.

---

## 1. Google client ID committed to git ⚠️ Critical

**File:** `apps/client/.env.development`

The file is tracked by git and contains a live Google OAuth client ID. The root `.gitignore` only excludes `.env`, `.env.local`, and `.env.*.local` — it does not cover `.env.development`.

**Fix:**
1. Add `.env.development` to the root `.gitignore`:
   ```
   .env.development
   ```
2. Rename the committed file to `.env.development.example` and clear the actual values.
3. Rotate the web client ID in Google Cloud Console if the repo is or becomes public.

---

## 2. Social user creation is not atomic ⚠️ Critical

**File:** `apps/api/src/lib/auth.ts` — `googleLogin` (~line 421) and `appleLogin` (~line 285)

New user sign-up runs 4 sequential DB inserts with no transaction:
1. `INSERT INTO users`
2. `INSERT INTO user_details`
3. `SELECT permissions`
4. `INSERT INTO user_permissions`

If step 2 or 4 fails mid-flight, an orphan row is left in `users` with no `user_details`. Every subsequent login for that user will call `mapUser → executeTakeFirstOrThrow()` on `user_details` and throw a permanent 500 error.

**Fix:** Wrap the entire user-creation block in a Kysely transaction in both `googleLogin` and `appleLogin`:

```ts
// before: bare sequential inserts
const inserted = await db.insertInto("users")...

// after: all inside one transaction
await db.transaction().execute(async (trx) => {
  const inserted = await trx.insertInto("users")...
  await trx.insertInto("user_details")...
  const readPerms = await trx.selectFrom("permissions")...
  if (readPerms.length > 0) await trx.insertInto("user_permissions")...
  existingUser = await trx.selectFrom("users").where("id","=",inserted.id)...
})
```

---

## 3. Google audience validation silently skipped ⚠️ Critical

**File:** `apps/api/src/lib/auth.ts:384`

```ts
...(googleClientIds.length > 0 ? { audience: googleClientIds } : {})
```

When `GOOGLE_IOS_CLIENT_ID` / `GOOGLE_ANDROID_CLIENT_ID` / `GOOGLE_WEB_CLIENT_ID` are absent from the environment, audience validation is silently skipped. Any cryptographically valid Google JWT — regardless of which app it was issued to — will authenticate on this API.

**Fix:** Make missing client IDs a hard error instead of a silent bypass:

```ts
if (googleClientIds.length === 0) {
  throw new Error("Google client IDs not configured — cannot verify token audience")
}
const payload = verify(idToken, pem, {
  algorithms: ["RS256"],
  issuer: ["https://accounts.google.com", "accounts.google.com"],
  audience: googleClientIds as [string, ...string[]],
})
```

> Note: `GOOGLE_IOS_CLIENT_ID` and `GOOGLE_ANDROID_CLIENT_ID` are already added to `apps/api/.env`. Make sure they are also set in the production environment.

---

## 4. deleteAccount broken for all mobile users ⚠️ Important

**File:** `apps/mobile/src/services/auth.ts:18`

The mobile service sends `DELETE /account` with no body. The API handler requires `password: z.string().min(1)` — Zod returns HTTP 400. No mobile user can delete their account.

**Fix (two parts):**

**API** — add a passwordless deletion path for social-only users, or make `password` optional and skip the check when the user has no `password_hash`:

```ts
// apps/api/src/lib/auth.ts — deleteAccount
if (user.password_hash) {
  if (!input.password) throw new Error("Password required")
  const valid = await bcrypt.compare(input.password, user.password_hash)
  if (!valid) throw new Error("Invalid password")
}
```

**Mobile** — on the Profile screen, only prompt for a password if the user has a password-based account; for social-only users, show a confirmation dialog and call the API without a password field.

---

## 5. Apple identityToken non-null assertion crash ⚠️ Important

**File:** `apps/mobile/src/screens/LoginScreen.tsx:69`

```ts
await appleLogin(credential.identityToken!, fullName)
```

`expo-apple-authentication` types `identityToken` as `string | null`. The `!` assertion will throw a runtime error if Apple returns `null`, which can happen on certain device/OS configurations.

**Fix:**

```ts
if (!credential.identityToken) {
  setServerError('Apple sign-in failed. Please try again.')
  return
}
await appleLogin(credential.identityToken, fullName)
```

---

## 6. No loading state on social buttons ⚠️ Important

**File:** `apps/mobile/src/screens/LoginScreen.tsx:217–239`

Google and Apple buttons have no disabled/loading state while the OAuth flow or API call is in progress. Tapping multiple times can fire concurrent login flows.

**Fix:** Add a `socialLoading` state and disable both buttons while it is true:

```ts
const [socialLoading, setSocialLoading] = useState(false)

// in handleAppleLogin:
setSocialLoading(true)
try { ... } finally { setSocialLoading(false) }

// in google useEffect:
setSocialLoading(true)
googleLogin(...).catch(...).finally(() => setSocialLoading(false))

// on buttons:
disabled={!googleRequest || socialLoading}
disabled={socialLoading}
```

---

## 7. Web client Apple login crashes on missing authorization ⚠️ Important

**File:** `apps/client/src/auth/useSocialAuth.ts:40`

```ts
await appleLogin(data.authorization!.id_token, data.user)
```

The non-null assertion on `data.authorization` throws an unhandled error if Apple returns a partial response. The surrounding `try/catch` logs via `console.error` only — the user sees no feedback.

**Fix:**

```ts
if (!data.authorization?.id_token) {
  // show error to user
  return
}
await appleLogin(data.authorization.id_token, data.user)
```

---

## 8. Google userinfo path doesn't check email_verified ⚠️ Important

**File:** `apps/api/src/lib/auth.ts` — `resolveGoogleProfile` accessToken branch (~line 401)

When Google login uses an access token (web client flow), the userinfo response is used as-is. Google can return `email_verified: false` for restricted accounts. Accounts with unverified emails should not be allowed to sign up.

**Fix:**

```ts
const profile = await resp.json() as {
  email?: string; name?: string; picture?: string; email_verified?: boolean
}
if (!profile.email_verified) throw new Error("Google account email is not verified")
return profile
```

---

## 9. Apple private relay email used as display name ⚠️ Important

**File:** `apps/api/src/lib/auth.ts:301`

```ts
full_name: fullName ?? payload.email
```

When a user hides their email via Apple's privacy relay, `payload.email` is something like `abc123@privaterelay.appleid.com`. This shows up as the user's display name in the UI.

**Fix:**

```ts
const isRelayEmail = (email?: string) => email?.endsWith('@privaterelay.appleid.com') ?? false
full_name: fullName ?? (isRelayEmail(payload.email) ? 'Apple User' : payload.email)
```

---

## Minor / Code quality

- `AppleJwk` (line 232) and `GoogleJwk` (line 348) in `auth.ts` are identical — consolidate into one `OAuthJwk` type.
- `import("jsonwebtoken")` is dynamic inside hot paths (`verifyAppleToken`, `verifyGoogleIdToken`) — move to a static top-level import.
- No tests cover `googleLogin`, `appleLogin`, `verifyGoogleIdToken`, or `checkSoftDelete` paths.
