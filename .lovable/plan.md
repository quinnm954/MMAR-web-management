# Prepare Broward and Palm Beach expansion (hidden until launch)

## What you'll get
- A new **South Florida** region, built but switched off. One admin switch, **Launch South Florida**, turns everything on together.
- Garage Ace knows which region each customer, job and tech belongs to. Broward and Palm Beach techs only see South Florida jobs, and Fort Myers techs only see Southwest Florida jobs.
- Website pages are ready for Broward County, Palm Beach County, Fort Lauderdale, Hollywood, Pembroke Pines, Coral Springs, West Palm Beach, Boca Raton, Delray Beach and Boynton Beach. They stay hidden from visitors and Google until launch.
- Same prices, diagnosis fee ($100, $50 credited to labor) and hours everywhere.
- Google: a separate paused ad campaign for the new counties, plus the new pages added to Google's page list at launch. Business Profile service areas get updated once the profile is connected.

## Garage Ace changes
1. **Regions**: Southwest Florida (current) and South Florida (new, off). Customers, appointments, booking requests and techs each get a region. All current records go to Southwest Florida.
2. **Automatic region**: set from the customer's city or ZIP when they book or are added, and you can change it by hand.
3. **Techs**: you pick a tech's region(s) in Admin → Team. Techs only see jobs and customers in their region.
4. **Calendar and open times**: filter by region. Open-time suggestions only offer times when a tech for that region is free. Blocked-off time can be set per region or for everything.
5. **Admin lists** (calls, texts, estimates, orders, invoices, reports): add a region filter. The dashboard can be split by region.
6. **Tech agreement and recruiter contract**: the work area comes from the tech's region (Broward/Palm Beach for South Florida techs).

## Website and receptionist (switched on at launch)
- City and county pages, service-area lists, footer links and sitemap entries for the new areas. They're hidden until launch.
- Until launch, the receptionist still says Fort Myers and Lehigh Acres only. After launch it also accepts Broward and Palm Beach callers and tags their requests South Florida.
- Booking form ZIP check: new-area ZIPs are refused before launch and accepted after.

## Google
- **Search listings**: at launch, the new pages are added to the sitemap and opened to search engines.
- **Ads**: a new paused Search campaign, "Mobile Repair Calls Broward Palm Beach", targeting both counties with the same services as the Fort Myers campaign (diagnostics, brakes, starters, alternators, tune-ups, major repairs). I'll show keywords, ad text and budget for your approval before creating it. It stays paused.
- **New Business Profile for South Florida**: a separate listing with the same business name, phone, website, hours, category and description as the Fort Myers one. It serves Broward and Palm Beach only, and the Fort Myers listing keeps only Fort Myers and Lehigh Acres, so the two never overlap.
  - Google only allows a second listing if the business has a real base in the new region, such as a tech's home or a garage in Broward or Palm Beach. Without one, Google can suspend both listings. I'll need that address. Customers won't see it, but Google mails or texts a code there to verify.
  - The phone number: using (813) 501-7572 on both listings is allowed but can look like a duplicate to Google. A separate number for the new region that rings to the same receptionist is safer. I'll ask which you prefer before creating anything.
  - Photos and logo can't be copied over automatically. After the listing is verified, you add them from the Google Maps app or business.google.com, and I'll give you the exact list to upload.
  - Nothing is created until you approve it on the confirmation card. It's built now but stays out of the website and ads until launch.

## What you'll need to do
- Approve the ad campaign card and the Business Profile connection.
- Give me a real South Florida base address and choose the phone number for the new listing, then complete Google's verification and upload the photos.
- Mark which techs work South Florida.
- Press **Launch South Florida** when ready, then publish and click **Update AI receptionist**.

## Technical details
- Migration: `regions` table (slug, name, active, counties, zip prefixes), `region_id` on customers/profiles, appointments, booking_requests, calendar_blocks; `user_regions` for techs. Backfill to `swfl`. RLS for tech visibility extended with a region match on top of the existing assignment checks.
- Helper `src/lib/regions.ts` (ZIP/city → region), plus a shared `useActiveRegions` hook gating routes, nav, sitemap generation and the robots/noindex state.
- New city/county entries in `src/data/cities.ts` with `region: 'sfl'`, filtered by active regions in pages, footer, `ServiceAreasPreview`, `llms.txt` and the prerender/sitemap scripts.
- `ai-receptionist`, `notify-booking-request` and open-slot logic read active regions from the database instead of hardcoded city lists.
- Ads: `google_ads--create_campaign` Search, PAUSED, location targets for Broward and Palm Beach counties, conversions reusing the existing call and quote actions.
- GBP: connect google_business_profile, read the existing location (title, categories, phone, hours, profile, website). Then search and create a new service-area location (CUSTOMER_LOCATION_ONLY, Broward/Palm Beach place IDs) with a unique requestId, PATCH the existing listing's serviceArea down to the Southwest Florida cities, and run verification on the user's request.
- Add roadmap.md entry: "Second Google Business Profile for South Florida".
- Record the region rule in `AGENTS.md`; update roadmap.md.
