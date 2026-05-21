# Profile Page Design Spec

**Date:** 2026-05-21  
**Status:** Approved  

## Overview

Add a `/profile` route inside the authenticated `AppShell` where users can update their display name, avatar, and password. A solid-background (non-transparent) `AvatarPreviewModal` is used to confirm the avatar selection before uploading.

---

## Scope

**In scope:**
- Full name update
- Avatar upload with preview confirmation modal
- Password change (requires current password)
- Backend: `PATCH /auth/me`, `PATCH /auth/me/password`, DB migration for `avatar_url`

**Out of scope:**
- Email change
- Account deletion (separate flow)
- Tier/plan management

---

## Backend

### Migration: `006_user_avatar.sql`

```sql
ALTER TABLE user_details ADD COLUMN IF NOT EXISTS avatar_url TEXT;
```

### `PATCH /auth/me`

**Auth:** `requireAuth`  
**Body:** `{ fullName?: string; avatarUrl?: string }` (at least one field required)  
**Response:** updated user object  
**Handler:** `authHandlers.updateMe`  
**Lib:** `authService.updateMe(userId, { fullName, avatarUrl })`  
**DB:** `UPDATE user_details SET full_name = ..., avatar_url = ..., updated_at = NOW() WHERE user_id = $userId`

### `PATCH /auth/me/password`

**Auth:** `requireAuth`  
**Body:** `{ currentPassword: string; newPassword: string }` (newPassword min 8 chars)  
**Response:** `204 No Content`  
**Handler:** `authHandlers.changePassword`  
**Lib:** `authService.changePassword(userId, { currentPassword, newPassword })`  
**Logic:**
1. Fetch `users.password_hash` for `userId`
2. `bcrypt.compare(currentPassword, hash)` — throw `"Invalid current password"` if mismatch
3. `bcrypt.hash(newPassword, 10)` → `UPDATE users SET password_hash = ...`

---

## Frontend

### Routing

- Add `<Route path="/profile" element={<ProfilePage />} />` inside the `ProtectedRoute`/`AppShell` block in `App.tsx`
- Update `TopBar` "Profile Settings" `<Link>` `to` prop from `/dashboard` → `/profile`

### `ProfilePage` (`apps/client/src/pages/ProfilePage.tsx`)

Two `GlassPanel` cards rendered in a single-column max-w-2xl centered layout:

**Card 1 — Personal Info**
- Circular avatar (80×80) with an overlay button "Change Photo" that triggers a hidden `<input type="file" accept="image/*">`
- On file selected → open `AvatarPreviewModal` with the chosen file's object URL
- Full name text input (pre-filled from `user.fullName`)
- Save button → `PATCH /auth/me { fullName }` (avatar saved separately via modal confirm)
- Inline success / error banners inside the card

**Card 2 — Security**
- Three password inputs: Current Password, New Password, Confirm New Password
- Client-side validation: new === confirm, new min 8 chars
- Change Password button → `PATCH /auth/me/password { currentPassword, newPassword }`
- Inline success / error banners inside the card

### `AvatarPreviewModal` (`apps/client/src/components/profile/AvatarPreviewModal.tsx`)

```
Props: { file: File | null; onConfirm: (url: string) => void; onClose: () => void }
```

**Styling (no glass/blur on the dialog box):**
- Overlay: `fixed inset-0 z-[100] bg-black/60 flex items-center justify-center`
- Dialog: `bg-surface rounded-3xl shadow-2xl p-8 max-w-sm w-full mx-4` — fully opaque
- Shows `<img>` preview of the selected file (object URL)
- **Confirm** button → `POST /upload` with FormData → get back `url` → call `onConfirm(url)` → parent calls `PATCH /auth/me { avatarUrl: url }` → `authStore.updateUser({ avatarUrl: url })`
- **Cancel** button → `onClose()`
- Escape key closes modal

### `authStore` additions

```ts
updateUser: (patch: Partial<User>) => void
```
- `set((s) => ({ user: s.user ? { ...s.user, ...patch } : null }))`
- Calls `persistUser` with the updated user to keep localStorage in sync

---

## Error handling

| Scenario | Behaviour |
|---|---|
| Wrong current password | API returns 401 → red banner "Current password is incorrect" inside Security card |
| New passwords don't match | Client-side → red text below Confirm field, Save disabled |
| Upload failure | Red banner inside Personal Info card |
| Network error | Generic "Something went wrong, please try again" banner |
| Success (name/avatar) | Green banner "Profile updated" auto-dismisses after 3 s |
| Success (password) | Green banner "Password changed" auto-dismisses after 3 s |

---

## File checklist

| File | Action |
|---|---|
| `db/migrations/006_user_avatar.sql` | Create |
| `apps/api/src/lib/auth.ts` | Add `updateMe`, `changePassword` |
| `apps/api/src/handlers/auth.ts` | Add `updateMe`, `changePassword` handlers |
| `apps/api/src/index.ts` | Register `PATCH /auth/me` and `PATCH /auth/me/password` |
| `apps/client/src/pages/ProfilePage.tsx` | Create |
| `apps/client/src/components/profile/AvatarPreviewModal.tsx` | Create |
| `apps/client/src/stores/authStore.ts` | Add `updateUser` action |
| `apps/client/src/App.tsx` | Add `/profile` route |
| `apps/client/src/components/layout/TopBar.tsx` | Fix "Profile Settings" link to `/profile` |
