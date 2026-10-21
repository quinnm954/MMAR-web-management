const TZ = 'America/New_York';
export function easternDate(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}
export function reminderDue(withdrawal: number, now: Date): boolean {
  if (!Number.isFinite(withdrawal) || withdrawal * 1000 <= now.getTime()) return false;
  const today = easternDate(now);
  const tomorrow = new Date(`${today}T12:00:00Z`);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  return easternDate(new Date(withdrawal * 1000)) === tomorrow.toISOString().slice(0, 10);
}

// Stripe owns charge timing. Never invent a fixed draft hour or change the subscription.
export async function sendFinancingReminders(sb: any, stripe: any, now: Date,
  send: (phone: string, text: string) => Promise<boolean>) {
  const result = { sent: 0, errors: [] as string[] };
  const { data: contracts, error } = await sb.from('financing_contracts')
    .select('id,customer_id,client_name,stripe_customer_id,status')
    .not('stripe_customer_id', 'is', null).limit(100);
  if (error) throw new Error(error.message);
  for (const c of contracts || []) {
    try {
      const { data: payments, error: paymentError } = await sb.from('financing_payments')
        .select('id,seq,due_date,amount,status,withdrawal_reminder_for_at')
        .eq('contract_id', c.id).in('status', ['scheduled', 'pending', 'failed', 'processing']).gt('seq', 0).order('seq');
      if (paymentError) throw new Error(paymentError.message);
      if (!payments?.length) continue;
      const [subscriptions, invoices] = await Promise.all([
        stripe.subscriptions.list({ customer: c.stripe_customer_id, limit: 100 }),
        stripe.invoices.list({ customer: c.stripe_customer_id, status: 'open', limit: 100 }),
      ]);
      const candidates: { at: number; payment: any; retry: boolean }[] = [];
      for (const sub of subscriptions.data) {
        if (sub.metadata?.contract_id !== c.id || !['active', 'past_due'].includes(sub.status) || sub.pause_collection || sub.collection_method !== 'charge_automatically') continue;
        const end = sub.items?.data?.[0]?.current_period_end ?? sub.current_period_end;
        if (!end || (sub.cancel_at && sub.cancel_at <= end)) continue;
        const payment = payments.find((p: any) => p.due_date === easternDate(new Date(end * 1000)));
        if (payment) candidates.push({ at: end, payment, retry: false });
      }
      for (const inv of invoices.data) {
        const subscriptionId = inv.parent?.subscription_details?.subscription ?? inv.subscription;
        const subId = typeof subscriptionId === 'string' ? subscriptionId : subscriptionId?.id;
        if (!subscriptions.data.some((s: any) => s.id === subId && s.metadata?.contract_id === c.id && !s.pause_collection)) continue;
        const at = inv.next_payment_attempt;
        const start = inv.lines?.data?.find((l: any) => l.parent?.subscription_item_details || l.type === 'subscription')?.period?.start;
        const payment = start ? payments.find((p: any) => p.due_date === easternDate(new Date(start * 1000))) : null;
        if (at && payment) candidates.push({ at, payment, retry: true });
      }
      const next = candidates.filter(x => x.at * 1000 > now.getTime()).sort((a, b) => a.at - b.at)[0];
      if (!next || !reminderDue(next.at, now)) continue;
      const scheduledAt = new Date(next.at * 1000).toISOString();
      if (next.payment.withdrawal_reminder_for_at && new Date(next.payment.withdrawal_reminder_for_at).getTime() === next.at * 1000) continue;
      const { data: profile, error: profileError } = await sb.from('profiles').select('phone,full_name').eq('id', c.customer_id).maybeSingle();
      if (profileError) throw new Error(profileError.message);
      if (!profile?.phone) continue;
      const date = new Date(next.at * 1000);
      const when = date.toLocaleString('en-US', { timeZone: TZ, weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
      const name = (profile.full_name || c.client_name || '').split(' ')[0];
      const text = `Hi ${name || 'there'}, Mike's Mobile Auto Repair reminder: your next automatic card ${next.retry ? 'payment retry' : 'withdrawal'} of $${Number(next.payment.amount).toFixed(2)} is scheduled for tomorrow, ${when}. Stripe processing may occur later; this is not a bank posting time. Please ensure funds are available. Reply STOP to opt out.`;
      if (!await send(profile.phone, text)) { result.errors.push(`financing reminder ${next.payment.id}: SMS not accepted`); continue; }
      const { error: saveError } = await sb.from('financing_payments').update({ withdrawal_reminder_for_at: scheduledAt, withdrawal_reminder_sent_at: now.toISOString() }).eq('id', next.payment.id);
      if (saveError) throw new Error(saveError.message);
      result.sent++;
    } catch (err) { result.errors.push(`financing ${c.id}: ${String(err)}`); }
  }
  return result;
}