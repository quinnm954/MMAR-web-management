# Inspection = the job completion

Make the inspection the only thing a tech fills out per job. Merge all 9 admin-defined checklist templates into one mobile-friendly form. Completing the inspection auto-completes the job and auto-creates the service record.

## Behavior changes

**TechJobs (`/tech/jobs`)**
- Remove the "Log Service & Complete" button and the entire log-service dialog.
- Replace with a single primary action per card: **"Open Inspection"** → if an inspection already exists for that appointment, open it; otherwise create one and open it.
- Keep status dropdown and notes field (handy for quick updates), but no manual service-record entry.

**TechInspections — single merged form**
- When creating an inspection for an appointment, pull items from **all active** `checklist_templates` (`is_active = true`), via `checklist_template_items`, and insert them as `inspection_items` grouped by template name as the category.
- De-dupe rule: collapse identical `(category, item_name)` pairs so the same item from two templates appears once.
- Sort by template `sort_order` then item `sort_order`, so the form reads top-down in the order the admin set up.
- Mobile-first tweaks: sticky category headers, large pass/warn/fail/N/A buttons (min 44px tap), one-tap photo capture, a sticky "Complete inspection" bar at the bottom, collapsible categories so the form stays scannable on a phone.

**On "Complete Inspection"**
1. Mark `inspections.status = completed`, set `completed_at`.
2. If the inspection has an `appointment_id`:
   - Set `appointments.status = completed`.
   - Insert a `service_records` row using: the appointment's `service_type`, today's date, `mileage` from inspection → `mileage_at_service`, `summary_notes` → `labor_performed`, and a summary like "Inspection #abcd1234" in `technician_notes`. Skip if a service_record already exists for that `appointment_id`.
3. Toast and return to job list.

## What gets removed
- TechJobs: `openLog`, `saveLog`, `form` state, the entire `<Dialog>` for service logging, the "Log Service & Complete" button, related imports (Textarea, Select if unused, etc.).
- The 12-item hardcoded `DEFAULT_TEMPLATE` in `TechInspections.tsx` — replaced by a loader that fetches `checklist_templates` + `checklist_template_items` and builds the merged item list.

## Files

Edited:
- `src/pages/tech/TechJobs.tsx` — remove log flow; add "Open Inspection" action that creates-or-opens the appointment's inspection (navigates to `/tech/inspections?inspection=<id>` or sets internal state via shared route).
- `src/pages/tech/TechInspections.tsx` — replace hardcoded template with merged-template loader, add auto service-record creation on completion, sticky bottom CTA, collapsible categories.

No database schema changes. Uses existing tables: `checklist_templates`, `checklist_template_items`, `inspections`, `inspection_items`, `service_records`, `appointments`.

## Open-deep-link detail

To make "Open Inspection" from TechJobs land directly on the inspection editor, `TechInspections` will read an `?inspection=<id>` query param on mount and open that one. If the appointment has no inspection yet, TechJobs creates a draft inspection (same logic as the existing `createInspection`) then navigates with the new id.

## Out of scope
- Editing checklist templates themselves (admin already has `AdminChecklists`).
- Invoice creation — admin still does that from the new `service_records` row.
- Photo annotations / signatures.
