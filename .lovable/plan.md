# Phone page becomes the only place for calls, texts, emails and messages

## What I found
- **Email → Sent is always empty because of a bug.** It's looking for the wrong label, so none of the 1,472 sent emails ever show up.
- **Email → Inbox is empty because no replies reach the app.** Customer replies go straight to your Outlook address, so nothing is stored here.
- Calls, texts, emails and in-app customer messages each still have their own separate screen in the admin menu.

## Changes
1. **Fix Email → Sent:** every sent email shows (estimates, invoices, reminders, fleet outreach), newest first, with full preview.
2. **Email → Inbox:** it lists customer replies once they reach the app. Until then, it shows a short note: "Replies currently go to your Outlook". I'll ask whether you want replies routed into the app (see question below).
3. **In-app chat moves onto the Phone page:** a 5th tab, "Chat", sits next to Inbox, Calls, Texts and Email. It holds every in-app message customers and techs send from their portal, and you can read and reply right there. Admins no longer use a separate Messages page; new chats also show in the Phone page's Inbox and on the Phone icon's unread count.
4. **Remove the separate screens:** Front Desk → Calls, Front Desk → Texts, Admin → Emails, and the admin Messages bell all go away, and old links open the Phone page instead. Customers and techs keep their own Messages page so they can still reach you.
5. **Inbox tab:** shows calls, texts, emails and chats mixed together, newest first.

## More workflow suggestions (not included)
- **Customer card from any conversation:** tap a caller or texter to see their vehicles, open estimate, unpaid invoice and next appointment, with "Make estimate" / "Book" buttons.
- **Quick-reply templates:** saved texts like "On my way", "Running 15 min late", "Your car is ready".
- **"On my way" text** automatically when a tech starts driving to a job.
- **Missed call → text back** with a booking link (already partly in place; can be tightened).

## Technical details
- AdminPhoneHub: replace the `emailFolder.slice(0,-1)` match with a map {inbox:'inbound', sent:'sent', drafts:'draft'}. Add `.limit(500)` to the email_send_log query. Add an empty-state note for inbox.
- New 'chat' mode reading `message_threads`/`messages` (same queries as src/pages/Messages.tsx), with realtime and reply. Included in the Inbox feed.
- AdminDashboard: drop the calls/texts/emails tabs and the group entries. Map `?tab=calls|texts|emails` to `phone`. Remove MessagesBellLink from the admin header. The /messages route stays for customer/tech roles; admins are redirected to the Phone page.
- Update AGENTS.md rule about the Phone workspace (it now replaces the Front Desk screens).
