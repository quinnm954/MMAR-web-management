import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.95.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const xml = (body: string) =>
  new Response(`<?xml version="1.0" encoding="UTF-8"?>${body}`, {
    headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
  });

const escapeXml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

function isWithinHours(hours: Record<string, { open: string; close: string } | null> | null): boolean {
  if (!hours) return true;
  // Use Eastern time (Florida)
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const day = DAYS[now.getDay()];
  const window = hours[day];
  if (!window) return false;
  const [oH, oM] = window.open.split(':').map(Number);
  const [cH, cM] = window.close.split(':').map(Number);
  const minutes = now.getHours() * 60 + now.getMinutes();
  return minutes >= oH * 60 + oM && minutes < cH * 60 + cM;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const sb = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const fnBase = `${supabaseUrl}/functions/v1`;

  let from = '';
  let to = '';
  let callSid = '';
  let form: FormData | null = null;
  try {
    form = await req.formData();
    from = String(form.get('From') || '');
    to = String(form.get('To') || '');
    callSid = String(form.get('CallSid') || '');
  } catch {
    // ignore
  }

  // Always log the call (even if dormant) so admin can see attempts
  if (callSid) {
    await sb.from('call_logs').upsert(
      {
        twilio_call_sid: callSid,
        direction: 'inbound',
        from_number: from || null,
        to_number: to || null,
        status: 'ringing',
      },
      { onConflict: 'twilio_call_sid' },
    );
    // Match customer by phone (best effort)
    if (from) {
      const { data: prof } = await sb
        .from('profiles')
        .select('id')
        .eq('phone', from)
        .maybeSingle();
      if (prof?.id) {
        await sb.from('call_logs').update({ customer_id: prof.id }).eq('twilio_call_sid', callSid);
      }
    }
  }

  const { data: settings } = await sb.from('phone_settings').select('*').eq('id', 1).maybeSingle();

  // Dormant mode — be polite, don't forward, don't record
  if (!settings?.routing_enabled) {
    const msg = settings?.unavailable_greeting ||
      'Thanks for calling. We are upgrading our phone system. Please text this number or try back shortly.';
    return xml(`<Response><Say voice="alice">${escapeXml(msg)}</Say><Hangup/></Response>`);
  }

  const forward = settings.forward_to_number?.trim();
  const greeting = settings.voicemail_greeting ||
    'Please leave a message after the tone.';
  const recordCalls = settings.record_calls !== false;
  const transcribe = settings.transcribe_voicemail !== false;
  const ringTimeout = Number(settings.ring_timeout_seconds) || 20;
  const inHours = isWithinHours(settings.business_hours as never);

  const recordingCb = `${fnBase}/twilio-voice-recording`;
  const transcribeCb = `${fnBase}/twilio-voice-transcription`;
  const statusCb = `${fnBase}/twilio-voice-status`;

  // AI receptionist answers 24/7 whenever the call isn't picked up (or it's after hours)
  const tryAi = async (): Promise<Response | null> => {
    const elKey = Deno.env.get('ELEVENLABS_API_KEY');
    if (!(settings.ai_enabled && settings.ai_agent_id && elKey)) return null;
    try {
      const today = new Date().toLocaleDateString('en-US', { timeZone: 'America/New_York', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const r = await fetch('https://api.elevenlabs.io/v1/convai/twilio/register-call', {
        method: 'POST',
        headers: { 'xi-api-key': elKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: settings.ai_agent_id,
          from_number: from,
          to_number: to,
          direction: 'inbound',
          conversation_initiation_client_data: {
            dynamic_variables: { call_sid: callSid, caller_number: from, today },
            conversation_config_override: settings.ai_greeting
              ? { agent: { first_message: settings.ai_greeting } } : undefined,
          },
        }),
      });
      if (r.ok) {
        await sb.from('call_logs').update({ ai_handled: true }).eq('twilio_call_sid', callSid);
        return new Response(await r.text(), { headers: { ...corsHeaders, 'Content-Type': 'text/xml' } });
      }
      console.error('register-call failed', r.status, await r.text());
    } catch (e) {
      console.error('register-call error', e);
    }
    return null;
  };

  // Outside hours OR no forward number → AI receptionist, then voicemail
  if (!inHours || !forward) {
    const ai = await tryAi();
    if (ai) return ai;
    const transcribeAttr = transcribe
      ? ` transcribe="true" transcribeCallback="${transcribeCb}"`
      : '';
    return xml(
      `<Response>` +
        `<Say voice="alice">${escapeXml(greeting)}</Say>` +
        `<Record maxLength="180" playBeep="true" recordingStatusCallback="${recordingCb}"${transcribeAttr}/>` +
        `<Hangup/>` +
      `</Response>`,
    );
  }

  // In hours → forward to cell, fall through to voicemail if missed
  const dialAttrs = [
    `timeout="${ringTimeout}"`,
    `answerOnBridge="true"`,
    `action="${fnBase}/twilio-voice-incoming?after=dial"`,
    recordCalls ? `record="record-from-answer-dual"` : '',
    recordCalls ? `recordingStatusCallback="${recordingCb}"` : '',
    `callerId="${escapeXml(to)}"`,
  ].filter(Boolean).join(' ');

  // After-dial fallthrough: Twilio re-hits this URL with ?after=dial when the dial ends
  const url = new URL(req.url);
  if (url.searchParams.get('after') === 'dial') {
    // Read DialCallStatus to decide
    const dialStatus = String(form?.get('DialCallStatus') || '');
    if (['completed', 'answered'].includes(dialStatus)) {
      return xml(`<Response><Hangup/></Response>`);
    }
    // missed → AI receptionist (if enabled), falling back to voicemail
    const ai = await tryAi();
    if (ai) return ai;
    const transcribeAttr = transcribe
      ? ` transcribe="true" transcribeCallback="${transcribeCb}"`
      : '';
    return xml(
      `<Response>` +
        `<Say voice="alice">${escapeXml(greeting)}</Say>` +
        `<Record maxLength="180" playBeep="true" recordingStatusCallback="${recordingCb}"${transcribeAttr}/>` +
        `<Hangup/>` +
      `</Response>`,
    );
  }

  // Ring cell + every admin/owner signed into the Garage Ace in-app phone at the same time
  const { data: staff } = await sb.from('user_roles').select('user_id').in('role', ['admin', 'owner']);
  const clients = [...new Set((staff || []).map((r: { user_id: string }) => r.user_id))]
    .map((id) => `<Client>staff_${String(id).replace(/-/g, '')}</Client>`).join('');
  return xml(
    `<Response>` +
      `<Dial ${dialAttrs}><Number>${escapeXml(forward)}</Number>${clients}</Dial>` +
    `</Response>`,
  );
});
