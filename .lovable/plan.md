# Publish, fix the stuck badge, add "Add to customers" on text threads

## 1. Put the latest Garage Ace on the live site
I'll publish once everything below is done. Then mikesmautorepair.com runs the newest version, including MMAR Phone, the red icon and alert routing.

## 2. Red badge that won't go away
Right now nothing is actually unread on your account, but the red dot on the icon still shows. It only updates while the app is open, so it gets stuck after you clear alerts. Fix:
- Each time you open an app, or switch back to it, it rechecks your unread alerts and clears the dot if nothing is unread.
- Each app counts only its own alerts. MMAR Phone counts calls, texts, chat and email. Garage Ace counts everything else.
- When you open a call or text conversation in MMAR Phone, that conversation's alerts are marked as read, so the dot goes down.
- Tapping an alert banner also updates the dot.
- Note: iPhone only updates an app's dot when that app opens or a new alert arrives. Opening each app once after this update clears any old leftover dot.

## 3. "Add to customers" on every text conversation
- Text conversations from numbers that aren't saved yet get an **Add to customers** button at the top, in both MMAR Phone and Front Desk.
- Tapping it reads the conversation with AI and opens a short form already filled in with name, phone, address, email and vehicle (year, make, model, engine) when they mentioned it.
- Review or edit the details, tap Save, and you have a new customer with the vehicle attached. The conversation then shows their name instead of the number.
- Anything the AI isn't sure about stays blank. Nothing is sent to the customer.

## Technical details
- **Badge:** `useAppBadgeSync` refreshes on mount, `visibilitychange`, `focus` and realtime events. It filters `category = 'message_updates'` when `isPhoneApp()`, and all other categories otherwise. `_send_push` / `send-web-push` compute `badge_count` per target app the same way. `sw.js` `notificationclick` posts a refresh message to open clients. `AdminPhoneHub` marks matching unread `message_updates` notifications (`read_at = now()`, link or data matching the thread or call) when a detail opens, and marks all of them read when the Phone app opens to its list. Badge counts reconcile after that.
- **Extraction:** new edge function `extract-thread-contact` (admin-only, JWT validated, Zod input `{ thread_id }`) loads `sms_messages` for the thread and calls Lovable AI (`google/gemini-2.5-flash`) with a tool schema. It returns `{ full_name, email, address_line1, city, state, postal_code, vehicle: { year, make, model, engine } }`, with nulls when unsure.
- **Save:** reuse `admin-create-customer` (name, email, phone), then update `profiles` with the address, insert into `vehicles`, and link `sms_threads.customer_id`.
- **UI:** an `AddCustomerFromThread` sheet in iOS style for `AdminPhoneHub` `TextDetail`, plus a button in the Front Desk texts view. It's hidden when the thread already matches a customer.
- Update `roadmap.md` and `AGENTS.md` (the extraction function rule).
