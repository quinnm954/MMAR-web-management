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
- **Automatic location lookup:** Google Maps finds each customer's address when a booking or appointment comes in, then picks the region by county:
  - Lee County → Southwest Florida
  - Broward or Palm Beach County → South Florida
  - Anywhere else → Outside service area
  - If Google can't find the address, it shows "Location unknown".
- **How the other records get a region:** estimates, repair orders and invoices take it from their linked appointment. Without one, they use the customer's home address.
- **Change it by hand:** a region picker on bookings and appointments for when Google gets it wrong. Linked estimates, orders and invoices follow the change.
- **Existing records:** everything already in Garage Ace gets looked up once so it sorts correctly.

## Technical details
- Migration:
  - Add geo fields (`geo_city`, `geo_county`, `geo_lat`, `geo_lng`, `geo_status` = pending/ok/not_found/manual) to `booking_requests` and `appointments`.
  - Add `counties text[]` to `service_regions` (Lee; Broward and Palm Beach), plus an inactive `outside` region.
  - Add `region_slug` to `estimates` and `invoices`, and to `profiles` (customer home region). Repair orders are covered: check whether they live on `appointments` or `estimates` and add it there if needed.
  - Triggers copy the region from the linked appointment, or the customer profile as a fallback, on insert and when the link changes. A trigger on `appointments.region_slug` cascades to linked estimates and invoices.
- New `geocode-region` edge function (service role, `GOOGLE_MAPS_API_KEY`): geocodes an address, maps `administrative_area_level_2` to a region, and updates the row. Manual overrides are left alone.
  - Called from `notify-booking-request`, the receptionist booking path, and on appointment create or address change (client call after save).
  - A one-time backfill runs over bookings, appointments and customer profiles in bounded batches.
- Frontend:
  - New `useAdminRegion` hook (localStorage plus context) and a `RegionSwitch` in the admin header.
  - Each list (`AdminBookingRequests`, `AdminAppointments`, `AdminEstimates`, `AdminRepairOrders`, `AdminInvoices`) adds `.eq('region_slug', …)` when a region is chosen and shows region tabs with counts and a region chip.
  - `AdminCalendar` filters events and blocks; a block with no region shows everywhere.
  - Region picker on booking and appointment detail.
  - Reports (Sales Dashboard and related cards in `AdminDashboard`) filter their invoice, appointment and estimate queries by the chosen region, and add a "By region" card with revenue, jobs and margin per region. Ad conversion events get a region from the page path when it's a city page; otherwise they stay unassigned.
- Update the AGENTS.md region rule (region comes from the geocoded county and is inherited by estimates, orders and invoices) and roadmap.md.
