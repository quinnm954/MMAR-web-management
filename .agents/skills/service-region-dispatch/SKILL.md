---
name: service-region-dispatch
description: Use when scheduling, assigning techs, changing service areas or regions, blocking calendar time, or handling Broward/Palm Beach/South Florida expansion in Garage Ace. Triggers on "region", "assign tech", "calendar", "block off", "service area", "dispatch", "booking".
---

# Service regions & dispatch

## Regions
- Regions live in `service_regions` (active = launched); techs are linked via `user_service_regions`.
- Southwest Florida is active; the website advertises only Fort Myers and Lehigh Acres as service areas.
- A launched region with no assigned tech is waitlist-only: take details, offer no slots or prices — never book work nobody can do.
- Bookings/appointments get `region_slug` by trigger from the service address. Don't set it by hand.
- Website South Florida pages are gated by `SOUTH_FLORIDA_WEBSITE_LIVE` in `src/lib/regions.ts` (site is pre-rendered).

## Assignment
- New appointments auto-assign the region's only tech. With several techs, `needs_tech_choice` is set and staff are alerted; never overwrite a manual pick.

## Scheduling
- Hours: Monday–Saturday, 8 AM–8 PM Eastern. Always offer the earliest open time, starting next day.
- Duration: diagnosis/inspection = 1 hour; repairs use estimated labor time (15-min rounding, 30-min minimum), default 2 hours.
- Bookings are never automatic: requests wait for Mike to approve and schedule.
- Blocked time lives in `calendar_blocks` (global, Eastern time); open slots, the admin calendar and ICS feed must all honor it.
- Confirmed time changes on approved-estimate repair orders send email and text automatically.
