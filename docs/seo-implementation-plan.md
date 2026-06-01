# SEO Implementation Plan

## Context

CamShare (`https://camshare.uplisoft.com`) currently has zero SEO infrastructure. Google cannot find useful metadata when crawling the site — no meta descriptions, no Open Graph tags, no sitemap, no robots.txt, no structured data.

**Lighthouse score:** 79 (performance). The SEO tab would score low due to missing meta tags.

Public pages to optimize (the only ones Google should index):
- `/` — Landing page
- `/about` — About
- `/privacy` — Privacy Policy
- `/terms` — Terms of Service
- `/login` — Login *(mark noindex)*
- `/register` — Register *(mark noindex)*

---

## Step 1 — Install react-helmet-async

```bash
pnpm --filter @camshare/client add react-helmet-async
```

Lets each page component inject its own `<title>`, `<meta>`, and `<link>` tags into `<head>` at runtime.

---

## Step 2 — Wrap app with HelmetProvider

**File:** `apps/client/src/main.tsx`

```tsx
import { HelmetProvider } from "react-helmet-async"

// wrap <App /> with <HelmetProvider>
root.render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
)
```

---

## Step 3 — Add default meta tags to index.html

**File:** `apps/client/index.html`

Add to `<head>` as site-wide fallbacks (react-helmet-async overrides per page):

```html
<meta name="description" content="CamShare — collect memories from every event in one shared album. Create an event, share the QR code, and let everyone contribute photos." />
<meta name="robots" content="index, follow" />

<!-- Open Graph -->
<meta property="og:type" content="website" />
<meta property="og:site_name" content="CamShare" />
<meta property="og:title" content="CamShare · Capture every memory" />
<meta property="og:description" content="Collect memories from every event in one shared album." />
<meta property="og:image" content="https://camshare.uplisoft.com/og-image.png" />
<meta property="og:url" content="https://camshare.uplisoft.com" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="CamShare · Capture every memory" />
<meta name="twitter:description" content="Collect memories from every event in one shared album." />
<meta name="twitter:image" content="https://camshare.uplisoft.com/og-image.png" />
```

Also add `og-image.png` (1200×630px) to `apps/client/public/` — use the existing landing page screenshot.

---

## Step 4 — Create reusable SEOHead component

**New file:** `apps/client/src/components/SEOHead.tsx`

```tsx
import { Helmet } from "react-helmet-async"

interface SEOHeadProps {
  title: string
  description: string
  canonical?: string
  noIndex?: boolean
}

export const SEOHead = ({ title, description, canonical, noIndex }: SEOHeadProps) => (
  <Helmet>
    <title>{title}</title>
    <meta name="description" content={description} />
    {canonical && <link rel="canonical" href={canonical} />}
    {noIndex && <meta name="robots" content="noindex, nofollow" />}
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    {canonical && <meta property="og:url" content={canonical} />}
  </Helmet>
)
```

---

## Step 5 — Add SEOHead to each public page

Render `<SEOHead />` at the top of each page component's JSX:

| Page file | Title | Description | noIndex |
|-----------|-------|-------------|---------|
| `LandingPage.tsx` | `CamShare · Capture every memory` | `Create an event, share a QR code, and collect memories from everyone who attended — in one shared album.` | — |
| `AboutPage.tsx` | `About · CamShare` | `Learn how CamShare was built to make sharing event photos effortless for everyone involved.` | — |
| `PrivacyPage.tsx` | `Privacy Policy · CamShare` | `How CamShare handles your data and protects your privacy.` | — |
| `TermsPage.tsx` | `Terms of Service · CamShare` | `Terms and conditions for using CamShare.` | — |
| `LoginPage.tsx` | `Sign in · CamShare` | — | `true` |
| `RegisterPage.tsx` | `Create account · CamShare` | — | `true` |

Example usage in `LandingPage.tsx`:

```tsx
<SEOHead
  title="CamShare · Capture every memory"
  description="Create an event, share a QR code, and collect memories from everyone who attended — in one shared album."
  canonical="https://camshare.uplisoft.com"
/>
```

---

## Step 6 — Add JSON-LD structured data to LandingPage

Inside `LandingPage.tsx`, add a `<Helmet>` with JSON-LD so Google understands the organization and website:

```tsx
import { Helmet } from "react-helmet-async"

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "name": "CamShare",
      "url": "https://camshare.uplisoft.com",
      "logo": "https://camshare.uplisoft.com/logo.png",
      "description": "Event photo sharing platform"
    },
    {
      "@type": "WebSite",
      "name": "CamShare",
      "url": "https://camshare.uplisoft.com"
    }
  ]
}

// in JSX:
<Helmet>
  <script type="application/ld+json">
    {JSON.stringify(jsonLd)}
  </script>
</Helmet>
```

---

## Step 7 — Create robots.txt

**New file:** `apps/client/public/robots.txt`

```
User-agent: *
Allow: /
Disallow: /dashboard
Disallow: /events
Disallow: /admin
Disallow: /profile
Disallow: /shared
Disallow: /analytics
Disallow: /archive

Sitemap: https://camshare.uplisoft.com/sitemap.xml
```

---

## Step 8 — Create sitemap.xml

**New file:** `apps/client/public/sitemap.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://camshare.uplisoft.com/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://camshare.uplisoft.com/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://camshare.uplisoft.com/privacy</loc>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>https://camshare.uplisoft.com/terms</loc>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
</urlset>
```

---

## Step 9 — Google Search Console (manual, you do this)

1. Go to **search.google.com/search-console**
2. Add property → URL prefix → `https://camshare.uplisoft.com`
3. Google gives you a verification code — add it to `index.html`:
   ```html
   <meta name="google-site-verification" content="YOUR_CODE_HERE" />
   ```
4. Deploy, then verify ownership in Search Console
5. Go to **Sitemaps** → submit `https://camshare.uplisoft.com/sitemap.xml`
6. Use **URL Inspection** → request indexing for `/` and `/about`

Google will crawl and render the pages (it handles SPAs natively) and your pages will appear in search results within days to a few weeks.

---

## Verification Checklist

After deploying:

- [ ] `https://camshare.uplisoft.com/robots.txt` loads and shows correct rules
- [ ] `https://camshare.uplisoft.com/sitemap.xml` loads and lists all 4 URLs
- [ ] Lighthouse SEO tab on landing page scores 90+
- [ ] [opengraph.xyz](https://www.opengraph.xyz) preview shows correct OG card for `/` and `/about`
- [ ] Google Search Console confirms pages are indexable via URL Inspection
