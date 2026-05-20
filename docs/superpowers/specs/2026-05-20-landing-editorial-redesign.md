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
- On every location change calls `window.scrollTo({ top: 0, behavior: 'instant' })`
- Renders `null`

**Mount point:** Inside `<App>` above `<Routes>` (App.tsx).

---

## 2. Hero / Overview Section

**Changes to the hero `<section>` in LandingPage.tsx:**

- Add `id="overview"` to the section element
- Insert a label chip above the `<h1>`:
  ```
  ● THE PLATFORM
  ```
  Styled: `text-[10px] tracking-[4px] uppercase text-champagne-gold font-label-md`
- Keep the existing headline copy; the italic gold span on "one shared album." stays
- Add a stat row below the CTA button group — three stat cards in a flex row:
  | Stat | Label |
  |---|---|
  | 500+ | Events hosted |
  | 12k+ | Photos shared |
  | ∞ | Memories made |
  Each card: `bg-white border border-outline-variant/30 rounded-xl px-6 py-3 text-center`

**Nav link update in MarketingShell.tsx:**  
Change `{ to: "/", label: "Overview" }` → `{ to: "/#overview", label: "Overview" }`

---

## 3. Features Section

**Changes to the `#features` section in LandingPage.tsx:**

### Section header (new, above the grid)
```
● FEATURES                          ← gold label chip
Built for moments that matter.      ← bold H2
──────────────────────────          ← 40px gold divider bar
```

### Grid restructure
Replace the current 3-column uniform grid with a 2-column asymmetric layout:

- **Left column** — Hero card (full height, `row-span-2` or `grid-row: span 3`):
  - Background: `bg-[#1a1a1a]` (dark)
  - Feature: **QR-Based Access** (the core differentiator)
  - Large icon (text-5xl), bold white title, white body copy, gold "Key feature" pill badge
  - Padding: `p-10`

- **Right column** — 2×3 sub-grid of smaller supporting cards:
  1. Private Albums
  2. Real-time Uploads
  3. Video Support
  4. Admin Control
  5. Beautiful Gallery ← gets gold gradient background (`bg-gradient-to-br from-champagne-gold to-yellow-600 text-white`)

All cards: `rounded-[2rem]`, same border radius as existing GlassPanel usage.  
Small cards: use `GlassPanel` as now, `p-6 rounded-[2rem]`.

---

## 4. Showcase Section

**Changes to the `#showcase` section in LandingPage.tsx:**

### Left column — text
- Insert gold label chip `● SHOWCASE` above the headline
- Headline: keep copy, add italic + gold on the last word:
  ```
  Feel the pulse of your celebration.
                              ↑ italic + text-champagne-gold
  ```
- Add 40px gold divider bar below the headline
- Change checkmark icon containers from `bg-primary/20` to `bg-champagne-gold`; icon `text-white text-sm`
- Add a **third bullet**:
  - Title: `Live Guest Counter`
  - Body: `See exactly who's uploading in real time.`

### Right column — mockup
- Change the inner mockup header bar from white to `bg-[#1a1a1a]` dark
- Event name and "Live Event Feed" label switch to white text
- LIVE badge stays red + white

---

## Out of Scope

- No changes to any other sections (How It Works, Use Cases, CTA)
- No changes to authenticated app pages
- No content changes to the nav or footer beyond the Overview link href
- No new routes

---

## File Checklist

| File | Change |
|---|---|
| `apps/client/src/components/ScrollToTop.tsx` | Create new |
| `apps/client/src/App.tsx` | Mount `<ScrollToTop />` above `<Routes>` |
| `apps/client/src/components/layout/MarketingShell.tsx` | Change Overview link to `/#overview` |
| `apps/client/src/pages/LandingPage.tsx` | All section changes above |
