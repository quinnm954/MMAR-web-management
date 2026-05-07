import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.95.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/twilio';
const SHOP_NAME = 'MMAR Care';

async function sendSms(to: string, body: string): Promise<{ ok: boolean; error?: string; sid?: string }> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  const TWILIO_API_KEY = Deno.env.get('TWILIO_API_KEY');
  const TWILIO_FROM = Deno.env.get('TWILIO_FROM_NUMBER');
  if (!LOVABLE_API_KEY || !TWILIO_API_KEY || !TWILIO_FROM) {
    return { ok: false, error: 'Twilio not configured' };
  }
  const tw = await fetch(`${GATEWAY_URL}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      'X-Connection-Api-Key': TWILIO_API_KEY,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: to, From: TWILIO_FROM, Body: body }),
  });
  const data = await tw.json();
  if (!tw.ok) return { ok: false, error: data?.message || 'Twilio error' };
  return { ok: true, sid: data.sid };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const sent: any[] = [];
  const errors: any[] = [];

  // 1) Appointment reminders: scheduled in the next 24-48 hours
  const now = new Date();
  const in24 = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in48 = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  const { data: upcoming } = await sb
    .from('appointments')
    .select('id, customer_id, service_type, scheduled_at, vehicle_id')
    .gte('scheduled_at', in24.toISOString())
    .lt('scheduled_at', in48.toISOString())
    .in('status', ['scheduled', 'confirmed']);

  for (const appt of upcoming || []) {
    const { data: existing } = await sb
      .from('service_reminders_sent')
      .select('id')
      .eq('reminder_type', 'appointment_24h')
      .eq('reference_id', appt.id)
      .maybeSingle();
    if (existing) continue;

    // Find phone via sms_threads (most recent for this customer)
    const { data: thread } = await sb
      .from('sms_threads')
      .select('phone')
      .eq('customer_id', appt.customer_id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!thread?.phone) continue;

    const when = new Date(appt.scheduled_at!);
    const msg = `${SHOP_NAME}: Reminder — your ${appt.service_type} appointment is scheduled for ${when.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}. Reply CANCEL to reschedule.`;

    const res = await sendSms(thread.phone, msg);
    await sb.from('service_reminders_sent').insert({
      customer_id: appt.customer_id,
      reminder_type: 'appointment_24h',
      reference_id: appt.id,
      phone: thread.phone,
      message: msg,
      status: res.ok ? 'sent' : 'failed',
      error: res.error,
    });
    if (res.ok) sent.push({ type: 'appointment_24h', id: appt.id }); else errors.push({ id: appt.id, error: res.error });
  }

  // 2) Service recommendations: due within next 14 days OR overdue mileage
  const in14 = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const { data: recs } = await sb
    .from('service_recommendations')
    .select('id, customer_id, vehicle_id, recommendation, due_date, due_mileage, status')
    .eq('status', 'pending')
    .or(`due_date.lte.${in14.toISOString().split('T')[0]},due_mileage.not.is.null`);

  for (const rec of recs || []) {
    const { data: existing } = await sb
      .from('service_reminders_sent')
      .select('id')
      .eq('reminder_type', 'recommendation_due')
      .eq('reference_id', rec.id)
      .maybeSingle();
    if (existing) continue;

    // Mileage check: skip if due_mileage > current_mileage + 500
    if (rec.due_mileage && rec.vehicle_id) {
      const { data: v } = await sb.from('vehicles').select('current_mileage').eq('id', rec.vehicle_id).maybeSingle();
      if (v?.current_mileage && rec.due_mileage > v.current_mileage + 500) continue;
    }

    const { data: thread } = await sb
      .from('sms_threads')
      .select('phone')
      .eq('customer_id', rec.customer_id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!thread?.phone) continue;

    const dueText = rec.due_date ? ` by ${rec.due_date}` : rec.due_mileage ? ` at ${rec.due_mileage} miles` : '';
    const msg = `${SHOP_NAME}: Your vehicle is due for ${rec.recommendation}${dueText}. Reply BOOK to schedule.`;
    const res = await sendSms(thread.phone, msg);
    await sb.from('service_reminders_sent').insert({
      customer_id: rec.customer_id,
      reminder_type: 'recommendation_due',
      reference_id: rec.id,
      phone: thread.phone,
      message: msg,
      status: res.ok ? 'sent' : 'failed',
      error: res.error,
    });
    if (res.ok) sent.push({ type: 'recommendation_due', id: rec.id }); else errors.push({ id: rec.id, error: res.error });
  }

  return new Response(JSON.stringify({ sent: sent.length, errors: errors.length, details: { sent, errors } }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
