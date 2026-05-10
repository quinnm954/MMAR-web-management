## Goal
Rank Mike's Mobile Auto Repair in the Google Map Pack across Lee County, FL for every mechanical service except bodywork. Map Pack ranking is driven mostly by **Google Business Profile (GBP) signals + reviews + citations**, supported by **on-page local SEO**. I'll handle all on-page work and give you a GBP checklist for what only you can do.

## Scope (per your answers)
- **Services (mechanical, no bodywork):** Engine, Oil & Fluids, Brakes, Electrical & Battery, AC & Heating, Cooling, Transmission & Drivetrain, Suspension & Steering, Tires & Wheels (mount/rotate/TPMS — no alignment rack), Fuel & Exhaust, Inspections & Fleet, plus standalone "Mobile Mechanic" hub.
- **Cities (Top 5 in Lee County):** Fort Myers, Cape Coral, Lehigh Acres, Bonita Springs, Estero. (Fort Myers + Lehigh already exist.)
- **Structure:** Service × City matrix → ~12 services × 5 cities = ~60 location-service pages, plus 5 city hubs and 12 service hubs.

## On-Page Build

### 1. City data — add 3 new cities
Extend `src/data/cities.ts` with full profiles for Cape Coral, Bonita Springs, Estero (zips, geo coords, neighborhoods + notes, intro, 5–6 unique long paragraphs each, pricing, FAQs). Same depth as existing Lehigh Acres / Fort Myers entries (Google rewards unique long-form local content).

### 2. Matrix landing pages — programmatic generator
Add `src/data/serviceCityMatrix.ts` that generates a page for every (service-category × city) combo not already hand-written in `localLandingPages.ts`. Each generated page composes:
- City-specific opening (uses city neighborhoods, ZIPs, climate notes)
- Service-specific procedure block (pulled from `serviceCategories.ts`)
- City pricing table
- 4–6 unique FAQs blending service + city
- LocalBusiness + Service + FAQPage + BreadcrumbList JSON-LD with city geo coords (critical for map pack)

URL pattern: `/{service-slug}-{city-slug}` (e.g. `/brake-repair-cape-coral`) — matches existing convention so hand-written pages take precedence.

### 3. Routing & hubs
- City pages (`/areas/:city`) — list all 12 services with internal links to that city's matrix page.
- Service hub pages (`/services/:slug`) — list all 5 cities with internal links to each city's matrix page.
- Add `/lee-county-fl` master hub page linking everything (county-level keyword).

### 4. Schema (Map Pack critical)
Every city + matrix page gets:
- `AutoRepair` LocalBusiness with **city-specific geo coordinates** (different lat/lng per page — Google uses this for proximity ranking)
- `areaServed` listing the city + ZIPs
- `Service` schema per page
- `FAQPage` schema
- `BreadcrumbList`
- Aggregate review schema pulled from existing reviews

### 5. Sitemap + robots
Regenerate `public/sitemap-locations.xml` with all ~80 URLs. Confirm `robots.txt` allows everything and references sitemap-index.

### 6. Internal linking
- Footer: link to all 5 city pages + `/lee-county-fl`.
- City page → all 12 services in that city.
- Service page → all 5 cities for that service.
- Home → "Service Areas" anchor with all 5 cities.

### 7. Meta + canonical hygiene
- Unique `<title>` and `<meta description>` per page (templated with city + service variables — never duplicated).
- Canonical URL per page.
- `og:image`, `og:locale=en_US`, geo meta tags per city page.

## GBP Checklist (your side — biggest map-pack lever)
On-page SEO alone won't get you in the Map Pack. You'll need to:

1. **Service Area Business setup:** GBP listed as service-area (no storefront), service area set to all 5 cities + Lee County.
2. **Categories:** Primary = "Auto Repair Shop" + "Mobile Mechanic" if available. Add secondaries: Brake Shop, Oil Change Service, Auto Air Conditioning Service, Auto Electrical Service, Tire Shop, Transmission Shop, Engine Rebuilding Service.
3. **Services:** Add every individual service from your menu inside GBP (matches your site's matrix).
4. **Reviews:** Aim for 50+ Google reviews with 4.7+ average. Ask every customer via your existing `/review` link — text it after each completed job. Reply to every review mentioning city + service ("Thanks for trusting us with your brake job in Cape Coral!").
5. **Photos:** Upload 30+ geotagged photos of service truck at customer locations across all 5 cities (each photo's EXIF location = a proximity signal).
6. **Posts:** 1 GBP Post/week — service tips, before/after, seasonal offers.
7. **Q&A:** Pre-seed 10 common questions and answer them yourself.
8. **Citations / NAP consistency:** List the business on Yelp, BBB, MechanicAdvisor, RepairPal, Angi, NextDoor, Apple Maps, Bing Places — same exact name/phone/address (or service-area config).
9. **Local backlinks:** Local sponsorships, Lee County chamber, partner with auto-parts stores or insurance offices in each city.

## Technical Notes (devs only)
- Pages render client-side (Vite SPA). Already shipping `useSeo` for dynamic meta, plus pre-built sitemap. For maximum crawler reliability, the existing static sitemap + per-page JSON-LD via `useSeo` is sufficient for Google (it executes JS), but I'll keep raw URLs in the sitemap so discovery is instant.
- Existing `localLandingPages.ts` hand-written pages are preserved — generator only fills gaps.
- All schema uses semantic HSL tokens / no design changes.

## What I'll Touch
- `src/data/cities.ts` — add 3 cities
- `src/data/serviceCityMatrix.ts` — new generator
- `src/data/localLandingPages.ts` — wire generator output into existing lookup
- `src/pages/CityPage.tsx`, `src/pages/ServiceCategory.tsx` — add cross-link grids
- `src/pages/LeeCounty.tsx` — new county hub
- `src/App.tsx` — register `/lee-county-fl` route
- `src/components/Footer.tsx` — service area links
- `public/sitemap-locations.xml` — regenerate

## Out of Scope
- Bodywork, paint, detail, alignment-rack-only services.
- GBP management itself (you do this).
- Paid ads.