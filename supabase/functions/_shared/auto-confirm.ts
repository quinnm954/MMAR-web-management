// Auto-confirm a booking request once the customer has accepted the price.
// Puts it on the calendar and leaves a DRAFT estimate for staff to review and send.
import { buildLaborQuote, createDraftEstimate } from './labor-quote.ts';

const d10 = (p?: string | null) => (p || '').replace(/\D/g, '').slice(-10);

async function ensureCustomer(sb: any, req: any): Promise<string | null> {
  const email = (req.customer_email || '').trim().toLowerCase();
  const phone = d10(req.customer_phone);
  let prof: any = null;
  if (email) prof = (await sb.from('profiles').select('id, email, phone').ilike('email', email).limit(1)).data?.[0];
  if (!prof && phone.length === 10) prof = ((await sb.from('profiles').select('id, email, phone').ilike('phone', `%${phone.slice(-4)}%`).limit(50)).data || []).find((p: any) => d10(p.phone) === phone);
  if (!prof && (email || phone.length === 10)) {
    const { data: c, error } = await sb.auth.admin.createUser(email
      ? { email, email_confirm: true, user_metadata: { full_name: req.customer_name || '', phone: req.customer_phone || '', source: 'auto_confirm' } }
      : { phone: `+1${phone}`, phone_confirm: true, user_metadata: { full_name: req.customer_name || '', phone: req.customer_phone || '', source: 'auto_confirm', needs_enrollment: true } });
    if (error) { console.error('auto-confirm user', error); return null; }
    await sb.from('profiles').upsert({ id: c.user.id, email: email || null, full_name: req.customer_name || null, phone: req.customer_phone || null });
    prof = { id: c.user.id, email: email || null, phone: req.customer_phone };
  }
  if (!prof) return null;
  // Make the confirm step find this exact profile.
  await sb.from('booking_requests').update(prof.email ? { customer_email: prof.email } : { customer_phone: prof.phone }).eq('id', req.id);
  return prof.id;
}

export async function autoConfirmBooking(sb: any, bookingId: string, date: string, time: string) {
  const { data: req } = await sb.from('booking_requests').select('*').eq('id', bookingId).maybeSingle();
  if (!req) return { ok: false, error: 'not found' };
  const customerId = await ensureCustomer(sb, req);
  if (!customerId) return { ok: false, error: 'no customer' };
  const { data: r, error } = await sb.rpc('bot_confirm_booking_request', { _id: bookingId, _date: date, _time: time });
  if (error) { console.error('auto-confirm rpc', error); return { ok: false, error: error.message }; }
  const apptId = r?.appointment_id as string;
  let estimateId: string | null = null;
  try {
    const { data: ex } = await sb.from('estimates').select('id').eq('appointment_id', apptId).limit(1);
    estimateId = ex?.[0]?.id ?? null;
    if (!estimateId) {
      const { data: fresh } = await sb.from('booking_requests').select('*').eq('id', bookingId).maybeSingle();
      const q = await buildLaborQuote(sb, fresh || req);
      estimateId = await createDraftEstimate(sb, fresh || req, q, { appointmentId: apptId, customerId });
    }
  } catch (e) { console.error('auto-confirm estimate', e); }
  try { await sb.rpc('_notify_staff_customer_action', {
    _title: 'Booking auto-confirmed — check estimate',
    _body: `${req.customer_name || 'Customer'} is booked ${date} ${time}. Review the draft estimate and press Send.`,
    _link: '/admin/dashboard?tab=estimates',
  }); } catch (e) { console.error('notify', e); }
  return { ok: true, appointmentId: apptId, estimateId };
}
