# Garage Ace Home: shortcuts + notifications (replace the car scene)

## What changes
- The Home tab in Garage Ace no longer shows the 3D street-racing scene.
- Home becomes a quick-launch screen:
  1. **Needs attention** – the newest unread notifications (up to 5), each tappable to open the right page and mark it seen, plus "Mark all read".
  2. **Shortcuts grid** – large tiles for your most-used pages, each with a live count and red alert dot:
     - Phone – unread texts/calls/emails
     - Calendar – appointments today
     - Bookings – requests waiting for approval
     - Estimates – drafts / awaiting approval
     - Repair Orders – open jobs
     - Invoices – unpaid
     - Customers, Reports (no count, alert dot only)
  3. **Most used ordering** – tiles sort by how often you open each page (remembered on this device), starting from the order above. A small "More" tile opens the full menu.
- Tapping a tile opens that page; the page's alerts clear as they do today from the menu.

## Out of scope (next conversation)
- Global dynamic themes for the app.

## Technical details
- `AdminDashboard.tsx`: replace `StreetRun3D` in the `dashboard` tab with new `AdminHomeLaunchpad`; record tab opens in localStorage (`ga-tab-usage`) when `activeTab` changes.
- New `src/components/admin/AdminHomeLaunchpad.tsx`: uses `useNotifications` + `tabForNotification` for per-tile dots and the attention list; lightweight head-count queries (`count: 'exact', head: true`) for appointments today (Eastern), pending booking_requests, draft/sent estimates, open repair orders, unpaid invoices. Tiles filtered by the user's roles, semantic tokens only.
- Leave `StreetRun3D.tsx` file unused (not deleted) unless you want it removed.
- Small unit test for the usage-ordering helper.
