# Database performance review — November 12, 2026

## Recorded baseline

Window: October 30, 2026 00:00 UTC through November 12, 2026 12:07 UTC (partial current day; recording may lag activity).

| Running category | Requested credits | Recorded quantity |
| --- | ---: | --- |
| Database compute | 10.761269 | 278 pico instance-hours |
| AI Gateway | 4.834905 | Token quantities unavailable |
| Network | 0.357200 | 1.587499 GB uncached, 0.000170 GB cached |
| Functions | 0.134010 | 26,802 invocations |
| Realtime | 0.016963 | 2,714 messages |
| File storage | 0.000118 | 1.643962 GB-hours |
| **Running total** | **16.104464** | |

Build usage is separate: 94.113 requested credits. No database-storage usage item was returned; database allocated GB-hours are unknown. These are requested credits, not evidence of deductions or cash paid.

Current pico quote: 0.0387096 credits/instance-hour; 27.870912 credits for a hypothetical continuous 720-hour month, before allowances. Faster queries do not change this rate.

## Measured database state

- Database and connection pool healthy; memory 45%, disk 48%, connections 13/60, pool clients 1/200, no recent resource-exhaustion alerts.
- Database size 3.46 GB; managed scheduled-job history relation approximately 3.666 billion bytes (3.41 GiB including indexes), overwhelmingly larger than application tables. Largest public table is audit_logs at 11.85 MB.
- Statement statistics reset November 12 at 12:03:07 UTC. The small post-reset sample is not representative historical load: the highest sampled statement was the approved-prospect scan, one execution at 7.86ms.
- Existing calls, text messages and notifications already have relevant customer, thread/date and unread indexes.
- Source shows every-minute Outlook synchronization and hourly outreach/follow-up work. Bounded Outlook logs show boots at 12:04 and 12:06 UTC, not proof of successful useful work. No supported safe schedule inventory/history interface was available; no schedule credentials were inspected or exposed.

## Applied and verified

1. **Approved-prospect queue index:** partial ordered index on created_at and next_email_at, preserving the worker's existing eligibility conditions and ordering. Live migration and index existence verified. Identical bounded query with 273 prospects and zero eligible rows changed from sequential scan + sort to index scan: shared buffer hits **111 → 1**, execution **0.345 → 0.102ms**. This measures empty-queue polling, not email-send throughput or sustained CPU.
2. **Phone duplicate refresh prevention:** concurrent refresh triggers now share in-flight work, without caching completed results or changing the existing 15-second refresh cadence. Failed operations can retry. Removed retired chat read-receipt polling and retired-chat subscription.
3. **Signed-in comparison:** same real account, /admin/phone, 17-second observation: retired message_reads requests **2 → 0**; calls, texts, inbound/outbound email, profiles and notification refresh counts remained unchanged. No page errors. Call names and happiness colors still visible. Twelve regression tests passed; preview build reports OK.

## Biggest remaining candidates and limits

- **Managed job history retention:** confirm a retention window and supported managed cleanup/recovery process before deleting anything. Do not modify managed cron tables directly. Removing history may not reduce allocated disk or billed GB-hours; remeasure afterward.
- **Compute:** already on pico in recorded usage; no resize or pause performed. A live phone receptionist needs availability, and manually pausing would interrupt it. A quiet snapshot does not establish peak headroom or an automatic sleep policy.
- **Phone email archive:** still reloads the complete paged sent-email archive on refresh; the real observation showed two email-page requests per cycle. Incremental loading is a further candidate, but must preserve historical body/status merging, all saved emails, search and delivery-status changes. Not changed in this pass.
- **AI:** second-largest running category, but token quantities and representative request quality were not measured in this database-focused pass. No model downgrade or quality change made.

No customer messages were sent, customer records deleted, retention windows changed, or reminder/inbox timing changed. Realized credit reductions remain unmeasured; compare equivalent traffic and recorded usage in Settings → Plans & credit usage after recording catches up.

Workflow: database-optimization, extended by cost-optimization.