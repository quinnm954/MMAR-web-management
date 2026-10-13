# More Phone page functions

## What you'll get
0. **Fix the "message" and "call" buttons on the call details screen** (your screenshot). Right now the in-app calling piece only loads on the admin dashboard, so in the MMAR Phone app "call" does nothing, and "message" can fail silently. Calling will be loaded in the Phone app itself (with a fallback to your iPhone dialer if it can't connect), and "message" will always open the text thread with a visible error if something goes wrong. The "mail" button will work when the caller has an email on file.
1. **Call out and text out on mobile** — a clear green "Call" and blue "New Text" button at the top of the Phone page (in the installed MMAR Phone app too). New Text opens a sheet: type a number or pick a customer by name, write the message, send. It opens straight into that conversation.
2. **Delete calls and messages** — swipe left on any call or text conversation in the list to reveal a red Delete (like iPhone), plus a Delete button inside each call and conversation. Press-and-hold a single text bubble to delete just that message. Every delete asks "Are you sure?" first.
3. **Scroll threads without jumping** — while you're reading older messages the thread stays put. It only moves to the bottom when you open it, send something, or you're already at the bottom when a new message comes in. If a new one arrives while scrolled up, a small "New message" pill appears to jump down.
4. **Clear phone notifications button** — a bell icon on the Phone page with a count. Tapping it shows recent call/text/chat/email alerts and a "Clear all" that marks only those as read and clears the MMAR Phone icon badge. Service alerts in Garage Ace are not touched.

## Technical details
- `AdminPhoneHub.tsx`: header actions (Call opens existing keypad sheet; New Text sheet with number/customer search, creates or finds `sms_threads` row, sends via `send-sms`, selects thread).
- Scroll fix: the 15s poll/refreshOpen replaces the message array, retriggering `useBottom`. Change refresh to merge only new/changed rows (skip setState when unchanged), and replace `useBottom` with a "stick to bottom only if near bottom" hook + new-message pill.
- Deletes: admin-only. Calls → delete `call_logs` row; text thread → delete `sms_messages` then `sms_threads`; single SMS → delete `sms_messages` row; chat thread → existing tables. Add admin DELETE RLS policies where missing (migration), keep realtime refresh.
- Swipe-to-delete on list rows (horizontal touch, doesn't conflict with left-edge back swipe, which starts within 24px of edge).
- Phone notifications bell: query `notifications` where category = `message_updates`, unread; "Clear all" updates `read_at` and calls `clearAppBadge`.
- Verify at 390px with Playwright: scroll stability across a poll, swipe delete, new text send flow.
