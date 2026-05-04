# Make All Pages Rankable on Google

## Current Issues Found

1. **SPA with empty HTML** — `index.html` ships an empty `<div id="root">`. Google renders JS but indexing is slower and unreliable. Without prerendering, content-heavy SEO pages compete poorly.
2. **Sitemap gaps** — `sitemap-locations.xml` is missing many slugs that exist in `localLandingPages.ts` (e.g. `mobile-brake-repair`, `mobile-alternator-repair`, `mobile-battery-replacement`, `mobile-vehicle-diagnostics`, `mobile-no-start-diagnostics`, `mobile-brake-repair-lehigh-acres`, `alternator-repair-lehigh-acres`, etc.). `sitemap.xml` is also missing `/financing-contract` and `/areas/:city` parents.
3. **No prerendered HTML** — Title, description, and JSON-LD are injected client-side via `useSeo`/`useEffect`. Crawlers that don't execute JS see only the default `index.html` title/description for every route.
4. **NotFound page** — should send 404 signal; currently returns 200 with SPA fallback.
5. **AggregateRating** is hard-coded in `index.html` (47 reviews) but `REVIEWS_META` is the source of truth — risk of mismatch flagged by Google Rich Results.
6. **Duplicate AutoRepair schema** — both `index.html` (static) and `Index.tsx` (runtime) emit a `#business` AutoRepair node, which can trigger schema warnings.
7. **Image alts, internal linking, breadcrumbs** — only Index has BreadcrumbList; sub-pages should too.

## Plan

### 1. Add static prerendering (biggest win)
Install `vite-plugin-prerender-spa` (or `vite-plugin-ssg`/`react-snap`) to crawl all routes at build time and emit static HTML for each route with the rendered title, meta, content, and JSON-LD baked in. Routes to prerender:
- `/`, `/about`, `/services`, `/services/:slug` (all 11 categories), `/service-areas`, `/areas/lehigh-acres`, `/areas/fort-myers`, `/reviews`, `/contact`, `/blog`, `/blog/:slug` (all posts), `/blog/tag/:tag`, `/warranty-policy`, and every `localLandingPages` slug.

This makes every page fully indexable without JS execution.

### 2. Complete the sitemaps
Update `scripts/generate-sitemap.mjs` so it:
- Reads `localLandingPages.ts` and emits **every** slug into `sitemap-locations.xml`.
- Adds `/areas/lehigh-acres`, `/areas/fort-myers` to locations.
- Adds `/financing-contract` (or excludes if intentionally private) to `sitemap.xml`.
- Iterates all blog tags from `blogPosts.ts` automatically.
Re-run script and commit the regenerated XML files.

### 3. De-duplicate and unify JSON-LD
- Remove the static AutoRepair block from `index.html` (Index.tsx already emits a richer one with live `REVIEWS_META`).
- Keep one canonical schema source per page.

### 4. Add Breadcrumb JSON-LD on every sub-page
Wire `BreadcrumbList` into `useSeo`'s `jsonLd` array for AboutPage, ServicesIndex, ServiceCategory, ServiceAreas, CityPage, Reviews, ContactPage, Blog, BlogPost, BlogTag, LocalLanding.

### 5. Per-page meta hardening
Audit each page using `useSeo` to confirm:
- Unique `<title>` ≤ 60 chars with primary keyword + city.
- Unique `description` ≤ 155 chars, no duplicates across pages.
- `canonical` matches the served URL exactly (no trailing-slash mismatches).
- `og:image` set (use existing hero image as default).
Add an `og:image` default in `useSeo` so every page has social card.

### 6. NotFound returns proper signal
Add `<meta name="robots" content="noindex">` in `NotFound.tsx` via `useSeo({ noindex: true })`.

### 7. Performance / Core Web Vitals
- Add `loading="lazy"` and explicit `width`/`height` to non-hero images.
- Preload the hero image in `index.html`.

### 8. robots.txt
Already good. Add `Disallow: /review` if that URL is a private redirect; otherwise leave.

## Technical Section

- **Prerender tooling**: `vite-plugin-prerender-spa` (Puppeteer-based) with a `routes` array generated from the same data files used at runtime so it stays in sync.
- **Build flow**: `vite build` → prerender plugin crawls dev-server style and writes `dist/<route>/index.html` files. Lovable hosting serves them directly; SPA fallback still handles deep client navigation.
- **Sitemap script**: extend `scripts/generate-sitemap.mjs` to import the TS data via `tsx` or duplicate slug arrays in JS. Run during build.
- **useSeo enhancements**: extend hook to accept `breadcrumbs: {name,url}[]` and emit BreadcrumbList automatically; add default `ogImage`.

## Out of Scope
- Backlink building, Google Search Console verification (user action), Google Business Profile updates.

Ready to implement on approval.