
- Fleet prospecting: edge function `prospecting` (search/enrich/pitch, admin-only) + hourly `prospect-email-worker` sending via the `fleet-outreach` transactional template; no automated calls/texts (TCPA).

- Fleet registration: /fleet/register signs up via auth then calls anon-executable `submit_fleet_registration` RPC, guarded by user id+email match within 15 min of account creation.
- App emails are sent only from edge functions via `_shared/send-and-log.ts` (managed send + email_send_log row); why: the admin Emails screen reads that log and the browser must never send directly.
- Staff calendar feed: public `calendar-feed` edge function serves ICS keyed by a per-user token in `calendar_feed_tokens` (issued/rotated via `get_calendar_feed_token` RPC); why: phone/PC calendar widgets need an unauthenticated subscribable URL.
