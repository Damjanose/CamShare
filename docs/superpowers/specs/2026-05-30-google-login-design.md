# Google Login — Design Spec
**Date:** 2026-05-30  
**Status:** Draft

---

## Context

CamShare's login page already has a Google button and `@react-oauth/google` installed, but the OAuth flow is entirely mocked — on success it generates a fake email like `google-xxxxxx@aeterna.local` and calls the standard `/auth/login`. There is no server-side Google token verification.

This spec covers replacing the mock with a real, production-ready Google OAuth flow. The backend will verify the Google access token, create or find the matching user, and return CamShare JWT tokens — exactly the same session format as email/password login.

---

## Approach

**Frontend → Backend access-token flow (implicit grant):**
1. User clicks "Sign in with Google" → Google popup appears (existing `useGoogleLogin` hook, unchanged UI)
2. On success, Google returns an `access_token`
3. Frontend posts `{ accessToken }` to new endpoint `POST /auth/google`
4. Backend calls `https://www.googleapis.com/oauth2/v3/userinfo` with the token to verify it and get `email`, `name`, `picture`
5. Backend finds user by email or creates one (no password), creates a session, returns `{ user, tokens }` — same shape as all other auth endpoints
6. Frontend stores tokens and navigates to dashboard (same path as email login)

No new npm packages required. No redirect URIs needed in Google Cloud Console (implicit flow uses JS origins only).

---

## Google Cloud Console Setup (do this first)

1. Go to **https://console.cloud.google.com**
2. Create a new project or select an existing one
3. Navigate to **APIs & Services → OAuth consent screen**
   - User Type: **External**
   - App name: `CamShare`
   - User support email: `damjanoda@gmail.com`
   - Developer contact email: `damjanoda@gmail.com`
   - Scopes: add **email**, **profile**, **openid** (these are under "non-sensitive")
   - Test users: add `damjanoda@gmail.com` (required while app is in "Testing" status)
   - Save and continue through all steps
4. Navigate to **APIs & Services → Credentials → + CREATE CREDENTIALS → OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Name: `CamShare Web`
   - **Authorized JavaScript origins** (add both):
     - `http://192.168.100.68:5173`
     - `https://camshare.uplisoft.com`
   - Authorized redirect URIs: leave **empty** (not needed for implicit flow)
   - Click **Create**
5. Copy the **Client ID** (looks like `1234567890-abc...apps.googleusercontent.com`)
6. Set it in both env files:
   - `apps/client/.env.development`: `VITE_GOOGLE_CLIENT_ID=<your-client-id>`
   - Production build env: same key, same value (one client ID covers both origins)

> **Publishing:** While in "Testing" mode, only listed test users can sign in. When ready to open to all users, go back to OAuth consent screen and click **Publish App**.

---

## Database

**New migration** `db/migrations/009_nullable_password.sql`:
```sql
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
```

OAuth users have no password. `password_hash` becomes `NULL` for Google-created accounts.

**Kysely type update** in `apps/api/src/lib/db.ts`:
```typescript
// line 8
password_hash: string | null   // was: string
```

**Null-password guards** — three functions in `apps/api/src/lib/auth.ts` call `bcrypt.compare(password, user.password_hash)` and will crash if `password_hash` is null:
- `login()` — add guard after fetching user: if `password_hash` is null, throw `"Invalid credentials"`
- `changePassword()` — add guard: if `password_hash` is null, throw `"Invalid current password"`
- `deleteAccount()` — add guard: if `password_hash` is null, throw `"Invalid password"`

---

## Backend — New Endpoint

