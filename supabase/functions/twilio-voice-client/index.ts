import { createClient } from 'npm:@supabase/supabase-js@2';

const xml = (body: string) =>
  new Response(`<?xml version="1.0" encoding="UTF-8"?>${body}`, { headers: { 'Content-Type': 'text/xml' } });
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Handles calls placed from the Garage Ace in-app phone.
Deno.serve(async (req) => {
  const form = await req.formData().catch(() => null);
  const from = String(form?.get('From') || '');
  const to = String(form?.get('To') || '').replace(/[^\d+]/g, '');
  const callSid = String(form?.get('CallSid') || '');
  const acct = String(form?.get('AccountSid') || '');

  if (acct !== Deno.env.get('TWILIO_ACCOUNT_SID') || !from.startsWith('client:staff_') || !/^\+?\d{10,15}$/.test(to)) {
    return xml('<Response><Reject/></Response>');
  }
  const e164 = to.startsWith('+') ? to : (to.length === 10 ? `+1${to}` : `+${to}`);
  const callerId = Deno.env.get('TWILIO_FROM_NUMBER') || '';
  const base = `${Deno.env.get('SUPABASE_URL')}/functions/v1`;

  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: settings } = await sb.from('phone_settings').select('record_calls').eq('id', 1).maybeSingle();
  if (callSid) {
    await sb.from('call_logs').upsert({
      twilio_call_sid: callSid, direction: 'outbound', from_number: callerId, to_number: e164, status: 'in-progress',
    }, { onConflict: 'twilio_call_sid' });
  }
  const rec = settings?.record_calls !== false
    ? ` record="record-from-answer-dual" recordingStatusCallback="${base}/twilio-voice-recording"` : '';
  return xml(`<Response><Dial callerId="${esc(callerId)}" answerOnBridge="true"${rec}><Number>${esc(e164)}</Number></Dial></Response>`);
});
