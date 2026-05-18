---
name: Cinematic Keepsake
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#d0c5af'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#99907c'
  outline-variant: '#4d4635'
  surface-tint: '#e9c349'
  primary: '#f2ca50'
  on-primary: '#3c2f00'
  primary-container: '#d4af37'
  on-primary-container: '#554300'
  inverse-primary: '#735c00'
  secondary: '#d3bcfc'
  on-secondary: '#38265b'
  secondary-container: '#523f76'
  on-secondary-container: '#c4aeed'
  tertiary: '#ffbcd0'
  on-tertiary: '#5c1333'
  tertiary-container: '#fa94b6'
  on-tertiary-container: '#772948'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffe088'
  primary-fixed-dim: '#e9c349'
  on-primary-fixed: '#241a00'
  on-primary-fixed-variant: '#574500'
  secondary-fixed: '#ebdcff'
  secondary-fixed-dim: '#d3bcfc'
  on-secondary-fixed: '#230f45'
  on-secondary-fixed-variant: '#503d73'
  tertiary-fixed: '#ffd9e2'
  tertiary-fixed-dim: '#ffb0c9'
  on-tertiary-fixed: '#3e001e'
  on-tertiary-fixed-variant: '#792b4a'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  headline-xl:
    fontFamily: Playfair Display
    fontSize: 42px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.3'
  body-lg:
    fontFamily: DM Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: DM Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: DM Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: DM Sans
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: 0.1em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  margin-main: 1.5rem
  gutter: 1rem
  stack-lg: 2.5rem
  stack-md: 1.5rem
  stack-sm: 0.75rem
---

## Brand & Style

The design system is centered on "Immersive Nostalgia." It bridges the gap between a high-end fashion editorial and a private digital sanctuary. The goal is to make every user-uploaded photo feel like a curated piece of art. 

The aesthetic leverages **Glassmorphism** and **Minimalism** to ensure the interface never competes with the user's memories. By using translucent layers and refined typography, the UI recedes into the background, acting as a sophisticated frame for life's most meaningful moments. The emotional response should be one of warmth, exclusivity, and quiet reflection—evoking the feeling of flipping through a luxury linen-bound photo book under soft lighting.

## Colors

The palette is anchored in a **Deep Elegant Dark** mode to provide a high-contrast stage for colorful event photography. 

- **Champagne Gold (#D4AF37):** Used sparingly for high-value interactions, borders of featured memories, and premium iconography.
- **Soft Purple & Rose Pink:** These are utilized for soft background gradients and "aura" glows behind glass containers to provide emotional depth and a sense of "dreaminess."
- **Warm White (#F9F9F9):** Reserved for primary text and high-contrast iconography to ensure legibility against dark backgrounds.
- **Surface Strategy:** Use varying opacities of the neutral dark (80-90%) mixed with background blurs to create the glass effect.

## Typography

This design system employs a classic high-contrast pairing. **Playfair Display** provides an editorial, authoritative serif voice for headlines, titles of events, and dates. It should be typeset with tight letter-spacing for a modern "Vogue-esque" feel.

**DM Sans** acts as the functional workhorse. It was chosen for its geometric clarity and understated nature, ensuring that secondary information—like location data, timestamps, and captions—is effortlessly readable without distracting from the visual media. 

Use **Label-SM** for metadata (e.g., "SHOT ON IPHONE" or "PARIS, FR") to evoke the feeling of a gallery placard.

## Layout & Spacing

The layout philosophy is **Media-First**. The grid is a flexible 4-column system for mobile, but the content often ignores strict column constraints to allow for "Full Bleed" immersive imagery.

- **Margins:** A generous 24px (1.5rem) side margin is standard to provide breathing room and a premium "white space" feel, even in dark mode.
- **Vertical Rhythm:** Use larger gaps (Stack-LG) between different event clusters and smaller gaps (Stack-SM) for related metadata.
- **Aspect Ratios:** Standardize on 4:5 (Portrait) and 9:16 (Full Screen) to maximize mobile screen real estate and mimic high-end social storytelling formats.

## Elevation & Depth

Depth in this system is achieved through **Glassmorphism** and **Luminous Layering** rather than traditional heavy shadows.

1.  **Base Layer:** The Deep Dark (#121212) floor.
2.  **Atmospheric Layer:** Soft, low-opacity radial gradients of Rose Pink and Soft Purple that move or "breathe" slightly behind content.
3.  **Surface Layer:** Translucent containers (White at 10% opacity) with a 20px - 40px Backdrop Blur.
4.  **Accents:** 1px "Inner Glow" borders on the top and left edges of cards using a low-opacity Champagne Gold to simulate light catching the edge of glass.
5.  **Shadows:** Use only "Ambient Shadows"—extremely diffused (30px+ blur), low-opacity (15%) black shadows to lift glass cards off the atmospheric layer.

## Shapes

The shape language is ultra-soft and organic. A high roundedness level is essential to counteract the "coldness" of a dark, technical UI. 

- **Primary Cards:** Use a minimum of 24px corner radius.
- **Buttons & Chips:** Use fully pill-shaped (rounded-full) geometry to create a tactile, friendly interaction point.
- **Images:** All media should inherit the container's roundedness. Sharp corners are strictly prohibited as they break the "soft luxury" narrative.

## Components

### Buttons
Primary buttons are pill-shaped with a Champagne Gold to Rose Pink linear gradient. Text is centered DM Sans Bold in the Neutral Dark color for maximum contrast. Secondary buttons are "Glass Ghost" style: a simple frosted blur with a 1px Gold border.

### Media Cards
The cornerstone of the system. Cards feature a 4:5 aspect ratio with a subtle 1px top-down gradient overlay to ensure white text (Event Name) is legible at the bottom. The "Glass" treatment is applied to a small metadata tag sitting in the top-right corner (e.g., the year or weather).

### Navigation
The bottom navigation bar is a floating glass dock, detached from the screen edges, with a heavy backdrop blur. Active states are indicated by a small Champagne Gold dot beneath the icon.

### Input Fields
Inputs are minimalist: a single 1px Gold bottom-border that glows slightly when focused. Labels float above in Label-SM style.

### Interaction Chips
Used for event tags (e.g., "Wedding," "Summer '23"). These are semi-transparent purple or pink blurs with white text, providing a splash of color without overwhelming the image.