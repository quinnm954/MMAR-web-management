# Turn on South Florida now, with no bookings there until a tech is assigned

## What changes
- **Website goes live for Broward and Palm Beach.** The 8 city pages (Fort Lauderdale, Hollywood, Pembroke Pines, Coral Springs, West Palm Beach, Boca Raton, Delray Beach, Boynton Beach) appear on the site, in the service-area lists and footer, and in Google's page list.
  - Each page carries a "Now coming to [city]" note: call or text (813) 501-7572 to get on the list. It doesn't promise appointments.
- **South Florida is switched on in Garage Ace** (Admin → Settings → Service regions shows it as Live).
- **The receptionist turns away work there until a tech is assigned.**
  - **No South Florida tech yet:** it tells Broward and Palm Beach callers "We're expanding there soon but aren't booking yet." It offers to take their name, number and what they need. It quotes no price, books no time and promises no date. Those calls are saved like any other call, tagged South Florida, so you have a waiting list.
  - **Once you tick a tech for South Florida** in Service regions and tap **Update AI receptionist**, it starts accepting those callers normally.
- **Website booking requests from the new area** still come in, tagged South Florida. While there's no tech, the customer is told they're on the waiting list and nothing is scheduled.
- **The Fort Myers and Lehigh Acres listing and ads don't change.**

## What you'll need to do
- Publish so the website pages go live.
- Tap **Update AI receptionist** after this is built, and again when you add a South Florida tech.

## Technical details
- Set `SOUTH_FLORIDA_WEBSITE_LIVE = true`, add a "coming soon / waitlist" note to SFL city pages (`CityPage` checks the city's region), and add the cities to `ServiceAreasPreview`, `ServiceAreas` copy, `llms.txt` and `public/sitemap-locations.xml` (re-run the sitemap script).
- Set `service_regions.active = true` for `sfl`.
- `ai-receptionist` setup: split regions into "served" (active and at least one row in `user_service_regions`) and "waitlist" (active, no tech). The prompt lists served cities as the service area and waitlist cities with the refuse-and-take-details rule. The booking webhook rejects any request whose address resolves to a waitlist region (`region_for_address`), as a backstop.
- `submit_booking_request` stays as is. The admin booking list shows a "Waitlist – no tech" badge when the region has no tech. The confirmation text/email for those requests uses waitlist wording instead of a scheduling message.
- Update the AGENTS.md region rule ("a region accepts work only when active and staffed") and roadmap.md.
