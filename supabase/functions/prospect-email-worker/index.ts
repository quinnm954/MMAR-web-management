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
      const prefix = step === 1 ? '' : step === 2 ? 'Quick follow-up: ' : 'Last note: ';
      const bodyText = (step === 1 ? '' : 'Following up on my note below in case it got buried.\n\n') +
        String(p.email_body || '').replaceAll('{{name}}', p.name) +
        `\n\nMike's Mobile Auto Repair · ${st.mailing_address}`;

      const r = await fetch(`${url}/functions/v1/send-transactional-email`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${srk}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateName: 'fleet-outreach', recipientEmail: p.email,
          idempotencyKey: `prospect-${p.id}-${step}`,
          templateData: { subject: prefix + (p.email_subject || 'Keeping your trucks on the road'), body: bodyText },
        }),
      });
      if (r.status === 402 || r.status === 403 || r.status === 429) {
        await sb.from('prospect_email_state').update({ paused: true, pause_reason: `Email service returned ${r.status}: ${(await r.text()).slice(0, 300)}` }).eq('id', 1);
        break;
      }
      if (!r.ok) { console.error('send failed', r.status, await r.text()); continue; }
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
