# Move dashboard into Reports, then a new 3D Florida dashboard

## 1. Reports gets everything the dashboard has
Add to Reports what isn't there yet:
- Today's to-do card (drafts, expiring estimates, unpaid over 7 days, booking requests, unanswered texts, stuck jobs)
- Monthly goal with progress bar and "Set a goal"
- Today / Last 7 days / Year to date with trend lines and month pace
- Collected vs billed, returning-customer share, labor margin
- Money owed with aging (0–7 / 8–30 / 30+ days)
- Pipeline (open estimates, close rate, value won)
- Shop card (jobs done, revenue and hours per job, open appointments, customers, members)
- 12-month chart, 30-day vs previous 30 days, sales mix (diagnosis / labor / parts)

Same numbers and live updates as today.

## 2. New dashboard: 3D Southwest Florida
A full-screen 3D map of your service area that you can spin, tilt and pinch.

- **Raised land:** Southwest Florida coastline lifted off a dark ocean, with the Gulf, bays and islands (Cape Coral, Fort Myers, Estero, Naples, Immokalee and the other towns you serve).
- **Revenue towers:** each town rises as a glowing column. Height = money earned there, color goes blue to gold as it earns more.
- **Today's jobs:** pins float above each job's address, pulsing by status (scheduled, in progress, done). Tap a pin for customer, car and time.
- **Time slider (the 4th dimension):** drag or press play to watch towers grow week by week across the year.
- **Live:** when an invoice is paid, a gold ripple spreads from that town.
- **Small top bar:** this month's revenue, goal progress and the to-do count, plus a "Full report" button to Reports.
- Works with touch on your phone.

Towns are placed by name from each job's address or the customer's saved address. Jobs with no clear town are listed under "Other".

## Technical details
- Move dashboard sections from `AdminSalesDashboard.tsx` into reusable parts and show them inside `AdminReports.tsx`.
- New `FloridaMap3D` with `three`, `@react-three/fiber@^8.18`, `@react-three/drei@^9.122`. Coastline is a built-in, simplified outline extruded into land (no map service or key needed). Towns are mapped to fixed coordinates in a town lookup table. Instanced towers, OrbitControls, Lightformer environment (no CDN presets), DOM overlay for slider and labels.
- Data: paid invoices joined to appointments/profiles for the town, plus today's appointments, with the existing realtime refresh.
- The dashboard tab renders `FloridaMap3D` in place of the old cards. Check with screenshots on desktop and a 390px phone.
