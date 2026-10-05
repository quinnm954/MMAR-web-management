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

    // Transcripts only: once the transcript is saved, delete the voicemail audio from Twilio.
    if (status === 'completed') {
      try {
        const LOVABLE_KEY = Deno.env.get('LOVABLE_API_KEY');
        const TWILIO_KEY = Deno.env.get('TWILIO_API_KEY');
        if (LOVABLE_KEY && TWILIO_KEY) {
          const gw = 'https://connector-gateway.lovable.dev/twilio';
          const gwHeaders = { 'Authorization': `Bearer ${LOVABLE_KEY}`, 'X-Connection-Api-Key': TWILIO_KEY };
          const list = await fetch(`${gw}/Calls/${sid}/Recordings.json`, { headers: gwHeaders });
          if (list.ok) {
            const recs = (await list.json()).recordings || [];
            for (const r of recs) {
              await fetch(`${gw}/Recordings/${r.sid}.json`, { method: 'DELETE', headers: gwHeaders });
            }
          }
        }
      } catch (e) {
        console.error('recording cleanup error', e);
      }
    }

    return new Response('ok', { headers: corsHeaders });
  } catch (e) {
    console.error('voice-transcription error', e);
    return new Response('ok', { headers: corsHeaders });
  }
});
