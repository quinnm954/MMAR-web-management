# Roadmap

## Vehicle spelling corrections
- [ ] Automatically correct clear make/model errors on save and clean up existing vehicles.
- [ ] Show uncertain matches for owner review and verify corrected information reads back.

## Open Labor Project lookup
- [x] Reproduced provider model-name rejections (Odessy and generic Box Truck); added real error messages and provider-listed, lookup-only model selection. Seven tests passed and signed-in Odyssey search returned 1.2 alternator hours, added to the unsaved editor then cancelled. Saved records unchanged; preview build clean.

## Existing-customer check-ins
- [x] Reuse pending requests without an age cutoff and route phone/text check-ins to existing open orders without changing times; multiple open orders go to staff.
- [x] Twenty-one tests passed, both receptionists deployed and voice sync verified; Joel’s live account resolves his existing AC Hose order. No customer contacted; a new carrier check-in remains unobserved.

## Notification clearing and message browsing
- [x] Clear phone unread dots and counts together with dismissed notifications; signed-in Clear all removed dots and the bell stayed clear after reopening.
- [x] Defer page reloads while scrolling or reading an open message thread; three regression tests passed and a real signed-in text thread survived notification and 30-second reload triggers.

## Remaining selected security findings
- [x] Protect all six Twilio webhook handlers (10 findings) with account-bound signatures covering exact configured public URL/query and complete form. Three security tests and seven regression tests passed; all six deployed handlers reject unsigned requests (401) and accept signed no-action requests (200). No customer calls/texts initiated; next genuine carrier interaction remains unobserved.
- [x] Restrict manual SMS/email to owner/admin and bind email/payment recipients to saved contacts (3 findings).
- [x] Five security tests and 11 regression tests passed; deployed three senders and verified signed-in rejection of unrelated recipients with HTTP 400. Marked those three findings fixed; no real messages sent. Remaining 10 stay active pending the verification credential.

## Higher-margin SEO priorities
- [x] Record alternator, starter and brake repair searches as higher priority than battery replacement because margins are higher; no SEO page or ad changes requested yet.

## Selected monitoring fixes
- [x] Preserve numeric losses in CSV exports while retaining formula neutralization; signed-in report download verified 26 rows including numeric -100.00 and -600.00.
- [x] Preserve receptionist answers and checked time offers while continuing missing-detail intake; 23 regression tests passed and twilio-inbound-sms deployed. No real customer/carrier text was sent.

## Receptionist customer intake
- [x] Removed the outage notice; voice rejects missing new-prospect details, SMS continues collecting name/street address/vehicle and incomplete active threads route to intake.
- [x] Intake and returning-customer tests passed; deployed five handlers and live voice setup returned success. No real caller/carrier conversation was initiated, so future real-customer delivery is not verified.

## Monday receptionist reopening
- [ ] Enforce Monday Nov 2 as the earliest voice/text offer, retaining checked availability and pending owner approval.
- [ ] Text the active diagnosis requester that Monday is the earliest; verify the message in Phone.

## Returning-customer receptionist
- [x] Reuse resolved saved details in booking acknowledgments; a known customer saying Mike knows hands missing details to staff instead of repeating intake.
- [x] Deployed twilio-inbound-sms; 18 tests passed, including David's exact handler path with isolated AI/SMS delivery. No new carrier text was sent; actual next-customer delivery remains unverified.

## Yes/no satisfaction feedback
- [x] Replace star prompts on review page and invoices with shared Yes/No feedback; Google posting is a clearly separate action available to everyone. Updated and deployed follow-up SMS/email copy.
- [x] Save actual boolean answers separately from historical stars; four tests pass, both live public submissions read back in signed-in Admin Feedback with no page errors, and preview build is clean. Temporary verification entries removed after checking.

## Admin service balances
- [x] Show live Twilio balance and ElevenLabs usage with refresh and account links; deployed, two access tests passed, unauthenticated requests rejected, and signed-in desktop/phone verified at $12.74 and 60,646 characters remaining with no overflow or page errors.

## Text booking requests
- [x] Offer checked times while gathering customer details; persist selected date/time pending Mike's approval, including updates to existing requests.
- [x] Twenty-four tests passed; deployed the text handler and verified a temporary Oct 23 noon request reads back in the signed-in Pending screen with Confirm control and no appointment; removed test data. A new live AI/carrier text conversation was not performed.

## Receptionist reliability and afternoon times
- [x] Recent real calls/texts are answering; corrected conflicting scheduling prompts, automated-SMS suppression, missing diagnosis-draft import and fail-open calendar reads.
- [x] Default to noon–5 PM Eastern; mornings only when requested, retaining owner approval and service eligibility.
- [x] Seventeen tests passed; deployed affected handlers, synchronized the live agent and phone routing, verified real afternoon availability and rejection of unrequested mornings. A new live caller conversation was not performed.

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

- [x] Business number ported and connected to call/text receptionist handlers; routing reverified during October 22 synchronization.

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

## Competitor quote matching
- [x] Read itemized quote photos (lines, name, address, vehicle), show side-by-side in estimate editor with owner-only Match/Ignore; receptionists ask for itemized photos. 3 tests pass; deployed. No real customer photo tested yet.
