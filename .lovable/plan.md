# Live calendar feed for phones and Windows

Your appointments and pending booking requests show up in the calendar apps you already use: Apple Calendar, Google Calendar or Samsung Calendar, and Outlook or Windows Calendar. Their built-in home-screen and desktop widgets then show your schedule with nothing new to install.

## What you get

- **Admin → Settings → Calendar feed** card with:
  - A private feed link and buttons for "Add to iPhone", "Add to Google Calendar" and "Add to Outlook", plus a Copy link button
  - Step-by-step instructions for adding the calendar widget on iPhone, Android and Windows
  - A "Reset link" button that turns off the old link if it ever gets shared
- **What the feed shows** (from today through the next 60 days, plus the past 14 days):
  - **Booked appointments**, titled like "Brake job: John Smith (2017 F-150)". Each shows the address (tap it to open maps), phone number, notes, and a link to open the appointment in the admin area. They're blocked for 2 hours, the same block the booking bot uses.
  - **Pending booking requests**, titled "PENDING: AC diagnosis: Brandon". They're placed in the window the customer picked, like 10am–12pm for Morning, and are marked "tentative" so they look different.
  - Canceled appointments and requests that were declined or already turned into appointments are left out, so nothing shows up twice.
- **How fresh it is:** each time a calendar app checks, it gets the latest data. Google checks every few hours, and Apple and Outlook check about every 15 to 60 minutes. Apple lets you choose "every 5 minutes" in its settings. The instructions will say this.

## Technical details

- New table `calendar_feed_tokens` (user_id, token, created_at). RLS limits access to the owner, and only admins/staff can create a token. RPCs return or rotate the caller's token.
- New public edge function `calendar-feed` (verify_jwt off). `GET ?token=…` looks up the token with the service role, checks that the owner is still admin/staff, and returns `text/calendar` (RFC 5545 VCALENDAR). It sets `X-WR-CALNAME: Garage Ace Schedule`, `REFRESH-INTERVAL;VALUE=DURATION:PT15M` and `X-PUBLISHED-TTL:PT15M`, and uses `America/New_York` VTIMEZONE. Each VEVENT gets a stable UID (`appt-<id>` / `req-<id>`), plus DTSTAMP, LOCATION, DESCRIPTION, URL, and `STATUS:TENTATIVE` for requests. Text is properly escaped and lines are folded.
- Appointment time: `scheduled_at` with a 120-minute duration. If it's missing, the time comes from `requested_date` + the window, using the same mapping as the existing trigger.
- Subscribe links: `webcal://…` for Apple and Outlook, and `https://calendar.google.com/calendar/r?cid=webcal://…` for Google.
- New `CalendarFeedSettings.tsx` component in the admin settings. Update the AGENTS.md rule.

## Not included

- Custom Garage Ace branded widgets (needs separate phone-app code).
- Changing appointments from the calendar app. The feed is view-only, so changes are still made in the admin area.
