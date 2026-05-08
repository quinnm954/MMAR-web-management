# MMAR Care — Native App Build & Ship Guide

This project ships the MMAR Care customer portal as a real native app for the
**Apple App Store** and **Google Play Store** using Capacitor. Everything inside
the codebase is already wired up (smart launch redirect, push notifications,
24h/2h appointment reminders). What remains is one-time work on your own
machine to compile and submit the binaries.

---

## One-time prerequisites

- Apple Developer account ($99/yr) — https://developer.apple.com
- Google Play Console account ($25 one-time) — https://play.google.com/console
- A Mac with **Xcode** installed (iOS only)
- **Android Studio** installed (Android)
- Project exported to your own GitHub (Lovable's "Export to GitHub" button)
- A **Firebase project** with Cloud Messaging enabled (free) — https://console.firebase.google.com

## Add the Firebase secrets to Lovable Cloud

In your Firebase project:
1. Project Settings → Service Accounts → "Generate new private key" → download the JSON
2. Note the Project ID

Then in Lovable: Cloud → Secrets, add:
- `FCM_PROJECT_ID` = your Firebase project ID
- `FCM_SERVICE_ACCOUNT` = the entire downloaded JSON (paste as one string)

Without these, push silently no-ops — SMS reminders still work.

---

## Build the apps (do this on your laptop)

```bash
# 1. Pull project
git clone <your-github-repo> mmar-care
cd mmar-care
npm install

# 2. Add native platforms (one-time per platform)
npx cap add ios
npx cap add android

# 3. Build the web bundle
npm run build

# 4. Copy the build into the native projects
npx cap sync

# 5. Open in IDE
npx cap open ios       # opens Xcode
npx cap open android   # opens Android Studio
```

> Re-run `npm run build && npx cap sync` after every code change you pull.

### Before producing release builds

Open `capacitor.config.ts` and **comment out the entire `server` block**.
That block enables hot-reload from the Lovable preview during development.
Release binaries must load from the bundled `dist` folder.

### iOS push setup (one-time)

1. In Xcode: open the project, select the app target → "Signing & Capabilities"
2. Add capability: **Push Notifications**
3. Add capability: **Background Modes** → check "Remote notifications"
4. In the Apple Developer portal, create an APNs key (.p8) and upload it to
   Firebase under Project Settings → Cloud Messaging → Apple app configuration.

### Android push setup (one-time)

1. In Firebase Console, add an Android app with package
   `app.lovable.6370c0499e634e0c894716857b255272`
2. Download `google-services.json` and place it in `android/app/`
3. Capacitor's push-notifications plugin handles the rest.

---

## Submitting to the stores

### App Store (iOS)
1. In Xcode: Product → Archive
2. Distribute App → App Store Connect
3. Fill out the listing in App Store Connect (name: **MMAR Care**, category: Business)
4. Submit for review (~1–2 days typical)

### Play Store (Android)
1. In Android Studio: Build → Generate Signed Bundle (.aab)
2. Upload to Play Console → create a new release
3. Fill out listing, content rating, and data-safety form
4. Submit for review (~hours to a few days)

---

## What's already built for you

- **Native shell** (`capacitor.config.ts`) — MMAR Care branding, dark splash,
  status bar, push presentation options
- **Smart launch redirect** (`src/components/NativeBoot.tsx`) — sends signed-in
  customers to `/portal/dashboard`, staff to their dashboards, and signed-out
  users to `/portal/login`. Browser visitors are unaffected.
- **Android back-button handling** — pops history, exits at root
- **Push registration** (`src/hooks/useNativePushRegistration.tsx`) — runs once
  the customer signs in, requests permission, stores the device token
- **Database**: `device_tokens`, `notification_preferences`, plus
  `reminder_sent_24h` / `reminder_sent_2h` flags on `appointments`
- **Edge function `send-push`** — sends to one user's devices via FCM HTTP v1
- **Edge function `send-appointment-reminders`** — runs every hour via pg_cron;
  for each appointment 24h or 2h out, sends a push + SMS unless the customer
  opted out, then marks the flag so it never double-sends
- **Hourly cron job** — already scheduled

---

## Testing without the stores

You can run the app on a simulator or your own device immediately:

```bash
npm run build && npx cap sync
npx cap run ios       # iOS simulator
npx cap run android   # Android emulator or USB-attached phone
```

With `server.url` still in `capacitor.config.ts`, every code change you push
in Lovable shows up live in the simulator — no rebuild needed.

---

## Follow-ups you can ask for

- Customer-facing notifications opt-in/out panel inside `/portal/dashboard`
- App Store / Play Store screenshots
- Universal Links / App Links so SMS estimate links open in the app
- Apple Sign-in / Google Sign-in inside the app
