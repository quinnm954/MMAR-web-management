# New payment link for Jose Navas

## Amounts
- Missed weekly payments: Oct 26, Nov 2, Nov 9 = 3 x $63.60 = $190.80
- Less the $6.40 overpayment ($70 sent for the Oct 19 payment, $63.60 owed)
- **Due now: $184.40**
- Then **$63.60 weekly**, every Monday, starting Mon Nov 16, for the remaining 9 payments (through Jan 11, 2027). The final payment in his agreement is $63.63; the extra 3 cents will be collected as a one-time adjustment on the last week so the total matches.
- No late fees added.

## What I will do
1. Create one Stripe checkout link for Jose's existing Stripe customer: charges $184.40 today and starts a weekly $63.60 subscription billing Mondays from Nov 16, set to end automatically after the 9th payment.
2. Tag the subscription to his financing agreement so payments keep recording on his Financing tab and invoice like before (invoice stays open until the last payment clears).
3. Record the $6.40 overpayment credit on his payment ledger so the books match.
4. Post the link here in chat. I will not text it to Jose; you can send it yourself.

## Technical details
- Stripe Checkout Session, mode=subscription, customer cus_VQi5jKT2gPlxwH, weekly price $63.60, add_invoice_items one-time $184.40, billing_cycle_anchor Mon Nov 16, cancel_at after the 9th cycle, metadata contract_id=a5739933-....
- Mark Oct 26 / Nov 2 / Nov 9 ledger rows as covered by the due-now payment once it succeeds via the existing record_financing_stripe_invoice path.
