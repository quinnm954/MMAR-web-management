import { hhmm, label12 } from './booking-bot.ts';

export type TextSlot = { date: string; time: string; accepted: boolean };
export type TextBooking = {
  customer_name?: string; vehicle_info?: string; description?: string;
  service_address?: string; preferred_day?: string;
};
export type OpenDay = { date: string; slots: number[] };

type CustomerDetails = { full_name?: string; email?: string; address_line1?: string; address_line2?: string };

export function resolvedTextBooking(booking: TextBooking, profile?: CustomerDetails, existing?: TextBooking): TextBooking {
  const known = (value?: string) => value?.trim() || '';
  return {
    customer_name: known(booking.customer_name) || known(profile?.full_name) || known(existing?.customer_name),
    service_address: known(booking.service_address) || [profile?.address_line1, profile?.address_line2].filter(Boolean).join(', ') || known(existing?.service_address),
    vehicle_info: known(booking.vehicle_info) || known(existing?.vehicle_info),
    description: known(booking.description) || known(existing?.description),
    preferred_day: booking.preferred_day,
  };
}

export function missingTextContact(booking: TextBooking): ('name' | 'service address')[] {
  return [!booking.customer_name?.trim() && 'name', !booking.service_address?.trim() && 'service address'].filter(Boolean) as ('name' | 'service address')[];
}

export function deferKnownCustomerDetails(text: string, savedCustomer: boolean): boolean {
  return savedCustomer && /\b(?:he|mike|you)\s+(?:already\s+)?know(?:s)?\b|\bon file\b|\bsame (?:address|place|location)\b|\b(?:ya sabe|ya lo sabe|misma direcci[oó]n)\b/i.test(text);
}

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
  profile?: CustomerDetails) {
  const { data: requests, error: lookupError } = await sb.from('booking_requests')
    .select('id, customer_phone, customer_name, customer_email, vehicle_info, description, service_address, notes').gte('created_at', new Date(Date.now() - 3 * 86400_000).toISOString())
    .in('status', ['new', 'contacted']).order('created_at', { ascending: false });
  if (lookupError) throw new Error('Could not check existing text requests');
  const key = phone.replace(/\D/g, '').slice(-10);
  const existing = (requests || []).find((r: any) => String(r.customer_phone || '').replace(/\D/g, '').slice(-10) === key);
  const resolved = resolvedTextBooking(booking, profile, existing);
  const chosen = slot?.accepted ? slot : null;
  const payload = {
    customer_name: String(resolved.customer_name || 'Text customer').slice(0, 200),
    customer_phone: phone, customer_email: profile?.email || existing?.customer_email || null,
    vehicle_info: String(resolved.vehicle_info || '').slice(0, 200) || null,
    description: String(resolved.description || '').slice(0, 2000),
    service_address: resolved.service_address?.slice(0, 300) || null,
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
  return resolved;
}