## Local SEO Landing Pages (service + city URLs)

Create dedicated, SEO-optimized landing pages at clean URLs like:

- `/mobile-brake-repair-lehigh-acres`
- `/mobile-alternator-repair-fort-myers`
- `/mobile-battery-replacement-cape-coral`
- `/emergency-mobile-mechanic-lehigh-acres`

These are the highest-converting URL patterns for local search. The current `/services/:slug` and `/areas/:city` pages stay in place; these new pages are narrower (one service in one city) and target long-tail keywords.

### Approach

A single dynamic route handles all combos, driven by a curated data file. This keeps it DRY and lets us extend to dozens of pages without writing one file each.

### Files to create

```text
src/data/localLandingPages.ts   curated list of {slug, service, city, h1, intro, paragraphs, faqs, relatedServiceId}
src/pages/LocalLanding.tsx      renders any landing page from the data file
```

The data file ships with these starter pages (we can add more later):

| Slug | Service | City |
|---|---|---|
| `mobile-brake-repair-lehigh-acres` | Brake repair | Lehigh Acres |
| `mobile-alternator-repair-fort-myers` | Alternator repair | Fort Myers |
| `mobile-battery-replacement-cape-coral` | Battery replacement | Cape Coral |
| `emergency-mobile-mechanic-lehigh-acres` | Emergency mobile mechanic | Lehigh Acres |

Each entry has unique, locally-written copy (~300–500 words) — never spun/duplicated, so Google rewards it.

### Files to edit

```text
src/App.tsx                      add <Route path="/:landingSlug" element={<LocalLanding />} /> just above the catch-all NotFound
src/components/Footer.tsx        new "Local Services" column linking these landing pages
src/components/SeoContent.tsx    inline links to a few landing pages from the homepage SEO copy
src/pages/CityPage.tsx           add a "Popular services in {city}" section linking landing pages for that city
src/pages/ServiceCategory.tsx    add a "Get this service in your city" section linking related landing pages
public/sitemap.xml               add the 4 new URLs
```

### Page layout (each landing page)

```text
[Nav]
H1: Mobile Brake Repair in Lehigh Acres, FL
Sub: One-line value prop with phone number
[RequestQuoteCTA — pre-filled with service + city]
~3 paragraphs of unique local copy (why mobile, what we fix, neighborhoods served)
"What's included" checklist (pulled from related service category)
ZIP codes + neighborhoods (from city data)
3–5 FAQs (How much…, How long…, Same-day?, Warranty?, Areas covered?)
JSON-LD: LocalBusiness + Service schema for richer snippets
Related links: parent service category page + city page + 2 sibling landing pages
[Footer + FloatingCallButton]
```

### Routing detail

The new route is a top-level `/:landingSlug` pattern. To avoid colliding with existing routes (`/services/...`, `/areas/...`, `/admin/...`, `/financing-contract`, `/warranty-policy`), the `LocalLanding` page does a lookup against the data file's slug list and renders `<NotFound />` if there is no match. React Router's specific routes are matched first, so existing pages are unaffected.

### SEO details

- Per-page `<title>`: `Mobile Brake Repair in Lehigh Acres, FL | Mike's Mobile Auto Repair`
- Per-page meta description from the intro paragraph
- Canonical URL set via the existing `useSeo` hook
- JSON-LD `Service` + `LocalBusiness` schema injected per page
- New entries appended to `public/sitemap.xml` so Google indexes them quickly

### What stays the same

- Existing `/services/:slug` (category hub) and `/areas/:city` (city hub) pages remain — they cross-link to the new landing pages and vice versa for strong internal linking.
- Phone number, branding, RequestQuoteCTA, and design tokens are reused — no visual drift.

### Out of scope (ask if you want these next)

- Generating the full matrix (every service × every city = ~30+ pages). Easy to add — just append entries to `localLandingPages.ts`.
- Programmatic FAQ schema beyond the per-page faqs array.
- A CMS/admin UI to author new landing pages without code.
