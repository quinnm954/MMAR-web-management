# Google review texts + happiness colors on customer names

## 1. One-time text to 5-star customers
Send one text to each customer who gave 5 stars on the feedback page and hasn't already posted on Google:
- Dustin, Steve Thompson, Angela Dabo, Gary, Brittany Johnson (one text each, duplicates removed)
- Skipped: Brett Baker (already posted his Google review), and one anonymous 5-star entry with no phone number

Message (sent from (813) 501-7572):
"Hi {first name}, thanks again for the 5 stars on your recent repair with Mike's Mobile Auto Repair! Would you mind sharing it on Google? It really helps local drivers find us: {Google review link}. Reply STOP to opt out."

Each text is logged in the Phone workspace thread like any other text.

## 2. Happiness tracking per customer
Each customer gets a happiness status from their newest answer:
- Happy (green name): latest answer is "Yes" on the new feedback, or 4-5 stars on old feedback
- Unhappy (red name): latest answer is "No", or 1-3 stars on old feedback
- Not rated: default name color

Only the most recent answer counts, so an unhappy customer who later says Yes turns green.

## 3. Colored names, admin only
Names turn green or red everywhere customers appear on admin screens: customers list and details, calendar, estimates, repair orders, invoices, Phone workspace threads and calls, dashboard cards. Technicians and customers never see the colors.

## Technical details
- Security-definer RPC `customer_happiness()` returning `customer_id, status` (admin-only via `has_role`), combining `customer_satisfaction_feedback` and legacy `review_feedback`, latest per customer; phone-match fallback for rows without customer_id.
- `useCustomerHappiness()` hook (cached, loaded once in admin shell) + `<CustomerName id name />` component applying semantic `text-success` / `text-destructive` tokens; swap into the ~26 admin files that render customer names. Not used in tech/portal layouts.
- One-off texts sent through the existing `send-sms` function with the direct Google review link already used by the review page; recorded in `sms_messages`.
- Small test for the status rule (Yes/4-5 green, No/1-3 red, newest wins, none = default).
