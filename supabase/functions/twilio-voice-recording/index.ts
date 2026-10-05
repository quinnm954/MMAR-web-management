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

    // Audio is never stored — transcripts only. Keep duration/voicemail metadata.
    const update: Record<string, unknown> = {};
    if (recordingDuration) update.duration_seconds = recordingDuration;
    if (source === 'RecordVerb') update.voicemail = true;
    if (Object.keys(update).length === 0) return new Response('ok', { headers: corsHeaders });

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
