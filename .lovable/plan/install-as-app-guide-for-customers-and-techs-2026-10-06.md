# Install-as-app guide for customers and techs

## What's already there
- An install page at /install, plus a one-time install banner and a step-by-step guide. Both appear only in the Customer portal.
- On Android and Chrome, the banner already has a one-tap **Install** button that opens the phone's own install prompt.
- iPhones don't allow one-tap installs, so iPhone users need the short Share → "Add to Home Screen" guide.
- The installed app currently always opens to the Customer portal, even for techs.

## What I'll build
1. **Install banner and guide for techs**: the same banner and guide will show in the Technician app, written for techs (jobs, inspections, pay).
2. **One tap where possible**:
   - On Android and desktop Chrome, a big **Install app** button opens the built-in install prompt.
   - On iPhone, a 3-step picture guide (Share button → Add to Home Screen → Add). It also tells people to use Safari if they opened the link in another browser, like the Gmail or Facebook app.
3. **Shown at first login**: new customers and techs see the guide once, right after their first sign-in (techs see it after signing their agreement). If they skip it, they're reminded every 14 days until it's installed. It's hidden once the app is installed.
4. **The app opens the right home screen**: the installed app checks who's signed in. Techs land on their jobs screen, customers on their portal, and admins on the admin page.
5. **Install link in messages**: the welcome and sign-up links sent to new customers and techs will include a short "Install the app" link to /install.

## Note
People who already installed the app may need to remove it and add it again before it opens to their correct home screen.

## Technical details
- Add `InstallAppBanner` and `PwaInstallTutorial` to `TechLayout`. Pass a `variant="tech"|"customer"` prop to switch the wording.
- Add an `/app` route that redirects by role (technician → /tech, admin → /admin/dashboard, customer → /portal/dashboard, signed out → /login). Change the manifest's `start_url` to `/app?source=pwa`.
- Guide state lives in localStorage (`ga_install_tutorial_seen`), and the existing 14-day dismiss window stays.
- Manifest-only installability. Push notifications keep using the existing `sw.js`. No offline or caching changes.
- Add one install line to the enrollment and tech-onboarding email and text templates.
