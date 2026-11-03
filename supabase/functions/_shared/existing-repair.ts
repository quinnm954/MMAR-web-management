const phoneKey = (value: string) => String(value || '').replace(/\D/g, '').slice(-10);

/** Look up open work before intake; a failed lookup must never create duplicate work. */
export async function existingCustomerWork(sb: any, phone: string, customerId?: string) {
  const key = phoneKey(phone);
  if (key.length !== 10) throw new Error('Invalid customer phone');
  const { data: requests, error } = await sb.from('booking_requests').select('*')
    .ilike('customer_phone', `%${key.slice(-4)}%`).order('created_at', { ascending: false });
  if (error) throw new Error('Could not check existing requests');
  const matched = (requests || []).filter((r: any) => phoneKey(r.customer_phone) === key);
  let id = customerId;
  if (!id) {
    const { data: profiles, error: profileError } = await sb.from('profiles').select('id, phone')
      .ilike('phone', `%${key.slice(-4)}%`);
    if (profileError) throw new Error('Could not check customer');
    id = (profiles || []).find((p: any) => phoneKey(p.phone) === key)?.id;
  }
  const linked = matched.map((r: any) => r.converted_appointment_id).filter(Boolean);
  const query = sb.from('appointments').select('id, status, technician_notes, service_type, scheduled_at, repair_order_number')
    .not('status', 'in', '(completed,cancelled,canceled,declined,no_show)');
  const { data: orders, error: orderError } = id ? await query.eq('customer_id', id)
    : linked.length ? await query.in('id', linked) : { data: [], error: null };
  if (orderError) throw new Error('Could not check open repair orders');
  return {
    orders: orders || [],
    request: matched.find((r: any) => !r.converted_appointment_id && ['new', 'contacted', 'confirmed'].includes(r.status)) || null,
  };
}

export async function recordRepairCheckIn(sb: any, orders: any[], text: string) {
  if (!orders.length) return false;
  const note = `Customer check-in: ${text.trim().slice(0, 2000)}`;
  // Several open jobs require Mike to choose; never attach a message to an arbitrary vehicle.
  if (orders.length === 1 && text.trim()) {
    const order = orders[0];
    if (!String(order.technician_notes || '').split('\n').includes(note)) {
      const { error } = await sb.from('appointments').update({
        technician_notes: [order.technician_notes, note].filter(Boolean).join('\n'),
      }).eq('id', order.id);
      if (error) throw new Error('Could not update existing repair order');
    }
  }
  await sb.rpc('_notify_staff_customer_action', {
    _title: 'Existing repair customer checked in', _body: text.slice(0, 300), _link: '/admin/phone',
  });
  return true;
}