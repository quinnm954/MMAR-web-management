# Garage Ace Code Audit — Findings & Fix Plan

Full sweep covering brand correctness, tech workflow, routing, types, and database. No critical bugs found; several real correctness issues and a large pile of brand-string hardcoding.

## Summary

| Area | Critical | High | Medium | Low |
|---|---|---|---|---|
| Brand correctness | 0 | 4 | 3 | 15+ |
| Tech workflow | 0 | 3 | 4 | 3 |
| Routing / dead code | 0 | 0 | 1 | 0 |
| Database (Supabase linter) | 0 | 0 | 0 | 70 advisory |

Supabase linter: 70 warnings, **all** are the standard "SECURITY DEFINER function callable by anon/authenticated" advisory. Every flagged function (`has_role`, `submit_estimate_decision`, `redeem_mileage_token`, `get_*_by_token`, etc.) is *intentionally* callable — they are how anonymous/auth flows reach the DB safely. Advisory only, no action needed.

---

## High-priority fixes (do now)

### Brand
1. **`index.html:29`** — `apple-mobile-web-app-title` content is `"MMAR"`. Change to `"Garage Ace"` so iOS home-screen icon matches the manifest.
2. **`src/components/tech/TechLayout.tsx:34`** — sub-label hardcodes `"Mike's Mobile Auto Repair"` inside the Garage Ace tech shell. Remove it or replace with the technician's name/role.
3. **`src/pages/portal/MembershipSignup.tsx:44,74`** — title `"… | MMAR"` and heading `"Join MMAR"` use the bare abbreviation. Use `PRODUCT_BRAND.name` (`"MMAR Care"`).
4. **`src/pages/portal/PortalServiceHistory.tsx:108`** — empty-state copy says `"…after your first MMAR visit."` — use `PRODUCT_BRAND.shopName` or `"MMAR Care"`.
5. **`src/pages/Fleet.tsx:36,105,249`** — three bare `"MMAR"` strings (SMS template, `<title>`, section heading). Use `PRODUCT_BRAND.shopName` / full name.
6. **`src/pages/AboutPage.tsx:13`** — `<title>` starts with `"About MMAR"`. Use the full shop name.

### Tech workflow
7. **`TechInspections.tsx:455`** — tab `onValueChange` calls `setParams({}, { replace: true })`, blowing away any active `?inspection=<id>` deep-link. Build a `URLSearchParams` and only delete `tab` (mirror the `closeDetail` helper at L195).
8. **`TechDashboard.tsx`** — Labor Hours / clock-in was supposed to be gone, but the dashboard still queries `time_entries`, computes `hoursThisWeek`, and renders a "Hours this week" stat card (`Clock` icon import L13, query L98-101, stat card L136/174). Remove the query, the field on `Stats`, the import, and the card.
9. **Untargeted checklist merge** — `TechJobs.openInspection` (L179-201) and `TechInspections.buildMergedTemplateItems` (L62-87) merge items from *every* active template regardless of the appointment's `service_type`. Filter templates by `service_type_match` against the appointment's service type (same case-insensitive contains rule the DB trigger `attach_inspection_checklists` already uses).

## Medium-priority

### Brand (replace hardcoded strings with imports from `src/lib/brand.ts` / `portalStrings.ts`)
- `src/components/BrandedDocLayout.tsx:13,56`
- `src/pages/FinancingContract.tsx:42`
- `src/pages/EstimateApproval.tsx:344`
- `src/pages/AppointmentConfirmation.tsx:84`
- `src/pages/MmarCare.tsx:145,173,300` — hardcoded `"Garage Ace"`, use `PLATFORM_BRAND.name`
- `src/pages/Login.tsx:160` — hardcoded `"Garage Ace"`, use `PLATFORM_BRAND.name`
- `src/components/portal/wizard/StepAgreement.tsx:115` — source shop name from `PRODUCT_BRAND.shopName`

### Tech workflow
- **`AdminInspections.tsx:16,65`** — local `DEFAULT_TEMPLATE` array bypasses `checklist_templates`. Load templates from DB like the tech side now does.
- **`src/App.tsx:52,143`** — `/tech/time` route + `TechTime` import are orphaned (no nav links anywhere). Either re-expose in nav or remove route + page + import.
- **`src/lib/serviceTypes.ts`** — header comment promises a 1:1 SERVICE_TYPE→template mapping but no runtime check exists. Either wire `auditServiceTypeTemplates` (already in `src/lib/auditServiceTypeTemplates.ts`) into AdminChecklists as a visible health badge, or drop the promise from the comment.
- **Stale `any` types** — `TechJobs.tsx:122-123,89,103,183,192,195`; `TechInspections.tsx:67,76,79,121,123,138,150,152,169,306`. Replace `any` accumulators / `(t: any)` callbacks with proper types from `src/integrations/supabase/types.ts`.

## Low-priority (cosmetic / consistency)

- Public marketing pages (Footer, FloatingCallButton, About, SeoContent, WhyChooseUs, VoiceSearchAnswers, ContactPage, ReviewLanding, NotFound, Unsubscribe, InstallApp, `data/cities.ts`, `data/blogPosts.ts`, `data/serviceCityMatrix.ts`, `data/localLandingPages.ts`, `index.html`) all hardcode `"Mike's Mobile Auto Repair"`. Values are correct; just not sourced from `PRODUCT_BRAND.shopName`. Worth a sweep but not urgent.
- `manifest.webmanifest` description hardcodes both brand names (correct text, just not constant-sourced).
- `forbidden-terms` script passes cleanly — no SC/Greenville/Spartanburg leakage.

---

## Out of scope for this pass
- Edge-function-side strings (transactional email templates) — separate review.
- Renaming/restructuring the brand constants themselves.
- Re-architecting the inspection ↔ checklist data model.

## What I'll do on approval
Implement everything under **High-priority** plus the medium-priority brand imports and the `any`-type cleanups in tech files. Decide `tech/time` route by asking you (keep or remove) before touching it. Leave the low-priority marketing sweep + AdminInspections refactor for follow-up unless you say otherwise.
