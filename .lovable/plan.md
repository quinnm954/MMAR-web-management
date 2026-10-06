# Standalone Admin Phone Page

## Goal
Add a new **Phone** destination in Admin that brings calls, texts, and emails into one phone-like workspace. The existing Front Desk screens remain unchanged.

## What will be built
- Add **Phone** as its own Admin navigation destination, separate from Front Desk.
- Create a dark, hyper-realistic phone interface based on the selected direction, using Garage Ace colors and existing design tokens.
- Provide four phone tabs:
  - **Inbox:** one chronological feed of calls, texts, and emails.
  - **Calls:** recent calls, missed calls, AI summaries, transcripts, duration, callback, and text-back actions.
  - **Texts:** conversation list, phone-style message bubbles, unread counts, new conversation, and anchored reply box.
  - **Email:** Inbox/Sent/Drafts, message reading, reply, compose, save draft, and delete where currently supported.
- Include a dial action that opens the existing browser softphone and uses the computer microphone and speakers.
- Match known phone numbers to customer, employee, or admin names where available; otherwise show the number.
- Use fixed internal scrolling so the Admin page itself does not jump while reading conversations.
- Adapt the phone page for smaller screens without changing the current mobile-first technician or customer areas.

## Interaction design
- Desktop: a centered phone-style feed with a companion detail panel when an item is opened, so the interface remains phone-like without wasting work space.
- Smaller screens: the phone fills the available width and moves between list and detail views like a real mobile app.
- Unread, missed, inbound, outbound, sent, failed, and draft states remain visually distinct.
- Existing data and sending functions are reused; this work does not alter call routing, booking rules, automated replies, or email delivery behavior.

## Technical details
- Add a focused `AdminPhoneHub` component that reads the existing `call_logs`, `sms_threads`/`sms_messages`, `inbound_messages`, `email_send_log`, and `email_drafts` records.
- Reuse the current `send-sms`, `send-admin-message`, and `dialInApp` actions rather than adding new communication services.
- Add the standalone Phone destination to the existing Admin tab system while leaving the current Calls, Texts, Emails, and Front Desk entries intact.
- Record the new UI-module decision in `AGENTS.md` and update the roadmap during implementation.

## Verification
- Check the new Phone destination as an authenticated admin.
- Verify Inbox, Calls, Texts, and Email each load real records and open their detail views.
- Verify call-back/dial, SMS reply, email reply/compose, read states, and internal scrolling.
- Check desktop and mobile-sized layouts and confirm the existing Front Desk pages are unchanged.
- Confirm the preview build and runtime logs are clean.
