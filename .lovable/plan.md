## Problem

Google Search Console URL Inspector is reporting **"Review has multiple aggregate ratings"** on `https://mikesmautorepair.com/`. This kills the review-stars rich result.

Root cause: the same business entity is declared multiple times per page, each with its own `aggregateRating`:

| Source | Entity | aggregateRating? |
|---|---|---|
| `index.html` (static, every page) | `AutoRepair @id="…#business"` | ✅ 5.0 / 47 |
| `src/pages/Index.tsx` (runtime, `/`) | `AutoRepair @id="…/#business"` | ✅ from `REVIEWS_META` |
| `src/pages/LocalLanding.tsx` (runtime, landing pages) | `AutoRepair @id="…/#business"` | ✅ from `REVIEWS_META` |
| `scripts/prerender.mjs` (city pages) | `AutoRepair @id="<page>#business"` (new id per page) | ❌ none |

Google merges duplicate business nodes and sees two ratings → invalid.

## Fix Strategy

**Single source of truth:** the `AutoRepair` business entity (with `aggregateRating`, hours, address, sameAs, etc.) lives in **one place only — `index.html`**. Every other page references it by `@id` instead of redefining it.

### Changes

1. **`src/pages/Index.tsx`**
   - Remove the runtime-injected `AutoRepair` node entirely (it duplicates `index.html`).
   - Keep only the page-specific `BreadcrumbList` (and any FAQ if present).
   - Drop the `aggregateRating` / `REVIEWS_META` import here.

2. **`src/pages/LocalLanding.tsx`**
   - Remove the full `AutoRepair` redefinition.
   - Replace `provider` and any business reference with `{ "@id": "https://mikesmautorepair.com/#business" }` so the `Service` node points at the canonical business without redeclaring it.
   - Remove the local `aggregateRating` block.

3. **`scripts/prerender.mjs` (city pages, `/areas/...`)**
   - Stop emitting a second `AutoRepair` node with a per-page `@id`.
   - Instead emit a single `LocalBusiness`-typed reference via `@id: "…/#business"` only when needed, OR drop the duplicate AutoRepair entirely and rely on the one in `index.html` plus a `BreadcrumbList` + `Place`/`City` context.
   - Net effect: each city page has Breadcrumb + FAQ + the inherited `index.html` business block — no duplicate rating.

4. **`scripts/validate-jsonld.mjs`**
   - Add a new check: across all JSON-LD blocks on a single page, no two nodes resolving to the same business `@id` (or same `AutoRepair`/`LocalBusiness` `name`+`url`) may both carry `aggregateRating`. Fail the build if violated.
   - This guarantees the "multiple aggregate ratings" error can never be reintroduced.

5. **`src/data/reviewsMeta.ts`**
   - Keep the constant (still used by visible UI components like the testimonials section), but it should no longer be referenced by any JSON-LD emitter.

### Verification

After the changes, run the existing pipeline:
- `npm run build` → prerender + validate-jsonld + check-jsonld-urls
- New duplicate-rating check should pass on all 59 routes.
- Manually re-test `/` in Google's Rich Results Test — the "multiple aggregate ratings" error disappears, and the single `AggregateRating` (5.0 / 47) from `index.html` remains valid.

### Files to edit

- `src/pages/Index.tsx`
- `src/pages/LocalLanding.tsx`
- `scripts/prerender.mjs`
- `scripts/validate-jsonld.mjs`
