// Hourly (pg_cron): estimate nudges (24h, 72h), invoice auto-send + reminders (day 3, day 7),
// and a review request 2h after payment. Email always; text only once the A2P campaign is approved.
import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@18.5.0';
import { sendAndLog } from '../_shared/send-and-log.ts';
import { sendSms } from '../_shared/booking-bot.ts';
import { smsAllowed } from '../_shared/missed-call.ts';
import { enrollSuffix } from '../_shared/enroll.ts';

const SITE = 'https://mikesmautorepair.com';
const H = 3600000, D = 24 * H;
const BATCH = 25;
const money = (n: unknown) => `$${Number(n || 0).toFixed(2)}`;
const first = (n?: string | null) => (n || '').trim().split(/\s+/)[0] || '';

Deno.serve(async () => {
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const now = new Date();

  // Quiet hours: only reach out 9am–7pm Eastern.
  const etHour = Number(now.toLocaleString('en-US', { timeZone: 'America/New_York', hour: 'numeric', hour12: false }));
  if (etHour < 9 || etHour >= 19) return Response.json({ skipped: 'quiet hours' });

  const { data: lease } = await sb.from('followup_worker_state')
    .update({ lease_until: new Date(now.getTime() + 10 * 60000).toISOString() })
    .eq('id', 1).or(`lease_until.is.null,lease_until.lt.${now.toISOString()}`).select('id');
  if (!lease?.length) return Response.json({ skipped: 'already running' });

  const textsOk = await smsAllowed();
  const out = { estimates: 0, invoices: 0, reminders: 0, reviews: 0, errors: [] as string[] };
  const profile = async (id: string) =>
    (await sb.from('profiles').select('full_name,email,phone').eq('id', id).maybeSingle()).data as { full_name?: string; email?: string; phone?: string } | null;

  try {
    // 1) Estimate follow-ups
    const { data: ests } = await sb.from('estimates')
      .select('id,customer_id,estimate_number,total,approval_token,sent_at,followup_count,customer_phone')
      .eq('status', 'sent').lt('followup_count', 2).not('sent_at', 'is', null)
      .lte('sent_at', new Date(now.getTime() - D).toISOString()).order('sent_at').limit(BATCH);
    for (const e of ests || []) {
      const step = e.followup_count + 1;
      const due = new Date(e.sent_at).getTime() + (step === 1 ? D : 3 * D);
      if (now.getTime() < due) continue;
      const p = await profile(e.customer_id);
      const url = `${SITE}/estimate/${e.approval_token}`;
      const final = step === 2;
      // One channel per nudge: text when possible, otherwise email.
      const phone = p?.phone || e.customer_phone;
      if (textsOk && phone) {
        const hi = first(p?.full_name) ? `Hi ${first(p?.full_name)}, ` : 'Hi, ';
        const enr = await enrollSuffix(sb, e.customer_id);
        await sendSms(sb, phone, (final
          ? `${hi}this is Mike's Mobile Auto Repair checking in one last time on your estimate (${money(e.total)}). Approve it here and we'll book the earliest open time: ${url} Reply STOP to opt out.`
          : `${hi}this is Mike's Mobile Auto Repair. Your estimate (${money(e.total)}) is ready whenever you are. Approve all or part of it here: ${url} Reply STOP to opt out.`) + enr);
      } else if (p?.email) {
        await sendAndLog({ templateName: 'estimate-reminder', recipientEmail: p.email, idempotencyKey: `estimate-reminder-${e.id}-${step}`,
          templateData: { customerName: first(p.full_name), estimateNumber: e.estimate_number, total: money(e.total), approvalUrl: url, final } });
      }
      await sb.from('estimates').update({ followup_count: step, followup_last_at: now.toISOString() }).eq('id', e.id);
      out.estimates++;
    }

    // 1b) At appointment time: turn the approved estimate into an invoice so it is sent below
    //      and is paid/acknowledged by the time the repair is done.
    const { data: appts } = await sb.from('appointments').select('id')
      .not('status', 'in', '(cancelled,canceled,completed,no_show,declined)')
      .gte('scheduled_at', new Date(now.getTime() - 12 * 3600000).toISOString())
      .lte('scheduled_at', new Date(now.getTime() + 45 * 60000).toISOString())
      .limit(BATCH);
    for (const a of appts || []) {
      const { error } = await sb.rpc('create_invoice_for_appointment', { _appointment_id: a.id });
      if (error) out.errors.push(`appt invoice ${a.id}: ${error.message}`);
    }

    // 2) Invoices: send when created, then remind on day 3 and day 7
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: '2025-08-27.basil' }) : null;
    const payLink = async (inv: any, email?: string) => {
      if (!stripe) return `${SITE}/portal/invoices/${inv.id}`;
      const dueAmt = Number(inv.total) - Number(inv.amount_paid || 0);
      const s = await stripe.checkout.sessions.create({
        mode: 'payment', payment_method_types: ['card'], customer_email: email || undefined,
        line_items: [{ price_data: { currency: 'usd', product_data: { name: inv.invoice_number || 'Invoice' }, unit_amount: Math.round(dueAmt * 100) }, quantity: 1 }],
        success_url: `${SITE}/portal/invoices?paid=1`, cancel_url: `${SITE}/portal/invoices`,
        metadata: { invoice_id: inv.id, customer_id: inv.customer_id, source: 'auto_followup' },
      });
      await sb.from('invoices').update({ stripe_session_id: s.id }).eq('id', inv.id);
      return s.url!;
    };
    const { data: invs } = await sb.from('invoices')
      .select('id,customer_id,invoice_number,total,amount_paid,status,auto_sent_at,reminder_count')
      .not('status', 'in', '(paid,void,draft)').lt('reminder_count', 2).order('created_at').limit(BATCH);
    for (const inv of invs || []) {
      const dueAmt = Number(inv.total) - Number(inv.amount_paid || 0);
      if (dueAmt <= 0) continue;
      let kind: 'send' | 'remind' | null = null;
      if (!inv.auto_sent_at) kind = 'send';
      else {
        const wait = inv.reminder_count === 0 ? 3 * D : 7 * D;
        if (now.getTime() >= new Date(inv.auto_sent_at).getTime() + wait) kind = 'remind';
      }
      if (!kind) continue;
      const p = await profile(inv.customer_id);
      if (!p?.email && !(textsOk && p?.phone)) continue;
      let url: string;
      try { url = await payLink(inv, p?.email); } catch (err) { out.errors.push(`pay link ${inv.id}: ${err}`); continue; }
      const reminder = kind === 'remind';
      const step = reminder ? inv.reminder_count + 1 : 0;
      if (textsOk && p?.phone) {
        const hi = first(p.full_name) ? `Hi ${first(p.full_name)}, ` : 'Hi, ';
        const enr = await enrollSuffix(sb, inv.customer_id);
        await sendSms(sb, p.phone, (reminder
          ? `${hi}friendly reminder from Mike's Mobile Auto Repair: your invoice for ${money(dueAmt)} is still open. Pay securely here: ${url} Reply STOP to opt out.`
          : `${hi}thanks for choosing Mike's Mobile Auto Repair! Your invoice for ${money(dueAmt)} is ready. Pay securely here: ${url} Reply STOP to opt out.`) + enr);
      } else if (p?.email) {
        await sendAndLog({ templateName: 'invoice-reminder', recipientEmail: p.email, idempotencyKey: `invoice-auto-${inv.id}-${step}`,
          templateData: { customerName: first(p.full_name), invoiceNumber: inv.invoice_number, amountDue: money(dueAmt), payUrl: url, reminder } });
      }
      await sb.from('invoices').update(reminder
        ? { reminder_count: step, reminder_last_at: now.toISOString() }
        : { auto_sent_at: now.toISOString() }).eq('id', inv.id);
      reminder ? out.reminders++ : out.invoices++;
    }

    // 3) Review request 2h after payment, at most once per customer every 90 days
    const { data: paid } = await sb.from('invoices').select('id,customer_id,paid_at')
      .eq('status', 'paid').is('review_requested_at', null).not('paid_at', 'is', null)
      .lte('paid_at', new Date(now.getTime() - 2 * H).toISOString()).limit(BATCH);
    for (const inv of paid || []) {
      const { count } = await sb.from('invoices').select('id', { count: 'exact', head: true })
        .eq('customer_id', inv.customer_id).gte('review_requested_at', new Date(now.getTime() - 90 * D).toISOString());
      if (!count) {
        const p = await profile(inv.customer_id);
        if (p?.email) await sendAndLog({ templateName: 'review-request', recipientEmail: p.email, idempotencyKey: `review-request-${inv.id}`, templateData: { customerName: first(p.full_name) } });
        if (textsOk && p?.phone) {
          const hi = first(p.full_name) ? `Hi ${first(p.full_name)}, ` : 'Hi, ';
          await sendSms(sb, p.phone, `${hi}thanks again for choosing Mike's Mobile Auto Repair! If we did a good job, would you rate your service? It takes 10 seconds: ${SITE}/review Reply STOP to opt out.`);
        }
        out.reviews++;
      }
      await sb.from('invoices').update({ review_requested_at: now.toISOString() }).eq('id', inv.id);
    }
  } catch (err) {
    console.error(err); out.errors.push(String(err));
  } finally {
    await sb.from('followup_worker_state').update({ lease_until: null, last_run_at: now.toISOString() }).eq('id', 1);
  }
  console.log(JSON.stringify(out));
  return Response.json(out);
});
