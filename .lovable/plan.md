## Goal
Auto-attach a focused inspection checklist to each appointment based on its `service_type`, so techs inspect adjacent components while in that area and can convert findings into estimate lines in one tap.

## Job → focus-area templates (seeded)
Each becomes a `checklist_templates` row with `category = 'inspection'` and a `service_type_match` array.

- **Oil change** → under-hood + undercarriage: belts, hoses, coolant level, brake fluid, air filter, leaks, CV boots, exhaust, motor mounts.
- **Brake job** → suspension + wheel area: rotors, calipers, pads remaining (mm), struts/shocks, tie rods, ball joints, control-arm bushings, wheel bearing, tire tread/wear pattern.
- **Tires / alignment** → steering + front end: ball joints, tie rod ends, control arms, wheel bearings, sway bar links, alignment indicators.
- **Battery / electrical** → charging system: alternator output, starter draw, battery terminals/clamps, ground straps, belt tension.
- **Coolant / radiator** → cooling system: hoses, water pump, thermostat housing, cap, fan operation, overflow tank.
- **Transmission service** → drivetrain: mounts, axles/CV joints, transfer case, diff seals, driveshaft U-joints.
- **AC service** → HVAC + belts: compressor clutch, condenser fins, cabin filter, blower, refrigerant pressures, drive belt.

## Schema additions

Extend the existing `service_checklists` + `service_checklist_items` tables (already in use) with severity + upsell fields.

```text
checklist_templates
  + service_type_match  text[]    -- e.g. {oil_change, oil}
  + auto_attach         boolean   -- default true on inspection templates

service_checklist_items
  + severity            text      -- good | monitor | needs_service | urgent | null
  + recommended         boolean   -- tech marked as upsell
  + recommended_at      timestamptz
  + recommended_by      uuid
  + estimate_line_id    uuid      -- back-ref once added to an estimate
```

(Photos and measured-value fields skipped per your selection.)

## Auto-attach trigger

DB trigger `tr_appointment_attach_inspection` on `appointments` AFTER INSERT/UPDATE OF `service_type`:
1. Find active `checklist_templates` where `service_type_match` contains the appointment's service_type.
2. For each, call existing `create_checklist_from_template(template_id, appointment_id, customer_id, vehicle_id)` if one isn't already attached.
3. Idempotent: skip if a checklist with that `(appointment_id, template_id)` already exists.

## Tech UX (`TechChecklists.tsx`)

Per item, add:
- 4-color severity selector: green (good) / yellow (monitor) / orange (needs service) / red (urgent).
- **"Recommend"** button (visible when severity ≥ monitor). Tapping it:
  - Marks `recommended = true`.
  - Opens a small sheet pre-filled with item label, suggested labor hours, and optional catalog part search.
  - On confirm → inserts a line into the active estimate for that RO/appointment (creates a draft estimate if none exists) and stamps `estimate_line_id` back on the item.

## Admin UX

- `AdminChecklists.tsx` template editor gains a multi-select **"Auto-attach for service types"** field and per-item severity defaults.
- RO/appointment detail shows a "Recommendations" panel listing all `recommended = true` items across the job's checklists with a one-click "Add to estimate" for any not yet linked.

## Customer portal

Read-only badge per item showing severity color + any tech-added recommendation note (no pricing pressure — they see findings, admin sends the estimate separately via the existing estimate flow).

## Out of scope (v1)
- Photos per item, measured numeric fields, auto-sent recommendation summaries to customer, AI suggestions.

## Files touched
- New migration: schema additions + auto-attach trigger + seed of 7 templates with items.
- `src/pages/tech/TechChecklists.tsx` — severity selector, Recommend sheet, estimate-line creation.
- `src/components/admin/AdminChecklists.tsx` — service_type_match editor.
- `src/pages/portal/PortalChecklists.tsx` — severity color display.
- New `src/components/admin/RecommendationsPanel.tsx` mounted on RO/appointment detail.
