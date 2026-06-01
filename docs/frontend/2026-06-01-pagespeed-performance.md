# PageSpeed Performance Fixes

**Date:** 2026-06-01  
**Plan:** [pagespeed-performance-fixes.md](../pagespeed-performance-fixes.md)

## What changed

Six targeted fixes to improve PageSpeed Insights scores: compressed oversized images, removed a render-blocking script, added preconnect/preload hints, split the single 444 KB JS bundle into per-route chunks, and added lazy loading to below-fold images.

## Files modified

| File | Change |
|------|--------|
| `apps/client/public/favicon.png` | Compressed 1.3 MB → 1.8 KB (resized to 32×32 with `sips`) |
| `apps/client/public/logo.png` | Compressed 1.3 MB → 169 KB (`sips -Z 400`) |
| `apps/client/src/assets/camshare-logo.png` | Compressed 1.3 MB → 173 KB — this is the logo imported by layout components |
| `apps/client/index.html` | Removed blocking Apple Auth `<script>` tag; added `preconnect` for Google Fonts, `dns-prefetch` for Unsplash, and `preload` for the hero LCP image |
| `apps/client/src/App.tsx` | All 15 static page imports replaced with `React.lazy()` + dynamic imports; `<Routes>` wrapped in `<Suspense>` |
| `apps/client/src/pages/LandingPage.tsx` | Hero `<img>` gets `fetchPriority="high"` + dimensions; showcase grid and use-cases images get `loading="lazy"` + dimensions |
| `apps/client/vite.config.ts` | Added `build.rollupOptions.output.manualChunks` (function form) splitting React, router, TanStack Query, socket.io, and misc libs into separate vendor chunks |

## Bundle size before / after

| Metric | Before | After |
|--------|--------|-------|
| Main JS entry | 444 KB (all routes + vendors) | 21.8 KB |
| vendor-react | bundled in main | 192 KB (separate, cacheable) |
| vendor-router | bundled in main | 37 KB separate |
| vendor-query | bundled in main | 34 KB separate |
| Each page | all loaded upfront | 2–14 KB on demand |
| favicon | 1.3 MB | 1.8 KB |
| logo (src/assets) | 1.3 MB | 173 KB |

## Gotchas / non-obvious decisions

- There are **two logo files**: `public/logo.png` (served as a static file) and `src/assets/camshare-logo.png` (imported by `TopBar`, `MarketingShell`, `AuthShell`). Both needed compressing independently.
- Apple login is stubbed out — removing the Apple CDN script entirely is safe. If re-enabled later, load it with `defer`.
- `React.lazy()` requires a **default export**. Since pages use named exports (`export const LandingPage = ...`), each lazy import needs `.then(m => ({ default: m.PageName }))`.
- `manualChunks` must use the **function form** in Vite 7 (not the object form) to correctly match node_modules paths. The object form produced empty 0-byte chunks for `vendor-react` and `vendor-socket`.
- `fetchPriority="high"` on the hero `<img>` matches the `<link rel="preload">` in index.html — both point to the same Unsplash URL so the browser reuses the preloaded response.
