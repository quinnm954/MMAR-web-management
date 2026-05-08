# MMAR Care — Native Mobile App Plan

Goal: ship MMAR Care as a real native app on the **Apple App Store** and **Google Play Store**, opening straight into the customer portal with push + SMS appointment reminders.

We already have `capacitor.config.ts` in the repo, the customer portal is fully built, Twilio SMS is wired up, and Lovable Cloud handles auth + database. This plan adds the native wrapper, the smart launch redirect, and an automated reminder pipeline.

---

## What you'll need (one-time, outside Lovable)

You can't ship to the stores from inside Lovable's preview — you'll do these once on your own machine:

- A Mac with **Xcode** (for iOS) and/or **Android Studio** (for Android)
- **Apple Developer account** — $99/year
- **Google Play Console account** — $25 one-time
- Your project exported to GitHub (Lovable's "Export to GitHub" button)

I'll handle everything inside the codebase. You'll handle the store submissions.

---

## Phase 1 — Native shell (Capacitor)

1. **Install Capacitor packages**: `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`, `@capacitor/android`, `@capacitor/push-notifications`, `@capacitor/app`, `@capacitor/status-bar`, `@capacitor/splash-screen`.
2. **Update `capacitor.config.ts`**:
   - `appId`: `app.lovable.6370c0499e634e0c894716857b255272`
   - `appName`: `MMAR Care`
   - Splash screen: dark background (`#0F172A`-ish per design tokens), MMAR logo
   - Status bar: dark style
   - `server.url` pointed at the Lovable preview for hot-reload during development (you'll comment this out before building production binaries)
3. **App icons & splash**: generate iOS and Android icon sets from the existing `mmar-logo.jpeg` (1024×1024 master) and a dark splash screen.
4. **Smart launch redirect**: a tiny `<NativeBoot>` component that runs on app launch and routes:
   - signed-in customer → `/portal/dashboard`
   - signed-in staff/admin → their respective dashboard
   - signed-out → `/portal/login`
   - Web visitors are unaffected — the redirect only fires when running inside Capacitor (`Capacitor.isNativePlatform()`).
5. **Tighten the portal for app feel**:
   - Hide the marketing top nav inside Capacitor so it looks like an app, not a website.
   - Respect iOS safe-area insets (notch/home indicator) on the portal layout.
   - Add Capacitor `App` listener for back-button handling on Android.

## Phase 2 — Push notifications

1. **Capacitor side**: register the device on first portal load, store the FCM/APNs token against the user.
2. **New table `device_tokens`** (user_id, token, platform, last_seen_at) with RLS so users only manage their own tokens.
3. **Edge function `send-push`**: accepts `{ user_id, title, body, data }`, looks up tokens, sends via Firebase Cloud Messaging (FCM handles both Android and iOS via APNs). You'll need an **FCM server key** added as a secret — I'll request it when we get there.
4. Customers can disable push from a new "Notifications" section in `/portal/dashboard`.

## Phase 3 — Appointment reminders (push + SMS)

1. **New edge function `send-appointment-reminders`** that runs hourly via `pg_cron`:
   - Finds appointments scheduled 24h out and 2h out that haven't been reminded yet.
   - Sends a **push** (if the customer has a device token) and an **SMS** via your existing Twilio integration as a fallback / belt-and-suspenders.
   - Marks `reminder_sent_24h` / `reminder_sent_2h` columns on the appointment so we don't double-send.
2. **Migration** adds those two boolean columns to `appointments`.
3. **Cron job** scheduled with `pg_cron` to call the function every hour.
4. Customer can opt out per channel from their portal Notifications page.

## Phase 4 — Build & ship

I'll write you a plain-English `MOBILE_APP_README.md` with the exact commands to:
- Pull the project from GitHub
- `npm install` → `npx cap add ios` / `npx cap add android` → `npm run build` → `npx cap sync`
- Open in Xcode / Android Studio, set signing certificates, archive, and upload to App Store Connect / Play Console
- App Store / Play Store listing copy (description, keywords, screenshots checklist)

---

## Technical details

- **Hot reload during dev**: `server.url` points at the Lovable preview so app changes show up in the simulator instantly. This URL is removed before producing release binaries.
- **Auth**: existing `useAuth` + Supabase client work unchanged in Capacitor. Sessions persist via `localStorage`, which Capacitor's WebView preserves between launches.
- **Deep links**: Universal Links (iOS) / App Links (Android) for `/estimate/:token`, `/share/:token`, etc., so SMS links open the app instead of Safari/Chrome when installed. Configured via `apple-app-site-association` and `assetlinks.json` files served from the website.
- **Push provider**: Firebase Cloud Messaging — single backend for both platforms, free tier is plenty for this scale.
- **No backend changes to existing portal code** — the native shell wraps the same React app; only adds the boot redirect and a notifications settings panel.

---

## What I won't do in this pass (ask separately if you want them)

- In-app booking calendar UI (you currently use SMS/call to request)
- Apple Pay / Google Pay native checkout (Stripe Checkout already works in the WebView)
- Offline mode for vehicles/records (you opted not to include it)
- App Store screenshots — I can generate them in a follow-up if you want

---

Approve this and I'll start with Phase 1 (Capacitor wrapper + smart redirect + app polish), then move through phases 2–4. Each phase is independently testable.