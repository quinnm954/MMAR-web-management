import { expect, test } from 'bun:test';
import { existingCustomerWork, recordRepairCheckIn } from '../supabase/functions/_shared/existing-repair';

function client(rows: Record<string, any[]>) {
  const writes: any[] = [];
  return { writes, from(table: string) {
    let data = rows[table] || [];
    const q: any = { then(resolve: any) { return Promise.resolve({ data, error: null }).then(resolve); } };
    q.select = q.order = q.ilike = () => q;
    q.eq = (key: string, value: any) => { data = data.filter(r => r[key] === value); return q; };
    q.in = (key: string, values: any[]) => { data = data.filter(r => values.includes(r[key])); return q; };
    q.not = (key: string, _: string, value: string) => { data = data.filter(r => !value.includes(r[key])); return q; };
    q.update = (payload: any) => { writes.push({ table, payload }); return q; };
    return q;
  }, async rpc() { return { error: null }; } };
}

test('pending requests older than three days are reused on check-ins', async () => {
  const sb = client({ booking_requests: [{ id: 'old-request', status: 'contacted', customer_phone: '(239) 555-0198', created_at: '2020-01-01' }] });
  expect((await existingCustomerWork(sb, '+12395550198')).request?.id).toBe('old-request');
});

test('converted requests resolve the existing open repair order, not another request', async () => {
  const sb = client({ booking_requests: [{ status: 'converted', customer_phone: '+12395550198', converted_appointment_id: 'repair-1' }],
    appointments: [{ id: 'repair-1', status: 'in_progress', technician_notes: 'Existing shop note' }] });
  const work = await existingCustomerWork(sb, '+12395550198');
  expect(work.request).toBeNull();
  await recordRepairCheckIn(sb, work.orders, 'My engine is a 3.3L V6');
  expect(sb.writes).toEqual([{ table: 'appointments', payload: { technician_notes: 'Existing shop note\nCustomer check-in: My engine is a 3.3L V6' } }]);
});

test('completed repairs do not block a later new request', async () => {
  const sb = client({ profiles: [{ id: 'customer', phone: '+12395550198' }], appointments: [{ id: 'done', customer_id: 'customer', status: 'completed' }] });
  expect((await existingCustomerWork(sb, '+12395550198')).orders).toEqual([]);
});

test('several open orders never receive an arbitrary vehicle update', async () => {
  const sb = client({});
  expect(await recordRepairCheckIn(sb, [{ id: 'one' }, { id: 'two' }], 'Checking on my repair')).toBe(true);
  expect(sb.writes).toEqual([]);
});

test('repeated identical check-ins do not duplicate repair notes', async () => {
  const sb = client({});
  await recordRepairCheckIn(sb, [{ id: 'one', technician_notes: 'Customer check-in: Any update?' }], 'Any update?');
  expect(sb.writes).toEqual([]);
});