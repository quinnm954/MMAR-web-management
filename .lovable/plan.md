# Connect the new Broward Google Business Profile to the South Florida page

## What changes
- **Find the new Broward profile** in your Google account and confirm it's the right one (name, address or service area, verification status).
- **Set its website** to `https://mikesmautorepair.com/south-florida`, so it points to the South Florida page and not your Lee County home page.
- **Check its service areas** list only Broward (and Palm Beach if you want). Your Lee County profile isn't touched.
- **Switch South Florida on for the website:**
  - Google can list the South Florida page and the 8 city pages.
  - They're added to the sitemap, and the city names become clickable.
  - Each page carries a "Now coming to [city]" note telling people to call or text to get on the list. It doesn't promise appointments until a tech is assigned.
- **The receptionist and booking don't change.** South Florida stays waitlist-only: no prices, no times, until you assign a tech.
- **Resubmit the sitemap in Search Console** so Google picks up the new pages.
- **Verification:** if the profile isn't verified yet, I'll show you the verification options. Nothing gets sent until you pick a method.

## What you'll need to do
- Publish after this is built.
- Approve the Google profile changes when the approval card appears.

## Technical details
- Use the Business Profile connector: list accounts and locations, then pick the new Broward location by its exact resource name. Run the PATCH with `validateOnly=true` first, then the real `updateMask=websiteUri`. Read `VoiceOfMerchantState` only. Never start verification automatically.
- Set `SOUTH_FLORIDA_WEBSITE_LIVE = true`. Add a waitlist note to SFL city pages in `CityPage`. Add the SFL entries to `sitemap-locations.xml` and `llms.txt`. The JSON-LD on `/south-florida` turns on through the flag. Keep the home page's Lee County focus.
- Save a memory line with the Broward listing name, service area, verification state, Place ID and account.
