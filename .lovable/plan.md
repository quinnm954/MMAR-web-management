## Master Vehicle Health Checklist

A single, persistent **Vehicle Health Checklist** per vehicle that aggregates items from every inspection template, auto-updates after each tech inspection, and is editable by both the admin and the customer.

### Concept

Today: each appointment spawns one or more disposable `service_checklists` from templates. The customer only sees flagged items from the most recent job.

New: every vehicle has **one master checklist** — a living record of every inspection point (brakes, fluids, suspension, tires, etc.) with current status, last-checked date, who checked it, and notes. Per-job tech checklists keep working as they do now, but on save they **push results into the master**.

### Data model

New table `vehicle_master_checklist_items`:
- `vehicle_id`, `customer_id`
- `category` (Brakes, Fluids, Tires, Suspension, etc.)
- `label` (e.g. "Front brake pads")
- `status` (`good` | `monitor` | `due_soon` | `urgent` | `unknown`)
- `severity_note`, `measurement` (e.g. "4mm")
- `last_checked_at`, `last_checked_by` (tech id), `last_source` (`tech_inspection` | `customer_edit` | `admin_edit` | `seed`)
- `price_low`, `price_high` (carried from template item)
- `customer_note` (free-text the customer can add: "replaced at Jiffy Lube 3/2026")
- `source_template_id`, `source_template_item_id` (for dedupe)
- `is_hidden` (soft-delete so edits don't get clobbered by re-seed)

### Seeding & sync

1. **Seed on demand**: a `seed_vehicle_master_checklist(vehicle_id)` function pulls every active template's items into the master (deduped by template_item_id). Runs first time the master is viewed, or when a new template is added.
2. **Tech sync trigger**: when a `service_checklist_items` row is updated (status set, recommended, measurement entered), an `AFTER UPDATE` trigger upserts the matching master item by `source_template_item_id` — copies status, measurement, note, sets `last_checked_at = now()`, `last_source = 'tech_inspection'`. Customer edits flagged `last_source = 'customer_edit'` within the last 30 days are NOT overwritten unless the tech's status is worse (e.g. customer said "good", tech finds "urgent" → tech wins).
3. **Customer/admin edit**: writes directly to `vehicle_master_checklist_items` with `last_source = 'customer_edit'` or `'admin_edit'`.

### RLS

- Customer: SELECT + UPDATE rows where `customer_id = auth.uid()` (only `status`, `customer_note`, `measurement` columns — enforced via trigger).
- Admin/tech: full access.
- Insert/delete restricted to admin + the seed function.

### UI

**Customer portal** — new page `/portal/vehicle-health` (and a card on the existing dashboard):
- Grouped by category, color-coded by status
- Each row: label, status badge, last-checked date, measurement, price range, customer note
- Inline edit: change status, add note ("I replaced this myself"), mark as serviced elsewhere
- "Request service" button on urgent/due_soon items → opens existing quote dialog

**Admin** — new tab in customer detail (`AdminCustomerDetail`) → "Vehicle Health":
- Same grid, full edit (any field), re-seed button, hide/unhide
- Audit trail shown (last_source + who)

**Tech** — existing per-job checklist unchanged. After they save, a small "Synced to vehicle health" toast confirms.

### Files

New:
- migration: `vehicle_master_checklist_items` table, RLS, `seed_vehicle_master_checklist` RPC, `sync_master_from_tech_checklist` trigger
- `src/lib/vehicleMasterChecklist.ts` — typed helpers (load, upsert, seed, update)
- `src/pages/portal/PortalVehicleHealth.tsx` — customer view
- `src/components/admin/AdminVehicleHealth.tsx` — admin tab

Edited:
- `src/App.tsx` — route for `/portal/vehicle-health`
- `src/components/portal/PortalNav.tsx` (or equivalent) — nav link
- `src/pages/admin/AdminCustomerDetail.tsx` — new tab
- `src/pages/portal/PortalDashboard.tsx` — health summary card

### Out of scope (intentionally)

- Per-vehicle override of price ranges (still uses template prices)
- Photo uploads on customer edits (admin/tech only)
- Reminder push notifications (can add later)
