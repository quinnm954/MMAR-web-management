# Make the receptionist listen and respond better

## What's holding it back today
- The AI "brain" it thinks with is never chosen, so it gets the phone provider's basic default, which is weaker at following a long set of shop rules.
- It isn't told the car words callers use (Tacoma, Cruze, caliper, serpentine, Cape Coral, Estero...), so it mishears them on noisy phone lines.
- It doesn't adjust how soon it answers: it can jump in while someone is still talking, or wait too long.
- Callers can't easily interrupt it mid-sentence, and its replies can run long.

## Changes
1. **Smarter brain:** set the receptionist to a stronger, fast AI model with low "creativity" so it sticks to your rules (no prices except the diagnosis fee, no auto-booking, transfer when asked for Mike).
2. **Better hearing:** use the higher-quality speech-to-text tuned for phone audio, plus a list of car makes and models, parts, and your service-area towns so those words come through correctly.
3. **Natural timing:** let it wait a moment when a caller pauses mid-sentence ("my truck is... uh... making a noise") instead of cutting in. Callers can talk over it and it stops right away.
4. **Shorter, clearer replies:** one or two sentences per turn, one question at a time. It repeats back the key details (name, vehicle, address, day) once before saving. If it didn't catch something, it asks again instead of guessing.
5. **Pick up where it left off:** if the caller goes quiet, it gives one short "Are you still there?" before the existing 10-second hang-up.

Unchanged: voice, Spanish switching, no call recordings, transfer to Mike, $100 diagnosis fee rule.

## How we'll check it
Redeploy, then you make 2–3 test calls: a mumbled vehicle name, an interruption, and asking for Mike. Afterwards I'll read the transcripts in Admin → Calls and fine-tune.

## Technical details
In `supabase/functions/ai-receptionist/index.ts` agent config:
- `agent.prompt.llm` set to a fast high-quality model (e.g. `gemini-2.5-flash` or `gpt-4o` per ElevenLabs options), `temperature: 0.2`, `max_tokens` ~150.
- `asr: { quality: 'high', provider: 'elevenlabs', user_input_audio_format: 'ulaw_8000', keywords: [...] }` built from common makes/models, part names and `cities`.
- `turn: { turn_timeout: 7, silence_end_call_timeout: 10, mode: 'turn', turn_eagerness: 'patient' }`; interruptions enabled via `client_events` incl. `interruption`.
- Prompt additions: brevity, one question per turn, read-back, re-ask on low confidence, one "still there?" check.
- Re-sync the agent through the existing update path and verify with the ElevenLabs agent GET.
