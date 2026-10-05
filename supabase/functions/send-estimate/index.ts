// Staff-only: notify a customer their estimate is ready. Text once A2P texting is approved, email until then.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, json, requireStaff } from '../_shared/staff-auth.ts';
import { sendAndLog } from '../_shared/send-and-log.ts';
import { smsAllowed } from '../_shared/missed-call.ts';
import { sendSms } from '../_shared/booking-bot.ts';
import { enrollSuffix } from '../_shared/enroll.ts';

const SITE = 'https://mikesmautorepair.com';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const auth = await requireStaff(req);
  if (auth instanceof Response) return auth;
  try {
    const { id } = await req.json().catch(() => ({}));
    if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id)) return json({ error: 'Invalid id' }, 400);
    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: est } = await sb.from('estimates').select('id, estimate_number, approval_token, total, customer_id, customer_phone').eq('id', id).maybeSingle();
    if (!est) return json({ error: 'Not found' }, 404);
    const { data: p } = await sb.from('profiles').select('full_name, email, phone').eq('id', est.customer_id).maybeSingle();
    const first = (p?.full_name || '').split(' ')[0];
    const phone = (est.customer_phone || p?.phone || '').replace(/\D/g, '').slice(-10);
    const email = (p?.email || '').trim().toLowerCase();
    const url = `${SITE}/estimate/${est.approval_token}`;
    const total = `$${Number(est.total || 0).toFixed(2)}`;
    if (phone.length === 10 && await smsAllowed().catch(() => false)) {
      await sendSms(sb, phone, `${first ? `${first}, your` : 'Your'} estimate from Mike's Mobile Auto Repair is ready (${total}): ${url}${await enrollSuffix(sb, est.customer_id)}`);
      return json({ ok: true, via: 'sms' });
    }
    if (!email) return json({ ok: true, via: 'none' });
    const { data: link } = await sb.auth.admin.generateLink({ type: 'magiclink', email, options: { redirectTo: `${SITE}/portal/estimates` } }).catch(() => ({ data: null }));
    const r = await sendAndLog({
      templateName: 'estimate-ready', recipientEmail: email, idempotencyKey: `estimate-sent-${est.id}-${Date.now()}`,
      templateData: { name: first || undefined, estimateNumber: est.estimate_number || '', total, approvalUrl: url, accountUrl: link?.properties?.action_link || `${SITE}/login` },
      metadata: { estimate_id: est.id },
    });
    if (r.error) return json({ error: r.error.message }, 502);
    return json({ ok: true, via: 'email' });
  } catch (e) {
    console.error(e);
    return json({ error: String(e) }, 500);
  }
});
