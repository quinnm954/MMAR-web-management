# Fix job statuses, message scrolling, plus workflow ideas

## What I found
- **AC Evaporator** repair order still says "In progress", but its invoice was paid on Oct 7. Nothing currently closes a job when its invoice is paid. It's the only one stuck like this right now.
- "Converted" is a status on **estimates**, not invoices. 3 estimates have it, and it means the estimate turned into a repair order.
- Message threads open at the top instead of the newest message.

## Fixes
1. **Paid invoice closes the job:** when an invoice becomes paid (by card, text-to-pay, or payment recorded by hand), its repair order is marked Completed automatically. The AC Evaporator job gets closed now.
2. **Converted estimates read as complete:** "converted" shows as **Complete** with a green badge everywhere. On the Estimates screen, those estimates sit under a **Complete** tab instead of "In repair".
3. **Auto-scroll:** every message thread jumps to the newest message when you open it, and again when a new text arrives. This covers Admin → Phone, Front Desk → Texts, and the customer/tech Messages page.

## Workflow suggestions (not included; pick any)
- **One-tap "Finish job":** a tech marks the job done, which issues and texts the invoice in one step.
- **Approved estimate starts the repair order:** when a customer approves, the job moves to In progress without you pressing anything.
- **Daily "needs attention" list:** approved but not scheduled, finished but not invoiced, invoices unpaid after 3 days.
- **Auto-close stale estimates:** sent estimates with no answer after 30 days become Expired.

## Technical details
- Migration: trigger on `invoices` AFTER UPDATE OF status. When the new status is `paid`, it sets `appointments.status/board_column = 'completed'` for `appointment_id` or the appointment on `service_record_id`. Then a one-time backfill for already-paid invoices (run_sql).
- Converted label: in AdminEstimates STATUS_COLORS/tab, PortalEstimates and EstimateSummaryCard, show "Complete".
- Scroll: a bottom ref + `scrollIntoView` in a useEffect on `[messages, activeId]` in AdminSMS.tsx, AdminPhoneHub.tsx and Messages.tsx.
