import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.95.0';

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
    if (!from || !body) return new Response('ok', { headers: corsHeaders });

    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // Find or create thread
    let { data: thread } = await sb.from('sms_threads').select('*').eq('phone', from).maybeSingle();
    if (!thread) {
      const ins = await sb.from('sms_threads').insert({ phone: from, last_message_preview: body.slice(0, 80) }).select().single();
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
      thread_id: thread.id, direction: 'inbound', body, twilio_sid: sid, status: 'received',
      invoice_id: invoiceId,
    });
    await sb.from('sms_threads').update({
      last_message_at: new Date().toISOString(),
      last_message_preview: body.slice(0, 80),
      unread_count: (thread.unread_count || 0) + 1,
      ...(invoiceId ? { last_invoice_id: invoiceId } : {}),
    }).eq('id', thread.id);

    return new Response('<?xml version="1.0" encoding="UTF-8"?><Response/>', {
      headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
    });
  } catch (e) {
    return new Response(String(e), { status: 500, headers: corsHeaders });
  }
});
