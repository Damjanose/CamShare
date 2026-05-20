# Landing Page Editorial Redesign + Scroll-to-Top

**Date:** 2026-05-20  
**Scope:** `apps/client/src/pages/LandingPage.tsx`, `apps/client/src/components/layout/MarketingShell.tsx`, `apps/client/src/App.tsx`, new `apps/client/src/components/ScrollToTop.tsx`

---

## Goals

1. Give the Overview, Features, and Showcase nav sections a strong editorial identity — bold typography, gold label chips, gold dividers, and clear visual hierarchy.
2. Fix the missing scroll-to-top behavior so every route change starts at the top of the page.

---

## Decisions Made

| Question | Decision |
|---|---|
| Redesign direction | Full editorial (bold type, gold accents, higher visual impact) |
| Color tone | Light background (cream/white) — no dark sections |
| Overview = ? | Hero IS the overview — no separate section needed |
| Features layout | Hero card (QR Access, dark) left + 5-card supporting grid right |
| Showcase layout | Keep split 2-column, go bolder text + gold details |

---

## 1. Scroll-to-Top

**New file:** `apps/client/src/components/ScrollToTop.tsx`

- Uses `useEffect` + `useLocation` from `react-router-dom`
- On every location change, scroll to top **only when there is no hash** in the new location (i.e. `location.hash === ''`). Hash-anchor navigation (e.g. `/#features`, `/#showcase`) must be left to the browser's native scroll-to-anchor behavior — ScrollToTop must not override it.
- Calls `window.scrollTo({ top: 0, behavior: 'instant' })` when the condition above is met.
- Renders `null`.

**Mount point:** Inside `<App>` above `<Routes>` (App.tsx).

**Nav link coexistence:** The Overview nav link stays as `to="/"` (not `/#overview`). Clicking it navigates to the root route; ScrollToTop fires and resets to the top, which is where the hero lives. Features and Showcase links (`to="/#features"`, `to="/#showcase"`) contain a hash, so ScrollToTop skips them and the browser scrolls to the element with that id.

---

## 2. Hero / Overview Section

**Changes to the hero `<section>` in LandingPage.tsx:**

- Keep `id` absent (the hero is always at the top; no anchor needed since Overview uses `/`)
- Insert a label chip above the `<h1>`:
  ```
  ● THE PLATFORM
  ```
  Styled: `text-[10px] tracking-[4px] uppercase text-champagne-gold font-label-md block mb-4`
- Keep the existing headline copy; the italic gold span on "one shared album." stays
- Add a stat row below the CTA button group — three stat cards in a flex row:

  | Stat | Label |
  |---|---|
  | 500+ | Events hosted |
  | 12k+ | Photos shared |
  | ∞ | Memories made |

  Container: `flex flex-wrap gap-4 mt-8`  
  Each card: `bg-white border border-outline-variant/30 rounded-xl px-6 py-3 text-center`  
  Stat number: `font-bold text-2xl text-champagne-gold block`  
  Stat label: `text-xs text-on-surface-variant`

  On mobile (`< md`), the stat row wraps naturally due to `flex-wrap`.

**Nav link in MarketingShell.tsx stays as `{ to: "/", label: "Overview" }`** — no change needed (ScrollToTop handles the scroll).

---

## 3. Features Section

**Changes to the `#features` section in LandingPage.tsx:**

### Section header (new, above the grid)

```
● FEATURES                          ← gold label chip (same style as hero chip)
Built for moments that matter.      ← bold H2 (font-display-lg text-display-lg)
<div aria-hidden="true" />          ← 40px × 4px gold divider bar, rounded-full, mx-auto or left-aligned, mb-12
```

### Grid restructure

Replace the current `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` uniform grid with:

```
grid grid-cols-1 md:grid-cols-2 gap-8
```

**Left column — Hero card** (`md:row-span-3`, full height of the right 2×3 grid):
- Background: `bg-[#1a1a1a]` — not a GlassPanel
- Feature: **QR-Based Access**
- Layout inside: `flex flex-col justify-between h-full p-10`
- Icon: `text-6xl text-champagne-gold mb-6`
- Title: `font-headline-lg text-headline-lg text-white mb-4`
- Body: `text-on-surface-variant text-base leading-relaxed` (on dark bg use `text-gray-300`)
- Gold pill badge at bottom: `inline-block bg-champagne-gold text-black text-xs font-bold px-4 py-1.5 rounded-full mt-8`; text: "Core feature"
- Border radius: `rounded-[2rem]`
- Minimum height on mobile: `min-h-[320px]`; on md+ height is determined by the row-span

**Right column — 2-column sub-grid of 5 supporting cards** (`grid grid-cols-2 gap-8`):

Order and treatment:
1. Private Albums — `GlassPanel p-6 rounded-[2rem]`
2. Real-time Uploads — `GlassPanel p-6 rounded-[2rem]`
3. Video Support — `GlassPanel p-6 rounded-[2rem]`
4. Admin Control — `GlassPanel p-6 rounded-[2rem]`
5. Beautiful Gallery — `col-span-2 p-6 rounded-[2rem] bg-gradient-to-br from-champagne-gold to-yellow-600` (spans full width of the right sub-grid; white text + white icon)

Each card retains: icon (`text-3xl mb-4`), title (`font-headline-md text-headline-md mb-2`), body (`text-on-surface-variant text-sm`). Beautiful Gallery card uses `text-white` for all text.

**Mobile:** On screens `< md`, the outer grid collapses to 1 column (hero card full width, then sub-grid below). The sub-grid stays `grid-cols-2` at all breakpoints.

---

## 4. Showcase Section

**Changes to the `#showcase` section in LandingPage.tsx:**

### Left column — text

- Insert gold label chip `● SHOWCASE` above the headline (same chip style as other sections; `block mb-4`)
- Headline keep existing copy, wrap the last word in italic gold:
  ```jsx
  Feel the pulse of your{" "}
  <span className="text-champagne-gold italic">celebration.</span>
  ```
- Add 40px gold divider bar below the headline (`aria-hidden="true"`, `w-10 h-1 bg-champagne-gold rounded-full mb-8`)
- Change checkmark icon containers from `bg-primary/20` to `bg-champagne-gold`; change icon class to `text-white text-sm`
- Add a **third bullet** to the `ul`:
  - Title: `Live Guest Counter`
  - Body: `See exactly who's uploading in real time.`

### Right column — mockup

- The inner white `<div>` header bar: change background from white to `bg-[#1a1a1a]`
- `h5` event name (`C & J Wedding`): change `text-primary` to `text-white`
- `"Live Event Feed"` label: change `text-on-surface-variant` to `text-gray-400`
- LIVE badge: no change (already red + white)

---

## Out of Scope

- No changes to any other sections (How It Works, Use Cases, CTA)
- No changes to authenticated app pages
- No content changes to the nav or footer
- No new routes

---

## File Checklist

| File | Change |
|---|---|
| `apps/client/src/components/ScrollToTop.tsx` | Create new |
| `apps/client/src/App.tsx` | Mount `<ScrollToTop />` above `<Routes>` |
| `apps/client/src/components/layout/MarketingShell.tsx` | No change (Overview link stays as `"/"`) |
| `apps/client/src/pages/LandingPage.tsx` | All section changes above |
