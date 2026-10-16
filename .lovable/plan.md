# Receptionist answers every incoming text

## Today
The receptionist only texts back when the customer already has an open booking request. Any other text (new customers, questions, existing customers asking something) just lands in Phone with no reply.

## What changes
- Every incoming text gets a short, friendly reply from the receptionist, in English or Spanish to match the customer.
- Same rules as on the phone: Fort Myers and Lehigh Acres only (South Florida = waitlist), no tires, alignments or pre-purchase inspections, oil changes only for MMAR Care members (pitch it), only the $100 diagnosis fee may be quoted, never book or confirm a time.
- If the number matches a saved customer, it greets them by name and uses their saved vehicle and address instead of asking again.
- When someone needs service, it collects name, vehicle (with engine size), the problem, address and preferred day, then saves a booking request for you to approve — same as calls.
- If they ask for Mike, are upset, or it's urgent, it says Mike will reach out and sends you an alert.
- It stays quiet when: you've texted that person yourself in the last 2 hours (so it never talks over you), the text is from staff/techs, it's a STOP/opt-out, or an automated code. Existing booking-request texting keeps working as is.
- An on/off switch for "Answer texts" in Admin → Settings → Phone (on by default). Its replies show in the Phone thread like any other text.

## Technical details
- New `_shared/sms-receptionist.ts`: builds prompt from the same business rules/regions used by `ai-receptionist`, keeps per-thread history from recent `sms_messages`, calls Lovable AI, returns JSON `{reply, booking?, handoff}`; booking inserts via existing `submit_booking_request` path so draft estimates and staff alerts still fire.
- `twilio-inbound-sms`: if `handleBotReply` returns false, run the SMS receptionist with the skip rules above; send through the existing send helper (gated by `smsAllowed()`), mirrored into the thread.
- `phone_settings.ai_sms_enabled boolean default true` via migration; toggle in `AdminPhoneSettings.tsx`.
- Deploy `twilio-inbound-sms`; test by simulating an inbound text from a new number and from a saved customer.
