## Goal

After a customer signs up, greet them with a guided, dismissible tutorial that walks them through installing Garage Ace to their home screen as a PWA. Existing users don't see it. Existing `InstallAppBanner` remains as the ongoing nudge; this is the one-time onboarding overlay.

## Trigger logic

- Show only when **all** are true:
  - Signed-in customer visiting the portal (any `/portal/*` route)
  - Not already running standalone (`display-mode: standalone` or iOS `navigator.standalone`)
  - First time this user has seen the tutorial — tracked in `profiles` via a new `pwa_tutorial_seen_at timestamptz` column (survives across devices; more reliable than localStorage alone)
  - Fallback per-device dismissal via `localStorage` key `ga_pwa_tutorial_seen` so it doesn't re-appear before the profile write settles
- Trigger fires from `PortalLayout` on mount, once profile is loaded.
- If the user already installed (standalone), we mark `pwa_tutorial_seen_at` silently so we never show it later.

## The tutorial UX

A centered modal (shadcn `Dialog`) with a 3-step carousel. Platform detected up front:

- **iOS Safari** path (3 steps):
  1. "Welcome to Garage Ace — install the app for faster access, home-screen icon, and notifications." Screenshot/illustration of a phone home screen with the icon.
  2. "Tap the Share button at the bottom of Safari." Illustration of Safari share icon.
  3. "Scroll and tap **Add to Home Screen**, then **Add**." Illustration of the AtHS row.
- **Android / Desktop Chrome** path:
  1. Welcome + benefits.
  2. If `beforeinstallprompt` fired → step 2 is a big **Install app** button that calls `prompt.prompt()`. Success closes the modal and toasts "Installed!".
  3. If the event never fired (Firefox, Samsung Internet, etc.) → step 2 shows "Open your browser menu (⋮) and tap **Install app** / **Add to Home screen**."
- **Unsupported (in-app browser, embedded webview)** → single step explaining "Open this page in Safari/Chrome to install," with a copy-link button.

Footer of every step: `Skip for now` (marks seen), `Back`, `Next` / `Done`. Progress dots at top. Users can reopen the tutorial from Portal → Settings via existing `/install` link (unchanged).

## Files to create

- `src/components/shell/PwaInstallTutorial.tsx` — the Dialog + carousel, platform detection, `beforeinstallprompt` capture, marks seen on close/finish.
- `src/hooks/usePwaTutorial.ts` — small hook: reads `profiles.pwa_tutorial_seen_at`, exposes `shouldShow` and `markSeen()` (writes profile + localStorage).
- `src/assets/pwa-tutorial/` — 3 lightweight SVG illustrations (share icon, add-to-home row, home-screen icon). Use inline SVG components to avoid new asset files if simpler.

## Files to edit

- `src/components/portal/PortalLayout.tsx` — mount `<PwaInstallTutorial />` alongside `<InstallAppBanner />`.
- `src/integrations/supabase/types.ts` — regenerated after migration.

## Database migration

Single migration adds one nullable column, no policy changes (existing profile RLS already lets a user update their own row):

```sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pwa_tutorial_seen_at timestamptz;
```

## Out of scope

- No change to `InstallAppBanner`, `/install` page, or manifest.
- No service worker / offline work (project is manifest-only PWA today; keep it that way).
- No push notification prompting inside this tutorial — that's a separate flow.

## Verification

1. Sign up a new test customer → land on `/portal/dashboard` → modal appears with correct platform steps.
2. Dismiss → refresh → modal does not reappear; `profiles.pwa_tutorial_seen_at` is set.
3. On iOS, steps show Safari Share → Add to Home Screen instructions.
4. On Android Chrome, tapping Install triggers native install prompt; on success, modal closes and won't reappear.
5. Existing signed-in users (with older profiles) see it once, then never again.
