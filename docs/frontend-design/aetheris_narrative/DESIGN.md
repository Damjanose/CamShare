---
name: Aetheris Narrative
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1b1c1c'
  on-surface-variant: '#4d4635'
  inverse-surface: '#303030'
  inverse-on-surface: '#f3f0ef'
  outline: '#7f7663'
  outline-variant: '#d0c5af'
  surface-tint: '#735c00'
  primary: '#735c00'
  on-primary: '#ffffff'
  primary-container: '#d4af37'
  on-primary-container: '#554300'
  inverse-primary: '#e9c349'
  secondary: '#655497'
  on-secondary: '#ffffff'
  secondary-container: '#c7b3ff'
  on-secondary-container: '#534284'
  tertiary: '#815152'
  on-tertiary: '#ffffff'
  tertiary-container: '#dfa4a4'
  on-tertiary-container: '#64393a'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffe088'
  primary-fixed-dim: '#e9c349'
  on-primary-fixed: '#241a00'
  on-primary-fixed-variant: '#574500'
  secondary-fixed: '#e8ddff'
  secondary-fixed-dim: '#cebdff'
  on-secondary-fixed: '#200b50'
  on-secondary-fixed-variant: '#4c3c7e'
  tertiary-fixed: '#ffdad9'
  tertiary-fixed-dim: '#f5b7b7'
  on-tertiary-fixed: '#331012'
  on-tertiary-fixed-variant: '#663a3b'
  background: '#fcf9f8'
  on-background: '#1b1c1c'
  surface-variant: '#e5e2e1'
  champagne-gold: '#D4AF37'
  soft-amethyst: '#8E7CC3'
  faded-rose: '#E5A9A9'
  canvas-white: '#FAF9F6'
  surface-glass: rgba(255, 255, 255, 0.7)
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  headline-md:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
  container-max: 1440px
---

## Brand & Style

This design system is crafted for a premium event memory platform, focusing on the emotional resonance of shared experiences. The brand personality is sophisticated, nostalgic, and curation-focused, blending the functional clarity of professional SaaS with the visual richness of a digital gallery.

The aesthetic utilizes **Glassmorphism** and **Minimalism** to create a sense of depth and lightness. Interfaces are treated as "stages" for content, where media is the primary protagonist. High-end editorial influences drive the layout, ensuring that every user interaction feels like flipping through a high-quality physical album. The atmosphere is one of calm luxury—clean, spacious, and evocative.

## Colors

The palette is anchored in a "Warm Luxury" theme. The primary **Champagne Gold** is used sparingly for high-impact accents, call-to-actions, and premium indicators. **Soft Amethyst** and **Faded Rose** provide emotional depth, used for secondary interactive elements and decorative highlights within memory clusters.

The background uses **Canvas White**, a slightly warm off-white that reduces eye strain and feels more organic than pure white. In dark mode, the palette shifts to a deep charcoal base with lowered saturation on the accent colors to maintain an elegant, atmospheric glow. Glassmorphic surfaces should use the `surface-glass` token with a significant backdrop blur to create a layered, translucent effect.

## Typography

This design system employs a classic high-contrast pairing. **Playfair Display** handles all serif headlines, providing an editorial, "coffee-table book" feel that emphasizes the platform's emotional value. **Inter** is used for all functional UI elements, data density, and body copy to ensure maximum legibility and a modern SaaS feel.

Headlines should utilize slightly tighter letter spacing to maintain a sophisticated silhouette. Labels are set in uppercase with increased tracking to create a sense of professional organization and hierarchy.

## Layout & Spacing

The layout follows a **Fluid Grid** philosophy with generous white space to allow media to breathe. A 12-column system is used for the main dashboard, but components often sit within a centered container to maintain an intimate feel.

Margins are intentionally large on desktop (64px) to emphasize the premium nature of the content. Spacing between sections follows an 8px base unit, but preference is given to larger gaps (48px+) to separate distinct "memories" or data modules. Gallery layouts should mimic a masonry style, allowing for varied aspect ratios that prioritize the visual integrity of uploaded photography.

## Elevation & Depth

Depth is conveyed through **Glassmorphism** and **Ambient Shadows**. Instead of traditional solid shadows, this design system uses long, soft, low-opacity shadows with a subtle tint of the primary Champagne Gold or Soft Amethyst to create a "glow" rather than a dark void.

1.  **Base Layer:** Canvas White background.
2.  **Surface Layer:** Translucent panels with 20px-40px backdrop-blur. Use a 1px border with 10% white opacity to define edges.
3.  **Floating Layer:** High-elevation components (modals, active cards) use a double shadow—one tight, neutral shadow for definition and one large, diffused, tinted shadow for atmosphere.

## Shapes

The shape language is **Rounded**, avoiding the harshness of sharp corners to maintain an approachable and soft aesthetic. Standard interface elements (inputs, buttons) use a 0.5rem (8px) radius. Larger containers and media cards utilize a more pronounced 1rem (16px) radius to create a "container" feel that mimics physical photo frames. Interactive chips and status badges use a full pill-shape for distinct contrast against rectangular content blocks.

## Components

### Buttons
Primary buttons are solid Champagne Gold with white text. Secondary buttons use a glassmorphic style with a subtle Amethyst border. All buttons have a soft hover transition that increases the shadow diffusion.

### Cards
Cards are the primary vehicle for content. They feature no visible border, instead relying on the glassmorphic background and a soft ambient shadow. Images within cards should always use `object-fit: cover` and maintain the container's roundedness.

### Input Fields
Inputs are minimal, featuring only a bottom border that transitions from a soft gray to Champagne Gold upon focus. Labels float above the field in the uppercase Inter font style.

### Gallery Masonry
The platform's core is a Pinterest-inspired masonry grid. Spacing between items is a consistent 24px. On hover, gallery items should subtly scale up (1.02x) and increase their shadow depth to indicate interactivity.

### Navigation
The sidebar or top navigation remains semi-transparent and blurred at all times, "floating" over the content as the user scrolls, maintaining the feeling of depth and continuity.