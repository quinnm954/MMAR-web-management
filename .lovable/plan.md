# SEO Indexing & Local-Ranking Pass

Goal: give Google more crawlable, well-linked local pages, surface them in the menu, and put full NAP + social/photo signals on every page.

## 1. Add the missing landing pages

Add new entries to `src/data/localLandingPages.ts` (each ~700–900 words, FAQ block, included-services list, canonical, meta — matching the existing pattern):

- `mobile-mechanic-naples` — region/city page for Naples (parallels Lehigh/Fort Myers/Cape Coral).
- `oil-change` — short-slug region page (currently only `/mobile-oil-change` exists; add `/oil-change` as canonical short slug requested).
- `diagnostics` — short-slug region page (currently only `/vehicle-diagnostics` and `/mobile-vehicle-diagnostics`).
- `battery-alternator-starter` — combined electrical-starting-system page targeting that exact phrase.

These slugs already render through the existing `/:landingSlug` route in `App.tsx` + `LocalLanding.tsx`, so no new routes needed — only data.

## 2. Update the hamburger / desktop menu

Edit `src/components/Navigation.tsx` so both the `SERVICES` and `AREAS` arrays expose the requested links:

Services dropdown:
- `/brake-repair`
- `/oil-change` (new)
- `/diagnostics` (new)
- `/battery-alternator-starter` (new — replaces the three separate battery/alternator/starter items, keep "All Services")

Service Areas dropdown:
- `/mobile-mechanic-lehigh-acres`
- `/mobile-mechanic-fort-myers`
- `/mobile-mechanic-naples` (new — currently links to `/areas/naples`)
- Keep Cape Coral, Estero, Bonita Springs.

## 3. Footer NAP, hours, socials (global)

Edit `src/components/Footer.tsx` to add a dedicated NAP block visible on every page:

- **Business name:** Mike's Mobile Auto Repair LLC
- **Phone:** (813) 501-7572 (tel + sms links)
- **Service areas:** Lehigh Acres, Fort Myers, Cape Coral, Estero, Bonita Springs, Naples (Lee & Collier County, SWFL)
- **Hours:** Mon–Sat 8am–7pm, Sun by appointment (confirm wording with you if different — using these as default)
- **Socials:** add Facebook (existing) + TikTok (placeholder URL until you supply the handle) alongside the existing Google/Yelp/Nextdoor chips.

Also wrap the NAP in `LocalBusiness` JSON-LD already present on the home page — extend it to include `openingHoursSpecification` and `sameAs` (Facebook, TikTok) so the structured data is complete.

## 4. Photo gallery with SEO alt text

Add a new `src/components/home/LocalPhotoGallery.tsx` rendered on the home page and on each city short-slug page (`mobile-mechanic-*`). It will display 4–6 `<img>` tags pointing to images you upload (placeholders until then) with descriptive alt text such as:
- "Mobile mechanic working on a car battery in Lehigh Acres FL"
- "Brake pad replacement at customer driveway in Fort Myers FL"
- "Mobile auto repair van serving Naples FL"
- "Alternator replacement on a Chevy Cruze in Cape Coral FL"

You can swap the placeholder images by uploading photos in chat — I'll wire them in.

## 5. Sitemap

Update `public/sitemap.xml` to add:
- `/mobile-mechanic-naples`
- `/oil-change`
- `/diagnostics`
- `/battery-alternator-starter`

Bump `lastmod` to today on changed URLs.

## 6. Google Search Console (manual — your action)

Indexing requires you to:
1. Verify the property `https://www.mikesmautorepair.com/` in Search Console.
2. Submit `https://www.mikesmautorepair.com/sitemap.xml`.
3. Use **URL Inspection → Request Indexing** for the new short-slug pages and homepage.
4. (Optional) Submit the sitemap to Bing Webmaster Tools.

I can't do this for you — it requires Google account access. Once submitted, indexing typically takes 3–14 days.

## Files touched

- `src/data/localLandingPages.ts` — 4 new entries
- `src/components/Navigation.tsx` — menu items
- `src/components/Footer.tsx` — NAP block, hours, TikTok link
- `src/pages/Index.tsx` — extend JSON-LD with `sameAs` + hours; render gallery
- `src/components/home/LocalPhotoGallery.tsx` — new
- `src/pages/LocalLanding.tsx` — render gallery on city pages
- `public/sitemap.xml` — 4 new URLs

## Open questions

- Confirm business hours (using Mon–Sat 8am–7pm, Sun by appt as default).
- Share your TikTok URL (will leave a placeholder otherwise).
- Will you upload photos now, or should I use neutral placeholders for the gallery initially?
