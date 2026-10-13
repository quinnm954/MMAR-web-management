# Finish regions, auto-update receptionist, auto-assign techs

## 1. Region tabs everywhere left
- **Calendar**: same All / SW Florida / S Florida / Outside tabs; only that region's jobs and blocked time show. Each job card gets a small region tag.
- **Appointments list**: region tabs and a region tag on each row.
- **Reports and Sales Dashboard**: the region pick filters revenue, jobs done, estimates, payment aging and ad conversions. "All" works like it does now.
- **Manual region change**: a small region picker on booking requests and repair orders, for when the address lookup gets it wrong. Estimates and invoices tied to that job follow it.
- **Older records**: a one-time pass tags past bookings, appointments and customers by address. Anything it can't place stays SW Florida, the region they belong to today.

## 2. No more "Update AI receptionist" button
- The receptionist updates itself after any change that affects what it says: Phone settings saved (greeting, toggles), a region launched or switched off, or a tech added to or removed from a region.
- Every change sends one update. Several changes close together get combined into one. If an update fails, it tries again on the next hourly run, and Phone settings shows a "Last updated" time with an error note if needed.
- The button stays only as "Set up AI receptionist" for first-time setup. After that it becomes a small "Re-sync now" link that you never need to use.

## 3. Tech auto-assigned when a repair order is created
- When a job is created (from a confirmed booking, an approved estimate or a manual entry), the system looks up the techs assigned to that job's region.
  - **One tech:** assigned automatically and shown on the repair order.
  - **Several techs:** nothing is assigned. The repair order shows a yellow "Choose technician" prompt listing only that region's techs, and you get a notification. Once you pick, the normal job-assigned alert goes to that tech.
  - **No tech:** left unassigned with a "No tech in this region" note.
- An assignment you set by hand is never overwritten.

## Technical details
- Frontend: add `RegionSwitch`/`match` from `useAdminRegion` to `AdminCalendar`, `AdminAppointments`, `AdminReports`, `AdminSalesDashboard`, `AdminDashboard` (pass region to queries or filter client-side on `region_slug`). Add a region select to `AdminBookingRequests` cards and `RepairOrderDetail`. Update the existing cascade trigger so it re-inherits estimate and invoice regions when an appointment's region changes.
- Backfill: an admin-only `geocode-region` call with `backfill: true` in batches. Default SWFL stays as the fallback.
- Receptionist auto-sync: add `phone_settings.ai_synced_at` and `ai_sync_error` columns, plus a `receptionist_sync_requested_at` marker. Triggers on `phone_settings` (relevant columns), `service_regions` and `user_service_regions` set the marker. One function call (pg_net to `ai-receptionist?action=setup` with the internal token) runs on change, and the hourly worker re-runs it when the marker is newer than `ai_synced_at`. The UI shows status only. Remove the "Tap Update AI receptionist" toast copy.
- Auto-assign: a BEFORE INSERT trigger on `appointments`, running after `set_appointment_region`. It counts techs in `user_service_regions` for the row's region: with exactly one it sets `assigned_technician_id` when that is null; with more than one it sets a new `needs_tech_choice boolean default false` and notifies staff via `_send_push_to_staff`. Clear the flag when a tech is set. The existing job-assigned email trigger then fires as it does today.
- Record the auto-assign and receptionist auto-sync rules in AGENTS.md / project knowledge.
