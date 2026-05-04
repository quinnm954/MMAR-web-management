## SEO Power Pack — what I'll ship

### 1. Schema markup (JSON-LD) sitewide
- **Home (`index.html`)**: already has `AutoRepair` — extend with `geo` (lat/lng), `aggregateRating` (using current Google review numbers), and explicit `@id` for entity consolidation.
- **City pages (`CityPage.tsx`)**: inject per-page `LocalBusiness` + `Service` schema with `areaServed`, `geo`, ZIPs, neighborhoods.
- **Service category pages**: add `Service` schema with `provider` referencing the home `@id`.
- **Blog posts**: add `Article` + `FAQPage` schema (FAQs already exist in data).
- **Breadcrumbs**: add `BreadcrumbList` schema on city/service/blog pages.

Implementation: extend `useSeo.ts` to accept an optional `jsonLd` object/array and inject/cleanup `<script type="application/ld+json" data-dynamic>` tags on route change.

### 2. Expand city pages to 1,500+ words
Rewrite each city in `src/data/cities.ts` to include:
- Expanded intro + 6–8 substantive paragraphs (currently 3)
- **Pricing ranges** table (oil change, brakes, battery, alt, AC, diagnostics)
- **Neighborhood mini-callouts** (2 sentences per neighborhood)
- **Local landmarks / commute pain points** (I-75, US-41, Pine Island Rd, etc.)
- **Why-mobile-here** angle specific to each city
- **City-specific FAQs** (5 per city) — rendered with FAQ schema

Update `CityPage.tsx` to render the new sections and embed a Google Maps iframe of the service area.

### 3. Two link-bait blog posts
Add to `src/data/blogPosts.ts`:
- **"What it really costs to replace a car battery in Florida heat (2026)"** — pricing table, why FL batteries die in 2–3 years, OEM vs aftermarket, mobile vs shop cost.
- **"Why Florida cars need AC service every 2 years"** — humidity/refrigerant loss explanation, signs, cost ranges, DIY recharge warning.

Both with FAQs, internal links to city + service pages, and Article+FAQ schema.

### 4. Review-request page + QR-friendly short URL
- New route `/review` → branded page with one big "Leave a Google Review" button (deep link to GBP review form), plus a "Text us first" fallback.
- Add `noindex` on this page (utility, not for ranking).
- This lets Mike text/QR customers post-job to drive review volume — the #1 map-pack ranking factor.

### 5. Performance fixes
- Audit hero & gallery images: convert oversize JPGs, add explicit `width`/`height`, `fetchpriority="high"` on the LCP hero image, `loading="lazy"` everywhere else (most already done).
- Add `<link rel="preconnect">` for Google Fonts / GTM in `index.html`.
- Defer non-critical gtag if needed.
- I'll report measured Lighthouse-style wins after the changes; can't run PageSpeed Insights against the live domain from here, but I'll fix the patterns known to hurt LCP/CLS.

### 6. Small wins
- Add `<html lang="en">` ✅ (already)
- Add Open Graph `og:locale`, `og:site_name`
- Add `robots` meta `index,follow,max-image-preview:large` (helps image SEO)
- Internal linking: add a "Nearby cities" block on each city page

### Files I'll touch
- `index.html` — extra meta, preconnect, schema enrichments
- `src/lib/useSeo.ts` — JSON-LD support
- `src/data/cities.ts` — expanded content + FAQ + pricing data
- `src/pages/CityPage.tsx` — render new sections, schema, breadcrumbs, map embed, nearby-cities
- `src/pages/ServiceCategory.tsx` — Service schema + breadcrumbs
- `src/pages/BlogPost.tsx` — Article + FAQ schema
- `src/data/blogPosts.ts` — 2 new posts
- `src/pages/Review.tsx` (new) — review-request landing
- `src/App.tsx` — register `/review` route
- `public/sitemap-blog.xml` + `scripts/generate-sitemap.mjs` — include new posts

### Out of scope (you have to do these — they matter MORE than code)
1. **Optimize Google Business Profile**: verify, fill 100%, add 20+ photos, set 6 service areas, post weekly.
2. **Get listed**: Yelp, Angi, Nextdoor, BBB, RepairPal, MechanicAdvisor, local Chamber — identical NAP everywhere.
3. **Drive Google reviews** — text every customer the new `/review` link. Aim 50+.
4. **Backlinks**: pitch the two new blog posts to local Fort Myers / Naples news + community blogs.

Ready to build — approve and I'll ship it.