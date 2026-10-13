# Booking requests organized by region, with automatic location lookup

## What you'll get
- **Region tabs at the top of Admin → Booking requests:** All, Southwest Florida, South Florida, and Outside service area. Each tab shows a count of new requests.
- **Region label on every request**, such as "Fort Myers · Southwest Florida". South Florida requests with no tech assigned also show a "Waitlist – no tech" badge.
- **Automatic location lookup:** Google Maps finds each customer's address when the request comes in, from the website, the receptionist or the phone. It records the city, county and a map pin, then picks the region by county:
  - Lee County → Southwest Florida
  - Broward or Palm Beach County → South Florida
  - Anywhere else → Outside service area
  - If Google can't find the address, the request shows "Location unknown". You can still set the region by hand.
- **Change region by hand:** a small region picker on each request, in case Google gets it wrong.
- **Existing requests:** all past booking requests get looked up once so they sort correctly.

## Technical details
- Migration: add `geo_city`, `geo_county`, `geo_lat`, `geo_lng`, `geo_status` ('pending' | 'ok' | 'not_found' | 'manual') to `booking_requests`. Add an `outside` row to `service_regions` (inactive) so out-of-area requests have a region value. Add a `counties text[]` column to `service_regions`, filled with Lee, Broward and Palm Beach.
- New edge function `geocode-booking` (service role): calls Google Geocoding with `GOOGLE_MAPS_API_KEY` for the service address, reads `administrative_area_level_2` and `locality`, maps the county to a region, and updates the row. Skip rows set to `manual`.
- Run it from `notify-booking-request` after submission, and from the receptionist booking path. A one-time backfill runs over all existing rows (bounded batches).
- The address-text trigger stays as the instant first guess. The geocode result replaces it, unless the region was set by hand.
- `AdminBookingRequests.tsx`: region tabs with counts, a region and city chip per card, a waitlist badge (region active and no tech in `user_service_regions`), and a region select that saves `region_slug` with `geo_status = 'manual'`.
- Update the AGENTS.md region rule to say regions come from geocoded county.
