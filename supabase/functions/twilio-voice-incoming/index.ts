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
  try {
    const form = await req.formData();
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

  // Outside hours OR no forward number → straight to voicemail
  if (!inHours || !forward) {
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
    let dialStatus = '';
    try {
      const f = await req.formData();
      dialStatus = String(f.get('DialCallStatus') || '');
    } catch {
      // ignore
    }
    if (['completed', 'answered'].includes(dialStatus)) {
      return xml(`<Response><Hangup/></Response>`);
    }
    // missed → voicemail
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

  return xml(
    `<Response>` +
      `<Dial ${dialAttrs}>${escapeXml(forward)}</Dial>` +
    `</Response>`,
  );
});
