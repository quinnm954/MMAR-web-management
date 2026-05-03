## Full Local SEO + Conversion Overhaul

A focused, end-to-end SEO and conversion build that doesn't require rewriting the existing site — it extends what's already there (homepage, service categories, city pages, landing pages) into a complete local-domination structure for mobile-mechanic searches in Southwest Florida.

### What exists already (keep + extend)

- Homepage with Hero, Services accordion, SeoContent (~700 words), Testimonials with Google/Facebook/Yelp/Nextdoor links, Contact, FloatingCallButton
- `/services/:slug` category pages (11 categories) + `/areas/:city` city pages (Lehigh Acres, Fort Myers, Cape Coral)
- `/:landingSlug` local landing pages (4 starter pages with JSON-LD, FAQs, sitemap entries)
- `useSeo` hook for title/meta/canonical, RequestQuoteCTA component, sitemap.xml, robots.txt

### What this plan adds

#### 1. Homepage rebuild for keyword targeting (1,200–2,000 words)

Refactor `src/components/SeoContent.tsx` (and add new sections) so the homepage hits every required H2:

- H1 already correct: "Mobile Mechanic in Lehigh Acres & Fort Myers, FL"
- New H2 sections, each 120–250 words of natural local copy:
  - Emergency Roadside Repairs
  - Mobile Brake Repair
  - Alternator & Starter Repair
  - Battery Replacement
  - Vehicle Diagnostics
  - Why Choose MMAR (trust block)
  - Areas We Service (links to all 6 cities)
  - Frequently Asked Questions (8–10 Qs with FAQ schema)

Each H2 inline-links to the matching service landing page and city pages. Phone/text CTAs sprinkled every ~2 sections.

#### 2. Expand service landing pages (10 total)

Current data file has 4 entries. Add 6 more to `src/data/localLandingPages.ts` plus a generalized template for service-only pages (no city in slug) so we cover both:

- Service-in-city pages (existing pattern, e.g. `/mobile-brake-repair-lehigh-acres`)
- Service-only pages at clean slugs:
  - `/mobile-brake-repair`
  - `/mobile-alternator-repair`
  - `/mobile-battery-replacement`
  - `/mobile-starter-repair`
  - `/mobile-vehicle-diagnostics`
  - `/emergency-roadside-mechanic`
  - `/mobile-oil-change`
  - `/mobile-suspension-steering`
  - `/mobile-engine-diagnostics`
  - `/mobile-no-start-diagnostics`

Each: 800–1,200 words of unique copy, FAQs, JSON-LD `Service`+`FAQPage`, "Available across SWFL" city link grid, RequestQuoteCTA, trust block.

The existing `LocalLanding` page is generalized to handle both shapes (city optional). When `citySlug` is absent it shows all cities and a wider service-area schema.

#### 3. Add 3 new city pages (6 total)

Append to `src/data/cities.ts`:
- `estero` — 33928, 33967, 33928 — Coconut Point, Estero Park, Miromar
- `bonita-springs` — 33923, 33928, 33931 — Bonita Beach, Imperial Bonita Estates, Pelican Landing
- `naples` — 34102, 34103, 34104, 34105, 34108, 34109, 34110, 34112, 34113, 34114, 34116, 34117 — Old Naples, North Naples, Park Shore, Pelican Bay, Golden Gate

Each gets ~500–700 words of unique copy mentioning Florida heat, salt air, common local vehicle issues, and roadside availability. Existing `CityPage` template is reused — no new component needed.

#### 4. Blog structure + starter posts

Create a lightweight in-codebase blog (no CMS):
```text
src/data/blogPosts.ts        title, slug, excerpt, dateISO, tags, body (string of HTML or MDX-lite)
src/pages/Blog.tsx           index at /blog — grid of post cards
src/pages/BlogPost.tsx       /blog/:slug — article layout, JSON-LD Article schema, RequestQuoteCTA at bottom
```

Five starter posts (700–1,000 words each, internal links to relevant service/city pages):
- Why Cars Overheat in Florida
- 7 Warning Signs of a Bad Alternator
- Dead Battery vs Bad Starter — How to Tell the Difference
- Why Your Car Won't Start (and What a Mobile Mechanic Can Do)
- 6 Common Car Problems in Southwest Florida

