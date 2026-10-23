# Silent "do not contact" for unhappy customers

## What changes
When a customer's newest feedback answer is No (or 1-3 stars on the old form), the app quietly stops contacting them. Nothing is sent to tell them.

**Stops right away (automated):**
- Marketing and promo emails, prospecting emails
- Service and maintenance reminders, mileage update requests, checklist reminders
- Booking follow-ups, missed-call follow-ups, review requests
- Receptionist replies: if they text or call later, the receptionist stays silent (calls go to voicemail with no reply text), and you get a normal alert so you can decide yourself

**Finishes the current job, then stops:**
- Messages about a job already open when they said No (appointment reminder, estimate, invoice and payment link, paid receipt) still go out until that job is paid or closed. After that, nothing more goes out about later jobs.

**Your own messages:**
- You can still text or email them by hand from the Phone screen. A red banner says "This customer said they were unhappy. Automated messages are off." before you send.

**Coming back:**
- If they answer Yes on feedback later, they turn green and messages resume. You can also switch the block off on their customer page.

## Technical details
- New `profiles.do_not_contact_at timestamptz` (+ `do_not_contact_open_job_ids uuid[]` snapshot of open appointments/estimates/invoices at block time). Set by trigger on `customer_satisfaction_feedback` / `review_feedback` insert when unhappy (phone-matched if no customer_id); cleared on a later happy answer or admin toggle.
- Shared edge guard `_shared/contact-block.ts`: `isBlocked({customerId, phone, email, jobId?})` — returns blocked unless jobId is in the open-job snapshot. Applied in send-and-log email path, send-service-reminders, send-appointment-reminders, send-mileage-*, send-checklist-reminders, followup-worker, prospect-email-worker, missed-call, sms-receptionist / twilio-inbound-sms, twilio-voice-incoming (no AI pickup), booking-bot, send-estimate, send-invoice-payment-link, send-invoice-paid-receipt, notify-* customer messages. Skips are logged as `suppressed: unhappy`.
- Manual `send-sms` / `send-admin-message` stay allowed; Phone thread and compose UI show the warning banner using the happiness hook.
- Admin customer page: "Automated messages off" toggle.
- Tests for: unhappy blocks reminders, open-job invoice still allowed, later job blocked, Yes answer clears block.
