## Current state

- Email domain `notify.mail.mikesmautorepair.com` is verified ✅
- Queue cron `process-email-queue` is active (every 5s) ✅
- 8 transactional templates registered (appointment, service-completed, invoice, membership, estimate, inspection, mileage-reminder, paid-receipt) ✅
- Admin → Emails dashboard exists with stats/filters/table ✅
- **But `email_send_log` is empty** — zero emails ever sent in the last 7 days. No customer-facing trigger has fired yet.

## What's missing

1. **No way to verify the pipeline works.** Admin has no "send test" button — they have to wait for an organic event.
2. **Booking requests don't email anyone.** When a customer submits via `QuoteRequestDialog` (calls `submit_booking_request` RPC), neither the customer nor the admin gets an email.
3. **No new-booking alert to the shop.** Admin only finds out by checking the dashboard.

## Plan

### 1. Add "Send test email" button to AdminEmails dashboard
- Button next to the refresh icon, opens a small dialog with: recipient email (defaults to current admin's email) + template picker (lists registered templates).
- Invokes `send-transactional-email` with a synthetic `idempotencyKey` (`test-{template}-{timestamp}`) and the template's `previewData`.
- Toast shows success/failure; the new row appears in the log within ~5s.

### 2. Add two new templates + wire them to the booking flow
- `booking-request-received` — sent to the customer ("We got your request, we'll call you shortly"). Includes service type, vehicle, requested date.
- `admin-new-booking-request` — sent to the shop owner email ("New booking request from {name}"). Includes all request details + a link to `/admin/bookings`.

Wiring: in `QuoteRequestDialog.tsx`, after `submit_booking_request` succeeds, fire both `sendNotification` calls (fire-and-forget, won't block UI). Idempotency keys: `booking-req-customer-{id}` and `booking-req-admin-{id}`.

### 3. Owner email lookup
- Add a helper that reads the owner email from `user_roles` joined with `auth.users` (already accessible via existing `profiles` table for the owner — `quinnm954@gmail.com` per the bootstrap function). Fall back to a hardcoded constant if lookup fails.

### 4. Verify end-to-end
After deploy, send one test from the new button to confirm a row lands in `email_send_log` with status `sent`.

## Technical notes

- All new templates follow the existing brand styling pattern in `_shared/transactional-email-templates/` (white body, brand blue accents, `MMAR Care` / shop sign-off).
- Update `registry.ts` to import + register the two new templates.
- No DB migrations needed — uses existing `email_send_log` / queue infra.
- Redeploy `send-transactional-email` after adding templates (REQUIRED — Edge Functions serve last-deployed code).

## Files touched

- NEW `supabase/functions/_shared/transactional-email-templates/booking-request-received.tsx`
- NEW `supabase/functions/_shared/transactional-email-templates/admin-new-booking-request.tsx`
- EDIT `supabase/functions/_shared/transactional-email-templates/registry.ts`
- EDIT `src/components/QuoteRequestDialog.tsx` (fire 2 emails after submit)
- EDIT `src/components/admin/AdminEmails.tsx` (add Send Test dialog)