**`apps/api/src/lib/auth.ts`** — add `googleLogin()`:
```typescript
export const googleLogin = async (
  accessToken: string,
  context: { userAgent?: string; ipAddress?: string }
): Promise<AuthResponse> => {
  const resp = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!resp.ok) throw new Error("Invalid Google token")
  const profile = await resp.json() as { email?: string; name?: string; picture?: string }
  if (!profile.email) throw new Error("Google account has no email")

  let existingUser = await db.selectFrom("users").selectAll()
    .where("email", "=", profile.email).executeTakeFirst()

  if (!existingUser) {
    const inserted = await db.insertInto("users")
      .values({ email: profile.email, password_hash: null })
      .returning(["id", "email", "is_active"]).executeTakeFirstOrThrow()

    await db.insertInto("user_details").values({
      user_id: inserted.id,
      full_name: profile.name ?? profile.email,
      avatar_url: profile.picture ?? null,
    }).execute()

    const readPerms = await db.selectFrom("permissions").select(["id"])
      .where("name", "in", ["product.read", "category.read"]).execute()
    if (readPerms.length > 0) {
      await db.insertInto("user_permissions")
        .values(readPerms.map((p) => ({ user_id: inserted.id, permission_id: p.id }))).execute()
    }
    existingUser = await db.selectFrom("users").selectAll()
      .where("id", "=", inserted.id).executeTakeFirstOrThrow()
  }

  const sessionId = crypto.randomUUID()
  const at = signAccessToken({ sub: existingUser.id, sid: sessionId, email: existingUser.email })
  const rt = signRefreshToken({ sub: existingUser.id, sid: sessionId, email: existingUser.email })
  await db.insertInto("auth_sessions").values({
    id: sessionId, user_id: existingUser.id,
    refresh_token_hash: hashToken(rt),
    user_agent: context.userAgent ?? null, ip_address: context.ipAddress ?? null,
    expires_at: refreshExpiryDate(),
  }).execute()

  return { user: await mapUser(existingUser.id, existingUser.email, existingUser.is_active), tokens: { accessToken: at, refreshToken: rt } }
}
```

**`apps/api/src/handlers/auth.ts`** — add `googleAuth` handler + extend `handleError`:
```typescript
const googleSchema = z.object({ accessToken: z.string().min(1) })

export const googleAuth = async (req: Request, res: Response) => {
  try {
    const { accessToken } = googleSchema.parse(req.body)
    const data = await authService.googleLogin(accessToken, {
      userAgent: req.header("user-agent"),
      ipAddress: req.ip,
    })
    return res.json(data)
  } catch (error) {
    return handleError(res, error)
  }
}
```

Add to `handleError` inside the existing `if (error instanceof Error && ...)` block:
```typescript
error.message === "Invalid Google token" ||
error.message === "Google account has no email"
```
→ return `401`.

**`apps/api/src/index.ts`** — register route (public, before `requireAuth` middleware):
```typescript
app.post("/auth/google", authHandler.googleAuth)
```

---

## Frontend

**`apps/client/src/stores/authStore.ts`** — add to `AuthState` type and store:
```typescript
// in AuthState type
googleLogin: (googleAccessToken: string) => Promise<User>

// in create() body, same pattern as login()
googleLogin: async (googleAccessToken) => {
  const data = await apiClient.post<ApiAuthResponse>("/auth/google", { accessToken: googleAccessToken })
  setTokens(data.tokens.accessToken, data.tokens.refreshToken)
  const user = toWebUser(data.user)
  persistUser(user)
  set({ user, accessToken: data.tokens.accessToken })
  return user
},
```

**`apps/client/src/auth/AuthContext.tsx`** — expose `googleLogin` through context:
- Add `googleLogin: (googleAccessToken: string) => Promise<User>` to `AuthContextValue`
- Include it in the value returned by `AuthProvider`

**`apps/client/src/auth/useSocialAuth.ts`** — replace mock with real call:
```typescript
// Replace: const { login, register } = useAuth()
const { login, register, googleLogin } = useAuth()

// Replace the onSuccess mock in googleSignIn:
onSuccess: async (response: TokenResponse) => {
  await googleLogin(response.access_token)
  navigate(redirectTo, { replace: true })
},

// Remove the mock fallback in onError:
onError: (error) => {
  console.warn("Google sign-in failed", error)
  // no fallback — real errors should surface to the user
},
```

**`apps/client/.env.example`** — add line:
```
VITE_GOOGLE_CLIENT_ID=
```

---

## Production Checklist

- [ ] Google Cloud: both origins added (`192.168.100.68:5173` and `https://camshare.uplisoft.com`)
- [ ] `VITE_GOOGLE_CLIENT_ID` set in production build env
- [ ] Google consent screen published ("Publish App") before going live
- [ ] Migration `009_nullable_password.sql` run on production DB

---

## Verification

1. Run `pnpm --filter @camshare/api db:migrate` — migration applies without error
2. Start API + client (`pnpm dev`)
3. Open `http://192.168.100.68:5173/login`
4. Click "Sign in with Google" — Google popup appears, select a Google account
5. Popup closes, app navigates to `/dashboard`, user name shows correctly
6. Check API logs: `POST /auth/google 200`
7. New user: check DB — row in `users` with `password_hash = NULL`, `user_details.full_name` from Google, `avatar_url` from Google picture
8. Sign out, sign in again with same Google account → logs into existing account (not a duplicate)
9. Sign in with Google using an email that already has a CamShare email+password account → should succeed and log into the existing account (Google finds user by email)
10. Sign in via email/password using an account created only via Google (no password) → should be rejected with "Invalid credentials"
