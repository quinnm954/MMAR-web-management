## Goal
Force every booking request from a new customer to create a portal account. Email becomes required, we auto-create the auth user, and we email them a set-password link so the booking flow doubles as onboarding. Signed-in customers skip all contact fields.

## Changes

### 1. `QuoteRequestDialog.tsx` — make email required + signed-in shortcut
- Add `useAuth()`; when `user` exists, load `profiles` (full_name, phone, email) and:
  - Hide the Name / Mobile / Email inputs entirely.
  - Show a small "Booking as **{name}** ({email})" note with a "Not you? Sign out" link.
  - Use the profile values when calling `submit_booking_request`.
- When signed-out:
  - Change label from "Email (optional)" to "Email" and add required-field validation ("We'll create your account so you can track this booking").
  - Add a short helper line: "We'll email you a link to set a password after you submit."
- Keep the existing `bootstrap-customer-from-booking` invoke, but read its response. If `created === true` (brand-new user), call `supabase.auth.resetPasswordForEmail(email, { redirectTo: ${window.location.origin}/set-password })` so they get a set-password email. If `reused === true` and the current session isn't theirs, skip the reset email (they already have an account).
- Toast copy after submit: "Request received! Check your email to finish setting up your account."

### 2. `bootstrap-customer-from-booking/index.ts` — small tweak
- Already returns `{ created, reused, customer_id }`. No functional change needed there; the set-password email is triggered from the client via `resetPasswordForEmail`, which routes through the existing Lovable auth email hook (recovery template) — no new email template required.
- Await the invoke instead of fire-and-forget so we know whether to send the reset email. Show a friendly error if it fails ("Could not set up your account — please call…").

### 3. Signed-in UX polish
- If `user` exists but their profile is missing name/phone, still show those fields prefilled/editable so the booking can be completed.

## Not changed
- No new tables, no new edge functions, no new email templates.
- Admin/notification flow, RPC `submit_booking_request`, and attribution tracking stay identical.
- `/set-password` page already exists and is public.

## Edge cases
- Email belongs to an existing account → `reused: true`; we do **not** trigger a password reset (avoids letting a stranger reset someone else's password by typing their email into a booking). They can still request a reset from the login page.
- `resetPasswordForEmail` failing is non-blocking; booking still succeeds, and we surface a subtle toast telling them to use "Forgot password" on the login screen.
- Booking source `phone_call` / admin-created bookings are untouched (this dialog is the website flow only).