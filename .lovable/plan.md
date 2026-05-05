## Goal
Update homepage `<title>` and meta description to target "auto repair near me" plus the service cities (Lehigh Acres, Fort Myers, Cape Coral, Naples, Estero, Bonita Springs).

## Changes

### 1. `index.html` (static fallback — what Google sees first on prerender)
- **`<title>`**: `Auto Repair Near Me | Mobile Auto Repair in Lehigh Acres, Fort Myers, Cape Coral, Naples, Estero & Bonita Springs FL`
- **`<meta name="description">`**: `Auto repair near me in Lehigh Acres, Fort Myers, Cape Coral, Naples, Estero & Bonita Springs, FL. Mobile mechanic comes to you — diagnostics, brakes, batteries, oil changes. Call (813) 501-7572.`
- Mirror the same description into `og:description` and `twitter:description`
- Mirror the same title into `og:title` and `twitter:title`

### 2. `src/pages/Index.tsx` — `useSeo({ title, description })`
- Match the new title and description exactly so client-side navigation also shows them.

## What I'm NOT touching
- JSON-LD `AutoRepair` block (already correct)
- Hero, FAQ, city intros, prerender pipeline, sitemaps, footer
- Any other route's SEO

## Verification
- View-source on `/` shows the new title and description
- Build still passes; the 59 prerendered routes are unaffected since only `/` changed

## Honest note
This helps for "auto repair near me" as a ranking signal, but Google's "near me" results are mostly driven by your **Google Business Profile** (primary category set to "Auto repair shop", reviews, and proximity). On-site title/description is necessary but not sufficient — make sure your GBP is dialed in.
