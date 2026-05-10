## Goal
Build the full call-handling system in the admin portal now, but keep it **dormant** until you finish porting your number to Twilio. Nothing routes, records, or transcribes until you flip a single switch in Phone Settings.

## Safety gate (key change)
- New `phone_settings.routing_enabled` boolean, defaults to **false**.
- Until you set it to `true` in the admin UI, the voice webhook will respond with a polite TwiML message ("This number is being upgraded — please call back shortly") and **not forward, not record, not transcribe**.
- Lets you point Twilio's webhook at the function the moment porting completes without any pre-port surprises.
- Phone Settings page shows a clear banner: "Routing is OFF — calls will not be forwarded. Enable when porting is complete."

## What gets built (now, but inactive)

### Database
- `call_logs` — from, to, direction, status (initiated/ringing/answered/completed/missed/voicemail), duration, recording URL, transcription, customer_id, twilio_call_sid, created_at.
- `phone_settings` — single row: `routing_enabled` (default false), `forward_to_number`, `business_hours` JSON, `voicemail_greeting`, `record_calls`, `transcribe_voicemail`.
- RLS: admins-only.

### Edge functions (4 new)
- `twilio-voice-incoming` — checks `routing_enabled` first. If OFF → returns "upgrade in progress" TwiML. If ON → during business hours dials your cell with recording; otherwise records voicemail.
- `twilio-voice-status` — upserts `call_logs` row from Twilio lifecycle events.
- `twilio-voice-recording` — saves recording URL to the call row.
- `twilio-voice-transcription` — saves transcription text + bumps unread.

### Admin portal UI
- New nav item **Calls** — list view with filters (All / Missed / Voicemails / Today), inline audio player, transcription, customer match, click-to-text shortcut. Empty state: "No calls yet — calls will appear here once your number is ported and routing is enabled."
- New **Phone Settings** page (under admin Shop Settings) with:
  - Big ON/OFF toggle for `routing_enabled`
  - Forward-to cell number
  - Business hours editor
  - Voicemail greeting text
  - Record calls toggle
  - Transcribe voicemails toggle
  - Copy-to-clipboard webhook URL to paste into Twilio Console after porting
  - Step-by-step porting + webhook checklist

### Reused
- Caller→customer match: same lookup pattern as `twilio-inbound-sms`.
- SMS inbox stays exactly as is.

## What you do when porting completes
1. Open admin → **Phone Settings**.
2. Paste your cell into "Forward to".
3. Copy the webhook URL → paste into Twilio Console → Phone Numbers → your number → Voice Configuration.
4. Flip **Routing Enabled** to ON.
5. Test by calling your own number.

That's the only switch — no code changes needed.

## Out of scope
- In-browser softphone (Twilio Voice SDK).
- Outbound click-to-call.
- IVR menus / multi-staff routing.

## Deliverables
- [ ] Migration: `call_logs`, `phone_settings` (routing_enabled defaults false)
- [ ] 4 edge functions deployed but inert until toggle ON
- [ ] Admin **Calls** inbox page
- [ ] Admin **Phone Settings** page with safety toggle + setup checklist
