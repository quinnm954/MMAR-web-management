# MMAR Care — Native App Assets

Source assets for iOS / Android icons and splash screens. Generated from
`public/mmar-logo.jpeg` on a black backdrop to match the logo's built-in
background (no visible seam between logo and canvas).

| File | Size | Purpose |
|------|------|---------|
| `icon.png` | 1024×1024 | Universal app icon (iOS + Android legacy) |
| `icon-foreground.png` | 1024×1024 | Android adaptive icon foreground (transparent) |
| `icon-background.png` | 1024×1024 | Android adaptive icon background (solid `#000000`) |
| `splash.png` | 2732×2732 | Light splash screen |
| `splash-dark.png` | 2732×2732 | Dark splash screen |

## Generate platform assets

After running `npx cap add ios` and/or `npx cap add android` locally, run:

```bash
npx capacitor-assets generate --iconBackgroundColor '#000000' \
                              --iconBackgroundColorDark '#000000' \
                              --splashBackgroundColor '#000000' \
                              --splashBackgroundColorDark '#000000'
```

This writes every required iOS `AppIcon.appiconset` size and Android
`mipmap-*` density into the native projects. Re-run any time the source
images in this folder change, then `npx cap sync`.
