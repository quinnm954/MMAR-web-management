# Auto-refresh Garage Ace

## What you'll see
- Garage Ace (admin, tech and the MMAR Phone app) reloads itself every 30 seconds so every screen shows the latest jobs, bookings, texts and invoices.
- When a new notification arrives (in-app alert or push), the app reloads right away instead of waiting.
- You stay on the same page and tab after each reload, and the scroll position comes back.

## Safety rules (so a reload never ruins your work)
The reload waits, then happens as soon as it's safe, when any of these are true:
- You're on a phone call (call screen open).
- You're typing in a box (text reply, estimate, notes) or have unsaved text in one.
- A pop-up window or editor is open (estimate editor, invoice, block-off time, signature pad).
- The app is in the background. It reloads when you open it again.

The public website and customer portal are not affected.

## Technical details
- New `src/hooks/useAutoRefresh.ts`, mounted once in the admin, tech and phone-app shells (`AdminDashboard`, `TechLayout`, `AdminPhoneApp`).
- 30s interval plus an immediate trigger from `useNotifications`' realtime INSERT and the service worker's `postMessage` (`badge-refresh` / new `push-received` message added to `public/sw.js` push handler).
- Guard: skip when `document.hidden`, `document.activeElement` is input/textarea/contenteditable, any `[role=dialog][data-state=open]` exists, an active call flag from AdminPhoneHub is set, or a form has dirty input. Pending reload retries every 5s.
- Before reload, save `scrollY` to sessionStorage keyed by URL; restore after load.
- Full `window.location.reload()` is used because most screens load their data once on open; a softer data-only refresh would need changes across ~50 screens.
- Record the rule in `AGENTS.md`.
