# Make automatic estimates match what the customer described

## What went wrong with Nia's estimate
Nia wrote "I need the back breaks replaced", and her request came in under the website's "Mobile Brake Repair" service. The estimate builder never matched her own words, because it doesn't recognize the misspelling "breaks". It found the word "Brake" in the service name, searched the labor guide for "brake replacement", and got a list of brake jobs. When several jobs fit equally well, it picks the shortest name, which here was "Brake Booster" (2.5 hrs, $312.50). It also missed "back" because it only looks for "rear".

## Changes
1. **Customer's words first.** Pick the repair from the description, and fall back to the website service name only when the description names no part.
2. **Understand everyday wording.** "Breaks" means brakes. "Back" means rear. Plain "brakes" means pads and rotors, never the booster, master cylinder, lines or ABS unless the customer names them.
3. **Front/rear from the description.** "Back brakes" quotes rear pads and rotors. "Front" quotes front. "All" or "both" quotes both axles.
4. **No guessing between unrelated jobs.** If the labor guide's choices don't contain the customer's part words, the draft says "No labor guide match — add labor and parts" instead of picking the shortest name.
5. **Fix Nia's draft.** Rebuild her unsent estimate as rear brake pads and rotors for her 2014 Honda Civic LX. Nothing is sent to her.

## Checks
New tests:
- "back breaks replaced" picks rear pads/rotors, never the booster.
- "front brakes" picks front.
- Plain "brakes" never picks booster, master cylinder or lines.
- The description wins over the service name.
- A request with no clear part still gets the $100 diagnosis fee.

Existing estimate tests keep passing.

## Technical details
- `supabase/functions/_shared/labor-quote.ts`:
  - Normalize the text with `breaks?` to `brakes` and `back` to `rear`.
  - Run `specificJob` on the description before the service type.
  - Map plain "brake(s)" to "brake pads" and let the front/rear/pair filters run before the shortest-name tie-break.
  - Add an exclusion list (booster, master cylinder, line, hose, ABS, caliper) for jobs whose words weren't in the request.
  - Return `kind: 'none'` when no job contains the request's part words.
- Redeploy the functions that use it: notify-booking-request, estimate-for-appointment, ai-receptionist, twilio-inbound-sms, followup-worker.
- Rebuild estimate `41ca8b04…` by calling the fixed builder for Nia's request. It stays a draft.
