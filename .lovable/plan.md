## Goal
Add a full service checklist system: admin-managed reusable templates, per-vehicle/per-RO instances that technicians fill out, plus a read-only customer view so customers can see what was done and what's coming up (including their MMAR Care plan items).

## Database (new tables)

1. **`checklist_templates`** — admin-defined reusable templates
   - `name`, `description`, `category` (`oil_change` | `brake_job` | `inspection` | `membership` | `maintenance` | `custom`)
   - `plan_id` (nullable FK → `membership_plans`, used for "MMAR Care plan checklist")
   - `customer_visible` (bool, default true)
   - `is_active`, timestamps

2. **`checklist_template_items`** — items inside a template
   - `template_id`, `label`, `description`, `sort_order`, `required` bool

3. **`service_checklists`** — instance attached to a job / vehicle / membership cycle
   - `template_id` (nullable — instance can be ad-hoc)
   - `appointment_id` (nullable), `customer_id`, `vehicle_id`, `membership_id` (nullable)
   - `assigned_technician_id`, `status` (`open` | `in_progress` | `completed`)
   - `title`, `notes`, `started_at`, `completed_at`, timestamps

4. **`service_checklist_items`** — items on an instance
   - `checklist_id`, `label`, `description`, `sort_order`
   - `status` (`pending` | `done` | `na` | `issue`)
   - `notes`, `completed_by`, `completed_at`

**RLS**
- Admins: full manage on all 4 tables.
- Technicians: read/update `service_checklists` (and items) where `assigned_technician_id = auth.uid()`. Read templates (to use as picker).
- Customers: read-only on their own `service_checklists` + items (where `customer_id = auth.uid()` and parent template is `customer_visible`).

## Frontend

1. **`src/components/admin/AdminChecklists.tsx`** — new admin page with two tabs:
   - **Templates** — list/create/edit templates, manage items (drag to reorder, required toggle), set category and optional membership plan link, toggle customer-visible.
   - **Active checklists** — table of all `service_checklists` (filter by status, technician, customer). Click row → drawer to view/edit items, reassign tech, mark complete.
   - Mount on `/admin/checklists` and add nav entry in admin dashboard sidebar.

2. **Tech dashboard** — add a "My checklists" card/section on `src/pages/tech/TechDashboard.tsx` listing instances assigned to the logged-in tech. Click → full-screen check-off view (`/tech/checklists/:id`) with large tap targets to set each item to done / na / issue, add notes, and mark the checklist complete.

3. **Customer portal** — add a small read-only "Service checklist" card on `src/components/portal/VehicleHealthCard.tsx` (or new section on PortalDashboard) that shows the most recent + in-progress checklist for each vehicle, plus a dedicated page `/portal/checklists` to browse history.

4. **Per-RO integration (lightweight)** — on the existing repair order / appointment detail in admin, add a "Checklists" panel showing checklists tied to that appointment with a button to attach a template (creates a new instance from the template). No full RO rewrite — just a panel.

## Out of scope this pass
- Photos on checklist items (we can add later — `inspections` already covers photo-heavy flows)
- Automated recurrence (e.g. "create a new membership checklist every quarter") — admins create them manually for now
- Email/SMS notifications when a checklist is completed

## Technical notes
- Instances copy items from the template at creation time (snapshot) so editing a template later doesn't mutate in-flight jobs.
- Membership plan checklists: when admin opens a membership, they can spawn a new instance from the template linked to that plan.
- All status transitions stamp `completed_by = auth.uid()` and `completed_at = now()` via simple client updates (RLS enforces who can do it).
- Reuse existing shadcn primitives (Table, Sheet, Tabs, Badge, Checkbox).
