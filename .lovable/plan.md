## Goal
Show a numbered badge on the installed PWA's app icon reflecting the user's unread notification count.

## Approach
Use the standard **App Badging API** (`navigator.setAppBadge(n)` / `clearAppBadge()`). This is what iOS 16.4+ (installed PWAs), Chrome/Edge on desktop, and Android Chrome support for numbered dots on the home screen / dock icon.

We already have a `notifications` table with realtime capability and a `useUnreadNotifications`-style pattern in the portal. We'll hook badge updates to that same unread count.

## Changes

1. **New helper** `src/lib/appBadge.ts`
   - `setBadge(count: number)` — calls `navigator.setAppBadge(count)` if available; falls back silently.
   - `clearBadge()` — calls `navigator.clearAppBadge()`.
   - Feature-detects and no-ops on unsupported browsers (no errors on desktop Safari, Firefox, etc.).

2. **New hook** `src/hooks/useAppBadge.ts`
   - Accepts current user id.
   - Fetches initial unread count from `notifications` where `user_id = auth.uid()` and `read_at is null`.
   - Subscribes to realtime `postgres_changes` on `notifications` filtered by `user_id` to increment/decrement/refresh.
   - Calls `setBadge` on change, `clearBadge` on zero or sign-out.
   - Cleans up channel on unmount.

3. **Wire into app shell** (`src/App.tsx` or the authenticated layout that already mounts once per session)
   - Call `useAppBadge(user?.id)` at the top level so it runs across all routes.
   - Also clear badge on sign-out.

4. **Manifest check** (`public/manifest.webmanifest`)
   - No changes required — Badging API doesn't need manifest fields, but confirm `display: "standalone"` is present (it already is for the installed PWA).

## Technical notes
- Badging API only shows on **installed** PWAs. In a normal browser tab it silently does nothing, which is expected.
- iOS requires 16.4+ and the app added to Home Screen; Android Chrome and desktop Chrome/Edge support it broadly.
- No service worker changes needed for foreground badge updates. (Background push-driven badge updates would require a push subscription + service worker — out of scope unless you want push notifications too.)
- Uses the existing `notifications` table and RLS; no schema changes.

## Out of scope
- Background/push-driven badge updates when the app is fully closed (would require Web Push setup).
- Changing notification content or the in-app bell UI.