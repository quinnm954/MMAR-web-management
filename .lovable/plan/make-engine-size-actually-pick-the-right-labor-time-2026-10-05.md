# Make engine size actually pick the right labor time

## What's going wrong
The Cruze estimate said "1.4" but still showed "0.6–2.2 hrs by engine". The engine-matching code exists, so the spread most likely comes from one of these (to confirm first by running the same lookup live):
- The labor guide returns several job versions for the same engine (for example front shocks vs. rear shocks, or one side vs. both). These get lumped together and called "by engine".
- The engine text from the guide doesn't match "1.4" the way the customer typed it (for example "1.4L L4 Turbo" vs "1.4T"), so the filter falls back to all engines.
- The engine typed on the form isn't reaching the lookup in every path.

## Fix
1. **Confirm the cause** by running the 2011 Chevy Cruze 1.4 shock lookup and looking at exactly what the guide returns.
2. **Better engine matching:** match on liters (1.4, 1.4L, 1.4T, 1400cc) and cylinder count; also read the engine from its own form field, not only from the vehicle text.
3. **Pick one job, not a spread:** when the guide returns multiple versions of a job for the matched engine (front/rear, single/pair), choose the one that best matches the customer's words; if they didn't say, list each version as its own estimate line (e.g. "Front shocks – 0.6 hrs", "Rear shocks – 2.2 hrs") so they approve what they want. No more "by engine" ranges.
4. **No engine given:** the text bot and receptionist ask for it before quoting; the auto-estimate stays an unsent draft for you to review instead of sending a range.
5. Redeploy the booking bot, text bot, phone receptionist tools and confirmed-booking estimate.
6. **Test** with the Cruze 1.4 shock request and a starter request and confirm each gets a single labor time.

## Notes
- Your existing Cruze shock estimate isn't changed automatically; I can redo it once the fix is in.
