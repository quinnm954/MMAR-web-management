# Fix the customer Invoices screen

## The problem
On the customer Invoices list, Alex's $600 refund receipt (REF-20261017-AO600, recorded as -$600) is treated as an unpaid bill:
- It shows a **Pay** button.
- The "Outstanding balance" box at the top counts every invoice that isn't marked paid, so it adds the -$600 refund. Void and financed invoices also get counted, so the total doesn't add up.

## Changes
1. **No Pay button** on refunds, void invoices, financed invoices, or anything with nothing left to pay. Pay only shows when an invoice is actually unpaid and has money owed.
2. **Outstanding balance** adds up only invoices you can actually pay (unpaid, overdue, or partly paid, with money still owed). Refunds, void and financed invoices are left out.
3. **Refund receipts look like refunds**: they get a "Refunded" tag and show as -$600.00 with the word "Refund". There's no balance line on them.
4. Remove the wrong line under the balance ("We'll automatically charge your authorized payment method…"). It goes back to a plain total with nothing about automatic charges.
5. Check the invoice detail page with the same rules. It already hides Pay when nothing is owed.

## Technical details
- Add `isPayableInvoice(inv)` and `invoiceBalanceDue(inv)` to `src/lib/reportInvoice.ts` (excludes refunded/void/is_financed, due = total - amount_paid > 0). Use them in `PortalInvoices.tsx` and `PortalInvoiceDetail.tsx`.
- Add tests in `scripts/reportInvoice.test.ts`: the -$600 refund is not payable and adds $0 to the balance, and a $1,000 unpaid invoice with $400 paid has a $600 balance.
