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
    const status = String(form.get('CallStatus') || '');
    const duration = Number(form.get('CallDuration') || 0);
    if (!sid) return new Response('ok', { headers: corsHeaders });

    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const update: Record<string, unknown> = { status };
    if (status === 'in-progress') update.answered_at = new Date().toISOString();
    if (status === 'completed' || status === 'no-answer' || status === 'busy' || status === 'failed' || status === 'canceled') {
      update.completed_at = new Date().toISOString();
      if (duration) update.duration_seconds = duration;
      // Mark missed if never answered
      if (['no-answer', 'busy', 'failed', 'canceled'].includes(status)) {
        update.status = 'missed';
      }
    }

    await sb.from('call_logs').upsert(
      { twilio_call_sid: sid, ...update },
      { onConflict: 'twilio_call_sid' },
    );

    return new Response('ok', { headers: corsHeaders });
  } catch (e) {
    console.error('voice-status error', e);
    return new Response('ok', { headers: corsHeaders });
  }
});
