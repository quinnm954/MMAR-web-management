# Remove labor-hour ranges from quotes

## Goal
Estimates and quotes never show a labor-hour spread like "0.6–2.2 hrs by engine". Every quote is a single labor time and a single price.

## Changes

### Quote logic (`supabase/functions/_shared/labor-quote.ts`)
- When the engine size is known, use that engine's book time (already works this way).
- When the engine is unknown, use the **highest** book time for that vehicle instead of quoting a range — so the quote is never too low and there is one number.
- Remove the "0.6–2.2 hrs by engine" wording from the estimate line description; the line just reads e.g. "shock replacement (book labor)".
- Customer-facing quote text (phone/text bot) says one time and one price, e.g. "about 2.2 hrs ($275)" — no "depending on engine" range.

### Redeploy
- Redeploy the functions that use this: booking bot, text bot, estimate-for-appointment.

## Notes
- Existing estimates that already show a range stay as-is; you can edit or delete them in Estimates.
- Downside of using the highest time: small-engine cars get quoted a bit high. Asking for engine size (already in place) avoids that.
