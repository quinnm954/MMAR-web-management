# Schedule waiting work starting Monday, Nov 2

Up to 3 jobs per day, 10 AM–5 PM Eastern. Already-scheduled appointments go first, then waiting requests from oldest to newest. Cory Allen (Cape Coral) is skipped. Your calendar is empty from Nov 2 on, and the only blocked time is Sunday, Nov 1.

## Proposed schedule

| Day | Time | Customer | Job | Source |
|---|---|---|---|---|
| Mon Nov 2 | 10:00 AM | David Case | Isuzu box truck, vacuum pump (in progress) | moved from Oct 26 |
| Mon Nov 2 | 1:00 PM | Gert Vanvulpen | existing appointment | moved from Oct 28 |
| Mon Nov 2 | 3:30 PM | Natalie Griffin | battery install | request from Oct 25 |
| Tue Nov 3 | 10:00 AM | Gary | Challenger battery + Corvette oil-leak diagnosis (12081 Nokomis Ct, Fort Myers) | request from Oct 25 |
| Tue Nov 3 | 1:00 PM | Casey Hickman | serpentine belt | request from Oct 27 |
| Sat Nov 7 | 10:00 AM | Nia Rogers | rear brakes (Lehigh Acres) | asked for Nov 7 |

Each time is checked against open slots and drive time before saving. If a slot isn't free, the job moves to the next open time in the same order.

## Texts (from 813-501-7572, logged in each Phone thread)

- **Moved appointments:** "Hi [name], Mike's service vehicle is back on the road. We've moved your appointment to [day, date] at [time]. Reply if that doesn't work and we'll find another time."
- **Confirmed requests:** "Hi [name], you're booked with Mike's Mobile Auto Repair for [day, date] at [time] for [job]. Reply if you need a different time." Natalie and Casey have no address on file, so their texts also ask for the service address.
- Customers marked do-not-contact are booked but not texted. None of these six are marked today; I'll check again before sending.

## Technical details

- Appointments: update `scheduled_at` on the 2 existing rows. Status stays the same.
- Requests: confirm through the existing `admin_confirm_booking_request` flow, so each request becomes an appointment, its estimate is reused, and the tech is assigned by the normal rules.
- Texts go out through `send-sms` with `manual: true` so they appear in the Phone threads.
- No code changes.
