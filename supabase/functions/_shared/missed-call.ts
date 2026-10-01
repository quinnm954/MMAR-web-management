// Missed-call follow-up: one text (and an email for account holders) per caller per 12 hours.
const TWILIO_GW = 'https://connector-gateway.lovable.dev/twilio';
const COOLDOWN_HOURS = 12;

const last10 = (p: string) => (p || '').replace(/\D/g, '').slice(-10);

export async function sendMissedCallFollowup(sb: any, caller: string, fromNumber?: string) {
  const digits = last10(caller);
  if (digits.length !== 10) return;
  const to = `+1${digits}`;

  const since = new Date(Date.now() - COOLDOWN_HOURS * 3600000).toISOString();
  const { data: recent } = await sb.from('service_reminders_sent').select('id')
    .eq('reminder_type', 'missed_call').eq('phone', to).gte('sent_at', since).limit(1);
  if (recent?.length) return;

  // Find an account by phone
  const { data: profs } = await sb.from('profiles').select('id, full_name, email, phone')
    .not('phone', 'is', null).ilike('phone', `%${digits.slice(-4)}%`).limit(200);
  const prof = (profs || []).find((p: any) => last10(p.phone) === digits) || null;
  const first = prof?.full_name?.split(' ')[0];

  const body = `MMAR: ${first ? `Hi ${first}, sorry` : 'Sorry'} we missed your call! Mike will follow up shortly. Reply here with what you need or book anytime: mikesmautorepair.com/book Reply STOP to opt out.`;
  let err: string | undefined;
  const LK = Deno.env.get('LOVABLE_API_KEY'); const TK = Deno.env.get('TWILIO_API_KEY');
  const FROM = fromNumber || Deno.env.get('TWILIO_FROM_NUMBER');
  if (LK && TK && FROM) {
    const r = await fetch(`${TWILIO_GW}/Messages.json`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${LK}`, 'X-Connection-Api-Key': TK, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ To: to, From: FROM, Body: body }),
    });
    const txt = await r.text();
    if (!r.ok) err = `twilio ${r.status}: ${txt.slice(0, 200)}`;
    else {
      try {
        let { data: thread } = await sb.from('sms_threads').select('id').eq('phone', to).maybeSingle();
        if (!thread) thread = (await sb.from('sms_threads').insert({ phone: to, customer_id: prof?.id ?? null, last_message_preview: body.slice(0, 80) }).select('id').single()).data;
        if (thread) {
          await sb.from('sms_messages').insert({ thread_id: thread.id, direction: 'outbound', body, twilio_sid: JSON.parse(txt)?.sid ?? null, status: 'sent' });
          await sb.from('sms_threads').update({ last_message_at: new Date().toISOString(), last_message_preview: body.slice(0, 80) }).eq('id', thread.id);
        }
      } catch (e) { console.error('sms mirror failed', e); }
    }
  } else err = 'Twilio not configured';

  // Email account holders who allow email
  if (prof?.email) {
    const { data: prefs } = await sb.from('notification_preferences').select('email_enabled').eq('user_id', prof.id).maybeSingle();
    if (prefs?.email_enabled !== false) {
      const url = Deno.env.get('SUPABASE_URL')!;
      const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      try {
        await fetch(`${url}/functions/v1/send-transactional-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}`, apikey: key },
          body: JSON.stringify({
            templateName: 'missed-call-followup',
            recipientEmail: prof.email,
            idempotencyKey: `missed-call-${digits}-${new Date().toISOString().slice(0, 13)}`,
            templateData: { customerName: first },
          }),
        });
      } catch (e) { console.error('missed-call email failed', e); }
    }
  }

  await sb.from('service_reminders_sent').insert({
    customer_id: prof?.id ?? null, reminder_type: 'missed_call', phone: to,
    message: body, status: err ? 'failed' : 'sent', error: err,
  });
}
