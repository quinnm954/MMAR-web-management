---
name: repair-estimate-pricing
description: Use when creating, editing or reviewing MMAR/Garage Ace estimates, repair orders, invoices, labor hours, parts pricing, diagnosis fees, refunds or technician pay. Triggers on "estimate", "labor", "invoice", "diag", "tech pay", "parts", "PartsTech", "repair order".
---

# Repair estimate & pricing rules

## Labor
- Customer labor rate is $125/hour. Labor hours on a line = charge ÷ 125; bill in 15-minute increments.
- Labor line qty 1 = hours × unit price. Parts = qty × unit price.
- When a job has several labor items from a labor guide, use the cheapest-to-most-expensive range and, for overlapping items, keep only the highest labor value — overlapping procedures shouldn't be billed twice.
- Pick labor times matching the vehicle's engine size; ask for engine size if unknown.

## Diagnosis
- Diagnosis/diags/diagnostics/inspection = $100, with $50 credited toward repair labor if the customer proceeds. Calendar slot is 1 hour.
- Vague or unknown problems get the diagnosis fee, never a guessed repair price — clarify the repair before quoting.

## Technician pay
- Techs earn $40 per labor hour, flat, no base pay. Financed invoices still pay full labor.
- Refund receipts reduce revenue/profit on their completion date but never count as sales, labor or tech pay (see `src/lib/reportInvoice.ts`).

## Documents
- Repair-order names come from approved estimate repair lines, preferring labor descriptions.
- A repair order needs a linked vehicle before starting or invoicing.
- Invoice notes show only when filled in.
- Estimate/invoice copy states cash isn't accepted and customers pay the invoice, not the technician.
- Never advertise financing anywhere (estimates, invoices, site). Financing is handled privately in Admin → Financing only.

## Parts
- Parts pricing is entered manually or via PDF import from PartsTech/First Call quotes. PartsTech punchout needs separate shop credentials and Garage Ace software-partner credentials — never substitute one for the other.

## Services not offered
- No tires, alignments, mobile tire service or pre-purchase inspections. Oil changes only for MMAR Care subscribers.
