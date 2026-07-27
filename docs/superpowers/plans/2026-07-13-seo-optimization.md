# SEO Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Optimize the HK School Finder web app for Google search visibility by fixing missing meta tags, adding social sharing images, implementing hreflang for bilingual content, and ensuring the production build includes all SEO elements.

**Architecture:** All SEO changes are in `index.html` (source) and `vite.config.ts` (PWA icons). The production build (`dist/`) will be regenerated via `vite build`. No server-side rendering changes needed — the existing SPA with pre-rendered HTML meta tags is sufficient for this app's scope.

**Tech Stack:** Vite 6, React 19, vite-plugin-pwa, Tailwind CSS 4

---

## File Structure

| File | Action | Purpose |
|------|--------|---------|
| `index.html` | Modify | Add missing meta tags, hreflang, theme-color, OG image |
| `public/og-image.png` | Create | Social sharing image (1200x630) |
| `vite.config.ts` | Modify | Add PWA icons configuration |
| `public/icon-192.png` | Create | PWA icon 192x192 |
| `public/icon-512.png` | Create | PWA icon 512x512 |
| `public/sitemap.xml` | Modify | Update lastmod date |

---

## Task 1: Create Social Sharing Image (og-image.png)

**Files:**
- Create: `public/og-image.png`

**Interfaces:**
- Consumes: None
- Produces: Image file used by `og:image` and `twitter:image` meta tags in Task 2

- [ ] **Step 1: Create the og-image.png file**

Create a 1200x630 PNG image for social media sharing. The image should:
- Have a clean, professional design with the app name "HK School Finder"
- Include a tagline like "Find Hong Kong Schools Near You"
- Use a map-themed or education-themed visual
- Be readable at small sizes (social media previews are often 600x315 scaled)

Save to: `C:\Github\(Web app)\hk_school_finder\public\og-image.png`

- [ ] **Step 2: Verify the image exists**

Run: `dir "C:\Github\(Web app)\hk_school_finder\public\og-image.png"`

Expected: File exists with reasonable size (>10KB)

---

## Task 2: Add Missing Meta Tags to index.html

**Files:**
- Modify: `C:\Github\(Web app)\hk_school_finder\index.html`

**Interfaces:**
- Consumes: `public/og-image.png` from Task 1
- Produces: Complete SEO meta tags in HTML head

- [ ] **Step 1: Add og:image and twitter:image meta tags**

After line 15 (`<meta property="og:site_name" ...`), add:

```html
    <meta property="og:image" content="https://hk-school-finder.vercel.app/og-image.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:locale" content="en_HK" />
```

After line 19 (`<meta name="twitter:description" ...`), add:

```html
    <meta name="twitter:image" content="https://hk-school-finder.vercel.app/og-image.png" />
```

- [ ] **Step 2: Add hreflang tags for bilingual content**

After the Twitter Card section (after the twitter:image line added above), add:

```html
    <!-- Hreflang for bilingual content -->
    <link rel="alternate" hreflang="en" href="https://hk-school-finder.vercel.app/" />
    <link rel="alternate" hreflang="zh-Hant" href="https://hk-school-finder.vercel.app/" />
    <link rel="alternate" hreflang="x-default" href="https://hk-school-finder.vercel.app/" />
```

- [ ] **Step 3: Add theme-color meta tag**

After the viewport meta tag (line 5), add:

```html
    <meta name="theme-color" content="#ffffff" />
```

- [ ] **Step 4: Add apple-touch-icon link**

After the favicon link (line 37), add:

```html
    <link rel="apple-touch-icon" href="./icon-192.png" />
```

- [ ] **Step 5: Verify all meta tags are present**

Open `index.html` and confirm these tags exist in the `<head>`:
- `<meta name="theme-color">`
- `<meta property="og:image">`
- `<meta property="og:image:width">`
- `<meta property="og:image:height">`
- `<meta property="og:locale">`
- `<meta name="twitter:image">`
- `<link rel="alternate" hreflang="en">`
- `<link rel="alternate" hreflang="zh-Hant">`
- `<link rel="alternate" hreflang="x-default">`
- `<link rel="apple-touch-icon">`

---

## Task 3: Add PWA Icons to vite.config.ts

**Files:**
- Modify: `C:\Github\(Web app)\hk_school_finder\vite.config.ts`
- Create: `public/icon-192.png`
- Create: `public/icon-512.png`

**Interfaces:**
- Consumes: None
- Produces: PWA manifest with proper icons for install prompts

