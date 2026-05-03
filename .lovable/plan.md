## Goal
Make sure every public page on the site is in a Google-readable sitemap, kept in sync automatically, and properly linked so Google can discover and index each one.

## Current state
- `public/sitemap.xml` exists but is hand-maintained and can drift from the actual routes.
- `public/robots.txt` already references it.
- Each page sets its own `<title>`, meta description, and canonical via `useSeo` — good.
- Routes live in `src/App.tsx`; dynamic page lists live in `src/data/cities.ts`, `src/data/serviceCategories.ts`, `src/data/localLandingPages.ts`, `src/data/blogPosts.ts`.

## What I will do

1. **Auto-generate the sitemap from data files.**
   - Add `scripts/generate-sitemap.mjs` that imports the static route list + dynamic data (cities, service categories, local landing pages, blog posts, blog tags) and writes `public/sitemap.xml`.
   - Wire it into `package.json` as `prebuild` so every deploy refreshes the sitemap automatically — no more manual edits.
   - Include `lastmod` (today for static pages, `publishedAt` for blog posts), sensible `changefreq`, and `priority`.

2. **Add a sitemap index** (`public/sitemap-index.xml`) that points to:
   - `/sitemap.xml` (pages)
   - `/sitemap-blog.xml` (blog posts + tags)
   - `/sitemap-locations.xml` (city + local landing pages)
   Splitting helps Google process large sections independently. `robots.txt` will list the index.

3. **Verify every route is covered.** Cross-check `App.tsx` routes against the generator output:
   - `/`, `/about`, `/services`, `/services/:slug` (all categories), `/service-areas`, `/areas/:city` (all cities), `/reviews`, `/contact`, `/blog`, `/blog/:slug` (all posts), `/blog/tag/:tag` (all tags), `/:landingSlug` (all `localLandingPages`), `/warranty-policy`.
   - Exclude `/admin/*` and `/financing-contract` (private/transactional).

4. **Per-page SEO sanity pass.**
   - Confirm every page component calls `useSeo` with a unique title, description, and canonical. Patch any that don't (spot-check `Reviews`, `ContactPage`, `AboutPage`, `ServicesIndex`, `ServiceAreas`, `Blog`, `BlogTag`, `BlogPost`, `WarrantyPolicy`, `LocalLanding`, `CityPage`, `ServiceCategory`).
   - Add a `<link rel="sitemap" type="application/xml" href="/sitemap.xml">` in `index.html` head for extra discoverability.

5. **Update `robots.txt`** to point at the new sitemap index:
   ```
   Sitemap: https://www.mikesmautorepair.com/sitemap-index.xml
   Sitemap: https://www.mikesmautorepair.com/sitemap.xml
   ```

6. **Documentation note** in chat after build: how to submit `https://www.mikesmautorepair.com/sitemap-index.xml` in Google Search Console, and how the auto-generation works going forward.

## Out of scope
- Verifying the domain in Google Search Console (manual step on Google's side).
- Server-side rendering / prerendering (the app is a SPA; sitemap + canonicals + JSON-LD are still the right SEO levers).
