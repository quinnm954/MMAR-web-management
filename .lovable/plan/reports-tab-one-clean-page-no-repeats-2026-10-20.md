# Reports tab: one clean page, no repeats

Today the Reports tab stacks two separate sections (Sales Dashboard + Profit & invoices), each with its own region switch, revenue headline, chart, average repair order, jobs finished and labor numbers. Merge them into one page with a single set of controls.

## Duplicates removed
- **Two region switches** → one at the top.
- **Two revenue headlines** ("Revenue this month" + "Revenue · This month") → one headline that follows the D/W/M/Y period picker, keeping the monthly goal bar and "on pace for" line when Month is selected.
- **Today / Last 7 days / Year to date mini boxes + 14-day sparkline** → dropped; the period picker shows the same thing.
- **Three revenue charts** (30 days, 12 months, Profit & invoices chart) → one chart that follows the period picker (Year still shows all 12 months).
- **Avg repair order, Jobs finished, Labor hours/hrs per job, Labor margin** shown twice → kept once in the Work and Money groups.
- "Profit & invoices" heading removed.

## Final layout (top to bottom)
1. Daily to-do (unchanged)
2. Filter bar: Region, Period, Current/Previous, Technician, ⋯ menu
3. Headline: revenue, change vs previous, net profit + margin, goal bar, chart
4. Stat groups: **Money** (gross, net, margin, collected vs billed, repeat customer %), **Costs** (parts, tech pay, card fees), **Work** (jobs finished, paid invoices, avg repair order, labor hours)
5. Action groups kept from the dashboard: **Money owed** (unpaid balance, aging), **Pipeline** (open estimates, close rate), **Shop** (open appointments, customers/members)
6. Sales mix + Top customers (side by side on desktop)
7. Website calls & quote requests card
8. Tabs: Breakdown / Invoices / Members / Parts

## Technical details
- Move the unique dashboard pieces (goal, owed, pipeline, shop counts, sales mix, top customers, collected vs billed, repeat %) into AdminReports or into small components it renders; delete AdminSalesDashboard's headline, mini stats, sparkline, performance row and its two charts.
- Reports tab in AdminDashboard renders only the merged page + DailyTodo + AdConversionsCard.
- No calculation changes; report tests stay green. Verify signed in at 393px and 1280px.
