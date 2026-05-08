# Universal Links (iOS) & App Links (Android)

This makes appointment, invoice, and shared portal links open **directly inside
the installed MMAR Care app** instead of bouncing to Safari or Chrome.

## Domain

Links must be on a domain you control and that serves these two well-known
files over HTTPS:

- `https://YOUR-DOMAIN/.well-known/apple-app-site-association` (no extension,
  served as `application/json`)
- `https://YOUR-DOMAIN/.well-known/assetlinks.json`

Both files already exist in `public/.well-known/` and ship with every
deployment. Lovable hosting serves them as JSON automatically. The current
default domain is `shop-flow-home.lovable.app`; if you connect a custom
domain (e.g. `mmarcare.com`), use that everywhere below instead.

## One-time values you must fill in

### iOS — `public/.well-known/apple-app-site-association`

Replace `TEAMID` with your **Apple Developer Team ID** (10 chars, found in
Apple Developer → Membership). Bundle ID is already correct
(`app.lovable.6370c0499e634e0c894716857b255272`).

### Android — `public/.well-known/assetlinks.json`

Replace `REPLACE_WITH_YOUR_APP_SIGNING_SHA256_FINGERPRINT` with the SHA-256
fingerprint of the cert that signs your release APK / AAB.

- **Play App Signing (recommended):** Play Console → your app → **Release →
  Setup → App signing** → copy the *App signing key certificate* SHA-256.
- **Local debug build (for testing):**
  ```bash
  keytool -list -v -keystore ~/.android/debug.keystore \
          -alias androiddebugkey -storepass android -keypass android
  ```
  You can list multiple fingerprints in the `sha256_cert_fingerprints` array
  (one for debug, one for release) so links work in both builds.

After editing those two files, redeploy the web app so the well-known files
update on your domain.

## Native project changes (run locally after `npx cap sync`)

### iOS — Associated Domains entitlement

In Xcode (`ios/App/App.xcworkspace`):

1. Select the `App` target → **Signing & Capabilities** → **+ Capability** →
   **Associated Domains**.
2. Add: `applinks:shop-flow-home.lovable.app`
   (and `applinks:mmarcare.com` once your custom domain is live).
3. Build & install on a real device — Universal Links don't work in the
   simulator with HTTPS verification.

### Android — `AndroidManifest.xml`

In `android/app/src/main/AndroidManifest.xml`, inside the main
`<activity android:name=".MainActivity" ...>`, add an intent filter:

```xml
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="https"
          android:host="shop-flow-home.lovable.app" />
    <!-- Add a second <data .../> line here for your custom domain when ready -->
</intent-filter>
```

Then rebuild: `npx cap sync android && npx cap run android`.

## How routing works inside the app

`src/components/NativeBoot.tsx` registers an `appUrlOpen` listener. When iOS
or Android hands the app a verified `https://...` link, we strip the host
and call `navigate(pathname + search + hash)` so React Router renders the
matching screen — e.g. tapping
`https://shop-flow-home.lovable.app/portal/appointments/abc-123` in an SMS
opens straight to that appointment in the app.

Web visitors are unaffected: the listener only runs when
`Capacitor.isNativePlatform()` is true.

## Verifying it works

- **iOS:** Long-press a link in Notes / Mail — you should see *"Open in MMAR
  Care"*. If the AASA file is wrong, that option is missing.
- **Android:** `adb shell pm get-app-links app.lovable.6370c0499e634e0c894716857b255272`
  should show your domain as `verified`. To force re-verification:
  `adb shell pm verify-app-links --re-verify app.lovable.6370c0499e634e0c894716857b255272`.
- **Validators:**
  - https://branch.io/resources/aasa-validator/
  - https://developers.google.com/digital-asset-links/tools/generator
