# Notification dots on the admin menu

## What you'll see
- A small red dot on **Workshop**, **Front Desk**, **Admin** and **More** when something new is waiting inside that menu.
- Inside each menu, a red dot (with a count) next to the specific option that has something new, e.g. Bookings, Phone, Repair Orders.
- When you open that option, its dot clears, and the menu's dot clears once nothing new is left inside it.
- Dots update live as new alerts arrive.

## What counts as "new"
Your existing unread alerts (the same ones in the bell). Each alert already points to a screen, so it's matched to the menu option:
- Texts, calls, emails -> Phone
- Booking requests -> Bookings
- Repair order / job alerts -> Repair Orders
- Estimate alerts -> Estimates, invoice alerts -> Invoices, inspection alerts -> Inspections, membership alerts -> Memberships, customer profile changes -> Customers
- Anything else -> Home

Opening an option marks just its alerts as read (so the bell count drops too).

## Technical details
- New `src/lib/adminTabAlerts.ts`: maps a notification (link `?tab=` value, with aliases sms/calls/texts/emails -> phone, booking-requests -> bookings, plus category fallback) to an admin tab value. Small test in `scripts/` for the mapping.
- `AdminDashboard.tsx`: use `useNotifications(200)`, compute unread counts per tab and per group; render dot on group trigger buttons and count badge on dropdown items; on `selectTab` (and initial tab load) mark matching unread notifications read.
- Add `markManyRead(ids)` to `useNotifications`.
- Dot uses `bg-destructive` token.
