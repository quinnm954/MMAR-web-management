## Goal

Make membership signups actually complete the Stripe charge (deposit + monthly subscription), then record every membership payment locally so admin reports show correct revenue, Stripe fees, and totals.

## Problems found

1. **Checkout fails immediately.** `create-membership-checkout` passes `subscription_data.add_invoice_items`, which is not a valid Stripe parameter. Edge function logs show every signup returning `parameter_unknown`. The one membership in the DB (`status='pending'`, `deposit_paid=false`, no `stripe_subscription_id`) confirms no customer has ever actually paid.
2. **Membership revenue is invisible to reporting.** `AdminReports` pulls from the `invoices` table only. Subscription deposits and monthly recurring charges are never written there, so revenue, Stripe fees, and totals are understated.
3. **No record of individual membership payments.** There's no `membership_payments` table, so we can't audit what each member has been charged or reconcile against Stripe.

## Fix plan

### 1. Fix Stripe Checkout session creation
In `supabase/functions/create-membership-checkout/index.ts`, charge the deposit as a second `line_items` entry (Checkout in subscription mode accepts mixed one-time + recurring line items) instead of using `subscription_data.add_invoice_items`:

```
line_items: [
  { price: plan.stripe_price_id, quantity: 1 },               // recurring monthly
  ...(depositCents > 0 ? [{                                   // one-time deposit
    quantity: 1,
    price_data: {
      currency: "usd",
      unit_amount: depositCents,
      product_data: { name: `${plan.name} — Membership Deposit (non-refundable)` },
    },
  }] : []),
],
```

Drop the broken `subscription_data.add_invoice_items` block. Keep the metadata.

### 2. New `membership_payments` table
Migration to create a normalized record of every charge tied to a membership:

- `membership_id`, `kind` ('deposit' | 'subscription'), `amount`, `stripe_invoice_id`, `stripe_payment_intent_id`, `stripe_charge_id`, `stripe_fee`, `period_start`, `period_end`, `paid_at`, `status`.
- Unique on `stripe_invoice_id` so retried webhooks don't double-insert.
- RLS: members read their own rows; admins read all; service role writes.
- GRANTs for `authenticated` and `service_role`.

### 3. Webhook: record every Stripe invoice for membership subs
Extend `supabase/functions/stripe-webhook/index.ts`:

- On `invoice.payment_succeeded` where `invoice.subscription` is set, look up the membership by `stripe_subscription_id`. For each line item, classify deposit vs recurring (by price_id vs the plan's `stripe_price_id`), then upsert a `membership_payments` row including the Stripe fee from the charge's balance transaction.
- Continue updating `memberships.next_billing_date` and (newly) `current_period_end`.
- On `invoice.payment_failed`, set `memberships.status = 'past_due'`.
- On `charge.refunded` for a membership invoice, mark the matching `membership_payments` row as `refunded`.

### 4. Surface membership revenue in admin reports
In `src/components/admin/AdminReports.tsx`:

- Fetch `membership_payments` for the same date window alongside `invoices`.
- Add membership revenue and Stripe fees into the existing Summary buckets (day/week/month/year) and KPI totals.
- Add a Memberships section to the Detail tab showing each charge (member name, plan, kind, amount, fee, paid_at) with the same D/W/M/Y filtering.

### 5. Extend Stripe fee sync to memberships
Update `supabase/functions/sync-stripe-fees/index.ts` to also iterate `membership_payments` rows missing `stripe_fee` and backfill them from the balance transaction, same pattern as invoices.

### 6. Verification checklist
- Submit a test signup → Checkout opens with two line items (monthly + deposit), payment succeeds.
- Webhook activates membership, sets `stripe_subscription_id`, `deposit_paid=true`, and writes a `deposit` + `subscription` row in `membership_payments`.
- Admin → Reports shows the new revenue under the selected period, with the Stripe fee populated after sync.
- Member portal still shows their active membership.

## Files touched

- `supabase/functions/create-membership-checkout/index.ts` (fix line items)
- `supabase/migrations/<new>.sql` (create `membership_payments` + RLS + grants)
- `supabase/functions/stripe-webhook/index.ts` (record payments, handle failed/refunded)
- `supabase/functions/sync-stripe-fees/index.ts` (cover membership payments)
- `src/components/admin/AdminReports.tsx` (include membership revenue/fees in summary + detail)
