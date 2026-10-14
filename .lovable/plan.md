# Jose Navas: finance invoice, half payment, full tech labor

## What's there now
- Invoice INV-20261009-b00997 ($1,613.32, Hyundai Kona timing chain) still shows **unpaid, $0 paid**.
- His $806.66 down payment was paid by card on Oct 13, but only on the financing schedule, not on the invoice.
- Tech on the invoice: Mike. Labor on the invoice: 7.5 hours. Tech pay only counts **paid** invoices, so these 7.5 hours aren't counted yet.

## Changes
1. **Record the half payment on the invoice**: add an $806.66 card payment dated Oct 13, labelled "Down payment (50%) - financing". The invoice will show $806.66 paid and $806.66 still owed.
2. **Mark it as a finance invoice**: add a "Financed" tag to the invoice in the admin list, on the repair order and on Jose's invoice page, with a note: "Balance of $806.66 + interest is paid weekly under the financing agreement." Automatic reminders and the "Pay" button for the full balance are turned off for financed invoices, so Jose isn't asked to pay twice.
3. **Keep it in sync from now on**: each weekly payment that goes through on the financing schedule is also added to the invoice. When the last payment is made, the invoice shows paid in full. Interest stays on the financing side and isn't counted as invoice revenue.
4. **Pay the tech full labor**: financed invoices count toward tech hours and pay once the down payment is paid, at the full 7.5 hours (not half). This also applies to future financed jobs.

## Technical details
- Migration: `invoices.is_financed boolean default false`; set true where a `financing_contracts.invoice_id` exists.
- Data: insert `invoice_payments` row (806.66, method `card`, reference = Stripe id) for Jose; existing `recalc_invoice_payment_totals` trigger updates amount_paid/status.
- Trigger on `financing_payments` status -> paid: insert matching invoice_payments row (principal share only, capped at the remaining balance), idempotent by reference.
- `my_tech_earnings` and Admin Reports tech-hours: treat `status='paid' OR (is_financed AND down payment paid)` as payable.
- followup-worker: skip invoice reminders when `is_financed`. Portal invoice: hide the full-balance Pay button and show the financing note when financed.
