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
    const text = String(form.get('TranscriptionText') || '');
    const status = String(form.get('TranscriptionStatus') || '');
    if (!sid) return new Response('ok', { headers: corsHeaders });

    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    await sb.from('call_logs').upsert(
      {
        twilio_call_sid: sid,
        transcription: status === 'completed' ? text : `[${status}]`,
        voicemail: true,
      },
      { onConflict: 'twilio_call_sid' },
    );

    return new Response('ok', { headers: corsHeaders });
  } catch (e) {
    console.error('voice-transcription error', e);
    return new Response('ok', { headers: corsHeaders });
  }
});
