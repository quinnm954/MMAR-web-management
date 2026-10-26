import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.95.0';
import { requireStaff } from '../_shared/staff-auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/twilio';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  // Only signed-in staff may text from the business line.
  const auth = await requireStaff(req);
  if (auth instanceof Response) return new Response(await auth.text(), { status: auth.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  try {
    const { thread_id, to, body: rawBody, media } = await req.json();
    const body = typeof rawBody === 'string' ? rawBody : '';
    const items = (Array.isArray(media) ? media : [])
      .filter((m: any) => typeof m?.path === 'string' && m.path.startsWith('outbound/') && !m.path.includes('..'))
      .slice(0, 10)
      .map((m: any) => ({ path: m.path as string, type: typeof m.type === 'string' ? m.type : 'image/jpeg' }));
    if (!thread_id || !to || (!body.trim() && !items.length)) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const TWILIO_API_KEY = Deno.env.get('TWILIO_API_KEY');
    const TWILIO_FROM = Deno.env.get('TWILIO_FROM_NUMBER');
    if (!LOVABLE_API_KEY || !TWILIO_API_KEY || !TWILIO_FROM) {
      return new Response(JSON.stringify({ error: 'Twilio not configured. Connect Twilio and set TWILIO_FROM_NUMBER.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const params = new URLSearchParams({ To: to, From: TWILIO_FROM });
    if (body) params.set('Body', body);
    for (const m of items) {
      // Temporary private link Twilio fetches once to deliver the photo.
      const { data, error } = await sb.storage.from('sms-media').createSignedUrl(m.path, 60 * 60 * 24);
      if (error || !data?.signedUrl) {
        return new Response(JSON.stringify({ error: 'Photo upload not found' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      params.append('MediaUrl', data.signedUrl);
    }

    const tw = await fetch(`${GATEWAY_URL}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': TWILIO_API_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });
    const twData = await tw.json();
    if (!tw.ok) {
      return new Response(JSON.stringify({ error: twData?.message || 'Twilio error', details: twData }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    await sb.from('sms_messages').insert({
      thread_id, direction: 'outbound', body, media_urls: items, twilio_sid: twData.sid, status: twData.status,
    });
    await sb.from('sms_threads').update({
      last_message_at: new Date().toISOString(), last_message_preview: (body || '📷 Photo').slice(0, 80),
    }).eq('id', thread_id);

    return new Response(JSON.stringify({ ok: true, sid: twData.sid }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
