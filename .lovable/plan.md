# Move dashboard into Reports, then a new 3D "Shop Pulse" dashboard

## 1. Reports gets everything the dashboard has
Add to Reports what isn't there yet:
- Today's to-do card (drafts, expiring estimates, unpaid over 7 days, booking requests, unanswered texts, stuck jobs)
- Monthly goal with progress bar and "Set a goal"
- Today / Last 7 days / Year to date with 14-day trend lines and pace for the month
- Collected vs billed, returning-customer share, labor margin
- Money owed (unpaid balance, days to get paid, 0–7 / 8–30 / 30+ aging)
- Pipeline (open estimates, close rate, value won)
- Shop card (jobs done week/month, revenue and hours per job, open appointments, customers, members)
- 12-month chart, 30-day chart vs previous 30 days, sales mix (diagnosis / labor / parts)

Same numbers and rules as today; live updates kept.

## 2. New blank-slate 3D dashboard: "Shop Pulse"
A full-screen 3D scene you can spin, pinch and tap. The 4th dimension is time: a slider and play button replay your shop day by day.

- **Time spiral:** every day of the last 12 months is a glowing bar wound into a spiral. Height = revenue, color = profit (blue to gold). Tap a bar for that day's total and jobs.
- **Play button (time travel):** sweeps through the year; the spiral grows day by day while a counter shows running revenue.
- **Floating orbs:** this month's revenue, goal progress (orb fills up), money owed and open estimates. Tap one to open its page.
- **Live pulse:** when an invoice is paid, a gold ripple shoots out from today's bar.
- Dark sky with brand blue and gold; works on phone with touch.
- A small "Details" button opens Reports for the full numbers.

## Technical details
- Extract dashboard sections from `AdminSalesDashboard.tsx` into reusable pieces and render them inside `AdminReports.tsx`.
- New `ShopPulse3D` using `three`, `@react-three/fiber@^8.18`, `@react-three/drei@^9.122` (React 18). Instanced bars for performance, OrbitControls, Lightformer environment (no CDN presets), DOM overlay for slider/labels.
- Data from the same paid-invoice queries plus realtime channel; dashboard tab renders `ShopPulse3D` instead of the old cards.
- Verify with screenshots on desktop and 390px phone.
