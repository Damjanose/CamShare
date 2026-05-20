# Landing Page Editorial Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the Overview, Features, and Showcase sections a bold editorial identity (gold label chips, bold headings, gold dividers, redesigned feature grid, dark mockup header) and fix missing scroll-to-top on route changes.

**Architecture:** Four independent changes to `LandingPage.tsx` (sections), one new utility component (`ScrollToTop`), and one mount in `App.tsx`. All changes are additive edits — no new routes, no new dependencies.

**Tech Stack:** React 19, react-router-dom v7, Tailwind CSS (custom tokens: `text-champagne-gold`, `bg-champagne-gold`, `text-on-surface-variant`, `GlassPanel` component, `Icon` component using Material Symbols names)

**Spec:** `docs/superpowers/specs/2026-05-20-landing-editorial-redesign.md`

---

## File Map

| File | Action | What changes |
|---|---|---|
| `apps/client/src/components/ScrollToTop.tsx` | **Create** | New utility component |
| `apps/client/src/App.tsx` | **Modify** | Mount `<ScrollToTop />` above `<Routes>` |
| `apps/client/src/pages/LandingPage.tsx` | **Modify** | Hero, Features, Showcase sections |

`MarketingShell.tsx` — **no change** (Overview nav link stays as `to="/"`)

---

## Task 1: ScrollToTop component

**Files:**
- Create: `apps/client/src/components/ScrollToTop.tsx`
- Modify: `apps/client/src/App.tsx`

- [ ] **Step 1: Create `ScrollToTop.tsx`**

```tsx
// apps/client/src/components/ScrollToTop.tsx
import { useEffect } from "react"
import { useLocation } from "react-router-dom"

export const ScrollToTop = () => {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, behavior: "instant" })
    }
  }, [pathname, hash])
  return null
}
```

The component only fires when there is **no hash** in the URL. This means:
- `/dashboard` → scrolls to top ✓
- `/#features` → skips (browser scrolls to `id="features"`) ✓
- `/about` → scrolls to top ✓

- [ ] **Step 2: Mount in `App.tsx`**

Open `apps/client/src/App.tsx`. Add the import and mount the component as the first child of the fragment:

```tsx
import { Navigate, Route, Routes } from "react-router-dom"
import { ScrollToTop } from "@/components/ScrollToTop"   // ← add this line
// ...rest of existing imports unchanged

export const App = () => {
  return (
    <>
      <ScrollToTop />   {/* ← add this line */}
      <Routes>
        {/* all existing routes unchanged */}
      </Routes>
    </>
  )
}
```

- [ ] **Step 3: Typecheck**

```bash
pnpm --filter @camshare/client typecheck
```

Expected: exits with 0 errors.

- [ ] **Step 4: Verify manually**

```bash
pnpm --filter @camshare/client dev
```

Open http://localhost:5173. Scroll halfway down the landing page, then click "Sign In" to go to `/login`. Page should snap to the top. Click back — should snap to top again. Click "Features" nav link — should scroll to the Features section (not snap to top).

- [ ] **Step 5: Commit**

```bash
git add apps/client/src/components/ScrollToTop.tsx apps/client/src/App.tsx
git commit -m "feat: add ScrollToTop on route changes (skips hash anchors)"
```

---

## Task 2: Hero / Overview editorial treatment

**Files:**
- Modify: `apps/client/src/pages/LandingPage.tsx` (hero `<section>`)

- [ ] **Step 1: Add label chip above `<h1>`**

In `LandingPage.tsx`, find the hero section's `<div className="flex-1 z-10">` block. Insert the chip as the very first child, before `<h1>`:

```tsx
<div className="flex-1 z-10">
  {/* ADD THIS: */}
  <span className="block text-[10px] tracking-[4px] uppercase text-champagne-gold font-label-md mb-4">
    ● The Platform
  </span>
  {/* existing h1 unchanged */}
  <h1 className="font-display-lg text-display-lg text-on-background mb-6 leading-tight">
    ...
  </h1>
```

- [ ] **Step 2: Add stat row below the CTA button group**

Find the `<div className="flex flex-wrap gap-4">` that contains the "Create Event" and "Join Event" buttons. Add the stat row immediately after that closing `</div>`:

```tsx
  {/* existing CTA buttons div — unchanged */}
  <div className="flex flex-wrap gap-4">
    <Link to="/register" ...>Create Event</Link>
    <Button variant="ghost" size="lg">...</Button>
  </div>

  {/* ADD THIS: stat row */}
  <div className="flex flex-wrap gap-4 mt-8">
    {[
      { stat: "500+", label: "Events hosted" },
      { stat: "12k+", label: "Photos shared" },
      { stat: "∞",    label: "Memories made" },
    ].map((item) => (
      <div
        key={item.label}
        className="bg-white border border-outline-variant/30 rounded-xl px-6 py-3 text-center"
      >
        <span className="block font-bold text-2xl text-champagne-gold">{item.stat}</span>
        <span className="text-xs text-on-surface-variant">{item.label}</span>
      </div>
    ))}
  </div>
```

- [ ] **Step 3: Typecheck**

