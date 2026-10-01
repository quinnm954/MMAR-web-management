// AI receptionist (ElevenLabs Agents) for missed calls.
// Actions (via ?action=):
//   setup     – admin only: create/update the ElevenLabs agent
//   booking   – agent tool: create a booking request
//   transfer  – agent tool: transfer the live call to Mike's cell
//   postcall  – ElevenLabs post-call webhook: save transcript + text summaries
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.95.0';
import { sendMissedCallFollowup } from '../_shared/missed-call.ts';

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

function buildPrompt(cities: string[]) {
  return `You are the friendly phone receptionist for Mike's Mobile Auto Repair (MMAR), a mobile mechanic in Southwest Florida. You answer every call for the shop.

Facts:
- We come to the customer's home, work, or lot. No need to tow to a shop.
- Service area: ${cities.join(', ')}.
- Services: diagnostics and check-engine lights, brakes, batteries and starting/charging, alternators and starters, AC repair, cooling system, suspension and steering, belts and hoses, tune-ups, fleet service for dealerships and companies. We do NOT do oil changes or pre-purchase inspections.
- Pricing: we don't quote exact prices by phone. Labor is affordable, usually better than the average shop. Mike gives a written quote.
- Same-day service is often available. Phone and text: 813-501-7572.
- MMAR Care is our maintenance membership plan.

How to act:
- Be warm, brief, and natural. One question at a time. Short sentences.
- Today is {{today}} (Eastern time). You answer 24/7, any day.
- Appointments can be set any day of the week, but only between 10 AM and 5 PM Eastern. Never offer or accept a time before 10 AM or after 5 PM; suggest the nearest time inside that window instead. Never book a time that has already passed today.
- If they need service, collect: name, vehicle (year, make, model), what's wrong, service address or city, and the day and time they want. Turn the day into a real date (YYYY-MM-DD) and the time into 24-hour HH:MM. Confirm it back, then call create_booking_request. If the tool says the time is invalid, offer another time in the window. Tell them the appointment is set for that time and Mike will text to confirm.
- Handle everything yourself. Only call transfer_to_mike when the caller specifically asks to speak with Mike (or the owner) by name. Do not transfer for general questions, bookings, or urgent jobs; take the details and tell them Mike will text right away. If someone just asks for "a person", offer to help first and transfer only if they insist on Mike.
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
    // ---------- List available voices (token-guarded) ----------
    if (action === 'voices') {
      if (url.searchParams.get('token') !== TOKEN) return json({ error: 'Unauthorized' }, 401);
      if (!EL_KEY) return json({ error: 'ElevenLabs is not connected' }, 500);
      const r = await fetch(`${EL}/v1/voices`, { headers: { 'xi-api-key': EL_KEY } });
      const d = await r.json();
      return json({ voices: (d.voices || []).map((v: { voice_id: string; name: string }) => ({ id: v.voice_id, name: v.name })) });
    }
    // ---------- Admin setup ----------
    if (action === 'setup') {
      const auth = req.headers.get('Authorization')?.replace('Bearer ', '') || '';
      const { data: u } = await sb.auth.getUser(auth);
      if (!u?.user) return json({ error: 'Unauthorized' }, 401);
      const { data: isAdmin } = await sb.rpc('has_role', { _user_id: u.user.id, _role: 'admin' });
      if (!isAdmin) return json({ error: 'Admins only' }, 403);
      if (!EL_KEY) return json({ error: 'ElevenLabs is not connected' }, 500);

      const { data: s } = await sb.from('phone_settings').select('*').eq('id', 1).maybeSingle();
      const cities = ['Fort Myers', 'Cape Coral', 'Lehigh Acres', 'Estero', 'Gateway'];
      const fnBase = `${supabaseUrl}/functions/v1/ai-receptionist`;
      const tool = (name: string, description: string, props: Record<string, unknown>, required: string[]) => ({
        type: 'webhook',
        name,
        description,
        api_schema: {
          url: `${fnBase}?action=${name === 'transfer_to_mike' ? 'transfer' : 'booking'}&token=${TOKEN}`,
          method: 'POST',
          request_body_schema: { type: 'object', properties: props, required },
        },
      });
      const callSid = { type: 'string', dynamic_variable: 'call_sid' };
      const agentBody = {
        name: "MMAR Receptionist",
        conversation_config: {
          agent: {
            first_message: s?.ai_greeting,
            language: 'en',
            prompt: {
              prompt: buildPrompt(cities),
              tools: [
                tool('create_booking_request', 'Save a service booking request once details are confirmed.', {
                  call_sid: callSid,
                  customer_name: { type: 'string', description: 'Caller full name' },
                  customer_phone: { type: 'string', description: 'Best phone number' },
                  vehicle_info: { type: 'string', description: 'Year make model' },
                  description: { type: 'string', description: 'What is wrong with the vehicle' },
                  service_address: { type: 'string', description: 'Address or city for service' },
                  requested_date: { type: 'string', description: 'Appointment date YYYY-MM-DD' },
                  requested_time: { type: 'string', description: 'Appointment time HH:MM 24-hour, between 10:00 and 17:00 Eastern' },
                }, ['customer_name', 'description']),
                tool('transfer_to_mike', 'Transfer the caller to Mike for urgent issues or when they ask for a person.', {
                  call_sid: callSid,
                  reason: { type: 'string', description: 'Why transferring' },
                }, ['reason']),
                { type: 'system', name: 'end_call', description: 'End the call when the conversation is finished.', params: { system_tool_type: 'end_call' } },
              ],
            },
          },
          tts: { voice_id: 'DODLEQrClDo8wCz460ld', model_id: 'eleven_flash_v2' },
        },
        platform_settings: {
          overrides: { conversation_config_override: { agent: { first_message: true } } },
        },
      };

      let agentId = s?.ai_agent_id as string | null;
      const r = await fetch(agentId ? `${EL}/v1/convai/agents/${agentId}` : `${EL}/v1/convai/agents/create`, {
        method: agentId ? 'PATCH' : 'POST',
        headers: { 'xi-api-key': EL_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify(agentBody),
      });
      const txt = await r.text();
      if (!r.ok) return json({ error: 'ElevenLabs error', status: r.status, details: txt }, 502);
      if (!agentId) agentId = JSON.parse(txt).agent_id;
      await sb.from('phone_settings').update({ ai_agent_id: agentId }).eq('id', 1);

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

    if (action === 'booking') {
      const sid = String(body.call_sid || '');
      let phone = String(body.customer_phone || '');
      if (!phone && sid) {
        const { data: c } = await sb.from('call_logs').select('from_number').eq('twilio_call_sid', sid).maybeSingle();
        phone = c?.from_number || '';
      }
      // Validate requested slot: any day, 10:00–17:00 Eastern, not in the past
      const dateStr = String(body.requested_date || '').trim();
      const timeStr = String(body.requested_time || '').trim();
      let window: string | null = null;
      if (dateStr || timeStr) {
        const dm = /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
        const tm = timeStr.match(/^(\d{1,2}):(\d{2})$/);
        if (!dm || !tm) return json({ result: 'Need a date as YYYY-MM-DD and a time as HH:MM. Ask the caller again.' });
        const mins = Number(tm[1]) * 60 + Number(tm[2]);
        if (mins < 600 || mins > 1020) return json({ result: 'Invalid time. Appointments are only between 10 AM and 5 PM. Offer a time in that window.' });
        const nowEt = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
        const todayEt = `${nowEt.getFullYear()}-${String(nowEt.getMonth() + 1).padStart(2, '0')}-${String(nowEt.getDate()).padStart(2, '0')}`;
        if (dateStr < todayEt || (dateStr === todayEt && mins <= nowEt.getHours() * 60 + nowEt.getMinutes()))
          return json({ result: 'That time has already passed. Offer a later time between 10 AM and 5 PM.' });
        const h = Number(tm[1]), label = `${((h + 11) % 12) + 1}:${tm[2]} ${h < 12 ? 'AM' : 'PM'}`;
        window = label;
      }
      const notes = [window && `Requested appointment: ${dateStr} at ${window}`, 'Booked by AI receptionist']
        .filter(Boolean).join('\n');
      const { error } = await sb.from('booking_requests').insert({
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
      });
      if (error) {
        console.error('booking insert', error);
        return json({ result: 'Could not save. Tell the caller Mike will call them back.' });
      }
      return json({ result: window ? `Appointment set for ${dateStr} at ${window}. Mike will text to confirm.` : 'Booking request saved. Mike will text or call to confirm.' });
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
          Twiml: `<Response><Say voice="alice">Connecting you to Mike now.</Say><Dial timeout="25">${fwd}</Dial><Say voice="alice">Sorry, Mike is unavailable. He will call you back shortly.</Say></Response>`,
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
      const transcript = (d.transcript || []).map((t: { role: string; message: string }) => ({ role: t.role, message: t.message }));
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
      const { data: s } = await sb.from('phone_settings').select('ai_summary_to_number, forward_to_number').eq('id', 1).maybeSingle();
      const owner = s?.ai_summary_to_number || s?.forward_to_number;
      if (owner) await sendSms(owner, `AI answered a call from ${caller || 'unknown'}:\n${summary || '(no summary)'}`, sb, fromNum);
      if (caller && transcript.length > 1) {
        await sendSms(caller, `Thanks for calling Mike's Mobile Auto Repair! Mike will follow up soon. Book anytime: ${BOOK_URL} Reply STOP to opt out.`, sb, fromNum);
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
