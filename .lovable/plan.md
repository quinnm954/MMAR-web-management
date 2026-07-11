## Digital Business Card

Create a shareable web page at `/card` designed to be sent via SMS/QR that presents Mike's Mobile Auto Repair contact info with one-tap action buttons and a "Save to Contacts" vCard download.

### New file: `src/pages/BusinessCard.tsx`

Mobile-first, single-viewport card layout using existing design tokens (sky/gold, glass-card, dark bg). Structure:

- **Header block** — MMAR logo, business name (display font), tagline "Mobile Auto Repair — Southwest Florida"
- **Primary actions** (large tap targets, stacked): 
  - Call (813) 501-7572 — white
  - Text (813) 501-7572 — blue
  - Book Now → `/book` — blue
  - Email `mikesmarllc@gmail.com` — blue
- **Secondary row**: Website, Google Reviews, Directions (uses existing GMB URL from `Contact.tsx`)
- **Save to Contacts button** (yellow accent) — triggers download of a generated `.vcf` blob (client-side, no dependency). Includes FN, ORG, TEL (work + cell), EMAIL, URL, ADR (service area), NOTE.
- **Share button** — uses existing `shareLink()` from `src/lib/share.ts` to invoke native share sheet with card URL.
- Footer: small "Capital Services Management, INC." legal line.

Reuses `trackConversion()` from `@/lib/gtag` on call/text/email clicks.

### SEO

Uses `useSeo()` with title "Mike's Mobile Auto Repair — Digital Card", description, canonical `https://mikesmautorepair.com/card`. Person/LocalBusiness JSON-LD already exists sitewide; no extra schema needed.

### Routing

Add `<Route path="/card" element={<BusinessCard />} />` in `src/App.tsx` above the catch-all `/:landingSlug` route.

### Out of scope

- No QR code image generated (user chose page-only). They can generate a QR from any tool pointing at `mikesmautorepair.com/card`.
- No per-staff variants.
- No changes to Navigation, Footer, or existing Contact page.

### Technical notes

vCard 3.0 string built inline and downloaded via `Blob` + anchor click — no npm dependency. Filename: `mikes-mobile-auto-repair.vcf`.
