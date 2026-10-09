# MMAR Phone home-screen icon

## What you'll get
- A new icon for the MMAR Phone app: your current app logo with a red phone handset badge over it, like the iPhone Phone app.
- Only the Phone app gets this icon. The main Garage Ace app icon stays the same.
- After publishing, delete the old MMAR Phone icon from your home screen and add it again. iPhone saves the icon when you add the app, so it won't update by itself.

## Technical details
- Create the icon from `public/icons/icon-512.png` with a red phone handset overlay. Save it as `public/icons/phone-icon-512.png`, plus 192 px, 180 px (Apple touch icon) and maskable versions.
- Point `public/phone.webmanifest` icons at the new files.
- On `/admin/phone`, `AdminPhoneApp` swaps `link[rel="apple-touch-icon"]` to the phone icon at runtime and restores it when you leave. iOS uses that tag for Add to Home Screen.
