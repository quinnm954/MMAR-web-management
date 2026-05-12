## Goal

Cleanly separate two brands inside one codebase, with no functional changes:

- **MMAR Care** = the *product* — your subscription/care plans + the public marketing site (mobile mechanic in SW Florida). This is what end customers buy.
- **Garage Ace** = the *platform* — the app shell where everything happens: login, customer portal (where they manage their MMAR Care subscription, vehicles, invoices, etc.), employee/tech app, and admin dashboard. This is what other shops will eventually buy.

This is brand-only for now. No multi-tenancy, no DB changes, no Stripe changes, no auth changes. Everything keeps working exactly as it does today.

## Brand mapping (the important flip)

Today the project memory says "the platform is MMAR Care, never Garage Ace." We're inverting that:

| Surface | Today | After |
|---|---|---|
| Public homepage, services, areas, blog, booking | MMAR Care | **MMAR Care** (unchanged) |
| Subscription plans (`/memberships`, `/mmar-care`) | MMAR Care | **MMAR Care** (unchanged) |
| Login page chrome | MMAR Care | **Garage Ace** |
| Customer portal (`/portal/*`) header/title/emails | MMAR Care | **Garage Ace** (with "Your MMAR Care membership" inside) |
| Admin dashboard (`/admin/*`) | MMAR Care | **Garage Ace** |
| Tech app (`/tech/*`) | MMAR Care | **Garage Ace** |
| Native app shell name + push notifications | MMAR Care | **Garage Ace** |
| Footer copyright | Capital Services Management, INC. | unchanged |

Rule of thumb: if a customer is *buying or learning about service*, they see MMAR Care. If they're *signed in and using the app*, they see Garage Ace (with their MMAR Care plan referenced inside).

## What changes

### 1. Brand config module
Create `src/lib/brand.ts` with two exports:
- `PLATFORM_BRAND` = `{ name: "Garage Ace", tagline: "Shop management, simplified", logo: ... }`
- `PRODUCT_BRAND` = `{ name: "MMAR Care", tagline: "Mobile mechanic care plans", logo: ... }`

All platform-shell components import from here so future renames (or per-tenant branding later) are one-file changes.

### 2. Rebrand the platform shell
- `src/pages/Login.tsx` — replace "MMAR Care" headings/logos with Garage Ace, add small "for MMAR Care customers and staff" subline.
- `src/components/portal/PortalLayout.tsx` — header brand → Garage Ace; keep "MMAR Care membership" wording inside the membership card on `PortalMembership.tsx`, `PortalDashboard.tsx`.
- `src/pages/admin/AdminDashboard.tsx` + `src/components/admin/*` page titles → Garage Ace.
- `src/components/tech/TechLayout.tsx` → Garage Ace.
- `src/components/NativeBoot.tsx` JSDoc + `src/hooks/useNativePushRegistration.tsx` strings → Garage Ace.
- `src/components/BrandedDocLayout.tsx` / `DocReferences.tsx` — document headers stay MMAR Care (they're customer-facing legal docs).

### 3. Public site untouched
`Hero.tsx`, `AboutPage.tsx`, `Memberships.tsx`, `MmarCare.tsx`, `Book.tsx`, `Blog*`, sitemaps, blog posts, navigation for logged-out users → all stay MMAR Care.

### 4. Native app + manifest
- `capacitor.config.ts` `appName` → "Garage Ace" (the installed app icon label is the platform).
- `public/manifest.webmanifest` `name` / `short_name` → Garage Ace (PWA install = the app, not the membership).
- iOS/Android display name docs in `MOBILE_APP_README.md` updated.
- App icons: keep current visual; just relabel. (Logo asset swap is a follow-up if you want a distinct Garage Ace mark.)

### 5. Document titles & SEO
- Logged-in routes (`/portal/*`, `/admin/*`, `/tech/*`, `/login`) → `<title>` uses Garage Ace.
- Public routes → `<title>` keeps MMAR Care.
- `robots.txt` already disallows `/portal`, `/admin`, `/tech` — no SEO bleed.

### 6. Email templates
Keep transactional emails (`appointment-confirmed`, `invoice-issued`, etc.) signed as **MMAR Care** because they're about the service the customer bought. Only the *portal-access* email ("set your password", "welcome to your account") gets Garage Ace branding so customers learn the app name.

### 7. Memory update
Rewrite `mem://branding/platform-name` and the Core memory line to reflect:
> Platform/app shell = Garage Ace. Service product + public marketing site + subscription plans = MMAR Care. Inside the app, refer to the user's plan as their "MMAR Care membership."

## What does NOT change
- Database schema, RLS, edge functions, Stripe products, Twilio, auth flow, routes, URLs.
- The `/mmar-care` and `/memberships` marketing pages.
- Phone number, service areas, financing/warranty terms, footer copyright.
- Google Ads tracking and sitemaps.

## Future (not in this plan, just so you know where it leads)
- Add a `tenants` table and a Garage Ace marketing/sales site so other shops can sign up.
- Extract MMAR Care–specific copy (phone number, service areas, plan SKUs) into a tenant config so the same Garage Ace app can power multiple shops.
- Separate domain: `app.garageace.com` for the platform vs. `mmarcare.com` for this shop's marketing.

## Files touched (estimate)
~25 files, all string/branding swaps + one new `src/lib/brand.ts`. No migrations. No new dependencies.
