import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.95.0';
import { sendMissedCallFollowup } from '../_shared/missed-call.ts';

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

    // Missed-call follow-up: call ended, nobody (Mike or the AI) actually talked to the caller.
    // AI-handled calls are followed up by the AI's post-call step instead.
    if (update.completed_at) {
      const { data: call } = await sb.from('call_logs')
        .select('direction, from_number, to_number, ai_handled, answered_at').eq('twilio_call_sid', sid).maybeSingle();
      if (call?.direction === 'inbound' && call.from_number && !call.ai_handled && !call.answered_at) {
        await sendMissedCallFollowup(sb, call.from_number, call.to_number || undefined);
      }
    }

    return new Response('ok', { headers: corsHeaders });
  } catch (e) {
    console.error('voice-status error', e);
    return new Response('ok', { headers: corsHeaders });
  }
});
