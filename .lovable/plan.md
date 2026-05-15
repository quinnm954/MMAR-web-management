## Add Mileage Tracking → Retention Engine

Today the system stores a single `vehicles.current_mileage` number that customers update manually on the Vehicles page. The mileage reminder cron already exists, but it only fires after a service has been logged at a known mileage — there's no way to know how fast a vehicle is actually accumulating miles, no prompts to update mileage, and no upsell pipeline driven off it.

This plan turns mileage into a first-class signal.

---

### 1. Mileage history (foundation)

New table `vehicle_mileage_logs`:
- `vehicle_id`, `customer_id`, `mileage`, `recorded_at`, `source` (`manual` | `service` | `quick_prompt` | `email_reply` | `sms_reply` | `admin`), `notes`

Trigger: every insert updates `vehicles.current_mileage` to the max value and recomputes `vehicles.avg_miles_per_day` (a new column) using the last 90 days of logs (fallback: lifetime average).

When a `service_records` row is inserted with `mileage_at_service`, also auto-insert a mileage log (source = `service`) so the odometer never goes stale after a visit.

### 2. Customer-facing capture

**Quick mileage widget** (added to `PortalDashboard` and the existing `VehicleHealthCard`):
- "Last updated 47 days ago — current mileage?" with a single number input + Save.
- Shown when the most recent log is >30 days old, or always with a subtle "update" link.

**Vehicles page**: replace the static `current_mileage` field with an "Update mileage" action that writes a log row instead of overwriting silently. Show a small history sparkline.

**Service-history page**: when a tech logs a service, the entered mileage automatically becomes a log entry (already half-done — wire the trigger).

### 3. Automated mileage prompts

New edge function `request-mileage-update` (cron, weekly):
- Targets vehicles whose last mileage log is >45 days old AND owner has `marketing_opt_in = true`.
- Sends a transactional email "What's your odometer reading?" with a one-click magic link `/m/<token>?miles=____` (token table `mileage_update_tokens`, 30-day expiry, single-use).
- Optional SMS variant for opted-in customers — body: "Hi {name}, quick favor — what's the current mileage on your {year} {make}? Reply with just the number." Inbound SMS handler (`twilio-inbound-sms`) parses any standalone integer reply within 7 days of the prompt and writes a log.

### 4. Smarter service reminders & maintenance schedule

Upgrade `send-mileage-email-reminders`:
- Project each vehicle's mileage forward using `avg_miles_per_day` so a service due in 1,200 mi can be scheduled by *date* ("due around June 14"), not just "due soon."
- Trigger reminders earlier when a vehicle is high-mileage-per-day (fleet-style drivers).
- Suppress items where a recent service_record already covers the interval.

New portal page section **Maintenance schedule** (extend `PortalMaintenance`):
- Timeline view: each interval shows last performed → projected next due (date + miles), color-coded (green/amber/overdue).
- "Book this now" button → pre-fills the booking form with that service.

### 5. Upsell engine

New edge function `generate-upsell-recommendations` (cron, daily):
- For each active customer, look at projected services in the next 60 days that are >$200 competitor price OR cluster 2+ services into a single visit ("save a trip — bundle these 3").
- Writes rows into existing `service_recommendations` table (status `pending`, priority based on overdue distance).
- Sends a weekly digest email "3 services coming due on your Tacoma" (rate-limited: max one upsell email per customer per 14 days).

Admin sees these in `AdminCustomers` / a new "Upsell pipeline" tab so the shop can also call/text proactively.

### 6. Admin visibility

`AdminCustomers` detail: mileage history chart + "Last odometer update" badge.
New small admin widget: customers with stale mileage (>60 days) → one-click "Send mileage request now."

---

### Technical details

- **Migration**: create `vehicle_mileage_logs` (RLS: customer reads/inserts own; admin/staff full; technician insert for assigned vehicles), add `vehicles.avg_miles_per_day numeric`, `vehicles.last_mileage_update_at timestamptz`. Trigger `sync_vehicle_mileage_from_log()` updates the vehicles row. Trigger on `service_records` inserts a log row when `mileage_at_service` is present. Create `mileage_update_tokens` (token, vehicle_id, customer_id, expires_at, used_at).
- **Edge functions**:
  - `request-mileage-update` (cron weekly Tue 10am ET) — picks stale vehicles, generates token, sends email via existing transactional pipeline, optionally enqueues SMS.
  - `record-mileage-from-token` (public, no JWT) — accepts `?token=&miles=`, validates, inserts log, marks token used, redirects to a small thank-you page `/mileage-thanks`.
  - `generate-upsell-recommendations` (cron daily 6am ET) — projects due services using `avg_miles_per_day`, writes into `service_recommendations`, fires digest email at most once per 14 days per customer.
  - Update `send-mileage-email-reminders` to use `avg_miles_per_day` for projected dates and skip items already covered by recent service_records.
  - Update `twilio-inbound-sms` to detect standalone-integer replies tied to a recent `mileage_update_tokens` row.
- **Templates**: new `mileage-update-request.tsx` (single-CTA email) and `upsell-digest.tsx` (groups recommendations by vehicle). Add to `registry.ts`.
- **Frontend**:
  - `MileageQuickUpdate` component (used in `PortalDashboard` + `VehicleHealthCard`).
  - Extend `PortalMaintenance` with timeline + "Book this" CTA.
  - New public route `/m/:token` that calls `record-mileage-from-token`.
  - New admin tab "Upsell pipeline" reading `service_recommendations` ordered by priority.
- **Cron**: schedule via `cron.schedule` SQL (insert tool, not migration) for the two new functions.
- **No new secrets needed** — uses existing Resend + Twilio + email queue.

### Out of scope for this pass
- True automatic mileage capture from OBD-II / connected-car APIs (would require user hardware or a third-party data partner; can be a follow-up).
- Mobile app push prompts for mileage (the web widget + email/SMS covers all current channels).
