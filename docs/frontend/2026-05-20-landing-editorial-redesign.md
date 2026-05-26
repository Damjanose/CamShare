# Landing Page Editorial Redesign

**Date:** 2026-05-20  
**Plan:** [superpowers/plans/2026-05-20-landing-editorial-redesign.md](../superpowers/plans/2026-05-20-landing-editorial-redesign.md)

## What changed
Gave Overview, Features, and Showcase sections a bold editorial identity (gold label chips, bold headings, gold dividers, redesigned feature grid, dark mockup header). Fixed missing scroll-to-top on route changes.

## Files modified
| File | Change |
|------|--------|
| `apps/client/src/components/ScrollToTop.tsx` | New — scroll-to-top utility on route change using `useLocation` |
| `apps/client/src/App.tsx` | Mounted `<ScrollToTop />` above `<Routes>` |
| `apps/client/src/pages/LandingPage.tsx` | Hero, Features, Showcase sections redesigned |

## Gotchas / non-obvious decisions
- Uses custom Tailwind tokens: `text-champagne-gold`, `bg-champagne-gold`, `text-on-surface-variant`
- Uses `GlassPanel` component and `Icon` component with Material Symbols names
- `MarketingShell.tsx` not modified — Overview nav link stays as `to="/"`
- Scroll-to-top needed because React Router v7 doesn't scroll automatically on navigation
