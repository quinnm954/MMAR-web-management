import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.95.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const form = await req.formData();
    const sid = String(form.get('CallSid') || '');
    const recordingSid = String(form.get('RecordingSid') || '');
    const recordingUrl = String(form.get('RecordingUrl') || '');
    const recordingDuration = Number(form.get('RecordingDuration') || 0);
    const source = String(form.get('RecordingSource') || ''); // RecordVerb = voicemail
    if (!sid || !recordingUrl) return new Response('ok', { headers: corsHeaders });

    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // Twilio gives URL without extension; .mp3 is publicly downloadable
    const fullUrl = `${recordingUrl}.mp3`;

    const update: Record<string, unknown> = {
      recording_url: fullUrl,
      recording_sid: recordingSid,
    };
    if (recordingDuration) update.duration_seconds = recordingDuration;
    if (source === 'RecordVerb') update.voicemail = true;

    await sb.from('call_logs').upsert(
      { twilio_call_sid: sid, ...update },
      { onConflict: 'twilio_call_sid' },
    );

    return new Response('ok', { headers: corsHeaders });
  } catch (e) {
    console.error('voice-recording error', e);
    return new Response('ok', { headers: corsHeaders });
  }
});
