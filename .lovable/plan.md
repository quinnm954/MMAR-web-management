## Goal

Close the remaining SEO gaps from the recommendation list: ship the missing city+service landing pages, beef up homepage crawlable text, expand structured data (LocalBusiness/Review/Service/Breadcrumb), and add a first batch of high-intent blog posts. Backlinks, real-photo content, and Google Map embed are noted as out-of-code follow-ups.

## 1. New city+service landing pages

Add these entries to `src/data/localLandingPages.ts`. Each gets ~800–1,200 words of city-specific copy across `intro` + `paragraphs`, an `included` checklist, 5 FAQs, full `metaTitle` / `metaDescription`. They route automatically through `/:landingSlug` → `LocalLanding.tsx`, which already emits `Service` + `FAQPage` JSON-LD.

New short-slug city+service combos:
- `/brake-repair-lehigh-acres`
- `/alternator-repair-fort-myers`
- `/battery-replacement-lehigh-acres`
- `/roadside-mechanic-fort-myers`
- `/oil-change-lehigh-acres`
- `/diagnostics-lehigh-acres`

Existing long-slug equivalents (e.g. `mobile-brake-repair-lehigh-acres`) get a `canonical` field pointing to the new short slug so equity consolidates — same pattern already used for the service-only short slugs.

All 6 new URLs are appended to `public/sitemap.xml`.

## 2. LocalLanding template upgrades

Update `src/pages/LocalLanding.tsx` JSON-LD graph to also emit:
- `BreadcrumbList` (Home → City or Service → This page)
- `LocalBusiness` / `AutoRepair` provider node with full NAP, hours, areaServed (mirrors `index.html`)
- `AggregateRating` on the Service node (uses real Google Reviews count we already cite — pulled from a single constant in `src/data/reviewsMeta.ts`, new file)

Add a small "What customers say" block on each landing page that surfaces 2 city-relevant testimonials from `src/components/Testimonials.tsx` data, so the page has visible review content matching the schema.

## 3. Homepage content expansion

Goal: ~1,200–1,600 visible words on `/` while keeping it conversion-focused. Add three new lightweight sections between `TestimonialsPreview` and `FinalCTA` in `src/pages/Index.tsx`:

- `WhyChooseUs.tsx` — 4–6 trust bullets with short paragraphs (ASE-level work, transparent pricing, 7am–9pm, mobile-first, warranty, locally owned in Lee County).
- `HomeServicesOverview.tsx` — 4–6 short paragraphs naturally mentioning brake repair, alternator/battery, diagnostics, no-start, roadside, oil change, with inline links to the new landing pages.
- `HomeFAQ.tsx` — 6 FAQs (cost, response time, warranty, areas served, payment, parts) rendered with the existing `Accordion` component. Emits `FAQPage` JSON-LD via a small effect.

Also add a `BreadcrumbList` + reinforced `LocalBusiness`/`AutoRepair` JSON-LD block on the homepage (the existing `index.html` block stays; the new one adds `aggregateRating` and explicit `service` list).

## 4. Blog content batch

Add 4 new posts to `src/data/blogPosts.ts` (existing infra already renders Article + FAQ JSON-LD and BreadcrumbList):
- "Why Your Car Won't Start in Florida Heat"
- "Signs Your Alternator Is Failing"
- "Mobile Mechanic vs Shop in Lehigh Acres"
- "Most Common Chevy Cruze Problems in SWFL"

Each: 700–1,100 words, 4–6 FAQs, internal links to relevant landing pages, tagged for `/blog/tag/...`. Append to `public/sitemap.xml`.

## 5. Performance / mobile polish

- Add `loading="lazy"` and `decoding="async"` to non-hero `<img>` tags across Hero/Testimonials/Blog cards where missing.
- Add `fetchpriority="high"` to the hero image and `width`/`height` attributes to prevent CLS.
- Verify Vite already code-splits routes (it does via React Router) — no change needed.

## 6. Out of code (noted in response, not implemented)

Backlinks (Yelp/BBB/Chamber/Nextdoor), real customer before/after photos, embedded Google Map iframe (needs Maps API key — will ask before adding), and weekly blog cadence are owner tasks. Will list these in the final message.

## File changes

- edit `src/data/localLandingPages.ts` (6 new entries + canonicals on 4 long-slug pages)
- edit `src/pages/LocalLanding.tsx` (BreadcrumbList + LocalBusiness + AggregateRating in JSON-LD, testimonials block)
- create `src/data/reviewsMeta.ts` (single source for review count/rating)
- create `src/components/home/WhyChooseUs.tsx`
- create `src/components/home/HomeServicesOverview.tsx`
- create `src/components/home/HomeFAQ.tsx`
- edit `src/pages/Index.tsx` (mount new sections + homepage JSON-LD effect)
- edit `src/data/blogPosts.ts` (4 new posts)
- edit `public/sitemap.xml` (10 new URLs)
- minor img attribute tweaks in Hero/Testimonials/blog card components

No new routes needed — `/:landingSlug` and `/blog/:slug` already cover them.
