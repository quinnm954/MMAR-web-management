# In-App Messaging + Notification Badge

Add direct messaging between users and a live unread badge that surfaces in the app and on the installed PWA icon.

## Who can message whom
- **Customers** ↔ **Admins / Managers**
- **Techs** ↔ **Admins / Managers**
- Admins/Managers can start a thread with any customer or tech.
- Customers and techs cannot message each other directly (keeps support funneled through staff).

## What gets built

### 1. Database (one migration)
- `message_threads` — participants (customer_id, tech_id, staff_id), `subject`, `last_message_at`, `created_by`.
- `messages` — `thread_id`, `sender_id`, `body`, `attachments jsonb`, `read_by jsonb` (per-user read timestamps).
- `message_reads` — per-user last-read marker for fast unread counts.
- RLS: only thread participants (or any admin/manager) can read/write.
- `GRANT`s for `authenticated` + `service_role`.
- Add tables to `supabase_realtime` publication for live updates.
- `unread_message_count(user_id)` SQL helper for badge counts.

### 2. UI
- New `/messages` route in **Portal**, **Tech**, and **Admin** layouts.
  - Two-pane: thread list (left) + conversation (right), mobile = stack.
  - Compose box, send on Enter, optimistic append.
- Admin/Manager view adds a "New message" picker (search customers + techs).
- Bell icon in each layout header gets a **red badge bubble** with unread count.
- New `MessagesNav` link added to bottom nav / sidebar.

### 3. Realtime + notifications
- Subscribe to `messages` inserts for the current user's threads → update list + badge live.
- On new message:
  - In-app toast.
  - Call existing `send-push` edge function so PWA/native devices get a push.
  - Respect `notification_preferences` (add a `message_updates` flag).

### 4. PWA app-icon badge
- Use the Web Badging API (`navigator.setAppBadge(count)` / `clearAppBadge()`).
- Update badge whenever unread count changes; clear on thread open.
- Gracefully no-op on unsupported browsers.

## Out of scope (ask later if needed)
- File/image attachments beyond basic URL field
- Group threads with multiple customers
- Message search, reactions, typing indicators
- SMS/email mirroring of in-app messages

Approve and I'll build it.
