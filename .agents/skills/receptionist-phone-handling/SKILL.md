---
name: receptionist-phone-handling
description: Use when changing the AI receptionist (calls or SMS auto-replies), its prompt/script, the Admin Phone app, or customer texting/email behavior in Garage Ace. Triggers on "receptionist", "AI answering", "text reply", "phone page", "SMS", "call transfer".
---

# AI receptionist & phone rules

## What the receptionist may say
- The only price it quotes: $100 diagnosis, $50 credited to repair labor. Repair prices require details and a written estimate.
- Ask about symptoms or the named repair before anything price-related.
- Collect name, vehicle with engine size, service address, preferred day (from tomorrow). English or Spanish.
- Never book automatically — tell callers Mike will confirm the time.
- Decline tires, alignments, mobile tire service and pre-purchase inspections. For oil changes, pitch MMAR Care membership (oil changes are subscriber-only).
- Never mention financing.
- Tone: concise turns, light humor. Transfer only when explicitly asked or for urgent owner situations.
- Answers texts too (Admin → Settings → Phone → "Let AI answer texts"). Replies consume workspace AI credits; at zero credits, texts still arrive but get no reply.

## Sync
- Settings/region/tech changes auto-trigger `ai-receptionist?action=setup&auto=1`; followup-worker retries hourly. No manual update button.

## Phone app
- Admin Phone (/admin/phone) is the only place for calls, texts and email; in-app chat is retired.
- Communication push alerts go to the Phone app; service alerts go to the Garage Ace app.
- No call recordings — transcripts and summaries only.
- Business number: (813) 501-7572. Never send app email from the browser; use edge functions via `_shared/send-and-log.ts`.
