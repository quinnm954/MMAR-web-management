# MMAR Phone icon + communication alerts in the Phone app

## What you'll get
1. **Red phone icon.** MMAR Phone gets its own icon: your app logo with a red phone handset badge on it. The Garage Ace icon stays the same.
2. **Alerts split between the two apps.**
   - **MMAR Phone:** new calls, missed calls, texts, chat and email alerts. Tapping one opens that conversation in the Phone app.
   - **Garage Ace:** service alerts like booking requests, appointments, estimates, invoices and inspections, same as today.
   - If MMAR Phone isn't installed or alerts aren't turned on there, communication alerts still go to Garage Ace, so you never miss one.
   - Customers and techs are not affected.
3. **Turn on alerts in the Phone app.** The first time you open MMAR Phone, you'll see an "Allow notifications" button. iPhone only allows notifications after you tap something.

After publishing, delete the old MMAR Phone icon from your home screen, add it again from Safari, then tap Allow notifications.

## Technical details
- **Icon:** create the icon from `public/icons/icon-512.png` with a red handset overlay. Save it as `phone-icon-512.png`, plus 192 px, apple-touch 180 px and maskable versions. Point `phone.webmanifest` at them. `AdminPhoneApp` swaps `link[rel=apple-touch-icon]` at runtime.
- **DB:** add `web_push_subscriptions.app text not null default 'main'` (`'main' | 'phone'`).
- **Client:** `useWebPushRegistration` registers with `app = isPhoneApp() ? 'phone' : 'main'`. Upserting by endpoint keeps each install separate, because iOS gives every home-screen app its own subscription. Add an explicit enable button in `AdminPhoneApp` that calls the same subscribe path.
- **send-web-push:** if `category = 'message_updates'` and the user has phone subscriptions, send only to those and rewrite the link to `/admin/phone`. Otherwise send to `main` subscriptions only, falling back to all subscriptions if there are no `main` ones. Native push is unchanged.
- Record the routing rule in AGENTS.md and add both tasks to roadmap.md.
