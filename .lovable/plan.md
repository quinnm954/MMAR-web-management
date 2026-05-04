## Goal

Make `mikesmautorepair.com` installable to the home screen on iPhone and Android as a Progressive Web App. Customers tap the Mike's icon and get a fullscreen, app-like experience powered by the same React code that runs the website. The live site stays exactly the same for normal browser visitors and for Google's crawler.

## What gets added

### 1. Web App Manifest (`public/manifest.webmanifest`)
- `name`: "Mike's Mobile Auto Repair"
- `short_name`: "Mike's Auto"
- `start_url`: `/`
- `display`: `standalone` (no browser chrome when launched from home screen)
- `theme_color`: sky blue `hsl(200 80% 60%)` → hex equivalent
- `background_color`: dark background to match the site
- `icons`: 192×192 and 512×512 PNGs (plus a maskable variant for Android adaptive icons)

### 2. PWA Icons (`public/icons/`)
Generate from the existing Mike's logo:
- `icon-192.png`
- `icon-512.png`
- `icon-512-maskable.png` (with safe-zone padding for Android)
- `apple-touch-icon.png` (180×180, for iOS home screen)

### 3. Meta tags in `index.html`
Add (without touching existing SEO/JSON-LD):
- `<link rel="manifest" href="/manifest.webmanifest">`
- `<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">`
- `<meta name="apple-mobile-web-app-capable" content="yes">`
- `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`
- `<meta name="theme-color" content="...sky blue...">`

### 4. `/install` page (`src/pages/InstallApp.tsx`)
A simple page customers can be sent to with step-by-step "Add to Home Screen" instructions:
- **iPhone (Safari)**: Share button → Add to Home Screen
- **Android (Chrome)**: Menu → Install app (with a real install button when the browser fires `beforeinstallprompt`)
- Detects platform and shows the relevant section first
- Branded with the existing dark theme + sky/gold accents
- Linked from the footer as "Install App"

Route added to `App.tsx` above the catch-all.

### 5. No service worker (intentional)
Skipping `vite-plugin-pwa` and service workers entirely. Reasons:
- Installability only requires the manifest + icons + HTTPS — all already true.
- Service workers cache aggressively and would interfere with the prerendered SEO HTML and the Lovable preview iframe.
- Offline support isn't valuable for this business (the whole point is to call/text Mike, which needs a network anyway).

This keeps the setup safe, low-risk, and avoids the stale-cache problems documented for Lovable PWAs.

## What does NOT change

- All 59 prerendered routes, JSON-LD, sitemaps, Google indexing — untouched
- Existing pages, components, styling, phone/SMS buttons — untouched
- `index.html` JSON-LD `AutoRepair` block with the single aggregateRating — untouched
- Build pipeline (`scripts/prerender.mjs`, `scripts/validate-jsonld.mjs`) — untouched
- No new dependencies, no service worker, no Lovable preview interference

## How customers install it

After this ships and you publish:
1. Visit `mikesmautorepair.com` on their phone, OR go to `mikesmautorepair.com/install`
2. **iPhone**: Tap Share → "Add to Home Screen" → Add
3. **Android**: Tap the install banner Chrome shows automatically, or Menu → "Install app"
4. Mike's icon appears on their home screen. Tapping it opens the site fullscreen, no browser bar — looks and feels like a native app. Call/text buttons fire the dialer exactly like before.

## Files

**Created:**
- `public/manifest.webmanifest`
- `public/icons/icon-192.png`, `icon-512.png`, `icon-512-maskable.png`, `apple-touch-icon.png`
- `src/pages/InstallApp.tsx`

**Edited:**
- `index.html` — add manifest link + apple-touch-icon + theme-color meta tags
- `src/App.tsx` — add `/install` route
- `src/components/Footer.tsx` — add "Install App" link

## Verification

After implementation:
- Open the published site on a phone → confirm "Add to Home Screen" works on both iOS and Android
- Confirm the installed app launches fullscreen with the correct icon and splash colors
- Re-run the existing build (`npm run build`) → all 59 prerendered routes + JSON-LD validation still pass
- Confirm Google's Rich Results Test on `/` is still clean (no regressions to the SEO work we just finished)
