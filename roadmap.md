# Roadmap

- [x] Remove the two excluded locations from public copy and search metadata.
- [x] Remove their service-area pages, links, and generated city coverage.
- [x] Verify no references remain and the site builds cleanly.

- [ ] When the 813-501-7572 port from Google Voice to Twilio completes, wire it to the AI receptionist: run the ai-receptionist setup action (auto-links every number on the account) or point the number's VoiceUrl at twilio-voice-incoming and SmsUrl at twilio-inbound-sms. Blocked: waiting on the port (1-4 weeks).

## Fleet Prospecting
- [x] Connect Google Maps; tables + RLS
- [x] Edge functions: prospect-search, prospect-enrich, prospect-pitch, prospect-email-worker (cron)
- [x] Outreach email template
- [x] Admin Prospecting tab (search, leads, pitch, tap-to-call, email queue)

## Email
- [x] Email sending update (ready to review; publish to finish)
- [x] Email domain notify.mikesmautorepair.com set up (finishing verification)

## Admin Phone
- [x] Preserve the existing Front Desk communication screens.
- [x] Add a standalone phone-style Admin workspace for calls, texts, and email.
- [ ] Verify real records, replies, dialing, and responsive presentation in the preview.
