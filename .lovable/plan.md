Plan: New MMAR logo from the reference image

1. Generate the logo
   - Use the uploaded reference as the style guide: black Shelby GT500 with white stripes, dripping graffiti "MMAR" lettering, "MIKE'S MOBILE AUTO REPAIR" text, crossed wrenches, shield/badge with speedometer.
   - Adapt the color palette to the site brand: sky blue `hsl(200,80%,55%)` and gold `hsl(45,90%,55%)` on a dark background.
   - Output a high-resolution PNG (square, at least 1024×1024) and a transparent-background version where possible.

2. Produce all required sizes/formats
   - `src/assets/mmar-logo.png` — main site logo for nav and footer.
   - `public/favicon.png` and `public/favicon.ico` — browser tab icon.
   - `public/logo192.png` and `public/logo512.png` — PWA/app icon sizes.
   - `public/og-image.png` — 1200×630 social share image.

3. Integrate into the app
   - Replace `src/assets/mmar-logo.jpeg` usage in `src/components/Navigation.tsx` and `src/components/Footer.tsx` with the new logo.
   - Update `index.html` favicon and `apple-touch-icon` links.
   - Update `public/manifest.webmanifest` icon entries to point at the new PWA icons.
   - Add Open Graph and Twitter Card meta tags in `index.html` pointing at the new `og-image.png`.

4. Verify
   - Check the preview to confirm the logo renders cleanly in the nav and footer at all breakpoints.
   - Confirm favicon and PWA icons are referenced correctly.

No other pages or business logic will be changed.