# Link a vehicle to every repair order

## Repair orders missing a vehicle (3)
| Customer | Job | Status | Saved vehicles |
|---|---|---|---|
| Brittany Johnson | EVAP purge valve + valve cover gaskets + timing chain inspection | In progress | 1 (her 2017 Explorer) |
| Brett Baker | Front and rear brake pads and rotors | Completed | 2 |
| David Case | Diagnosis | Completed | 0 |

## What I'll do
1. Brittany: link her only vehicle, the Explorer.
2. Brett: he has two vehicles, so I'll show you both and you choose one. If his invoice or the booking request names the car, I'll suggest that one.
3. David: he has no saved vehicle. I'll check his booking request and call notes for the car, add it to his file and link it. If I can't find it, I'll ask you.
4. From now on, a repair order can't be started or invoiced without a vehicle. The repair order screen will show a "Link vehicle" picker until one is chosen.

## Technical details
- Data fixes go through the data tool on `appointments.vehicle_id`, plus a new `vehicles` row for David if needed.
- Add a guard in the repair-order detail and start flows that blocks moving to in progress or invoicing when `vehicle_id` is null.
