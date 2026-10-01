import { sendAndLog } from '../_shared/send-and-log.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

// Sends approved fleet outreach emails in small batches. Called hourly by pg_cron.
const BATCH = 5;
const FOLLOWUP_DAYS = [4, 6]; // step1 -> +4d, step2 -> +6d (day 10)
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const url = Deno.env.get('SUPABASE_URL')!;
  const srk = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const sb = createClient(url, srk);

  const { data: st } = await sb.from('prospect_email_state').select('*').eq('id', 1).single();
  if (!st || st.paused) return json({ skipped: 'paused' });
  if (!st.mailing_address) return json({ skipped: 'no mailing address' });

  // single-flight lease
  const now = new Date();
  const { data: lease } = await sb.from('prospect_email_state')
    .update({ lease_until: new Date(now.getTime() + 5 * 60000).toISOString() })
    .eq('id', 1).or(`lease_until.is.null,lease_until.lt.${now.toISOString()}`).select('id');
  if (!lease?.length) return json({ skipped: 'locked' });

  const today = now.toISOString().slice(0, 10);
  let sentToday = st.sent_day === today ? st.sent_today : 0;
  const room = Math.min(BATCH, st.daily_cap - sentToday);
  let sent = 0;
  try {
    if (room <= 0) return json({ skipped: 'daily cap' });
    const { data: due } = await sb.from('prospects').select('*')
      .eq('email_status', 'approved').eq('do_not_contact', false).not('email', 'is', null)
      .or(`next_email_at.is.null,next_email_at.lte.${now.toISOString()}`)
      .order('created_at').limit(room);

    for (const p of due || []) {
      if (/^(filler|noreply|no-reply|example|test|user|email|yourname|name)@|@(example\.|domain\.|godaddy\.com$|sentry|wixpress\.com$)/i.test(String(p.email))) {
        await sb.from('prospects').update({ email_status: 'done', notes: `${p.notes ? p.notes + '\n' : ''}Skipped placeholder email ${p.email}` }).eq('id', p.id);
        continue;
      }
      const { data: sup } = await sb.from('suppressed_emails').select('id').eq('email', p.email).maybeSingle();
      if (sup) { await sb.from('prospects').update({ email_status: 'done', do_not_contact: true, stage: 'do_not_contact' }).eq('id', p.id); continue; }
      const step = p.email_step + 1;
      const trade = String(p.category || 'service').toLowerCase();
      const subject = step === 1 ? (p.email_subject || 'Keeping your trucks on the road')
        : step === 2 ? `The real cost of a truck at the shop`
        : `A free 15-minute look at one of your vehicles?`;
      const bodyText = step === 1
        ? String(p.email_body || '').replaceAll('{{name}}', p.name)
        : step === 2
        ? `Hi ${p.name} team,\n\nQuick follow-up. When a work truck goes to a repair shop, it's rarely just the repair bill. It's the drive over, the wait, and often two of your crew sitting in a waiting room instead of on a ${trade} job.\n\nWe come to your lot instead, so your people keep working while we handle the vehicle.\n\nWorth a quick call?\n\n— Mike, Mike's Mobile Auto Repair`
        : `Hi ${p.name} team,\n\nLast note from me. If it's easier, I can stop by your yard and take a 15-minute look at one truck or van, no commitment. You'll see exactly how mobile service works for your fleet.\n\nJust reply with a good day, or call/text 813-501-7572.\n\n— Mike, Mike's Mobile Auto Repair`;

      const r = await sendAndLog({
        templateName: 'fleet-outreach', recipientEmail: p.email,
        // "m2": earlier keys were burned by sends that failed before the domain was verified.
        idempotencyKey: `prospect-${p.id}-${step}-m2`,
        templateData: { subject, body: bodyText, step, mailingAddress: st.mailing_address },
      });
      if (r.status === 402 || r.status === 403 || r.status === 429) {
        await sb.from('prospect_email_state').update({ paused: true, pause_reason: `Email service returned ${r.status}: ${(r.error?.message ?? '').slice(0, 300)}` }).eq('id', 1);
        break;
      }
      if (r.error) { console.error('send failed', r.status, r.error.message); continue; }
      if (!r.sent) continue;
      await sb.from('prospect_touches').upsert({ prospect_id: p.id, channel: 'email', step, body: bodyText, outcome: 'sent' }, { onConflict: 'prospect_id,channel,step' });
      const next = step < 3 ? new Date(now.getTime() + FOLLOWUP_DAYS[step - 1] * 86400000).toISOString() : null;
      await sb.from('prospects').update({
        email_step: step, email_status: step < 3 ? 'approved' : 'done', next_email_at: next,
        last_contacted_at: now.toISOString(), stage: p.stage === 'new' ? 'contacted' : p.stage,
      }).eq('id', p.id);
      sent++; sentToday++;
    }
    return json({ ok: true, sent });
  } finally {
    await sb.from('prospect_email_state').update({ lease_until: null, sent_today: sentToday, sent_day: today }).eq('id', 1);
  }
});