- [ ] **Step 1: Create placeholder PWA icons**

Create two square PNG icons:
- `public/icon-192.png` — 192x192 pixels
- `public/icon-512.png` — 512x512 pixels

These can be simple colored squares with "HK" text or a map pin icon. The app icon (`favicon.svg`) already exists; these are for PWA install prompts on mobile.

- [ ] **Step 2: Update VitePWA manifest icons**

In `vite.config.ts`, replace line 20 (`icons: []`) with:

```typescript
        icons: [
          {
            src: './icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: './icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
```

- [ ] **Step 3: Add icons to includeAssets**

In `vite.config.ts`, update line 14 (`includeAssets: ['mask-icon.svg']`) to:

```typescript
      includeAssets: ['mask-icon.svg', 'icon-192.png', 'icon-512.png'],
```

- [ ] **Step 4: Verify vite.config.ts changes**

Read `vite.config.ts` and confirm:
- `includeAssets` includes the icon files
- `manifest.icons` has both 192 and 512 entries with correct `src`, `sizes`, and `type`

---

## Task 4: Update Sitemap lastmod Date

**Files:**
- Modify: `C:\Github\(Web app)\hk_school_finder\public\sitemap.xml`

**Interfaces:**
- Consumes: None
- Produces: Updated sitemap with current date

- [ ] **Step 1: Update lastmod to today's date**

In `public/sitemap.xml`, change line 4 from:

```xml
    <lastmod>2026-06-20</lastmod>
```

To:

```xml
    <lastmod>2026-07-13</lastmod>
```

- [ ] **Step 2: Verify sitemap.xml**

Read `public/sitemap.xml` and confirm the `<lastmod>` date is `2026-07-13`.

---

## Task 5: Rebuild Production Site

**Files:**
- Modify: `dist/index.html` (regenerated by build)

**Interfaces:**
- Consumes: All changes from Tasks 1-4
- Produces: Updated `dist/` directory with all SEO meta tags

- [ ] **Step 1: Run clean build**

Run: `npm run clean && npm run build`

Expected: Build completes successfully, `dist/index.html` is regenerated.

- [ ] **Step 2: Verify dist/index.html has all SEO tags**

Read `dist/index.html` and confirm it contains:
- Full title: `HK School Finder - Find Hong Kong Schools Near You`
- `<meta name="description">`
- `<meta name="keywords">`
- `<link rel="canonical">`
- All Open Graph tags (og:type, og:title, og:description, og:url, og:site_name, og:image, og:locale)
- All Twitter Card tags (twitter:card, twitter:title, twitter:description, twitter:image)
- JSON-LD structured data script
- `<link rel="alternate" hreflang>` tags
- `<meta name="theme-color">`
- `<link rel="apple-touch-icon">`

- [ ] **Step 3: Verify sitemap and robots.txt in dist**

Run: `dir dist\sitemap.xml` and `dir dist\robots.txt`

Expected: Both files exist in `dist/`.

---

## Task 6: Verify SEO with Lighthouse (Optional but Recommended)

**Files:**
- None (audit only)

**Interfaces:**
- Consumes: Built `dist/` from Task 5
- Produces: Lighthouse SEO audit report

- [ ] **Step 1: Run Lighthouse SEO audit**

If Lighthouse CLI is available:
```bash
npx lighthouse https://hk-school-finder.vercel.app --only-categories=seo --output=html --output-path=./lighthouse-seo-report.html
```

Or manually check in Chrome DevTools > Lighthouse > SEO category.

- [ ] **Step 2: Review and fix any remaining issues**

Check the report for:
- Document doesn't have meta description: Should PASS
- Document doesn't have valid hreflang: Should PASS
- Document doesn't have valid rel=canonical: Should PASS
- Image alt attributes: N/A (SPA content)
- Links: Should PASS

---

## Summary of All Changes

| Change | File | Impact |
|--------|------|--------|
| Add og:image + twitter:image | `index.html` | Social media previews show image |
| Add og:locale | `index.html` | Regional targeting |
| Add hreflang tags | `index.html` | Bilingual SEO signal |
| Add theme-color | `index.html` | Mobile browser chrome |
| Add apple-touch-icon | `index.html` | iOS home screen icon |
| Create og-image.png | `public/` | Social sharing visual |
| Create PWA icons | `public/` | Install prompts |
| Update vite PWA config | `vite.config.ts` | Manifest icons |
| Update sitemap date | `public/sitemap.xml` | Freshness signal |
| Rebuild dist/ | `dist/` | Production deployment |
