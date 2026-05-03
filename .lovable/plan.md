# SEO expansion plan

Most of what ChatGPT recommended is **already built** in this project. Here is the audit + the small set of additions that will actually move the needle.

## What already exists (no work needed)

**City pages** — live at `/areas/:slug` for all 6 SWFL cities (Lehigh Acres, Fort Myers, Cape Coral, Estero, Bonita Springs, Naples) with full SEO copy, FAQs, neighborhoods, and ZIPs.

**Service pages** — `/services` index plus `/services/:category` (engine, brakes, electrical, cooling, etc.) backed by `serviceCategories.ts`.

**Repair-specific landing pages** — already in `localLandingPages.ts`:
- `/mobile-alternator-repair`, `/mobile-battery-replacement`, `/mobile-brake-repair`, `/mobile-vehicle-diagnostics`, `/mobile-no-start-diagnostics`, `/mobile-starter-repair`, `/mobile-oil-change`, `/mobile-engine-diagnostics`, `/emergency-roadside-mechanic`, `/mobile-suspension-steering`
- City-specific combos: `/mobile-brake-repair-lehigh-acres`, `/mobile-alternator-repair-fort-myers`, `/mobile-battery-replacement-cape-coral`, `/emergency-mobile-mechanic-lehigh-acres`

**Blog posts** — all 5 articles ChatGPT suggested already exist at `/blog/:slug`:
- `why-cars-overheat-in-florida`, `signs-of-a-bad-alternator`, `dead-battery-vs-bad-starter`, `why-your-car-wont-start`, `common-car-problems-southwest-florida`

**Homepage** — already trimmed to: Hero → TrustBadges → FeaturedServices → ServiceAreasPreview → TestimonialsPreview → FinalCTA. Matches the recommended structure.

## What's actually missing

ChatGPT's URL suggestions use **shorter, higher-CTR slugs** than ours. Google does treat `/alternator-repair` as a stronger keyword match than `/mobile-alternator-repair`. The fix is to add short slug aliases pointing at the existing rich pages.

### 1. Add short-slug city landing pages

Three new entries in `localLandingPages.ts`, each a self-contained, keyword-tight page (not a redirect — duplicate-content-safe via unique copy + canonical):

- `/mobile-mechanic-lehigh-acres`
- `/mobile-mechanic-fort-myers`
- `/mobile-mechanic-cape-coral`

Each page: H1 with exact-match keyword, 2–3 paragraphs of unique copy (different angle than the `/areas/:city` page), "What we fix" list, 4 FAQs, internal links to the matching `/areas/:city` and the top 3 service pages, click-to-call CTA.

### 2. Add short-slug service landing pages

Five new entries in `localLandingPages.ts`:

- `/alternator-repair`
- `/battery-replacement`
- `/brake-repair`
- `/vehicle-diagnostics`
- `/no-start-diagnostics`

Each is a region-wide (no `citySlug`) page with unique copy, "Cities we serve" links to all 6 city pages, FAQs, and a CTA. Canonical points to itself; the longer `/mobile-*` versions get a canonical pointing back to these new short slugs to consolidate link equity.

### 3. Sitemap + internal linking

- Append all 8 new URLs to `public/sitemap.xml` with `priority` 0.9 (city) / 0.85 (service).
- Add the 3 new city slugs to the Footer "Service Areas" group.
- Add the 5 new service slugs to the Footer "Services" group and to `FeaturedServices` cross-links.
- Update `Navigation.tsx` Services dropdown to point top items at the new short slugs.

### 4. JSON-LD on new pages

Each new landing page emits:
- `Service` schema (name, provider, areaServed)
- `BreadcrumbList` (Home → Services/Areas → Page)
- `FAQPage` (from the page's FAQs)

## Technical notes

- **No new routes needed.** `App.tsx` already has `<Route path="/:landingSlug" element={<LocalLanding />} />` as a catch-all that reads from `localLandingPages.ts`. New entries are picked up automatically.
- **Canonical strategy** to avoid duplicate-content penalties: the longer `mobile-*` slugs get `canonical` updated to point at the new shorter slugs. `LocalLanding.tsx` already supports a per-page canonical via `useSeo`.
- **Forbidden-terms guard** (already in place) keeps SC/Greenville/Spartanburg out of any new copy automatically.

## Files to change

- `src/data/localLandingPages.ts` — add 8 new entries; update existing `mobile-*` entries to set canonical to the new short slugs
- `public/sitemap.xml` — append 8 URLs
- `src/components/Footer.tsx` — surface the new slugs
- `src/components/Navigation.tsx` — point Services dropdown at short slugs
- `src/components/home/FeaturedServices.tsx` — link to short service slugs

## What I am intentionally NOT doing

- Not adding more blog posts right now — the requested 5 already exist. I can add a second batch (e.g. "AC not blowing cold in Florida", "Why your serpentine belt squeals", "Mobile vs shop brake repair cost") in a follow-up pass.
- Not redesigning the homepage — it already matches the recommended structure.
