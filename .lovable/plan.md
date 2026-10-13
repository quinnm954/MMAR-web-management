# Organize all work by region, with automatic location lookup

## What you'll get
- **One region switch for Admin**, at the top of the admin screens: All regions, Southwest Florida, South Florida, Outside service area. Your choice is remembered and applies to:
  - Booking requests
  - Appointments
  - Calendar (day, week and month views)
  - Estimates
  - Repair orders
  - Invoices
  - Reports: revenue, jobs done, hours per job, labor margin, payment aging, estimate pipeline and ad conversions, plus a side-by-side "By region" comparison card
- **Region tabs with counts on each list**, so you can see how many new or open items each region has without switching.
- **Region label on every item**, such as "Boca Raton · South Florida". South Florida bookings with no tech assigned also get a "Waitlist – no tech" badge.
- **Online booking asks for location access.** When someone books on the website, their phone or browser asks "Allow location?". It's labeled clearly: "Share your location so we send the right mechanic." If they allow it, the exact spot is saved with the request. If they say no, the address they typed is used instead, and booking still works either way.
- **The receptionist asks where the caller is.** While preparing a request, it asks for the city and ZIP code (or a cross street) where the car is, then confirms it back. A phone call can't share GPS, so this is the receptionist's version of location access.
- **Picking the region:** Google Maps turns the shared location, or the city/ZIP/address, into a county:
  - Lee County → Southwest Florida
  - Broward or Palm Beach County → South Florida
  - Anywhere else → Outside service area
  - If nothing can be found, it shows "Location unknown".
- **How the other records get a region:** estimates, repair orders and invoices take it from their linked appointment. Without one, they use the customer's home address.
- **Change it by hand:** a region picker on bookings and appointments for when Google gets it wrong. Linked estimates, orders and invoices follow the change.
- **Existing records:** everything already in Garage Ace gets looked up once so it sorts correctly.

## New receptionist greeting
Every call opens with this greeting, then the receptionist carries on as normal in the language the caller picks:

> "Thanks for calling Mike's Mobile Auto Repair. We're mobile mechanics serving Fort Myers and Lehigh Acres, coming soon to Broward and Palm Beach. We come to you for diagnostics, brakes, starters and alternators, tune-ups and major repairs. For English, say English. Para español, diga español."

- The areas in the greeting update automatically. Once a South Florida tech is assigned, "coming soon to" changes to "and".
- If the caller just starts talking instead of choosing, it answers in whatever language they spoke.
- Known callers still get greeted by name after they pick a language.

## Technical details
- Migration:
  - Add geo fields (`geo_city`, `geo_county`, `geo_lat`, `geo_lng`, `geo_status` = pending/ok/not_found/manual) to `booking_requests` and `appointments`.
  - Add `counties text[]` to `service_regions` (Lee; Broward and Palm Beach), plus an inactive `outside` region.
  - Add `region_slug` to `estimates` and `invoices`, and to `profiles` (customer home region). Repair orders are covered: check whether they live on `appointments` or `estimates` and add it there if needed.
  - Triggers copy the region from the linked appointment, or the customer profile as a fallback, on insert and when the link changes. A trigger on `appointments.region_slug` cascades to linked estimates and invoices.
- New `geocode-region` edge function (service role, `GOOGLE_MAPS_API_KEY` via the gateway): reverse-geocodes `geo_lat`/`geo_lng` when present, otherwise geocodes the address or city+ZIP. It maps `administrative_area_level_2` to a region and updates the row. Manual overrides are left alone. Calls are bounded and deduped by address.
  - Website booking (`Book.tsx` / `QuoteRequestDialog`): a "Share my location" step calls `navigator.geolocation.getCurrentPosition` after a short explanation. Lat/lng go into `submit_booking_request` (new optional `_lat`, `_lng` params; `geo_source = 'device'`). If denied or timed out, the request falls back to the typed address.
  - Receptionist: the prompt requires asking for and confirming city and ZIP (or cross street) before saving any request. The booking tool gets required `service_city` and `service_zip` fields (`geo_source = 'caller'`).
  - Called from `notify-booking-request`, the receptionist booking path, and on appointment create or address change.
  - A one-time backfill runs over bookings, appointments and customer profiles in bounded batches.
- Frontend:
  - New `useAdminRegion` hook (localStorage plus context) and a `RegionSwitch` in the admin header.
  - Each list (`AdminBookingRequests`, `AdminAppointments`, `AdminEstimates`, `AdminRepairOrders`, `AdminInvoices`) adds `.eq('region_slug', …)` when a region is chosen and shows region tabs with counts and a region chip.
  - `AdminCalendar` filters events and blocks; a block with no region shows everywhere.
  - Region picker on booking and appointment detail.
  - Reports (Sales Dashboard and related cards in `AdminDashboard`) filter their invoice, appointment and estimate queries by the chosen region, and add a "By region" card with revenue, jobs and margin per region. Ad conversion events get a region from the page path when it's a city page; otherwise they stay unassigned.
- Update the AGENTS.md region rule (region comes from the geocoded county and is inherited by estimates, orders and invoices) and roadmap.md.
