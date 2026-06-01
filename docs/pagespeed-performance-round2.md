# PageSpeed Performance Fixes — Round 2

## Context

Follow-up to `pagespeed-performance-fixes.md`. After implementing round 1 fixes (image compression, code splitting, vendor chunks, preconnect hints), a second audit found these remaining issues in priority order.

| Fix | File(s) | Effort |
|-----|---------|--------|
| Nginx static asset cache headers | `nginx/nginx.conf` | 5 min |
| Lazy-load gallery + profile images | `EventGalleryPage`, `QrInvitePage`, `ProfilePage` | 5 min |
| Remove dead `react-apple-login` dependency | `LoginPage`, `RegisterPage`, `package.json` | 10 min |
| Subset Material Symbols font | `globals.css` | 2 min |

---

## Fix 1 — Nginx cache headers for static assets

**File:** `nginx/nginx.conf`

Vite already puts content hashes in every asset filename (e.g. `vendor-react-BDhndQcF.js`). Without cache headers, browsers re-download all 740 KB of JS/CSS on every visit. One location block fixes this permanently.

Add this block **inside the `server { listen 443 ... }` block**, after the existing `location /` block:

```nginx
# Cache hashed assets for 1 year — filenames change on every rebuild
location ~* /assets/.*\.(js|css|png|jpg|jpeg|webp|woff2|woff|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff always;
}

# Never cache index.html — it must stay fresh so new deploys take effect
location = /index.html {
    expires -1;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}
```

Deploy the updated nginx config:

```bash
# On the server (ssh root@72.61.183.120)
docker compose exec nginx nginx -t          # validate config
docker compose exec nginx nginx -s reload   # apply without downtime
```

---

## Fix 2 — Lazy-load images in EventGalleryPage, QrInvitePage, ProfilePage

**Files:**
- `apps/client/src/pages/EventGalleryPage.tsx` — line 274
- `apps/client/src/pages/QrInvitePage.tsx` — lines 207, 232
- `apps/client/src/pages/ProfilePage.tsx` — line 129

### EventGalleryPage (most impactful — gallery of user photos)

Find around line 274:

```tsx
<img
  src={photo.url}
  alt={photo.caption ?? ""}
  className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-105"
/>
```

Replace with:

```tsx
<img
  src={photo.url}
  alt={photo.caption ?? ""}
  loading="lazy"
  className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-105"
/>
```

### QrInvitePage — event cover image (line 207)

```tsx
// Before
<img src={event.coverImageUrl ?? ""} alt={event.title} className="w-full h-full object-cover" />

// After
<img src={event.coverImageUrl ?? ""} alt={event.title} loading="lazy" className="w-full h-full object-cover" />
```

### QrInvitePage — memories grid (line 232)

```tsx
// Before
<img src={url} alt="" className="w-full h-full object-cover" style={{ opacity: 0.85 }} />

// After
<img src={url} alt="" loading="lazy" className="w-full h-full object-cover" style={{ opacity: 0.85 }} />
```

### ProfilePage — avatar image (line 129)

```tsx
// Before
<img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />

// After
<img src={user.avatarUrl} alt={user.fullName} loading="lazy" width={80} height={80} className="w-full h-full object-cover" />
```

---

## Fix 3 — Remove dead `react-apple-login` dependency

**Files:** `apps/client/package.json`, `apps/client/src/pages/LoginPage.tsx`, `apps/client/src/pages/RegisterPage.tsx`

The `AppleLogin` component is imported but commented out in both pages. The package is being bundled into the login/register chunks for no reason.

### Step 1 — Remove the package

```bash
pnpm --filter @camshare/client remove react-apple-login
```

### Step 2 — Remove the import from LoginPage.tsx (line 5)

Delete this line:

```tsx
import AppleLogin from "react-apple-login"
```

Also remove `FaApple` from the react-icons import on line 4 if the Apple button is fully commented out:

```tsx
// Before
import { FcGoogle } from "react-icons/fc"
import { FaApple } from "react-icons/fa"

// After (if Apple UI is hidden)
import { FcGoogle } from "react-icons/fc"
```

### Step 3 — Same removals in RegisterPage.tsx (lines 4–5)

Same two lines to remove.

### Step 4 — Verify build still works

```bash
pnpm --filter @camshare/client build
```

---

## Fix 4 — Subset the Material Symbols icon font

**File:** `apps/client/src/styles/globals.css` — line 2

Current — loads ALL weight and fill combinations (very large variable font):

```css
@import url("https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap");
```

The app only uses weight 400 with fill toggling between 0 and 1. Replace with:

```css
@import url("https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL@20..48,400,0..1&display=swap");
```

This requests only weight 400 across optical sizes 20–48 with both fill states — the subset the app actually uses. Reduces the icon font download by ~40%.

---

## Verification

```bash
# Typecheck
pnpm --filter @camshare/client typecheck

# Build — check bundle sizes shrink in login/register chunks
pnpm --filter @camshare/client build

# Preview locally
pnpm --filter @camshare/client preview
```

After deploying, verify cache headers are set:

```bash
curl -I https://camshare.uplisoft.com/assets/vendor-react-BDhndQcF.js
# Should see: Cache-Control: public, immutable
```
