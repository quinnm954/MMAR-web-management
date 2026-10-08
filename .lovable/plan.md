# Prospecting: group by service type, fresher emails, better delivery

## Why the emails get little attention
- Every lead gets nearly the same pitch ("Fleet Partner Plan... Yard Days... digital fleet health reports"). It reads like a mass email.
- It arrives as a designed newsletter-style email from a no-reply sender, which tends to land in Promotions or spam.
- Cold sales emails also aren't allowed through the app's built-in email sender, which is meant only for customer emails such as estimates, invoices and reminders. Sales outreach there can hurt delivery of your invoices and estimates.

## Changes

### 1. Organize the list by service type
- Tabs across the top of the list: All, Roofing, Construction, Used car dealers, Plumbing, Pest control, Electrical, HVAC, Cleaning, Landscaping. Each tab shows a count.
- Inside each tab, leads are grouped as: Ready to approve, First email pending, Follow-up scheduled, Done, Needs email.
- Each tab gets an "Approve all in this group" button, so you can roll out one trade at a time.

### 2. Creative, trade-specific emails
New short, personal emails (about 80 words, plain text, signed by Mike), written for each trade's real pain point. Examples:
- **Roofing:** "Your crew can't shingle a roof from the side of I-75. When a truck's down, I come to your yard..."
- **Used car dealers:** "Every day a car sits waiting on a starter is a day it isn't on the front line. I do reconditioning repairs right on your lot."
- **Pest control / HVAC / plumbing:** "A van down means missed calls that go to your competitor."
- **Cleaning / landscaping:** "Oil changes and brakes done at your lot while the crew is out."

Each email has:
- A curious, specific subject (for example "Quick question about your trucks, {{name}}"). No sales words.
- One easy ask: "Worth a 10-minute visit to your yard?"
- A light offer: free fleet check on the first visit, for up to 3 vehicles.

The three-email sequence changes too. Day 1 is the intro, day 4 a one-line follow-up ("Did this get buried?"), and day 10 a short "last note" with a real repair example. I'll regenerate all unsent drafts and future follow-ups with the new style. Emails already sent are not changed.

### 3. Send from your own Outlook instead
Prospecting emails send from your connected Outlook inbox as normal one-to-one emails from Mike. Replies land right in your Phone page's Email inbox. The daily limit stays (default 30 a day, spread across business hours) to protect your Outlook account.

## Things to confirm
- The free fleet check for up to 3 vehicles is my suggestion. Tell me if you'd rather offer something else, or nothing.
- Outlook.com accounts have their own daily sending limits, so I'll keep volume low (30 a day or fewer).

## Technical notes
- UI: `AdminProspecting.tsx` gets category tabs from `prospects.category` with counts, and grouped sections that reuse the status logic.
- Copy: `prospecting` pitch generation uses a per-category prompt map (pain point, hook, example) for plain-text 3-step sequences, stored in `email_subject`/`email_body` with per-step variants. Unsent rows are regenerated.
- Sending: `prospect-email-worker` switches from `sendAndLog`/`fleet-outreach` to an Outlook Graph `/me/sendMail` call through the connector, keeps the suppression/do-not-contact checks, and logs to `email_send_log` so the Phone page still shows sent outreach. Includes your mailing address and an "reply STOP to opt out" line (CAN-SPAM).
