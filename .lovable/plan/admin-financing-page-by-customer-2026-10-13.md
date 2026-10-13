# Admin Financing page (by customer)

Note: the project rule says financing was removed from the app. This page is admin-only, for managing the arrangements you already made (like Jose's), and adds nothing customers see. Approving this plan changes that rule to "no financing offers or customer-facing financing pages; admin can manage existing arrangements."

## What you'll get
A **Financing** page in the admin menu:
- **List by customer**: name, vehicle and repair, total financed, amount paid, balance left, next payment date and amount, and status (Active, Behind, Paid off, Cancelled). Search and filter by status. Customers who are behind show at the top in red.
- **Customer detail** (tap a row):
  - Summary: down payment, principal, interest, total, card on file (brand and last 4), linked invoice.
  - **Signed documents**: the signed agreement (shows the customer's signature and date, your signature, and their initials), plus PDFs you upload, like the card agreement. You can open, download, upload and remove them.
  - **Payment schedule**: every draft with due date, amount and status (Paid, Due, Late, Failed). Buttons: charge now, mark paid (cash or other), skip or reschedule, and add a note.
  - Actions: copy or send the customer's payment page link by text, cancel the arrangement, or mark it paid off.
- **New arrangement**: pick a customer and invoice, enter down payment, rate, number of payments and how often, and first date. It builds the schedule using simple interest, the same way as Jose's.

## Technical details
- New route `/admin/financing-manage` (the existing `/admin/financing` payment view stays), admin-protected, and added to the admin navigation.
- Reads `financing_contracts` and `financing_payments`, and joins to profiles and invoices for display.
- New private storage bucket `financing-docs` (admin-only rules) plus a `financing_documents` table (contract_id, file path, name, uploaded_by, created_at) with grants and admin-only RLS.
- Charge now uses the existing `financing-ach` function (card action). Manual mark-paid updates the payment row and records a note.
- Update the project memory financing rule as described above.
- Check at 390px and desktop with Jose's contract.
