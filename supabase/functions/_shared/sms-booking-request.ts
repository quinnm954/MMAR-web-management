import { hhmm, label12 } from './booking-bot.ts';

export type TextSlot = { date: string; time: string; accepted: boolean };
export type TextBooking = {
  customer_name?: string; vehicle_info?: string; description?: string;
  service_address?: string; preferred_day?: string;
};
export type OpenDay = { date: string; slots: number[] };

export function checkedTextSlot(value: unknown, days: OpenDay[]): TextSlot | null {
  if (!value || typeof value !== 'object') return null;
  const slot = value as Record<string, unknown>;
  if (typeof slot.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(slot.date) ||
      typeof slot.time !== 'string' || !/^\d{2}:\d{2}$/.test(slot.time) || typeof slot.accepted !== 'boolean') return null;
  const day = days.find(d => d.date === slot.date);
  if (!day?.slots.some(m => hhmm(m) === slot.time)) return null;
  return { date: slot.date, time: slot.time, accepted: slot.accepted };
}

// Only intake rows are written here; appointments remain exclusively staff-approved.
export async function saveTextBookingRequest(sb: any, phone: string, booking: TextBooking, slot: TextSlot | null,
  profile?: { full_name?: string; email?: string; address_line1?: string; address_line2?: string }) {
  const { data: requests, error: lookupError } = await sb.from('booking_requests')
    .select('id, customer_phone, notes').gte('created_at', new Date(Date.now() - 3 * 86400_000).toISOString())
    .in('status', ['new', 'contacted']).order('created_at', { ascending: false });
  if (lookupError) throw new Error('Could not check existing text requests');
  const key = phone.replace(/\D/g, '').slice(-10);
  const existing = (requests || []).find((r: any) => String(r.customer_phone || '').replace(/\D/g, '').slice(-10) === key);
  const chosen = slot?.accepted ? slot : null;
  const payload = {
    customer_name: String(booking.customer_name || profile?.full_name || 'Text customer').slice(0, 200),
    customer_phone: phone, customer_email: profile?.email || null,
    vehicle_info: booking.vehicle_info ? String(booking.vehicle_info).slice(0, 200) : null,
    description: String(booking.description || '').slice(0, 2000),
    service_address: booking.service_address ? String(booking.service_address).slice(0, 300) :
      ([profile?.address_line1, profile?.address_line2].filter(Boolean).join(', ') || null),
    ...(chosen ? { requested_date: chosen.date, requested_time_window: label12(Number(chosen.time.slice(0, 2)) * 60 + Number(chosen.time.slice(3))) } : {}),
    bot_status: 'handoff',
    notes: [existing?.notes, 'Requested through AI text receptionist; pending Mike’s approval',
      booking.preferred_day && `Preferred day: ${String(booking.preferred_day).slice(0, 200)}`].filter(Boolean).join('\n'),
  };
  const result = existing
    ? await sb.from('booking_requests').update(payload).eq('id', existing.id)
    : await sb.from('booking_requests').insert({ ...payload, status: 'new', service_type: 'General Repair', source: 'ai_phone' });
  if (result.error) throw new Error('Could not save text booking request');
  if (chosen) await sb.rpc('_notify_staff_customer_action', {
    _title: 'Booking needs your OK',
    _body: `${payload.customer_name} requests ${chosen.date} at ${payload.requested_time_window}. Review and confirm the time.`,
    _link: '/admin/dashboard?tab=bookings',
  });
}