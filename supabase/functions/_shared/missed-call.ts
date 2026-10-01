import { sendAndLog } from './send-and-log.ts';
// Missed-call follow-up: one text (and an email for account holders) per caller per 12 hours.
const TWILIO_GW = 'https://connector-gateway.lovable.dev/twilio';
const COOLDOWN_HOURS = 12;

// Carriers only allow business texts once the A2P campaign is approved. Sending earlier got the
// account suspended, so every automated text checks this first.
let smsCache: { ok: boolean; at: number } | null = null;
export async function smsAllowed(): Promise<boolean> {
  if (smsCache && Date.now() - smsCache.at < 10 * 60000) return smsCache.ok;
  const LK = Deno.env.get('LOVABLE_API_KEY'); const TK = Deno.env.get('TWILIO_API_KEY');
  if (!LK || !TK) return false;
  const h = { Authorization: `Bearer ${LK}`, 'X-Connection-Api-Key': TK };
  let ok = false;
  try {
    const svcs = await (await fetch(`${TWILIO_GW}/messaging/v1/Services`, { headers: h })).json();
    for (const svc of svcs.services || []) {
      const c = await (await fetch(`${TWILIO_GW}/messaging/v1/Services/${svc.sid}/Compliance/Usa2p`, { headers: h })).json();
      if ((c.compliance || []).some((x: any) => x.campaign_status === 'VERIFIED')) { ok = true; break; }
    }
  } catch (e) { console.error('a2p check failed', e); }
  smsCache = { ok, at: Date.now() };
  return ok;
}

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
  const canText = await smsAllowed();
  if (!canText) err = 'Texting paused until carrier campaign is approved';
  else if (LK && TK && FROM) {
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
      try {
        const r = await sendAndLog({
          templateName: 'missed-call-followup',
          recipientEmail: prof.email,
          idempotencyKey: `missed-call-${digits}-${new Date().toISOString().slice(0, 13)}`,
          templateData: { customerName: first },
        });
        if (r.error) console.error('missed-call email failed', r.error.message);
      } catch (e) { console.error('missed-call email failed', e); }
    }
  }

  await sb.from('service_reminders_sent').insert({
    customer_id: prof?.id ?? null, reminder_type: 'missed_call', phone: to,
    message: body, status: err ? 'failed' : 'sent', error: err,
  });
}
