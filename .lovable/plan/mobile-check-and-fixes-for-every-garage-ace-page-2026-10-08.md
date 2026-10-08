# Mobile check and fixes for every Garage Ace page

Goal: every screen and pop-up in Garage Ace works on a phone, with no sideways scrolling, nothing cut off, buttons big enough to tap, and Save/Send always reachable. To keep credit use low, one automated sweep finds the problems first, and fixes go into shared pieces wherever possible.

## 1. One automated sweep (phone size, 390px wide)
Sign in once as admin and visit every screen:
- Admin: Dashboard and every tab (Bookings, Calendar, Estimates, Invoices, Repair Orders, Customers, Employees, Workshop/Inspections, Calls, Texts, Emails, Phone, Prospecting, Fleet, Reports, Settings, Tech Agreements)
- Tech: Dashboard, Jobs, Customers, History, Inspections, Checklists
- Customer portal: every menu page (Dashboard, Vehicles, Maintenance, Membership, Appointments, Estimates, Repair Orders, Service History, Recommendations, Vehicle Health, Inspections, Invoices, Financing, Fleet, Messages, Notifications)
- Shared pages: Login, Set Password, Install, Estimate approval, Inspection report, Enrollment, Tech agreement signing
- On each page, open its main pop-up (New/Edit buttons) too

Each screen gets an automatic check for sideways overflow, content wider than the screen, and buttons cut off. It also gets one screenshot.

## 2. Fix by category, not one at a time
- Wide tables: on phones they scroll inside their card or switch to stacked cards (for example customers, invoices, calls, employees, reports)
- Pop-ups: the full-screen phone layout already exists. Fix any pop-ups that override it or don't use the shared pop-up.
- Rows of buttons and tabs: they wrap or scroll sideways inside their own strip, never across the whole page
- Forms: side-by-side fields stack on phones
- Admin and Tech page frames: one fix covers every page that uses them

## 3. Re-check
Run the same sweep again and confirm no page overflows. Then send you a short list of what was fixed and anything that's still left.

## Technical details
- A Playwright script under /tmp/browser/mobile-sweep at 390x844 measures `document.documentElement.scrollWidth > innerWidth`. It also lists elements whose right edge is past the viewport, and logs selector/route.
- Shared fixes: a `Table` wrapper (`overflow-x-auto`) in src/components/ui/table.tsx, `TabsList` with `flex-wrap`/`overflow-x-auto`, and `DialogContent` overrides like `max-w-*` without `sm:`. Per-file fixes only where the sweep flags them.
- No changes to how anything works, only to layout.
