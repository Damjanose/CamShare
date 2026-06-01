# PageSpeed Performance Fixes

## Context

PageSpeed Insights flagged several issues on `https://camshare.uplisoft.com`. Fixes are listed in priority order — highest impact first.

| Issue | Severity |
|-------|----------|
| `favicon.png` and `logo.png` are each 1.3 MB | Critical |
| Apple Auth script blocks rendering | High |
| No preconnect for Google Fonts | High |
| Hero image not preloaded (slow LCP) | High |
| All 15 routes bundled into one 444 KB JS file | High |
| No `loading="lazy"` on below-fold images | Medium |
| Single JS bundle — no vendor chunk caching | Medium |

---

## Fix 1 — Compress public images

**Files:** `apps/client/public/favicon.png`, `apps/client/public/logo.png`

Both images are 1.3 MB each. Browsers request the favicon on every page load.

```bash
# Resize favicon to 32×32 (macOS sips)
sips -z 32 32 apps/client/public/favicon.png
ls -lh apps/client/public/favicon.png   # should be <50 KB

# Compress logo (max 400px wide)
sips -Z 400 apps/client/public/logo.png
ls -lh apps/client/public/logo.png      # should be <100 KB
```

After compressing, check the favicon still shows in the browser tab and the logo renders correctly in the navbar.

---

## Fix 2 — Remove the blocking Apple Auth script

**File:** `apps/client/index.html` — line 9

The Apple ID SDK is loaded synchronously in `<head>` which blocks the first paint. Apple login is currently stubbed out, so the script is dead weight.

Delete this line from `index.html`:

```html
<script type="text/javascript" src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"></script>
```

If Apple login is re-enabled later, load it with `defer` instead.

---

## Fix 3 — Add preconnect hints and LCP preload

**File:** `apps/client/index.html`

Google Fonts uses two separate origins. Without `preconnect`, browsers discover them late and stall font loading. The hero image is the LCP element — preloading it gives it a head start.

Add these lines to `<head>` after `<meta name="theme-color">`:

```html
<!-- Preconnect to Google Fonts origins -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />

<!-- DNS prefetch for Unsplash images -->
<link rel="dns-prefetch" href="https://images.unsplash.com" />

<!-- Preload the LCP hero image -->
<link
  rel="preload"
  as="image"
  href="https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=1100&fit=crop"
  fetchpriority="high"
/>
```

---

## Fix 4 — Route-level code splitting

**File:** `apps/client/src/App.tsx`

All 15 pages are statically imported so every visitor downloads dashboard, admin, and analytics code even on the landing page. Code splitting with `React.lazy` loads each page only when navigated to.

Replace the static import block at the top of `App.tsx`:

```tsx
import { lazy, Suspense } from "react"
import { Navigate, Route, Routes } from "react-router-dom"
import { ScrollToTop } from "@/components/ScrollToTop"
import { AppShell } from "@/components/layout/AppShell"
import { ProtectedRoute } from "@/auth/ProtectedRoute"
import { AdminRoute } from "@/auth/AdminRoute"

const LandingPage      = lazy(() => import("@/pages/LandingPage").then(m => ({ default: m.LandingPage })))
const LoginPage        = lazy(() => import("@/pages/LoginPage").then(m => ({ default: m.LoginPage })))
const RegisterPage     = lazy(() => import("@/pages/RegisterPage").then(m => ({ default: m.RegisterPage })))
const AboutPage        = lazy(() => import("@/pages/AboutPage").then(m => ({ default: m.AboutPage })))
const PrivacyPage      = lazy(() => import("@/pages/PrivacyPage").then(m => ({ default: m.PrivacyPage })))
const TermsPage        = lazy(() => import("@/pages/TermsPage").then(m => ({ default: m.TermsPage })))
const DashboardPage    = lazy(() => import("@/pages/DashboardPage").then(m => ({ default: m.DashboardPage })))
const CollectionsPage  = lazy(() => import("@/pages/CollectionsPage").then(m => ({ default: m.CollectionsPage })))
const CreateEventPage  = lazy(() => import("@/pages/CreateEventPage").then(m => ({ default: m.CreateEventPage })))
const EventGalleryPage = lazy(() => import("@/pages/EventGalleryPage").then(m => ({ default: m.EventGalleryPage })))
const QrInvitePage     = lazy(() => import("@/pages/QrInvitePage").then(m => ({ default: m.QrInvitePage })))
const SharedPage       = lazy(() => import("@/pages/SharedPage").then(m => ({ default: m.SharedPage })))
const AnalyticsPage    = lazy(() => import("@/pages/AnalyticsPage").then(m => ({ default: m.AnalyticsPage })))
const ArchivePage      = lazy(() => import("@/pages/ArchivePage").then(m => ({ default: m.ArchivePage })))
const ProfilePage      = lazy(() => import("@/pages/ProfilePage").then(m => ({ default: m.ProfilePage })))
const UsersPage        = lazy(() => import("@/pages/UsersPage").then(m => ({ default: m.UsersPage })))
```

Wrap the `<Routes>` block with `<Suspense>`:

```tsx
export const App = () => {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<div className="min-h-screen bg-background" />}>
        <Routes>
          {/* routes unchanged */}
        </Routes>
      </Suspense>
    </>
  )
}
```

Verify after: `pnpm --filter @camshare/client typecheck` should pass. In the Network tab, each page navigation should load a separate small JS chunk instead of one large file.

---

## Fix 5 — Lazy-load below-fold images

**File:** `apps/client/src/pages/LandingPage.tsx`

Add `loading="lazy"` to the use-cases grid images (the 5 Unsplash photos in the bottom section). Also add explicit `width` and `height` to avoid layout shift (CLS).

Find the use-cases `map` block and update each `<img>`:

```tsx
<img
  src={uc.image}
  alt={uc.label}
  loading="lazy"
  width={900}
  height={1200}
  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
/>
```

Add `fetchPriority="high"` to the hero image (phone mockup, above the fold) so the browser prioritizes it:

```tsx
<img
  src="https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=1100&fit=crop"
  alt="Event gallery preview"
  fetchPriority="high"
  width={600}
  height={1100}
  className="w-full h-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-110"
/>
```

---

## Fix 6 — Vendor chunk splitting in Vite

**File:** `apps/client/vite.config.ts`

Currently the entire app (React, router, socket.io, etc.) is in one bundle. Any code change invalidates the whole cache. Splitting vendor libraries into separate chunks means users cache React and friends across deploys.

```ts
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "node:path"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react":  ["react", "react-dom"],
          "vendor-router": ["react-router-dom"],
          "vendor-query":  ["@tanstack/react-query"],
          "vendor-socket": ["socket.io-client"],
          "vendor-misc":   ["zustand", "clsx", "tailwind-merge"],
        },
      },
    },
  },
})
```

Verify:

```bash
pnpm --filter @camshare/client build
ls -lh apps/client/dist/assets/
# Should see separate vendor-react-*.js, vendor-router-*.js, etc.
```

---

## Verification

```bash
# Full build
pnpm --filter @camshare/client build

# Preview production build
pnpm --filter @camshare/client preview
# Open http://localhost:4173

# Run Lighthouse in Chrome DevTools on http://localhost:4173
# Targets: Performance > 80 mobile, > 95 desktop
# LCP < 2.5s | TBT < 200ms | CLS < 0.1
```

After deploying, re-run PageSpeed Insights on `https://camshare.uplisoft.com`.
