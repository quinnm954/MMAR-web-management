# Tech Dashboard Overview Hub

Turn `/tech` from a bare jobs list into a proper overview hub, and consolidate checklists + inspections into one section.

## New routes

- `/tech` → **New** `TechHome` overview hub (replaces current dashboard view)
- `/tech/jobs` → existing assigned-jobs list (current `TechDashboard` content, renamed)
- `/tech/inspections` (existing checklists + inspections merged here)
- `/tech/checklists` → redirect to `/tech/inspections` (keep links alive)
- `/tech/customers` → **New** read-only customer + vehicle lookup
- `/tech/history` → **New** service records the tech has logged
- `/tech/time` → **New** labor hours tracker (uses existing `time_entries` table)

## Overview hub layout (`/tech`)

Top: greeting + today's date.

**Stats row (4 cards):**
- Jobs today (scheduled appointments assigned to me, today)
- In progress (status = in_progress)
- Completed this week
- Hours this week (sum from `time_entries` where technician_id = me)

**Quick-access cards (grid, mobile-first):**
- My Jobs → `/tech/jobs`
- Checklists & Inspections → `/tech/inspections`
- Customers & Vehicles → `/tech/customers`
- Service History → `/tech/history`
- Labor Hours → `/tech/time`

**Next up section:** next 3 upcoming appointments with quick "Start" / "Open" buttons.

## Merge checklists + inspections

The existing `/tech/inspections` page becomes the single home for both. Add tabs at the top: **Inspections** | **Checklists**. Move `TechChecklists` content into a tab inside `TechInspections`. Delete the separate route and update `TechLayout` nav: replace "Checklists" + "Inspections" entries with one **Inspections** entry.

Mobile bottom nav becomes: Home · Jobs · Inspections · More (sheet with Customers, History, Time).

## New pages

**`TechCustomers`** — search bar + paginated list of customers (read-only). Click a row → expand to show vehicles + recent service history for that customer. Uses existing `profiles`, `vehicles`, `service_records` tables. Reuses tech role check; RLS already lets tech roles read these.

**`TechHistory`** — list of `service_records` where `technician_id = auth.uid()` (need to confirm column exists; if not, filter via joined appointment.assigned_technician_id). Shows date, customer, vehicle, service type, labor performed.

**`TechTime`** — clock in/out widget + list of today's/this-week's `time_entries` for the current tech, with totals. Optional link to an appointment when clocking in. Uses existing RLS policy "Technicians manage own time entries".

## Files

New:
- `src/pages/tech/TechHome.tsx`
- `src/pages/tech/TechJobs.tsx` (moved from current `TechDashboard.tsx`)
- `src/pages/tech/TechCustomers.tsx`
- `src/pages/tech/TechHistory.tsx`
- `src/pages/tech/TechTime.tsx`

Edited:
- `src/App.tsx` — add new routes, redirect `/tech/checklists` → `/tech/inspections`
- `src/components/tech/TechLayout.tsx` — new nav items (Home, Jobs, Inspections, Customers, History, Time)
- `src/pages/tech/TechInspections.tsx` — add tabs to host checklists content
- `src/pages/tech/TechDashboard.tsx` — becomes thin re-export of `TechJobs` or deleted (replaced by `TechHome`)

No database changes — all required tables (`time_entries`, `service_records`, `appointments`, `vehicles`, `profiles`, `vehicle_inspections`, `vehicle_checklists`) and RLS policies already exist.

## Out of scope
- Editing customer data from tech view (read-only only)
- New labor-pay calculations (admin already has `AdminTechLaborPay`)
- Push notifications for new jobs
