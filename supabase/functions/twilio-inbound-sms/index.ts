import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.95.0';
import { handleBotReply } from '../_shared/booking-bot.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const form = await req.formData();
    const from = String(form.get('From') || '');
    const body = String(form.get('Body') || '');
    const sid = String(form.get('MessageSid') || '');
    const numMedia = Math.min(Number(form.get('NumMedia') || 0) || 0, 10);
    if (!from || (!body && numMedia === 0)) return new Response('ok', { headers: corsHeaders });

    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // Copy MMS photos/videos into private storage so staff can view them.
    const media: { path: string; type: string }[] = [];
    for (let i = 0; i < numMedia; i++) {
      const url = String(form.get(`MediaUrl${i}`) || '');
      const type = String(form.get(`MediaContentType${i}`) || 'application/octet-stream');
      if (!url) continue;
      try {
        let res = await fetch(url);
        if (!res.ok) {
          // Media auth enforced: fetch through the Twilio gateway instead.
          const m = url.match(/\/Messages\/[^/]+\/Media\/[^/?]+/);
          const lk = Deno.env.get('LOVABLE_API_KEY'), tk = Deno.env.get('TWILIO_API_KEY');
          if (m && lk && tk) res = await fetch(`https://connector-gateway.lovable.dev/twilio${m[0]}`, { headers: { Authorization: `Bearer ${lk}`, 'X-Connection-Api-Key': tk } });
        }
        if (!res.ok) { console.error('media fetch failed', res.status); continue; }
        const ext = (type.split('/')[1] || 'bin').split(';')[0].replace('jpeg', 'jpg');
        const path = `${from.replace(/\D/g, '')}/${sid || crypto.randomUUID()}-${i}.${ext}`;
        const up = await sb.storage.from('sms-media').upload(path, await res.arrayBuffer(), { contentType: type, upsert: true });
        if (up.error) { console.error('media upload', up.error.message); continue; }
        media.push({ path, type });
      } catch (e) { console.error('media error', e); }
    }
    const preview = body || (media.some(m => m.type.startsWith('video')) ? '🎥 Video' : '📷 Photo');

    // Find or create thread
    let { data: thread } = await sb.from('sms_threads').select('*').eq('phone', from).maybeSingle();
    if (!thread) {
      const ins = await sb.from('sms_threads').insert({ phone: from, last_message_preview: preview.slice(0, 80) }).select().single();
      thread = ins.data;
    }
    if (!thread) return new Response('error', { status: 500, headers: corsHeaders });

    // Determine which invoice this reply most likely refers to:
    // 1) The thread's last_invoice_id if its invoice is still unpaid
    // 2) Otherwise the most recently created unpaid invoice for this customer
    let invoiceId: string | null = null;
    if (thread.last_invoice_id) {
      const { data: inv } = await sb.from('invoices').select('id, status').eq('id', thread.last_invoice_id).maybeSingle();
      if (inv && inv.status !== 'paid' && inv.status !== 'void') invoiceId = inv.id;
    }
    if (!invoiceId && thread.customer_id) {
      const { data: inv } = await sb.from('invoices')
        .select('id')
        .eq('customer_id', thread.customer_id)
        .not('status', 'in', '(paid,void)')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (inv) invoiceId = inv.id;
    }

    await sb.from('sms_messages').insert({
      thread_id: thread.id, direction: 'inbound', body, media_urls: media, twilio_sid: sid, status: 'received',
      invoice_id: invoiceId,
    });
    await sb.from('sms_threads').update({
      last_message_at: new Date().toISOString(),
      last_message_preview: preview.slice(0, 80),
      unread_count: (thread.unread_count || 0) + 1,
      ...(invoiceId ? { last_invoice_id: invoiceId } : {}),
    }).eq('id', thread.id);

    // Booking follow-up bot replies if this customer has an active booking conversation
    if (body) try { await handleBotReply(sb, from, body); } catch (e) { console.error('booking bot', e); }

    return new Response('<?xml version="1.0" encoding="UTF-8"?><Response/>', {
      headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
    });
  } catch (e) {
    return new Response(String(e), { status: 500, headers: corsHeaders });
  }
});
