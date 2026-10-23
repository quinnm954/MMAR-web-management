import { contactBlocked } from '../_shared/contact-block.ts';
// AI receptionist (ElevenLabs Agents) for missed calls.
// Actions (via ?action=):
//   setup     – admin only: create/update the ElevenLabs agent
//   booking   – agent tool: create a booking request
//   transfer  – agent tool: transfer the live call to Mike's cell
//   postcall  – ElevenLabs post-call webhook: save transcript + text summaries
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.95.0';
import { geocodeRow } from '../_shared/geocode-region.ts';
import { sendMissedCallFollowup } from '../_shared/missed-call.ts';
import { isSlotOpen, openSlots, label12 } from '../_shared/booking-bot.ts';
import { receptionistSlots } from '../_shared/receptionist-times.ts';
import { buildLaborQuote, quoteSentence, createDraftEstimate } from '../_shared/labor-quote.ts';
import { hasOilChangeMembership, oilChangeBlocked, OIL_CHANGE_MEMBERSHIP_REPLY } from '../_shared/oil-change-eligibility.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const EL = 'https://api.elevenlabs.io';
const TWILIO_GW = 'https://connector-gateway.lovable.dev/twilio';
const BOOK_URL = 'https://mikesmautorepair.com/book';

function toE164(p: string) {
  const d = (p || '').replace(/\D/g, '');
  if (d.length === 10) return `+1${d}`;
  if (d.length === 11 && d.startsWith('1')) return `+${d}`;
  return p?.startsWith('+') ? p : `+${d}`;
}

