# Make /south-florida a copy of the home page for Broward & Palm Beach

## What changes
- **/south-florida becomes the South Florida home page.** It uses the same design as your main home page, in the same order, with the same car background:
  - menu, hero, trust badges, featured services, service areas, reviews, why choose us, services overview, popular local services, photo gallery, questions, voice answers, final call box, footer, call button.
- **Only the location wording changes:**
  - Fort Myers and Lehigh Acres become Broward and Palm Beach.
  - The service-area tiles become the 8 East Coast cities.
  - Local details change to I-95, the Turnpike, salt air, and condo and office lots.
  - Prices, the diagnosis fee, hours, the phone number, "next-day" and the warranty all stay the same.
- **The "coming soon" note stays honest.** Until you assign a South Florida tech, the hero says you're now coming to Broward and Palm Beach and asks people to call or text to get on the list. The note disappears once a tech is assigned.
- **Reviews and photos are from Lee County jobs.** The reviews section shows your real Google reviews, labeled as customer reviews and not tied to an East Coast city. The photo gallery uses neutral captions with no Lee County place names, so nothing claims work you haven't done there.
- **Links stay on the right side of the state.** On the South Florida page, the logo, "Service areas" and the footer city list point to South Florida pages, and the footer adds a small link to Fort Myers and Lehigh Acres. The main home page doesn't change at all.
- **Google sees two separate home pages.** Each page gets its own title, description, business info and service area, so neither one competes with the other.

## Technical details
- Add a `region` prop ('swfl' default | 'sfl') to Hero, FeaturedServices, ServiceAreasPreview, TestimonialsPreview, WhyChooseUs, HomeServicesOverview, PopularLocalServices, LocalPhotoGallery, HomeFAQ, VoiceSearchAnswers, FinalCTA and Footer. Keep the SFL copy in one `src/data/regionHomeCopy.ts` so the SWFL text stays byte-identical.
- Extract the Index layout into `RegionHome` and have Index render `<RegionHome region="swfl" />` and SouthFlorida render `region="sfl"`. Per-region `useSeo` and JSON-LD come from the existing SouthFlorida page.
- The waitlist banner is shown when `service_regions` 'sfl' has no row in `user_service_regions`. It reads through a public-safe RPC or a static flag; check RLS on both tables first.
- Verify with Playwright screenshots of `/` (unchanged) and `/south-florida` side by side.
- Add the AGENTS.md rule: "regional home pages share one layout via a region prop; why: identical design with only local copy".