Sitemap and footer link to `/blog` and each post.

#### 5. Technical SEO upgrades

- **Global LocalBusiness schema** added once in `index.html` `<head>` (AutoRepair type with phone, geo, areaServed array of all 6 cities, openingHours)
- **Per-page schema**: each landing page already injects Service+FAQ; add Article schema to blog posts
- **OpenGraph + Twitter meta** added in `useSeo` hook (og:title, og:description, og:url, og:image, twitter:card)
- **Image optimization**: ensure all `<img>` tags have `loading="lazy"`, `decoding="async"`, descriptive alt text mentioning service + location where appropriate
- **Sitemap regenerated** programmatically-friendly (script `scripts/build-sitemap.ts` reads data files and writes `public/sitemap.xml`) so future additions auto-include
- **Internal linking pass**: every service page links to all 6 city pages; every city page links to top 6 services; homepage links to top service+city pages; blog posts link contextually

#### 6. Conversion upgrades

- **Sticky mobile bar**: extend FloatingCallButton into a 2-button bar (Call + Text/Quote) visible on all pages, mobile only, with safe-area padding
- **Roadside emergency banner**: dismissible top banner on landing pages with red/amber accent, "24/7 Roadside Help — Tap to Call"
- **Inline CTAs**: add a compact `<InlineCallStrip>` component (phone + text buttons) inserted between long content sections on landing/city/blog pages
- **Trust block**: reusable `<TrustBadges>` (ASE-style, 5-Star Google, Mobile Service, Up-Front Pricing, Warranty Backed) added to homepage, landing, and city pages
- **Review section**: existing Testimonials block already shows Google + Facebook + Yelp + Nextdoor — extend with rating count display and a "Leave us a review" link
- **Before/after gallery**: new optional `src/components/BeforeAfterGallery.tsx` placeholder component on homepage — uses placeholder images until you supply real photos (will ask before wiring real photos)

#### 7. URL + redirect housekeeping

- All new service-only and city slugs added to sitemap with priority 0.9
- robots.txt verified to allow `/blog` and disallow `/admin/`
- Canonical URLs set per page via `useSeo`

### File map

**Create**
```text
src/data/blogPosts.ts
src/pages/Blog.tsx
src/pages/BlogPost.tsx
src/components/InlineCallStrip.tsx
src/components/TrustBadges.tsx
src/components/RoadsideBanner.tsx
src/components/BeforeAfterGallery.tsx
scripts/build-sitemap.ts            (one-shot, run when data files change)
```

**Edit**
```text
src/components/SeoContent.tsx       expand to ~1,400 words with all H2 sections + FAQ + schema
src/data/localLandingPages.ts       add 6 service-only entries + 6 more service-in-city entries
src/data/cities.ts                  add Estero, Bonita Springs, Naples
src/pages/LocalLanding.tsx          handle service-only pages (no city)
src/pages/CityPage.tsx              add inline call strip + trust block
src/pages/ServiceCategory.tsx       add inline call strip + trust block
src/pages/Index.tsx                 mount RoadsideBanner, TrustBadges, BeforeAfterGallery
src/lib/useSeo.ts                   add OpenGraph + Twitter meta
src/components/Footer.tsx           add Blog + new city links
src/components/FloatingCallButton.tsx  expand to call+text bar on mobile
src/App.tsx                         add /blog and /blog/:slug routes
public/sitemap.xml                  regenerated with all new URLs
index.html                          inject site-wide AutoRepair LocalBusiness JSON-LD
```

### Out of scope (will ask if you want next)

- Real before/after photos (need uploads from you)
- Live booking/calendar integration
- Programmatic page generation for every service × city combo (60+ pages) — current plan covers the highest-intent slugs
- Google Business Profile updates and citation building (off-site, not code)
- Schema markup for individual reviews (requires aggregating from review platforms; current setup links out)

### What you'll see after approval

- Homepage that ranks for and clearly targets every keyword in your list
- 10 service pages + 6 city pages + 4–10 service-in-city pages, all internally linked
- A working blog with 5 starter articles
- Site-wide LocalBusiness schema and per-page Service/FAQ/Article schema
- Stronger mobile CTAs and a roadside-emergency banner
- A regenerated sitemap covering ~30+ indexable URLs
