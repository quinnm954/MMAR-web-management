# Next update: Finish Job, estimate expiry, job history, daily to-do

## 1. Tech "Finish job" button
- Each in-progress job on the tech's Jobs screen gets a large **Finish job** button.
- Tapping it opens a short sheet:
  - Confirm the work done.
  - Optional final mileage.
  - Optional note or photo.
  - Then **Finish**.
- On Finish:
  - The job is marked complete with the exact time, so the dashboard counts it correctly.
  - If the job has an approved estimate, the invoice is created and sent to the customer automatically, same as Issue Invoice. The message keeps the cash-not-accepted line.
  - You get a "Job finished" alert in Garage Ace.
- Techs still can't see prices or totals, only the confirmation.

## 2. Estimate expiry (30 days)
- New estimates are valid for 30 days. The setting is in Shop Settings and is currently 14.
- The hourly follow-up job adds one "still interested?" email (and text once texting is allowed) 3 days before expiry. This comes after the existing 24h/72h nudges.
- On the expiry date, a sent estimate that hasn't been approved is marked **Expired**. It shows under the existing Declined/Expired tab with a one-tap **Reopen and resend** that sets a new 30-day date.
- The customer approval page shows "This estimate has expired — call or text 813-501-7572 for an updated quote" and no longer accepts approval.

## 3. Link old jobs to invoices
- 10 finished jobs have no invoice linked. 12 invoices have no job linked, and 10 of those are tied to a service record.
- One-time match:
  - First by service record.
  - Then by same customer, same vehicle and invoice date within 3 days of the job.
  - Only one clear match is linked. Anything uncertain is skipped and listed for you to review.
- Afterward, revenue per job and hours per job on the dashboard include past work.
- New invoices made from a job always carry the link (already true for Issue Invoice and Finish job).

## 4. Daily to-do card (top of the Sales Dashboard and the admin home)
- Shows counts with tap-through to the right screen:
  - Draft estimates not sent yet
  - Estimates expiring in the next 3 days
  - Unpaid invoices more than 7 days old
  - Booking requests waiting for approval
  - Texts and chats with no reply in over 2 hours
  - Jobs in progress for more than a day
- When everything is clear, it shows "All caught up."
- Optional 8 AM push alert with the same summary, sent only when something is waiting.

## Technical details
- Tech finish: new `tech_finish_job(_appointment_id, _mileage, _note)` security-definer RPC. It checks `tech_has_appointment`, sets status `completed` (the trigger stamps `completed_at`), logs mileage through `vehicle_mileage_logs`, and calls `create_invoice_for_appointment`. Then the client invokes `send-invoice-payment-link`, extended to also allow the assigned technician without returning the price to them. UI goes in `src/pages/tech/TechJobs.tsx`.
- Expiry: `shop_settings.estimate_valid_days` is updated to 30 (data change). `followup-worker` gets a pre-expiry nudge step (`followup_count` 2 to 3) and a pass that sets `status='expired'` where `status='sent' AND valid_until < today`. `get_estimate_by_token`/`submit_estimate_decision` reject expired estimates. Reopen goes in `AdminEstimates.tsx`.
- Backfill: one-time data update setting `invoices.appointment_id` from `service_records.appointment_id`, then a unique customer+vehicle+date match. Ambiguous rows are reported back, not guessed.
- To-do: client-side counts in a new `src/components/admin/DailyTodo.tsx`, which reuses existing tables (`estimates`, `invoices`, `booking_requests`, `sms_threads`, `message_threads`, `appointments`). The 8 AM summary is added to the existing hourly `followup-worker` (runs once per day at 8 AM Eastern), so no new schedule is added.
- Record new rules in AGENTS.md (finish-job flow, expiry handling).
