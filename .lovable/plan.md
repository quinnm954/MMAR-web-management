## Goal
Replace the current analytics-style Admin → Emails page with a Gmail-style mailbox for admin↔customer communication.

## What ships in this pass
1. **Inbox layout** — left rail (folders: Inbox, Sent, Drafts, All), middle list pane (subject + recipient + snippet + time), right reading pane with full HTML body, status badge, and reply/forward actions.
2. **Compose** — modal/sheet to send a free-form email to any customer (recipient picker pulls from `profiles`, free email input also allowed). Sends via existing `send-transactional-email` using a new generic `admin-message` template.
3. **Reply** — opens compose pre-filled with recipient + `Re:` subject + quoted body, tracked by an in-app thread id (we set a stable `message_id` so replies group together in the list).
4. **Threading** — group messages in the list by a `thread_id` we store in `email_send_log.metadata` (falls back to subject normalization when missing).
5. **Drafts** — new `email_drafts` table so admins can save in-progress messages.
6. **Inbound (stubbed)** — new `inbound_messages` table + a `receive-inbound-email` edge function that accepts a JSON webhook payload (Cloudflare Email Routing-compatible) and inserts a row. Inbox view merges these rows with sent rows. Setup instructions surfaced in a small "Connect inbound" panel — actual MX wiring is done outside Lovable.

## Out of scope (will call out in UI)
- Attachments, labels/folders beyond the defaults, search across full body text, marketing-grade analytics (the existing log table remains the underlying source).

## Files
- **DB migration** — `email_drafts`, `inbound_messages` tables + RLS (admin only).
- **Edge functions**
  - `supabase/functions/receive-inbound-email/index.ts` (new) — webhook, no JWT verify, validates a shared secret header.
  - `supabase/functions/_shared/transactional-email-templates/admin-message.tsx` + registry entry.
- **Frontend** — rewrite `src/components/admin/AdminEmails.tsx` into a 3-pane mailbox: folder rail, message list, reading pane, compose sheet. Keep route mount as-is.

## Technical notes
- Threading key: `metadata.thread_id` (uuid we mint on first compose; replies reuse parent's).
- "Inbox" pane = `inbound_messages` rows (newest first).
- "Sent" pane = `email_send_log` deduped on `message_id`, latest status per email.
- Reply sender is the verified Lovable Emails domain; we set `Reply-To` and `In-Reply-To` headers via the existing template path.
- All actions admin-gated by existing `ProtectedRoute` + RLS.
