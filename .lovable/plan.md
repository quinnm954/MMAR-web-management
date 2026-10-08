# Fix the Prospecting counts

## What's actually going on
"Queued: 66" mixes three different groups together:
- **9 businesses you just approved** (at 7:02 PM) that haven't had a first email yet. They go out on the next hourly send.
- **56 businesses already emailed** that are waiting for their scheduled follow-up (day 4 or day 10). Nothing is stuck; they just aren't due yet.
- **1 lead with no email address** (Chris' Complete Lawn Care), so it can never send.

Two of the 9 new ones also have the wrong address: Mighty Dog Roofing points at the state license board, and G&D Chimney points at the Lehigh fire department. Those would reach a government office, not the business.

The 205 drafts all have no email address, which is why "Drafts ready" reads 0 while the list still shows them.

## Changes
1. Replace the single "Queued" number with clear counts:
   - **First email pending**: approved, never emailed, has an address
   - **Follow-up scheduled**: emailed, next follow-up later (with the next date)
   - **Sent**: businesses emailed at least once, plus the total emails sent
   - **Drafts**: split into "ready to approve" and "needs an email address"
   - **Can't send**: approved but missing an address
2. The status labels on each lead in the list use the same groups.
3. Block government and licensing addresses (myfloridalicense.com, fire/county/city `.gov`-style addresses) the same way placeholder emails are blocked. Clear those two bad addresses and move them back to drafts.
4. Move the no-address approved lead back to drafts.

## Technical notes
- Counts are derived from `email_status`, `email_step`, `next_email_at` and `email` in `AdminProspecting.tsx`; Sent uses `email_step > 0` plus the `email_send_log` fleet-outreach sent count.
- Extend the skip regex in `prospect-email-worker` and the client approval filter; one data fix for the 3 rows.