```bash
pnpm --filter @camshare/client typecheck
```

Expected: 0 errors.

- [ ] **Step 4: Verify manually**

Dev server should still be running. Hard-refresh http://localhost:5173. Check:
- "● THE PLATFORM" chip appears in gold above the headline
- Three stat cards appear below the CTA buttons: "500+", "12k+", "∞"
- On a narrow window (≤ 640px), stat cards wrap gracefully

- [ ] **Step 5: Commit**

```bash
git add apps/client/src/pages/LandingPage.tsx
git commit -m "feat(landing): add editorial label chip and stat row to hero section"
```

---

## Task 3: Features section editorial treatment

**Files:**
- Modify: `apps/client/src/pages/LandingPage.tsx` (features section)

### Background

The current Features section is a bare `grid-cols-3` of 6 identical `GlassPanel` cards mapped from the `features` array. The redesign splits this into:
- A hero dark card (QR Access, hardcoded) on the left
- A 2-column sub-grid of the remaining 5 features on the right
- Beautiful Gallery spans both columns of the sub-grid (gold gradient)

The `features` constant at the top of the file will be reduced from 6 to 5 items (QR Access is pulled out into its own card). Beautiful Gallery stays in the array but its card renders differently.

- [ ] **Step 1: Update the `features` constant**

At the top of `LandingPage.tsx`, remove the QR Access entry from the `features` array. The array should now have 5 items in this order:

```tsx
const features = [
  {
    icon: "lock",
    title: "Private Albums",
    body: "Your content is secure. Control who sees and contributes with custom privacy settings.",
  },
  {
    icon: "sync",
    title: "Real-time Uploads",
    body: "Experience the event through every eye. Photos appear instantly in the live feed.",
  },
  {
    icon: "video_library",
    title: "Video Support",
    body: "Not just photos. Capture the laughter and music with high-quality video uploads.",
  },
  {
    icon: "shield_person",
    title: "Admin Control",
    body: "Moderate submissions and set upload caps to ensure a high-quality curation.",
  },
  {
    icon: "grid_view",
    title: "Beautiful Gallery",
    body: "A responsive masonry layout that makes every captured moment look editorial.",
  },
]
```

- [ ] **Step 2: Replace the Features `<section>` with the new layout**

Replace the entire `{/* FEATURES */}` section (from `<section id="features"` to its closing `</section>`) with:

```tsx
{/* FEATURES */}
<section id="features" className="px-margin-mobile md:px-margin-desktop py-24">
  {/* Section header */}
  <div className="text-center mb-16">
    <span className="block text-[10px] tracking-[4px] uppercase text-champagne-gold font-label-md mb-4">
      ● Features
    </span>
    <h2 className="font-display-lg text-display-lg text-on-background mb-6">
      Built for moments that matter.
    </h2>
    <div aria-hidden="true" className="w-10 h-1 bg-champagne-gold rounded-full mx-auto" />
  </div>

  {/* Asymmetric grid: hero card left + supporting sub-grid right */}
  <div className="flex flex-col md:flex-row gap-8 md:items-stretch">
    {/* Hero card — QR-Based Access */}
    <div className="md:w-1/2 bg-[#1a1a1a] rounded-[2rem] p-10 flex flex-col justify-between min-h-[320px]">
      <div>
        <Icon name="bolt" className="text-champagne-gold mb-6 block text-6xl" />
        <h4 className="font-headline-lg text-headline-lg text-white mb-4">
          QR-Based Access
        </h4>
        <p className="text-gray-300 text-base leading-relaxed">
          No apps to download. No accounts to create. Just a simple scan to start the magic.
        </p>
      </div>
      <span className="inline-block bg-champagne-gold text-black text-xs font-bold px-4 py-1.5 rounded-full mt-8 self-start">
        Core feature
      </span>
    </div>

    {/* Supporting sub-grid — 5 cards in 2 columns */}
    <div className="md:w-1/2 grid grid-cols-2 gap-8">
      {features.slice(0, 4).map((feature) => (
        <GlassPanel
          key={feature.title}
          className="p-6 rounded-[2rem] hover:shadow-2xl transition-all duration-500"
        >
          <Icon name={feature.icon} className="text-primary mb-4 block text-3xl" />
          <h4 className="font-headline-md text-headline-md mb-2">{feature.title}</h4>
          <p className="text-on-surface-variant text-sm">{feature.body}</p>
        </GlassPanel>
      ))}
      {/* Beautiful Gallery — gold gradient, full width */}
      <div className="col-span-2 bg-gradient-to-br from-champagne-gold to-yellow-600 rounded-[2rem] p-6 hover:shadow-2xl transition-all duration-500">
        <Icon name={features[4].icon} className="text-white mb-4 block text-3xl" />
        <h4 className="font-headline-md text-headline-md mb-2 text-white">
          {features[4].title}
        </h4>
        <p className="text-white/80 text-sm">{features[4].body}</p>
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 3: Typecheck**

```bash
pnpm --filter @camshare/client typecheck
```

Expected: 0 errors.

- [ ] **Step 4: Verify manually**

Refresh http://localhost:5173. Click the "Features" nav link. Check:
- "● FEATURES" chip and bold H2 heading appear above the grid
- Gold divider bar below the heading
- Left: tall dark card with gold bolt icon, white text, "Core feature" gold pill
- Right: 2×2 grid of glass cards (Private Albums, Real-time Uploads, Video Support, Admin Control) + Beautiful Gallery spanning full width at bottom in gold gradient
- On mobile (< 768px): hero card stacks above the sub-grid, full width

- [ ] **Step 5: Commit**

```bash
git add apps/client/src/pages/LandingPage.tsx
git commit -m "feat(landing): editorial redesign of Features section with hero card grid"
```

---

## Task 4: Showcase section editorial treatment

**Files:**
- Modify: `apps/client/src/pages/LandingPage.tsx` (showcase section)

- [ ] **Step 1: Update the Showcase left column**

Find the `{/* SHOWCASE */}` section. In the left column (`<div className="w-full lg:w-3/5">`), make these changes:

**a) Add label chip above the `<h2>`:**
```tsx
<span className="block text-[10px] tracking-[4px] uppercase text-champagne-gold font-label-md mb-4">
  ● Showcase