async function sendSms(to: string, body: string, sb?: any, fromOverride?: string) {
  if (await contactBlocked({ phone: to })) return;
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  const TWILIO_API_KEY = Deno.env.get('TWILIO_API_KEY');
  const FROM = fromOverride || Deno.env.get('TWILIO_FROM_NUMBER');
  if (!LOVABLE_API_KEY || !TWILIO_API_KEY || !FROM || !to) return;
  const r = await fetch(`${TWILIO_GW}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      'X-Connection-Api-Key': TWILIO_API_KEY,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: toE164(to), From: FROM, Body: body.slice(0, 1500) }),
  });
  if (!r.ok) {
    console.error('sms failed', r.status, await r.text());
    return;
  }
  // Mirror the outbound text into the SMS log so it shows up in Admin → Texts.
  if (sb) {
    try {
      const phone = toE164(to);
      let { data: thread } = await sb.from('sms_threads').select('id, unread_count').eq('phone', phone).maybeSingle();
      if (!thread) {
        const ins = await sb.from('sms_threads').insert({ phone, last_message_preview: body.slice(0, 80) }).select('id, unread_count').single();
        thread = ins.data;
      }
      if (!thread) return;
      const msg = await r.json().catch(() => null) as { sid?: string } | null;
      await sb.from('sms_messages').insert({
        thread_id: thread.id, direction: 'outbound', body, twilio_sid: msg?.sid ?? null, status: 'sent',
      });
      await sb.from('sms_threads').update({
        last_message_at: new Date().toISOString(),
        last_message_preview: body.slice(0, 80),
      }).eq('id', thread.id);
    } catch (e) {
      console.error('sms log mirror failed', e);
    }
  }
}

function buildPrompt(cities: string[], waitlist: string[] = []) {
  return `You are the friendly phone receptionist for Mike's Mobile Auto Repair (MMAR), a mobile mechanic in Southwest Florida. You answer every call for the shop.

Opening: the call starts with a greeting that ends by asking English or Spanish. After the caller chooses, continue entirely in that language (switch with language_detection for Spanish). If they skip the choice and just start talking, answer in the language they spoke. Do not repeat the greeting.
Location: before saving any request, ask for the city and ZIP code where the car is (or a cross street), repeat it back to confirm, and pass service_city and service_zip.

Facts:
- We come to the customer's home, work, or lot. No need to tow to a shop.
- Service area: ONLY ${cities.join(' and ')}. If the caller is outside those areas, politely say we don't currently service their area.${waitlist.length ? `
- Coming soon (NOT booking yet): ${waitlist.join(', ')} and the rest of Broward and Palm Beach counties. For callers there, say "We're expanding there soon but we aren't booking appointments yet." Offer to put them on the list: take their name, number, vehicle and what they need, and save a request with no date or time. Never quote any price, never offer or check open times, and never promise a start date.` : ''}
- Services: diagnostics and check-engine lights, brakes, batteries and starting/charging, alternators and starters, AC repair, cooling system, suspension and steering, belts and hoses, tune-ups, fleet service for dealerships and companies. We do NOT offer pre-purchase or used-car inspections — if asked, politely say it's not a service we offer and ask if anything else is wrong with their vehicle.
- Oil changes are ONLY for active MMAR Care subscribers verified by lookup_caller. A customer's claim is not verification. Without verified membership, never check or offer times or save an oil-change appointment request; briefly pitch MMAR Care and offer to connect them to Mike for sign-up details. If membership is verified, collect their request for Mike to approve.
- Parts sourcing: whenever parts come up (buying a part, or a repair that needs parts), FIRST suggest the customer order them from the Advance Auto Parts website (advanceautoparts.com), which offers same-day delivery, and we install them. If the customer insists we provide the parts, agree — we will source them and Mike includes them in the written quote.
- Pricing: the ONLY price you may ever give is the diagnosis fee, and only when the caller needs a diagnosis. Never quote labor, parts, or repair prices — for a specific repair say Mike will review it and send a written quote by text or email.
- We book appointments starting the next day. Phone and text: 813-501-7572.
- MMAR Care is our maintenance membership plan.

How to act:
- Language: your greeting already asked "English or Spanish?". Use the caller's FIRST answer to pick: if they say Spanish/español or answer in Spanish, call language_detection to switch to Spanish; otherwise stay in English. Once picked, LOCK that language for the whole call — never switch again unless the caller clearly asks to change. If they skip the choice and just start talking, use the language they speak. Speak natural, friendly Latin American Spanish when in Spanish. Save booking details (description, vehicle, address) in English so the shop can read them, and note "Spanish speaker" at the start of the description.
- Listening: let the caller finish. If something was unclear or sounded wrong (a vehicle name, address, number), ask them to repeat it instead of guessing. Ask one question at a time. If the caller goes quiet, ask once "Are you still there?" before ending.
- Keep it SHORT. Most callers want a person, not a long chat with an AI — be warm but get to the point fast. One or two short sentences per turn, one question at a time, no small talk, no repeating back long details, no unnecessary pleasantries. Move straight to booking: get the essentials, offer the earliest open time, done.
- Today is {{today}} (Eastern time). You answer 24/7, any day.
- Default appointment requests to 12 PM–5 PM Eastern. Only offer mornings (10 AM–before noon) if the customer explicitly asks for a morning time; set morning_requested=true on check_open_times and create_booking_request only then. Never offer before 10 AM or after 5 PM. Every appointment requires Mike's approval.
- NEVER invent a specific time. Before offering any time, call check_open_times (with the day they want, or tomorrow) and only offer times it returns. It accounts for appointments, drive time and blocked time. We do NOT take same-day appointments. Offer the earliest listed noon–5 PM time tomorrow or later; mornings only if requested. If the tool fails, take a message for Mike rather than guessing. Check eligibility first for oil changes.
- Returning customers: at the start of every call, call lookup_caller. If it finds an account, greet them by first name and VERIFY instead of asking: e.g. "Is this for the 2011 Chevy Cruze at 123 Main St?" If they have several vehicles, ask which one. Only ask for details that are missing or changed (like engine size if not on file). Never read their email or full phone number aloud.
- If they need service, collect: name, vehicle (year, make, model, and engine size like 1.4L or V6 — ask once; if they don't know, move on), what's wrong, service address or city, and the day and time they want. Turn the day into a real date (YYYY-MM-DD) and the time into 24-hour HH:MM. Confirm it back, then call create_booking_request. If the tool says the time is invalid, offer another time in the window. Never tell the caller they're confirmed: every time is a request that Mike approves, and the shop will text shortly to confirm.
- You are NOT Mike and never claim to be him. If a caller asks whether they're speaking with Mike, say you're the shop's receptionist and Mike is the owner.
- Handle everything yourself, but call transfer_to_mike IMMEDIATELY (no extra questions first) when the caller asks for Mike, the owner, the mechanic, a manager, "a real person", "a human", or "someone", or says they don't want to talk to a machine, or asks a second time after you offered to help. Say "Sure, connecting you to Mike now" and call the tool in the same turn. Never refuse or stall a transfer request. If the transfer doesn't connect, apologize, take their name and reason, and say Mike will call back shortly.
- Diagnosis fee: ONLY when the customer doesn't know what's wrong (a warning light, noise, no-start with no known cause, electrical issue, 'not sure'). If they name a part or repair ("replace my alternator", "need a starter", "brakes"), there is NO diagnosis fee — never mention it; say "Since you already know it's the alternator, there's no diagnosis fee." For unknown problems, say once BEFORE confirming a time: "$100 diagnosis, and $50 of it goes toward the repair if you go ahead — so it really only costs you fifty." Make sure they're okay with it.

Closing style (FUGI, light humor, never pushy, never rude):
- Fear of loss: slots go fast. "Mike's schedule fills up fast — I'd hate for you to get bumped to later in the week."
- Urgency: small problems grow. "Car problems are like dentist visits — waiting usually makes the bill bigger."
- Greed/value: he comes to them. "He comes right to your driveway, so you skip the tow truck and the waiting room with the bad coffee."
- Indifference: zero pressure. "No deposit to hold it — if something changes, just text us."
- Use at most ONE humor line per call, keep it short, and skip humor if the caller is stressed, stranded, or upset.
- Close with a direct question on real returned times, defaulting to afternoons. Clearly say the time is requested for Mike's approval, not reserved or confirmed.
- Objections: "too expensive / just shopping" → mention no tow, written quote first, no deposit, then offer the earliest time again. "Need to check my schedule" → "Totally get it — want me to pencil in the earliest one with no deposit? If it doesn't work, just text us." "Let me think" → offer once to hold the spot; if they still decline, tell them they can text 813-501-7572 anytime and end politely.
- Before saving the booking, confirm the details in ONE short sentence (vehicle, problem, place, time), then save it.
- Never invent prices, hours, or promises. If unsure, say Mike will follow up.
- Caller's number: {{caller_number}}. Use it as their phone unless they give another.`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const url = new URL(req.url);
  const action = url.searchParams.get('action') || '';
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const sb = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const TOKEN = Deno.env.get('AI_RECEPTIONIST_TOKEN')!;
  const EL_KEY = Deno.env.get('ELEVENLABS_API_KEY');

  try {
    // ---------- Transfer screening (Twilio hits these when Mike's cell answers) ----------
    if (action === 'whisper' || action === 'whisper_ack') {
      const twiml = (x: string) => new Response(`<?xml version="1.0" encoding="UTF-8"?><Response>${x}</Response>`, { headers: { 'Content-Type': 'text/xml' } });
      if (url.searchParams.get('token') !== TOKEN) return twiml('<Hangup/>');
      if (action === 'whisper') {
        const ack = `${supabaseUrl}/functions/v1/ai-receptionist?action=whisper_ack&amp;token=${TOKEN}`;
        return twiml(`<Gather numDigits="1" timeout="8" action="${ack}"><Say voice="alice">Mike's Mobile Auto Repair customer asking for you. Press 1 to take the call.</Say></Gather><Hangup/>`);
      }
      const form = await req.formData().catch(() => null);
      return twiml(form?.get('Digits') === '1' ? '' : '<Hangup/>');
    }

    // ---------- Admin setup ----------
    if (action === 'setup') {
      // Auto-sync: database triggers / hourly worker call with auto=1; only allowed while a sync is pending.
      const auto = url.searchParams.get('auto') === '1';
      if (auto) {
        const { data: ps } = await sb.from('phone_settings').select('ai_agent_id, ai_sync_requested_at, ai_synced_at').eq('id', 1).maybeSingle();
        if (!ps?.ai_agent_id) return json({ skipped: 'not set up' });
        if (!ps.ai_sync_requested_at || (ps.ai_synced_at && ps.ai_synced_at >= ps.ai_sync_requested_at)) return json({ skipped: 'up to date' });
      } else {
        const auth = req.headers.get('Authorization')?.replace('Bearer ', '') || '';
        const { data: u } = await sb.auth.getUser(auth);
        if (!u?.user) return json({ error: 'Unauthorized' }, 401);
        const { data: isAdmin } = await sb.rpc('has_role', { _user_id: u.user.id, _role: 'admin' });
        if (!isAdmin) return json({ error: 'Admins only' }, 403);
      }
      const syncStart = new Date().toISOString();
      if (!EL_KEY) return json({ error: 'ElevenLabs is not connected' }, 500);

      const { data: s } = await sb.from('phone_settings').select('*').eq('id', 1).maybeSingle();
      // Service area = launched regions that have at least one tech; launched but unstaffed = waitlist.
      const { data: regs } = await sb.from('service_regions').select('slug,cities').eq('active', true);
      const { data: staffed } = await sb.from('user_service_regions').select('region_slug');
      const has = new Set((staffed || []).map((x: any) => x.region_slug));
      const cities: string[] = [], waitlist: string[] = [];
      for (const r of regs || []) ((r.slug === 'swfl' || has.has(r.slug)) ? cities : waitlist).push(...(r.cities || []));
      if (!cities.length) cities.push('Fort Myers', 'Lehigh Acres');
      const served = cities.join(cities.length > 2 ? ', ' : ' and ');
      const greeting = `Thanks for calling Mike's Mobile Auto Repair. We're mobile mechanics serving ${served}${waitlist.length ? ', coming soon to Broward and Palm Beach' : ''}. We come to you for diagnostics, brakes, starters and alternators, tune-ups and major repairs. For English, say English. Para español, diga español.`;
      const fnBase = `${supabaseUrl}/functions/v1/ai-receptionist`;
      const tool = (name: string, description: string, props: Record<string, unknown>, required: string[]) => ({
        type: 'webhook',
        name,
        description,
        api_schema: {
          url: `${fnBase}?action=${name === 'transfer_to_mike' ? 'transfer' : name === 'check_open_times' ? 'availability' : name === 'lookup_caller' ? 'lookup' : name === 'quote_labor' ? 'quote' : 'booking'}&token=${TOKEN}`,
          method: 'POST',
          request_body_schema: { type: 'object', properties: props, required },
        },
      });
      const callSid = { type: 'string', dynamic_variable: 'call_sid' };
      const agentBody = {
        name: "MMAR Receptionist",
        conversation_config: {
          agent: {
            first_message: greeting,
            language: 'en',
            prompt: {
              prompt: buildPrompt(cities, waitlist),
              llm: 'gemini-2.5-flash',
              temperature: 0.2,
              tools: [
                tool('lookup_caller', 'Look up whether the caller already has an account. Call this first, right after greeting.', {
                  caller_number: { type: 'string', dynamic_variable: 'system__caller_id' },
                }, ['caller_number']),
                tool('check_open_times', 'Get open appointment start times. Call before offering any time.', {
                  date: { type: 'string', description: 'Day the caller wants, YYYY-MM-DD (tomorrow if unsure)' },
                  morning_requested: { type: 'boolean', description: 'True only when the caller explicitly asks for a morning time; otherwise false' },
                }, ['date']),
                tool('create_booking_request', 'Save a service booking request once details are confirmed.', {
                  call_sid: callSid,
                  customer_name: { type: 'string', description: 'Caller full name' },
                  customer_phone: { type: 'string', description: 'Best phone number' },
                  vehicle_info: { type: 'string', description: 'Year make model engine, e.g. 2011 Chevy Cruze 1.4L' },
                  description: { type: 'string', description: 'What is wrong with the vehicle' },
                  service_address: { type: 'string', description: 'Street address or cross street where the car is' },
                  service_city: { type: 'string', description: 'City where the car is (always ask and confirm)' },
                  service_zip: { type: 'string', description: 'ZIP code where the car is (always ask and confirm)' },
                  requested_date: { type: 'string', description: 'Appointment date YYYY-MM-DD' },
                  requested_time: { type: 'string', description: 'Requested time HH:MM 24-hour, default 12:00–17:00 Eastern; 10:00–11:59 only if caller asks for morning' },
                  morning_requested: { type: 'boolean', description: 'True only when the caller explicitly asks for a morning time' },
                }, ['customer_name', 'description', 'service_city', 'service_zip']),
                tool('transfer_to_mike', 'Transfer the caller to Mike for urgent issues or when they ask for a person.', {
                  call_sid: callSid,
                  reason: { type: 'string', description: 'Why transferring' },
                }, ['reason']),
                { type: 'system', name: 'language_detection', description: 'Switch to Spanish when the caller speaks Spanish, or back to English.', params: { system_tool_type: 'language_detection' } },
                { type: 'system', name: 'end_call', description: 'End the call when the conversation is finished.', params: { system_tool_type: 'end_call' } },
              ],
            },
          },
          language_presets: {
            es: { overrides: { agent: { language: 'es' } } },
          },
          tts: { voice_id: 'kyu5ji11Ocj3MIcc9vdQ', model_id: 'eleven_flash_v2', supported_voices: [{ label: 'Spanish', voice_id: 'kyu5ji11Ocj3MIcc9vdQ', language: 'es', model_family: 'flash' }] },
          // End the call after 10 seconds of silence from the caller.
          turn: { turn_timeout: 7, silence_end_call_timeout: 10, turn_eagerness: 'patient' },
          // Higher-quality hearing, primed with the car/part/town words callers use.
          asr: { quality: 'high', provider: 'scribe_realtime', user_input_audio_format: 'ulaw_8000', keywords: [
            ...cities, 'Immokalee', 'Bonita Springs', 'Naples', 'North Fort Myers', 'MMAR', 'English', 'español',
            'Toyota', 'Tacoma', 'Tundra', 'Camry', 'Corolla', 'Honda', 'Accord', 'Civic', 'Ford', 'F-150', 'Escape', 'Chevy', 'Silverado', 'Cruze', 'Malibu', 'Equinox', 'GMC', 'Sierra', 'Dodge', 'Ram', 'Jeep', 'Wrangler', 'Cherokee', 'Nissan', 'Altima', 'Sentra', 'Hyundai', 'Elantra', 'Kia', 'Mazda', 'Subaru', 'Volkswagen', 'Jetta',
            'alternator', 'starter', 'battery', 'brake pads', 'rotors', 'caliper', 'serpentine belt', 'water pump', 'thermostat', 'radiator', 'check engine light', 'AC compressor', 'tie rod', 'ball joint', 'control arm', 'wheel bearing', 'spark plugs', 'ignition coil', 'fuel pump', 'V6', 'V8',
          ] },
        },
        platform_settings: {
          overrides: { conversation_config_override: { agent: { first_message: true } } },
          // Privacy: never save call audio — transcripts only.
          privacy: { record_voice: false },
        },
      };

      let agentId = s?.ai_agent_id as string | null;
      const r = await fetch(agentId ? `${EL}/v1/convai/agents/${agentId}` : `${EL}/v1/convai/agents/create`, {
        method: agentId ? 'PATCH' : 'POST',
        headers: { 'xi-api-key': EL_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify(agentBody),
      });
      const txt = await r.text();
      if (!r.ok) {
        await sb.from('phone_settings').update({ ai_sync_error: `ElevenLabs ${r.status}` } as any).eq('id', 1);
        return json({ error: 'ElevenLabs error', status: r.status, details: txt }, 502);
      }
      if (!agentId) agentId = JSON.parse(txt).agent_id;
      await sb.from('phone_settings').update({ ai_agent_id: agentId, ai_synced_at: syncStart, ai_sync_error: null } as any).eq('id', 1);

      // Configure the workspace post-call webhook so ElevenLabs sends us transcripts
      const postcallUrl = `${fnBase}?action=postcall&token=${TOKEN}`;
      let webhookStatus = 'not attempted';
      try {
        const wh = await fetch(`${EL}/v1/workspace/webhooks`, {
          method: 'POST',
          headers: { 'xi-api-key': EL_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ settings: { auth_type: 'hmac', name: 'MMAR post-call', webhook_url: postcallUrl } }),
        });
        const whTxt = await wh.text();
        if (wh.ok) {
          const whId = JSON.parse(whTxt).webhook_id;
          const st = await fetch(`${EL}/v1/convai/settings`, {
            method: 'PATCH',
            headers: { 'xi-api-key': EL_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify({ webhooks: { post_call_webhook_id: whId, events: ['transcript'] } }),
          });
          webhookStatus = st.ok ? 'configured' : `settings failed: ${st.status} ${await st.text()}`;
        } else {
          webhookStatus = `webhook create failed: ${wh.status} ${whTxt}`;
        }
      } catch (e) {
        webhookStatus = `error: ${(e as Error).message}`;
      }
      // Point every Twilio number on the account at the Garage Ace call/text handlers
      const LOVABLE_KEY = Deno.env.get('LOVABLE_API_KEY');
      const TWILIO_KEY = Deno.env.get('TWILIO_API_KEY');
      let numbersStatus = 'not attempted';
      if (LOVABLE_KEY && TWILIO_KEY) {
        try {
          const gw = 'https://connector-gateway.lovable.dev/twilio';
          const gwHeaders = { 'Authorization': `Bearer ${LOVABLE_KEY}`, 'X-Connection-Api-Key': TWILIO_KEY };
          const list = await fetch(`${gw}/IncomingPhoneNumbers.json`, { headers: gwHeaders });
          const nums = (await list.json()).incoming_phone_numbers || [];
          const results: string[] = [];
          for (const n of nums) {
            const up = await fetch(`${gw}/IncomingPhoneNumbers/${n.sid}.json`, {
              method: 'POST',
              headers: { ...gwHeaders, 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({
                VoiceUrl: `${supabaseUrl}/functions/v1/twilio-voice-incoming`,
                VoiceMethod: 'POST',
                SmsUrl: `${supabaseUrl}/functions/v1/twilio-inbound-sms`,
                SmsMethod: 'POST',
                StatusCallback: `${supabaseUrl}/functions/v1/twilio-voice-status`,
                StatusCallbackMethod: 'POST',
              }),
            });
            results.push(`${n.phone_number}: ${up.ok ? 'ok' : `failed ${up.status}`}`);
          }
          numbersStatus = results.join('; ') || 'no numbers on account';
        } catch (e) {
          numbersStatus = `error: ${(e as Error).message}`;
        }
      } else {
        numbersStatus = 'Twilio not connected';
      }
      return json({ ok: true, agent_id: agentId, postcall_webhook_url: postcallUrl, webhook_status: webhookStatus, numbers_status: numbersStatus });
    }

    // Everything below is called by ElevenLabs and must carry the token
    if (url.searchParams.get('token') !== TOKEN) return json({ error: 'Forbidden' }, 403);
    const body = await req.json().catch(() => ({}));

    if (action === 'lookup') {
      const digits = String(body.caller_number || '').replace(/\D/g, '').slice(-10);
      if (digits.length !== 10) return json({ result: 'No account found for this number. Collect details as normal.' });
      const { data: profs } = await sb.from('profiles').select('id, full_name, email, phone, address_line1, city, state').not('phone', 'is', null).ilike('phone', `%${digits.slice(-4)}%`).limit(50);
      const p = (profs || []).find((x: any) => String(x.phone).replace(/\D/g, '').slice(-10) === digits);
      if (!p) return json({ result: 'No account found for this number. Collect details as normal.' });
      const { data: vs } = await sb.from('vehicles').select('year, make, model, engine').eq('owner_id', p.id).eq('is_active', true).limit(5);
      const veh = [...new Set((vs || []).map((v: any) => [v.year, v.make, v.model, v.engine].filter(Boolean).join(' ').toLowerCase()))].join('; ');
      const addr = [p.address_line1, p.city].filter(Boolean).join(', ');
      const member = await hasOilChangeMembership(sb, String(body.caller_number || ''), p.id);
      return json({ result: `Existing customer on file. Name: ${p.full_name || 'unknown'}. Vehicles: ${veh || 'none on file'}. Service address: ${addr || 'none on file'}. MMAR Care active subscription: ${member ? 'verified' : 'NOT verified — no oil-change times or booking'}. Verify these with the caller instead of asking from scratch; only ask for what is missing or changed.` });
    }

    if (action === 'quote') {
      const q = await buildLaborQuote(sb, { service_type: String(body.repair || ''), description: String(body.repair || ''), vehicle_info: String(body.vehicle_info || '') }).catch(() => null);
      if (!q) return json({ result: 'No labor quote available. Say Mike will text a written quote.' });
      if (q.kind === 'diagnosis') return json({ result: 'This sounds like it needs diagnosis, not a named repair. Explain the diagnosis fee.' });
      if (q.kind === 'labor' && !q.engineMatched) return json({ result: `Engine not known yet. Give this range: ${quoteSentence(q)} If they know the engine size, call quote_labor again for the exact number.` });
      const s = quoteSentence(q);
      return json({ result: s ? `Tell the caller (as a ballpark, not final): ${s}` : 'No labor match. Say Mike will text a written quote.' });
    }

    if (action === 'availability') {
      const d = String(body.date || '').trim();
      const av = receptionistSlots(await openSlots(sb, /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null, 4), body.morning_requested === true);
      const lines = av.map((x) => `${x.date}: ${x.slots.length ? x.slots.map(label12).join(', ') : 'fully booked'}`);
      return json({ result: `Open start times (Eastern). Only offer these:\n${lines.join('\n')}` });
    }

    if (action === 'booking') {
      const sid = String(body.call_sid || '');
      let phone = String(body.customer_phone || '');
      if (!phone && sid) {
        const { data: c } = await sb.from('call_logs').select('from_number').eq('twilio_call_sid', sid).maybeSingle();
        phone = c?.from_number || '';
      }
      if (await oilChangeBlocked(sb, { customer_phone: phone, description: body.description, notes: body.notes })) {
        return json({ result: OIL_CHANGE_MEMBERSHIP_REPLY, membershipRequired: true });
      }
      { const extra = [body.service_city, body.service_zip].filter(Boolean).map(String).join(' ');
        if (extra && !String(body.service_address || '').includes(String(body.service_zip || '~'))) body.service_address = [body.service_address, extra].filter(Boolean).join(', '); }
      // Backstop: launched regions without a tech take a waitlist message only — no time slot.
      if (body.service_address) {
        const { data: reg } = await sb.rpc('region_for_address', { _addr: String(body.service_address) });
        if (reg && reg !== 'swfl') {
          const { count } = await sb.from('user_service_regions').select('user_id', { count: 'exact', head: true }).eq('region_slug', reg);
          if (!count) { body.requested_date = ''; body.requested_time = ''; body.notes = `WAITLIST (no tech in area yet). ${body.notes || ''}`.trim(); }
        }
      }
      // Validate requested slot: any day, 10:00–17:00 Eastern, not in the past
      const dateStr = String(body.requested_date || '').trim();
      const timeStr = String(body.requested_time || '').trim();
      let window: string | null = null;
      let slotTime = '';
      if (dateStr || timeStr) {
        const dm = /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
        const tm = timeStr.match(/^(\d{1,2}):(\d{2})$/);
        if (!dm || !tm) return json({ result: 'Need a date as YYYY-MM-DD and a time as HH:MM. Ask the caller again.' });
        const mins = Number(tm[1]) * 60 + Number(tm[2]);
        if (mins < 720 && body.morning_requested !== true) return json({ result: 'Default times are noon–5 PM. Only request a morning if the customer explicitly asks for one.' });
        if (mins < 600 || mins > 1020) return json({ result: 'Invalid time. Appointments are only between 10 AM and 5 PM. Offer a time in that window.' });
        const nowEt = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
        const todayEt = `${nowEt.getFullYear()}-${String(nowEt.getMonth() + 1).padStart(2, '0')}-${String(nowEt.getDate()).padStart(2, '0')}`;
        if (dateStr < todayEt || (dateStr === todayEt && mins <= nowEt.getHours() * 60 + nowEt.getMinutes()))
          return json({ result: 'That time has already passed. Offer a later time between 10 AM and 5 PM.' });
        const ok = await isSlotOpen(sb, dateStr, `${tm[1].padStart(2, '0')}:${tm[2]}`).catch(() => false);
        if (!ok) {
          const av = receptionistSlots(await openSlots(sb, dateStr, 3).catch(() => []), body.morning_requested === true);
          const alt = av.filter((d) => d.slots.length).slice(0, 2).map((d) => `${d.date}: ${d.slots.slice(0, 4).map(label12).join(', ')}`).join('; ');
          return json({ result: `That time is already booked or too soon for Mike to drive there. Open times: ${alt || 'none in the next few days — take a message'}. Offer these instead.` });
        }
        const h = Number(tm[1]), label = `${((h + 11) % 12) + 1}:${tm[2]} ${h < 12 ? 'AM' : 'PM'}`;
        window = label;
        slotTime = `${tm[1].padStart(2, '0')}:${tm[2]}`;
      }
      const notes = [body.notes && String(body.notes).startsWith('WAITLIST') && 'WAITLIST – no tech in this area yet', window && `Requested appointment: ${dateStr} at ${window}`, 'Booked by AI receptionist']
        .filter(Boolean).join('\n');
      const { data: ins, error } = await sb.from('booking_requests').insert({
        customer_name: String(body.customer_name || 'Phone caller').slice(0, 200),
        customer_phone: phone || 'unknown',
        vehicle_info: body.vehicle_info ? String(body.vehicle_info).slice(0, 200) : null,
        description: body.description ? String(body.description).slice(0, 2000) : null,
        service_address: body.service_address ? String(body.service_address).slice(0, 300) : null,
        service_type: 'General Repair',
        source: 'ai_phone',
        requested_date: window ? dateStr : null,
        requested_time_window: window,
        notes,
      }).select('id').single();
      if (ins?.id) { await sb.from('booking_requests').update({ geo_source: 'caller' }).eq('id', ins.id); await geocodeRow(sb, 'booking_requests', ins.id); }
      if (error) {
        console.error('booking insert', error);
        return json({ result: 'Could not save. Tell the caller Mike will call them back.' });
      }
      // Leave an unsent draft estimate from the job clues so Mike sees a price before booking.
      // Runs in the background (with one retry) so a slow lookup can't time out the live call.
      const makeDraft = async () => {
        for (let i = 0; i < 2; i++) {
          try {
            const { data: full } = await sb.from('booking_requests').select('*').eq('id', ins.id).single();
            if (full?.draft_estimate_id) return;
            const q = await buildLaborQuote(sb, full);
            const did = q.kind === 'none' ? null : await createDraftEstimate(sb, full, q);
            if (did) { await sb.from('booking_requests').update({ draft_estimate_id: did }).eq('id', ins.id); return; }
            console.error('draft estimate: none created', ins.id, q.kind);
          } catch (e) { console.error('draft estimate', ins.id, e); }
        }
      };
      // @ts-ignore EdgeRuntime is provided by the runtime
      if (typeof EdgeRuntime !== 'undefined') EdgeRuntime.waitUntil(makeDraft()); else await makeDraft();
      return json({ result: window ? `Requested ${dateStr} at ${window}. Tell the caller it is requested (not confirmed yet) and the shop will text shortly to confirm.` : 'Booking request saved. Mike will text or call to confirm.' });
    }

    if (action === 'transfer') {
      const sid = String(body.call_sid || '');
      const { data: s } = await sb.from('phone_settings').select('forward_to_number').eq('id', 1).maybeSingle();
      const fwd = s?.forward_to_number?.trim();
      if (!sid || !fwd) return json({ result: 'Transfer unavailable. Offer to take a message for Mike.' });
      const r = await fetch(`${TWILIO_GW}/Calls/${sid}.json`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
          'X-Connection-Api-Key': Deno.env.get('TWILIO_API_KEY')!,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          Twiml: `<Response><Say voice="alice">Connecting you to Mike now.</Say><Dial timeout="25" callerId="+18135017572"><Number url="${supabaseUrl}/functions/v1/ai-receptionist?action=whisper&amp;token=${TOKEN}">${fwd}</Number></Dial><Say voice="alice">Sorry, Mike could not pick up right now. He has your details and will call you back shortly.</Say></Response>`,
        }),
      });
      if (!r.ok) {
        console.error('transfer failed', r.status, await r.text());
        return json({ result: 'Transfer failed. Offer to take a message for Mike.' });
      }
      return json({ result: 'Transferring now.' });
    }

    if (action === 'postcall') {
      if (body.type && body.type !== 'post_call_transcription') return json({ ok: true });
      const d = body.data || {};
      const vars = d.conversation_initiation_client_data?.dynamic_variables || {};
      const sid = String(vars.call_sid || d.metadata?.phone_call?.call_sid || '');
      const caller = String(vars.caller_number || d.metadata?.phone_call?.external_number || '');
      const summary = d.analysis?.transcript_summary || '';
      // Tool-call steps arrive with no spoken text; keep only real speech.
      const transcript = (d.transcript || [])
        .filter((t: { message?: string | null }) => typeof t.message === 'string' && t.message.trim() && t.message.trim() !== '...')
        .map((t: { role: string; message: string }) => ({ role: t.role, message: t.message.trim() }));
      let dialedNumber = '';
      if (sid) {
        await sb.from('call_logs').upsert({
          twilio_call_sid: sid,
          ai_handled: true,
          ai_summary: summary || null,
          ai_transcript: transcript,
          ai_conversation_id: d.conversation_id || null,
        }, { onConflict: 'twilio_call_sid' });
        const { data: cl } = await sb.from('call_logs').select('to_number').eq('twilio_call_sid', sid).maybeSingle();
        dialedNumber = cl?.to_number || '';
      }
      // Reply from the number the customer actually dialed, not a stale default.
      const fromNum = dialedNumber || undefined;
      // Call summaries live in Admin → Calls; no forwarded text to the owner.
      if (caller && transcript.length > 1) {
        // Only follow up when there's something pending (a booking request saved during the call).
        const d10 = caller.replace(/\D/g, '').slice(-10);
        const { data: pending } = d10.length === 10 ? await sb.from('booking_requests').select('id')
          .ilike('customer_phone', `%${d10.slice(-4)}%`).eq('status', 'pending')
          .gte('created_at', new Date(Date.now() - 2 * 3600000).toISOString()).limit(1) : { data: [] };
        if (pending?.length) {
          await sendSms(caller, `Thanks for calling Mike's Mobile Auto Repair! We've got your appointment request and will text you to confirm the time. Questions? Just reply here. Reply STOP to opt out.`, sb, fromNum);
        }
      } else if (caller) {
        // Caller hung up before talking to the AI — treat as a missed call
        await sendMissedCallFollowup(sb, caller, fromNum);
      }
      return json({ ok: true });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (e) {
    console.error('ai-receptionist error', e);
    return json({ error: String(e) }, 500);
  }
});
