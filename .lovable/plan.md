# Remove in-app chat for admins, techs and customers

Customers, techs and the shop will reach each other only by text, email and phone calls.

## What changes
- **Customer portal:** remove "Messages" from the menu, the messages icon in the top bar, and the Messages card on the dashboard.
- **Tech app:** remove "Messages" from the menu, the messages icon in the top bar, and the "Chat with the shop" tile on the dashboard.
- **Admin Phone:** remove the Chat tab and stop chat threads from appearing in the combined list. Calls, Texts and Email stay exactly as they are.
- **Old links:** opening `/messages` sends people to their home screen (portal, tech dashboard, or Admin Phone), so old bookmarks and notification taps still land somewhere useful.
- **Alerts:** no more new-chat notifications, so the phone app's badge counts only texts, calls and email.

## What stays
- Past chat messages are kept in the database but hidden. Nothing is deleted.
- Text, email, call alerts and the MMAR Phone app don't change.

## Technical details
- Remove the `/messages` route's `Messages` page from navigation. Replace the route with a role-aware redirect: admin goes to `/admin/phone`, tech to `/tech`, and everyone else to `/portal`.
- Drop the links in `PortalLayout`, `TechLayout`, `PortalDashboard` and `TechDashboard`, plus the `MessagesBellLink` usages. Delete `MessagesBellLink`, `useUnreadMessages` and `Messages.tsx` once nothing references them.
- `AdminPhoneHub`: remove the `chat` mode/kind, the `message_threads`/`messages`/`message_reads` loading and realtime, and the chat compose UI.
- Disable the `notify_new_message` trigger (DDL migration, drop the trigger only) so no pushes fire for chat. Mark `message_threads`/`messages`/`message_reads` as deprecated with table comments. Tables and data are kept.
- Update the AGENTS.md rule about the Admin Phone ("calls, texts, in-app chat and email" becomes "calls, texts and email"; customers and techs no longer have /messages).
