# Google ranking audit and fixes: Fort Myers and Lehigh Acres

## What Search Console shows (Sep 23 to Oct 20)
- 3,261 views and 34 clicks. Average position is about 17.
- "mobile mechanic near me" sits around #5. "mobile mechanic lehigh acres fl" is around #20. The Fort Myers mobile mechanic page is around #20. Battery replacement in Fort Myers is around #30.
- Google is still showing pages we removed, such as tire service, Estero and Cape Coral. Any ranking strength those pages earned is being lost.

## Step 1: Audit (read only)
- Business Profile: categories, services list, service areas, description, hours, photos, review count, and how replies are going. Check the profile's search terms and how many views it gets.
- Search Console: pull the full list of searches and pages for brakes, starter, alternator, diagnostics, battery and AC, and note which page Google ranks for each. Look for spots where two pages compete for the same search.
- Semrush: see which competitors rank in the top 3 for those searches and what their pages have that yours don't.
- Website: check the service and city pages for thin or repeated text, titles, internal links, and broken links to removed pages.

## Step 2: Fixes
**Website**
- Send each removed page (tire service, Estero, Cape Coral and the other removed cities) to the closest live page, so its ranking strength isn't lost.
- Give each main repair one strong page each for Fort Myers and Lehigh Acres: brakes, starter, alternator, battery, diagnostics, AC and tune-up. Each page gets unique local text, real prices only where you've confirmed them, and questions customers actually ask.
- Tighten titles and descriptions so each page aims at one search, such as "Mobile Brake Repair in Lehigh Acres, FL".
- Link the home page, the services page and the city pages to these repair pages.
- Update the sitemap and resubmit it.

**Business Profile** (each change goes through an approval card)
- Add secondary categories where they fit, like Auto electrical service and Brake shop.
- Rewrite the description around your main repairs and the two cities. No financing, no same-day promises.
- Point the services list at the matching website pages where Google allows it.
- Post a weekly update for each main repair. You approve each post.
- Reply to any unanswered reviews.

## What you'll need to do
- Approve the Business Profile changes when the cards appear.
- Add fresh job photos in the Google Business app. They can't be uploaded from here.
- Ask happy customers to mention the repair and the city in their reviews.
- Publish after the website changes are made.

## Technical details
- Add 301 rules to `public/_redirects` for every removed URL that shows up in GSC.
- Refine `localLandingPages.ts` entries and the city and service matrix. Avoid near-duplicate pages, keep one canonical per search intent, and regenerate the sitemaps.
- Business Profile: run PATCHes with `validateOnly` first, then batch them under one updateMask. Local posts go through `my_business` v4.
- No changes to the South Florida pages or the ad campaign.