</span>
```

**b) Update the `<h2>` to add italic gold on "celebration.":**
```tsx
<h2 className="font-display-lg text-display-lg mb-6 leading-tight">
  Feel the pulse of your{" "}
  <span className="text-champagne-gold italic">celebration.</span>
</h2>
```

**c) Add gold divider bar after the `<h2>` (before `<p>`):**
```tsx
<div aria-hidden="true" className="w-10 h-1 bg-champagne-gold rounded-full mb-8" />
```

**d) Update checkmark icon containers — change `bg-primary/20` to `bg-champagne-gold` and icon to white:**
```tsx
<div className="w-6 h-6 rounded-full bg-champagne-gold flex items-center justify-center flex-shrink-0 mt-1">
  <Icon name="check" className="text-white text-sm" />
</div>
```

**e) Add a third bullet to the `ul` array:**
```tsx
{
  title: "Live Guest Counter",
  body: "See exactly who's uploading in real time.",
},
```

After all edits the left column `<ul>` array should be:
```tsx
{[
  {
    title: "Instant Masonry Layout",
    body: "Photos of all sizes fit perfectly in our elegant grid.",
  },
  {
    title: "Seamless Transitions",
    body: "Smooth animations that feel like high-end editorial software.",
  },
  {
    title: "Live Guest Counter",
    body: "See exactly who's uploading in real time.",
  },
].map((item) => (
  <li key={item.title} className="flex items-start gap-4">
    <div className="w-6 h-6 rounded-full bg-champagne-gold flex items-center justify-center flex-shrink-0 mt-1">
      <Icon name="check" className="text-white text-sm" />
    </div>
    <div>
      <p className="font-bold">{item.title}</p>
      <p className="text-on-surface-variant">{item.body}</p>
    </div>
  </li>
))}
```

- [ ] **Step 2: Update the mockup header bar (right column)**

In the right column mockup, find the inner white `<div>` that contains the event title header. Change its background to dark:

**Before:**
```tsx
<div className="p-8 border-b border-outline-variant/10 flex justify-between items-center">
  <div>
    <h5 className="font-headline-md text-headline-md text-primary">
      C &amp; J Wedding
    </h5>
    <p className="text-xs font-label-md uppercase text-on-surface-variant">
      Live Event Feed
    </p>
  </div>
  <span className="bg-red-500 text-white ...">LIVE</span>
</div>
```

**After:**
```tsx
<div className="bg-[#1a1a1a] p-8 border-b border-white/10 flex justify-between items-center">
  <div>
    <h5 className="font-headline-md text-headline-md text-white">
      C &amp; J Wedding
    </h5>
    <p className="text-xs font-label-md uppercase text-gray-400">
      Live Event Feed
    </p>
  </div>
  <span className="bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-full animate-pulse">
    LIVE
  </span>
</div>
```

- [ ] **Step 3: Typecheck**

```bash
pnpm --filter @camshare/client typecheck
```

Expected: 0 errors.

- [ ] **Step 4: Verify manually**

Refresh http://localhost:5173. Click "Showcase" nav link. Check:
- "● SHOWCASE" gold chip above headline
- "celebration." rendered in italic gold
- Gold divider bar below headline
- Three checkmarks now gold-filled with white tick
- Third bullet "Live Guest Counter" appears
- Mockup card has a dark `#1a1a1a` header bar with white event name and gray subtitle
- LIVE badge unchanged (red + white)

- [ ] **Step 5: Commit**

```bash
git add apps/client/src/pages/LandingPage.tsx
git commit -m "feat(landing): editorial redesign of Showcase section"
```

---

## Done

All four tasks complete. The landing page now has:
- Scroll-to-top on every route change (hash anchors unaffected)
- Hero with "● The Platform" chip and three stat cards
- Features with section header + asymmetric hero/grid layout
- Showcase with gold accents, dark mockup header, and third bullet

Run a final check before wrapping:
```bash
pnpm --filter @camshare/client typecheck
pnpm --filter @camshare/client build
```

Both should exit cleanly.
