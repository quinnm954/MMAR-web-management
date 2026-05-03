## Plan: SEO Section, Service Pages & City Pages

### 1. Homepage SEO Content Section (~700 words)
Add a new component `src/components/SeoContent.tsx` and slot it into `src/pages/Index.tsx` between `Services` and `Testimonials`.

Content sections (H2/H3 with keyword-rich copy):
- **Mobile Auto Repair Done at Your Location** — what mobile mechanic service means, convenience, ASE-level work
- **Roadside Help When You're Stuck** — jump starts, lockouts, flat tires, dead batteries
- **Computer Diagnostics & Check Engine Light** — OBD-II scanning, drivability issues
- **Emergency Service** — same-day/after-hours response across SWFL
- **Service Areas** — internal links to Lehigh Acres, Fort Myers, Cape Coral, Naples, Estero, Bonita Springs

Will use existing semantic tokens (`text-sky`, `text-gold`, `bg-secondary/30`) and link out to new city/service pages. Phone CTA `tel:8135017572` included.

### 2. Individual Service Category Pages
Create one page per category from `Services.tsx` (11 categories: engine, oil-fluids, brakes, electrical, ac-heating, cooling, transmission, suspension, tires-wheels, fuel-exhaust, inspections).

Approach — single dynamic route to keep it DRY:
- New file: `src/pages/ServiceCategory.tsx`
- Route: `/services/:slug` in `App.tsx`
- Move the `categories` array out of `Services.tsx` into `src/data/serviceCategories.ts` so both the homepage accordion and the new pages share data
- Each page renders: Navigation, hero (category title + intro paragraph), full list of services as cards (each opens `QuoteRequestDialog`), local SEO blurb mentioning service areas, CTA buttons (Call / Text), Footer, FloatingCallButton
- Add a per-category `description` field used for the intro/meta description

Update `Services.tsx` accordion items so the category title links to its `/services/:slug` page (keep accordion expand behavior intact — add a small "View details →" link inside each open panel).

### 3. City Landing Pages
Single dynamic route `/areas/:city` powered by a city data file.

- New file: `src/data/cities.ts` with entries for `lehigh-acres`, `fort-myers`, `cape-coral` (name, neighborhoods, zip codes, intro paragraph, 2–3 unique paragraphs of local copy)
- New page: `src/pages/CityPage.tsx` rendering: Navigation, H1 like "Mobile Mechanic in Lehigh Acres, FL", local SEO copy (~400–500 words/city), grid of service category links (`/services/:slug`), CTA, Footer, FloatingCallButton
- Route added in `App.tsx` above the catch-all

### 4. Per-page SEO meta tags
Add a tiny helper `src/lib/useSeo.ts` that sets `document.title` and the `<meta name="description">` on mount. Use it on the new service and city pages so each has unique title + description (e.g. "Mobile Mechanic in Cape Coral, FL | Mike's Mobile Auto Repair").

### 5. Internal linking
- Footer: add a "Service Areas" column linking the 3 city pages and a "Services" column linking the 11 category pages
- Homepage SEO section: inline links to city + key category pages

### Files to create
```text
src/components/SeoContent.tsx
src/data/serviceCategories.ts
src/data/cities.ts
src/pages/ServiceCategory.tsx
src/pages/CityPage.tsx
src/lib/useSeo.ts
```

### Files to edit
```text
src/App.tsx              add /services/:slug and /areas/:city routes
src/pages/Index.tsx      mount <SeoContent />
src/components/Services.tsx   import categories from data file, add detail link
src/components/Footer.tsx     add Services + Service Areas link columns
```

### Notes
- All copy will be original, locally-focused, written for humans first (Google penalizes thin/spun content).
- No new dependencies needed.
- Cape Coral will be added to the service-area memory after implementation if you want it formally listed as a serviced city.
