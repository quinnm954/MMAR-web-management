# Make it clear a booking request is not a confirmed appointment

Every place a customer asks for a time will say plainly: "This is a booking request, not a confirmed appointment. Mike will text you to confirm."

## What changes

1. **Text receptionist** – after a customer picks a time, the reply becomes:
   "Got it — I've sent a booking request for Monday, Nov 9th at 10:00 AM. This is not a confirmed appointment yet; Mike will text you to confirm." (Spanish version too.)
   Time offers will also say "request" ("I can request Monday at 10 AM for you"), never "booked" or "you're set".
2. **Booking follow-up texts** (customers replying to a website request) – same wording, and the unused "You're all set" message is removed.
3. **Phone receptionist** – before hanging up, it must say: "Just so you know, this is a booking request, not a confirmed appointment. Mike will text you to confirm the time." Synced to the live phone line.
4. **Website booking form** – the thank-you screen and any confirmation text/email say "Booking request received — not confirmed yet. Mike will text you to confirm."
5. **Already confirmed appointments** keep their normal "You're confirmed" wording — this only affects pending requests.

No texts go out to existing customers; this only changes future replies.

## Technical details
- `_shared/sms-receptionist.ts` saved-request reply + prompt rule banning confirmation wording.
- `_shared/booking-bot.ts` request reply; drop dead `auto.ok` branch.
- `ai-receptionist/index.ts` prompt closing line + `create_booking_request` tool result message; trigger agent resync.
- Website booking page success copy and `notify-booking-request` customer message (verify wording, update if it implies confirmation).
- Update tests asserting the reply text; deploy affected functions.
