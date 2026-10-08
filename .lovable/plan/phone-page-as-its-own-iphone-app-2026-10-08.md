# Phone page as its own iPhone app

## What you'll get
- A separate home-screen app called "MMAR Phone" with its own icon. Tapping it opens straight into the Phone page, full screen — no admin menu, no browser bars, content tucked safely around the notch and home bar.
- Inside, it behaves like the iPhone Phone/Messages apps: open a call, text thread, chat or email, then swipe from the left edge of the screen to slide back to the list (the page follows your finger, and lets go back if you don't swipe far enough). The back arrow still works too.
- A "Add Phone to Home Screen" button on the Phone page (admin only) with the iPhone steps: Share, then Add to Home Screen.

## How to install (after this is built)
1. On your iPhone in Safari, open mikesmautorepair.com/admin/phone and sign in.
2. Tap Share, then Add to Home Screen, then Add.
3. Open "MMAR Phone" from your home screen.

## Technical details
- New route `/admin/phone` rendering `AdminPhoneHub` inside a fullscreen shell (100dvh, safe-area insets, no admin layout), admin-protected; existing Phone icon links there.
- Separate manifest `public/phone.webmanifest` (id `/admin/phone`, start_url `/admin/phone?source=pwa`, scope `/admin/phone`, standalone, dark theme). Swap the `<link rel="manifest">` and `apple-mobile-web-app-title` at runtime when on this route so iOS saves the Phone app instead of the main app.
- Edge-swipe gesture in `AdminPhoneHub`: touch starting within 24px of left edge, translate detail view with finger, commit back past ~35% width or fast flick; disable vertical scroll lock only while swiping horizontally.
- Sign-in on the installed app redirects back to `/admin/phone`.
- Verify with Playwright at 390px (standalone emulation + simulated touch swipe).
