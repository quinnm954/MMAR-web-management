# Garage Ace Mobile Enhancement Plan

You picked a large scope (admin + tech + portal + global shell) with three improvement types (layout/ergonomics, PWA install, native Capacitor). This is too much for one pass and would create a giant unreviewable change. Here is the proposed phased rollout — confirm and I'll start with Phase 1.

## Phase 1 — Touch ergonomics & responsive cleanup (biggest impact, lowest risk)

Global shell
- Sticky bottom tab bar on mobile for Admin and Tech (Dashboard / Bookings / RO / Customers / More) and for Portal (Dashboard / Vehicles / Estimates / Invoices / More).
- Collapse current sidebar into a slide-over drawer on phones; full-height tap targets.
- Top bar: condense to logo + page title + single overflow menu on mobile.
- Safe-area padding (`env(safe-area-inset-*)`) so content clears the iOS notch and home indicator.
- 44px minimum tap targets across primary buttons, list rows, icon buttons.

Admin area
- Convert wide tables (Bookings, Customers, Invoices, Estimates) to responsive card lists below `sm`.
- Kanban: horizontal scroll-snap columns on phones with column dots indicator.
- Modals/sheets: full-screen Sheet on phones instead of centered Dialog.
- Sticky bottom action bar on edit screens (Save / Cancel) so primary actions are always reachable.

Technician area
- RO detail: collapse meta into accordion; sticky "Clock In/Out" and "Add Photo" floating actions.
- Inspection items: larger pass/fail/recommend toggle row, swipe between items.
- Photo upload: trigger native camera via `<input capture="environment">`.

Customer portal
- Stat cards already trimmed; carry the same compact pattern to lists (estimates, ROs, invoices) with bigger row tap targets and stickied filter chips.
- Pull-to-refresh affordance via the existing refresh button moved to a sticky position.

## Phase 2 — Installable PWA (manifest-only, no service worker)

Per Lovable guidance, **no `vite-plugin-pwa` and no service worker** — just a web manifest so users can "Add to Home Screen" on iOS/Android with an app icon, splash background, and standalone display mode. This avoids preview-iframe cache issues and gives you a real installable app feel without offline complexity.

- Add `public/manifest.webmanifest` with name "Garage Ace", short_name, theme/background colors from the design tokens, icons (192/512), `display: "standalone"`.
- Add `<link rel="manifest">`, apple-touch-icon, theme-color, and viewport-fit=cover meta tags in `index.html`.
- Add a `/install` page with platform-aware instructions and the `beforeinstallprompt` flow on Android/Chrome.

## Phase 3 — Native wrapper (Capacitor) for App Store / Play Store

Scaffolding only — the user runs `npx cap add ios/android` from their own machine after exporting to GitHub.

- Install `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`, `@capacitor/android`.
- `capacitor.config.ts` with appId `app.lovable.6370c0499e634e0c894716857b255272`, appName `shop-flow-home`, hot-reload server URL pointing at the sandbox preview.
- Add `@capacitor/push-notifications`, `@capacitor/camera`, `@capacitor/status-bar`, `@capacitor/splash-screen` and a thin `src/lib/native.ts` that no-ops in the browser and uses native plugins when running inside Capacitor.
- Hook camera into the inspection photo flow, push tokens into the existing `device_tokens` table.
- Document the local steps (export to GitHub → `npm i` → `npx cap add ios/android` → `npx cap sync` → `npx cap run ios`) — read the Capacitor blog post for full setup.

## Suggested order

1. Phase 1 — shipped now, immediate UX win on the phones you already use.
2. Phase 2 — quick follow-up so staff/customers can install the app icon.
3. Phase 3 — when you are ready to publish to the App Store / Play Store.

## Confirm

Reply with one of:
- "Go" — I'll start Phase 1.
- "Just shell + portal first" (or any subset) — I'll narrow Phase 1.
- "Skip to Phase 2/3" — I'll jump ahead.
