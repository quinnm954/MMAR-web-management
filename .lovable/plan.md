# Restore yesterday's jobs, then rebuild Reports

## 1. Restore the 2 deleted jobs (Oct 8)
Found in the change history, both deleted yesterday afternoon, both paid $100 Diagnosis:
- **David Case** — Diagnosis, scheduled Oct 8 2:00 PM, invoice INV-20261008-6cb213 (paid)
- **Edwin Santos Rivera** — Diagnosis, scheduled Oct 8 4:00 PM, invoice INV-20261008-b589b9 (paid)

Steps:
- Put both jobs back exactly as saved (same ID, customer, car, tech, time).
- Mark them **Completed**, with the finish time set to when the invoice was paid.
- Link each paid invoice to its job so the dashboard and books count them (David's invoice is currently unlinked; Edwin's points to another job — I'll check that job and link to the restored one only if the other is a duplicate).

Not restored: Victor Mendoza's Oct 8 diagnosis (also deleted, no invoice) — say if you want it back too.

## 2. Stop accidental loss going forward
- Deleting a job that has a paid invoice is blocked; the button offers **Cancel** instead.

## 3. Rebuild the Reports page (same style as the dashboard)
- **Top:** period picker (Today, Week, Month, Quarter, Year, Custom) with big revenue number, change vs previous period, and a trend line.
- **Profit summary cards:** revenue, collected, parts cost, tech labor cost, card fees, net profit and margin.
- **Charts:** revenue vs profit over time; revenue by service type; payment method split.
- **Jobs:** jobs finished, average ticket, labor hours per job (at $125/hr), top services.
- **Tables (kept, tidier):** paid invoices and membership payments with fees, parts profitability, mobile-friendly with search.
- **Export:** CSV download of the period for your books.
- Uses finish dates and paid dates, matching the dashboard.

## Technical details
- Restore via INSERT from `audit_logs.before_data` for records 6cb213d6… and d3d66309…, set status/board_column completed, completed_at = invoice paid_at; update `invoices.appointment_id`.
- Add a BEFORE DELETE trigger on `appointments` raising when a paid invoice references it.
- Rewrite `src/components/admin/AdminReports.tsx` reusing dashboard card/sparkline components.
