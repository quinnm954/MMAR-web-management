# Sales dashboard: cleaner look, more useful numbers

## What changes for you

**Cleaner layout**
- Replace the 12 equal tiles with one large headline row: **Month to Date** (vs last month, up/down arrow and %), a **goal progress bar** toward a monthly target, plus Today, Last 7 Days and Year to Date as smaller figures.
- Group the rest into three short cards: **Money owed** (unpaid invoices, oldest overdue), **Pipeline** (open estimates, approval rate), **Shop** (customers, open jobs, memberships).
- Remove duplicate tiles ("Unpaid Total" repeats "Unpaid Invoices").
- Make headings easier to read. The current all-caps squeezed font is hard to read on charts.
- Show small trend lines inside the headline tiles and placeholder shapes while numbers load, instead of a spinner.

**New performance info**
- **Collected vs billed** this month (cash in vs invoices issued).
- **Estimate close rate**: approved ÷ sent, last 90 days, with the dollar value won.
- **Average days to get paid** after an invoice is issued.
- **Jobs completed** this week/month and **revenue per job**.
- **Repeat customers %**: share of this month's revenue from returning customers.
- **Tech labor cost vs labor billed**: rough labor profit margin from tech pay at the labor rate.
- **Overdue aging**: 0–7, 8–30 and 30+ days, with tap-through to Invoices.

**Fixes to current numbers**
- The "Last 12 Months" chart only loads this year, so Nov and Dec of last year always show $0. It will load a full 12 months.
- "Unpaid" will use the remaining balance (total minus amount paid), not the full invoice total.
- Charts switch to the app colors and show a gentle comparison line for the previous period.

## Question for you
- Monthly revenue goal for the progress bar: I'll start with an editable box on the dashboard (saved per shop). It stays empty until you set it.

## Technical details
- File: `src/components/admin/AdminSalesDashboard.tsx` (rewrite layout; keep recharts).
- Data: one invoice query covering a rolling 13 months (`paid_at`/`created_at`, `amount_paid`, `technician_id`, line items); estimates for the last 90 days (`status`, `total`, `sent_at`/`approved_at`); completed appointments count; tech pay from `employee_pay_defaults`/labor lines. All calculations happen in the browser; no new tables. The monthly goal is stored in `shop_settings` (existing row, new nullable column via migration).
- Chart colors come from CSS tokens (`--primary`, `--accent`) instead of hard-coded HSL.
- Skeleton loaders replace the full-page spinner, and it stays mobile-first (2-column tiles at 390px).
- Check at desktop and phone sizes with Playwright after the build.
