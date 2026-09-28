# Fleet Prospecting in Garage Ace

## What you'll get
A new **Prospecting** tab in Admin, for owners and admins only. It finds service businesses in Fort Myers and Lehigh Acres, writes a Fleet Partner Plan pitch for each one, and then:
- **Calls:** gives you a call list. Tap a business to call it from Garage Ace, with the pitch script on screen. Log how it went: interested, callback, not interested, or do not call.
- **Emails:** sends pitch emails automatically, with two follow-ups, a daily sending limit, and an unsubscribe link in every email.

No automated calls or texts go out, which keeps you within federal law (TCPA) and protects the texting approval on your 813 number.

## How it works
1. **Find leads.** Choose categories such as landscaping, HVAC, plumbing, pest control, pool service, roofing, electrical, cleaning, and car dealers. Pick Fort Myers, Lehigh Acres, or both, then click Search. Results come from Google Maps: name, phone, website, address, and rating. Businesses you've already found are skipped.
2. **Find emails.** For businesses with a website, the app checks their homepage and contact page for a public email address.
3. **Write the pitch.** AI writes a short pitch for each business type. For example, a landscaper hears about keeping trucks and trailers running during peak season. It includes no prices, which matches the Fleet page and brochure.
4. **Review, then send.** Emails start as drafts. You approve them one at a time or all at once. After that, a background job sends a few each hour, up to about 30 a day, and follows up on days 4 and 10 if there's no reply.
5. **Track results.** A board shows each lead's stage: New, Contacted, Interested, Callback, Won, Lost, or Do Not Contact. When someone unsubscribes or you mark them do not contact, they're excluded permanently.

## What you'll need to provide
- **Google Maps connection:** one click. Searches are capped per run to keep costs low.
- **An email sending service** such as Resend, plus a separate sending address like `fleet@mikesmautorepair.com`. The built-in site email is for customer messages only. Using it for cold email could hurt delivery of your appointment and invoice emails. I'll walk you through setup (about 10 minutes).
- **Your business mailing address** for the email footer. The law (CAN-SPAM) requires it.

## Technical details
- New tables `prospects` (place_id unique, name, category, city, phone, website, email, stage, do_not_contact, notes, last_contacted_at), `prospect_touches` (channel, direction, outcome, body, sent_at), and `prospect_email_suppressions`. Each table gets GRANTs and RLS limited to admin/owner through `has_role`.
- Edge function `prospect-search`: admin JWT required. Calls Places `searchText` through the Google Maps connector gateway with a limit of 20 results × the selected categories per run, dedupes on place_id, and handles 403 errors separately.
- Edge function `prospect-enrich`: bounded homepage/contact-page fetch with an email regex, 10 sites per call.
- Edge function `prospect-pitch`: Lovable AI Gateway Responses API, `openai/gpt-6-astra`, streamed, one pitch per category (cached), then personalized with the business name. Returns email subject and body plus a call script.
- Edge function `prospect-email-worker`: runs hourly via pg_cron. Uses a single-flight lease row, a batch of 5, a daily cap, and idempotent touch records. Checks suppression before every send. On 402/403/repeated 429 it pauses the queue and shows why in Admin. It adds a List-Unsubscribe header and link.
- Public edge function `prospect-unsubscribe` (signed token) adds the address to the suppression list.
- UI: `AdminProspecting.tsx` with search, lead table, pitch drawer, call button that reuses `dialInApp`, outcome logging, and an email queue status panel. Registered as an OWNER_ADMIN tab in `AdminDashboard.tsx`.
