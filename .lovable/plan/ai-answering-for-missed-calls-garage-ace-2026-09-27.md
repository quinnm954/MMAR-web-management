# AI answering for missed calls (Garage Ace)

## What you'll get
When a customer calls and you don't pick up, a natural-sounding AI receptionist answers instead of voicemail. It can:
- Answer questions about services, service area (Fort Myers, Cape Coral, Lehigh Acres, Estero, Gateway), hours, and how mobile repair works
- Take a booking request (name, vehicle, problem, location) and create it in Garage Ace, so it shows up in Admin like any other request
- Transfer the caller to your cell if it's urgent or they ask for a person
- Text the caller a booking link, and text you a short summary after every call

Every AI call is logged in Admin → Calls with the transcript, summary, and recording.

## Steps

**Step 1: Move your number to Twilio (you, 5–10 business days)**
Your 813-501-7572 number is still on Google Voice, so nothing can answer it yet. Port it to Twilio (free). Your Admin phone settings already list the steps. Until the transfer finishes, I can set everything up and test it on a temporary Twilio number.

**Step 2: Connect ElevenLabs (you, a few minutes)**
ElevenLabs runs the AI voice. It has very natural voices and works directly with Twilio phone lines. You connect your ElevenLabs account with one click. It charges per minute of AI talk time, roughly $0.08–0.10/min, and only missed calls use it.

**Step 3: I build it**
- Set up the AI receptionist with your business info, a friendly greeting, and the booking and transfer abilities
- Change missed-call handling: your cell rings first as it does today. If you don't answer, the call goes to the AI instead of voicemail.
- Keep voicemail as a backup if the AI service is ever unavailable
- Add an "AI answering" section to Admin phone settings: on/off switch, greeting text, transfer number, and a "Test call" button
- Show AI calls in Admin → Calls with the transcript and summary

**Step 4: Test together**
Call the number, let it ring out, and try booking, asking questions, and asking for a transfer.

## Technical details
- Missed-call handling: in `twilio-voice-incoming`, the dial fallthrough currently sends missed calls to `<Record>`. It will instead call ElevenLabs `POST /v1/convai/twilio/register-call` with agent_id, from, and to, then return the TwiML it gives back. If that request fails, missed calls still go to `<Record>` voicemail.
- The agent is created and updated through the ElevenLabs API: system prompt built from the service catalog and cities, the `transfer_to_number` system tool pointing at `forward_to_number`, and a server tool `create_booking_request` served by a new edge function that is secured with a shared secret and inserts into `booking_requests`, reusing the existing notification triggers.
- A new `elevenlabs-post-call` webhook edge function (HMAC-verified) saves the transcript and summary to `call_logs` (new columns `ai_handled`, `ai_summary`, `ai_transcript`) and sends both texts through the existing `send-sms` function.
- `phone_settings` gets new columns: `ai_enabled`, `ai_agent_id`, `ai_greeting`.
- Secrets: `ELEVENLABS_API_KEY` comes from the connector, plus a generated webhook secret. Twilio secrets already exist.

## Open item
Nothing will answer your real number until the transfer to Twilio is finished (Step 1).
