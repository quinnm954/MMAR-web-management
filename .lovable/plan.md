# Reports page: cleaner layout

Same numbers and rules — only the look and organization change. Built phone-first (your iPhone), scales up on desktop.

## New layout (top to bottom)

1. **Sticky filter bar** — one compact row: Period chips (D / W / M / Y / Custom), Current/Previous toggle, Technician picker. Less-used actions (Sync Stripe fees, Download for my books) move into a small "..." menu.
2. **Headline card** — big Revenue number, change vs previous period as a colored pill, Net profit + margin underneath, refunds note if any. Chart sits full width below it (taller, with a Revenue / Profit legend and dollar-formatted axis and tooltip).
3. **Three grouped stat sections** instead of 12 identical boxes:
   - **Money** — Gross profit, Net profit, Margin, Membership revenue
   - **Costs** — Parts, Tech pay, Card fees (with a thin bar showing each one's share of revenue)
   - **Work** — Jobs finished, Paid invoices, Avg repair order, Labor hours, Hours per invoice
   Each stat gets a small icon and consistent sizing; 2 per row on phone.
4. **Tabs: Breakdown / Invoices / Memberships / Parts** — moves the long tables (summary by period, invoice detail, membership payments, parts profitability) into one tab strip so the page isn't an endless scroll.
5. **Phone-friendly tables** — on small screens, rows show as stacked cards (date, customer, revenue, net profit, with the rest under a tap-to-expand); full tables on desktop.

## Technical details
- Changes limited to `src/components/admin/AdminReports.tsx` (plus small presentational subcomponents in `src/components/admin/reports/`). No data, calculation, or reportPeriod/reportChart logic changes; existing tests stay green.
- Semantic tokens only; existing primary/accent colors.
- Verify with Playwright at 393px and 1280px signed in.
