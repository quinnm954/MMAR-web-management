# Mobile-friendly editors + price-first online bookings

## 1. Mobile-friendly pop-ups
Fix these pop-ups so they fill the phone screen, scroll inside, and keep Save/Send buttons reachable at the bottom:
- Estimate editor and estimate details (Admin → Estimates)
- Invoice editor, payment and send pop-ups (Admin → Invoices)
- Inspection editor (Admin → Workshop → Inspections) and the checklist pop-up

On phones: full-screen sheet, sticky header (title + close) and sticky footer (actions). Line items switch from wide table rows to stacked cards (description on top, qty / price / amount below) with large tap targets. Desktop layout stays as it is.

## 2. Read the booking description and draft a price right away
When a customer submits a booking request on the website:
- The request's service type, description, vehicle and engine size are read for job clues (e.g. "grinding when braking, front" → front brake pads/rotors).
- Vague or symptom-only requests ("won't start", "check engine light") → draft estimate with the $100 diagnosis fee ($50 credited to repair labor).
- Clearly named repair with matching vehicle/engine → draft estimate with book labor hours × your labor rate.
- Too broad/unclear → no price guessed; request flagged "Needs quote".
- The draft estimate is linked to the booking request and shown on its card in Admin → Bookings with the price, so you see it before approving the time.
- Nothing is sent to the customer automatically — you still review and press Send. When you confirm the booking, the existing draft is attached to the appointment instead of making a second one.

This changes the earlier rule "no estimate until booking is confirmed" to "draft estimate at request time, still never auto-sent".

## Technical details
- Dialog changes: responsive classes on `DialogContent` (`w-full h-[100dvh] sm:h-auto sm:max-w-*`, flex column, inner `overflow-y-auto`, sticky footer), stacked line-item layout under `sm` in AdminEstimates, AdminInvoices, AdminInspections, AdminChecklists, plus the tech inspection screen if it uses the same editor.
- `notify-booking-request` (called after website submit) calls `buildLaborQuote` + `createDraftEstimate` with no appointment, storing the estimate id on the booking (new nullable `booking_requests.draft_estimate_id`). Needs a customer: reuse `ensure-booking-customer` logic so the draft has a customer id.
- `estimate-for-appointment` first looks up `draft_estimate_id` and links it to the appointment.
- Keyword-to-repair hints added to `_shared/labor-quote.ts` (still blocks broad categories).
- Update the project rule in AGENTS.md about when estimates are created.
