# Roadmap

## Receptionist reliability and afternoon times
- [ ] Diagnose current call/text receptionist failures and repair verified causes.
- [ ] Default to noon–5 PM Eastern; mornings only when requested, retaining owner approval and service eligibility.
- [ ] Test and deploy the affected receptionist paths.

## Subscriber-only oil changes
- [x] Enforce membership before automated oil-change time offers and booking conversion across phone, text, and website follow-ups; 11 tests passed, deployed guards and synced the live receptionist, and a signed-in attempt to schedule Nerittza was rejected without saving an appointment.

## Financed receipts in Reports
- [x] Include received down payments and installments on payment date without counting the financed invoice total again; 24 tests passed, preview builds cleanly, signed-in October revenue verified at $3,902.82 including Jose’s $806.66 receipt.

## Withdrawal reminders
- [x] Add day-before withdrawal SMS through the existing hourly worker; ten tests passed, deployed worker returned no errors, and Jose's next Stripe cycle was verified as October 26 at 9 AM Eastern. First reminder is due October 25; actual future SMS delivery remains to occur.

## Financing installment tracking
- [x] Synchronize successful Stripe installments and manual charges to financing payments and invoice history without duplicates; deployed and reconciled Jose's real down payment.
- [x] Keep the invoice open until the final scheduled payment; ten regression tests passed, live invoice shows Partial with $806.66 paid and $806.66 principal remaining.

## Better date filters
- [x] Add to-date, rolling and calendar date-range filters to Reports, invoices, estimates, repair orders, appointments and booking requests.
- [x] Test date boundaries (22 tests passing); verify signed-in presets and custom dates on desktop/phone and all operational date controls, with no page errors or phone overflow.

## Previous reporting periods and future chart values
- [x] Add previous day/week/month/year selection with bounded report queries; verified all four signed-in views.
- [x] Leave future chart months blank until recorded activity; verified yearly graph stops at October with November/December visible, 14 tests passed.

## Full-year report graph
- [x] Show all twelve months for Year with zero-filled gaps; verified signed-in graph and passed nine report tests.

## Paid estimate completion
- [x] Mark linked estimates Completed after invoice payment; corrected 19 existing estimates, verified signed-in Completed list and passed 12 tests.

## PartsTech connection
- [x] Correct punchout authentication and verify the request format (four tests and authenticated deployed check passed).
- [ ] Connect and verify a real parts quote. Blocked: PartsTech-issued Garage Ace partner credentials.

## Schedule blocking
- [x] Add calendar controls to create, edit and remove blocked times.
- [x] Verify saved blocks and receptionist availability exclusion.

## Refund reporting
- [x] Include completed refunds in report revenue/profit, charts and exports without counting them as sales or technician labor.
- [x] Verify Alex Ortiz’s $600 refund in the live Reports page.

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
- [x] Verify real records, replies, dialing, and responsive presentation in the preview.
- [x] Move Phone to the header, move notification controls into Settings, and remove the floating phone button.
- [x] Include the complete outbound email log and refresh it live on the Phone page.

## Repair Orders
- [x] Name repair orders from the approved repair descriptions instead of “Approved Estimate.”
- [x] Correct existing generic repair-order names.
- [x] MMAR Phone red phone icon
- [x] Route communication alerts to MMAR Phone, service alerts to Garage Ace
- [x] Fix stuck app-icon badge
- [x] Add to customers from text threads (AI prefill)
- [x] Faster Phone refresh
- [x] Publish latest version

## South Florida expansion (Broward & Palm Beach)
- [x] Service regions in the database, auto-tagging bookings/appointments by address
- [x] Admin → Settings → Service regions: launch switch + tech region assignment
- [x] Receptionist service area reads launched regions
- [x] South Florida city pages live with "coming soon" waitlist note; receptionist waitlist-only until a tech is assigned
- [ ] Paused Google Search campaign for Broward & Palm Beach (needs keyword/copy approval)
- [x] Region tabs on booking requests, estimates, repair orders, invoices
- [x] Region filter on calendar, appointments and Reports; manual region pickers; auto receptionist sync; auto tech assignment
- [ ] Second Google Business Profile once a tech has a South Florida base address
