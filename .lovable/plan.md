## Plan: Add a "Why Garage Ace?" customer bio + fix MMAR Care wording across the site

### Corrected brand model

- **Garage Ace** = the customer app / portal / native app — the thing customers log into to manage vehicles, approve estimates, see inspections, pay invoices.
- **MMAR Care** = the maintenance plan / membership program customers subscribe to inside Garage Ace. It is a product offering, not an app or portal.

Today the site conflates these — `MmarCare.tsx` is built as a customer-portal sign-in page, Navigation labels it "MMAR Care Portal", Login.tsx says "For MMAR Care customers", etc. We need to fix that and add a bio page that answers "why do I need this app?"

### 1. New page: `src/pages/WhyGarageAce.tsx` (route `/why-garage-ace`)

Public, customer-facing bio that the shop can send to anyone asking "why do I need this app?". Conversational tone, no jargon.

Sections:
- **Hero** — "Your car, your phone, your peace of mind." One line on what Garage Ace is for customers (the free app from Mike's Mobile Auto Repair).
- **The problem** — receipts in glove boxes, forgotten oil-change dates, phone tag for quotes, paper inspection sheets.
- **What Garage Ace does for you** — vehicle history, request appointments, approve estimates from your phone, see inspection photos, pay invoices, manage household vehicles.
- **Where MMAR Care fits in** — short callout: MMAR Care is the optional monthly maintenance plan you can subscribe to inside the app. The app is free either way.
- **Common questions** — Do I have to pay? (No.) Do I need to download anything? (No, works in any browser; native app optional.) Is my info safe? Can I share access with my spouse?
- **Get started** — sign-up CTA + text/call CTA.

Uses `Navigation`, `Footer`, `FloatingCallButton`, `useSeo`, existing Tailwind tokens (sky/gold), Lucide icons. Mobile-first.

### 2. Fix MMAR Care discrepancies across the site

**`src/pages/MmarCare.tsx`** — rebuild as the marketing page for the MMAR Care **maintenance plan program** (not a portal/login page).
- Remove the sign-in card entirely (login lives in Garage Ace).
- Reframe copy: MMAR Care = subscription maintenance plans (oil changes included, priority scheduling, discounted labor, per-VIN coverage).
- CTAs: "View plans" → `/memberships`, "Sign up" → `/login?tab=signup`, "Already a member? Open the app" → `/login`.
- Update SEO title/description to "MMAR Care Maintenance Plans" (no "Portal").
- Replace "What's inside MMAR Care" feature grid with plan benefits (included services, priority, savings, transferable warranty) instead of app features.

**`src/components/Navigation.tsx`**
- Line 61: change `"MMAR Care Portal"` → `"Garage Ace"` (or `PLATFORM_BRAND.name`).
- Lines 132 & 245: the menu item labeled "MMAR Care" that links to the portal — split or relabel: keep a "MMAR Care" link pointing to `/mmar-care` (plan info), and add/rename the portal/sign-in link to "Garage Ace" pointing to `/login` or `/portal/dashboard`.

**`src/pages/Login.tsx`** (line 157)
- Change `"For MMAR Care customers and staff"` → `"For Garage Ace customers and staff"`.

**`src/pages/GarageAce.tsx`**
- Lines 201–205 & 271–275: "MMAR Care customer? Sign in on the MMAR Care page" — wrong. Customers sign in on Garage Ace itself. Replace with a single combined "Customer sign-in" affordance (or keep the staff card and add a customer link to `/login`).
- Lines 54, 176, 334, 341: keep "Powering MMAR Care" references — these are correct (Garage Ace powers the MMAR Care plan program at this shop).

**`src/components/Hero.tsx`** (line 66) — `"Join MMAR Care — Member Plans"` — keep, this is correct (joining the plan).

**`src/pages/AboutPage.tsx`** — adjust the "Why we built MMAR Care" section copy: split into "Why we built Garage Ace (the app)" and "Why we built MMAR Care (the plan)". Update the existing paragraph that calls MMAR Care a portal.

**`src/lib/brand.ts`** — update the JSDoc comment block to reflect: PRODUCT_BRAND is the maintenance plan product, not "the customer-facing service product / public marketing site". Keep `name: "MMAR Care"` and `tagline: "Mobile mechanic care plans"` (already correct).

### 3. Route + cross-links

- Register `/why-garage-ace` route in `src/App.tsx`.
- Add a small "Why do I need this app?" link to:
  - The new revamped `/mmar-care` page (so members understand the app too).
  - `/login` page (subtle link under the sign-in form).

### 4. Memory update

Update `mem://branding/platform-name` so future work doesn't reintroduce the same confusion: explicitly state MMAR Care is a **maintenance plan / membership product**, not a portal or app. Garage Ace is the only app/portal brand.

### Files touched
- `src/pages/WhyGarageAce.tsx` (new)
- `src/App.tsx` (route)
- `src/pages/MmarCare.tsx` (rebuild as plan marketing page)
- `src/components/Navigation.tsx` (labels)
- `src/pages/Login.tsx` (copy)
- `src/pages/GarageAce.tsx` (customer sign-in references)
- `src/pages/AboutPage.tsx` (split brand explanation)
- `src/lib/brand.ts` (JSDoc only)
- `mem://branding/platform-name` (clarify)

No database changes.