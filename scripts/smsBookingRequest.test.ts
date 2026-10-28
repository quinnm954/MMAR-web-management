import { expect, test } from 'bun:test';
import { checkedTextSlot, saveTextBookingRequest, resolvedTextBooking, missingTextContact, deferKnownCustomerDetails } from '../supabase/functions/_shared/sms-booking-request';
import { receptionistSlots } from '../supabase/functions/_shared/receptionist-times';

const days = receptionistSlots([{ date: '2099-01-05', slots: [720, 750, 1020] }, { date: '2026-10-30', slots: [600, 720] }]);
test('returning customer with saved name is asked only for a missing address', () => {
  expect(missingTextContact(resolvedTextBooking({}, { full_name: 'David Case' }))).toEqual(['service address']);
});
test('returning customer with saved contact details needs neither question', () => {
  expect(missingTextContact(resolvedTextBooking({}, { full_name: 'David Case', address_line1: '123 Test Street' }))).toEqual([]);
});
test('Mike already knows defers intake for a previous customer, not an unknown number', () => {
  expect(deferKnownCustomerDetails('He knows it', true)).toBe(true);
  expect(deferKnownCustomerDetails('He knows it', false)).toBe(false);
  expect(deferKnownCustomerDetails('Yes, Monday noon will be perfect', true)).toBe(false);
});
test('resolved saved request retains known contact details omitted by AI', async () => {
  const sb = client([{ id: 'request-1', customer_phone: '(555) 555-0101', customer_name: 'David Case', service_address: '123 Test Street' }]);
  const saved = await saveTextBookingRequest(sb, '+15555550101', { description: 'Vacuum pump replacement' }, null);
  expect(missingTextContact(saved)).toEqual([]);
  expect(sb.writes[0].payload.customer_name).toBe('David Case');
  expect(sb.writes[0].payload.service_address).toBe('123 Test Street');
});
test('accepted noon request uses the checked date and time', () => {
  expect(checkedTextSlot({ date: '2099-01-05', time: '12:00', accepted: true }, days))
    .toEqual({ date: '2099-01-05', time: '12:00', accepted: true });
});
test('unrequested morning cannot become a text booking request', () => {
  expect(checkedTextSlot({ date: '2026-10-30', time: '10:00', accepted: true }, days)).toBeNull();
});
test('blocked or failed availability cannot become a text booking request', () => {
  expect(checkedTextSlot({ date: '2099-01-05', time: '13:00', accepted: true }, days)).toBeNull();
  expect(checkedTextSlot({ date: '2099-01-05', time: '12:00', accepted: true }, [])).toBeNull();
});
function client(existing: any[] = [], failure = false) {
  const writes: { table: string; operation: string; payload: any }[] = [];
  const notices: any[] = [];
  return { writes, notices, from(table: string) {
    const query: any = { then(resolve: any) { return Promise.resolve({ data: existing, error: failure ? { message: 'failed' } : null }).then(resolve); } };
    for (const method of ['select', 'gte', 'in', 'order', 'eq']) query[method] = () => query;
    for (const operation of ['insert', 'update']) query[operation] = (payload: any) => {
      writes.push({ table, operation, payload }); return query;
    };
    return query;
  }, async rpc(name: string, payload: any) { notices.push({ name, payload }); return { error: null }; } };
}
test('chosen date/time is saved as new pending request, never an appointment', async () => {
  const sb = client();
  await saveTextBookingRequest(sb, '+15555550101', { description: 'Battery replacement', vehicle_info: '2020 Chevrolet Traverse' },
    { date: '2099-01-05', time: '12:00', accepted: true });
  expect(sb.writes).toHaveLength(1);
  expect(sb.writes[0].table).toBe('booking_requests');
  expect(sb.writes[0].payload).toMatchObject({ requested_date: '2099-01-05', requested_time_window: '12:00 PM', status: 'new', bot_status: 'handoff' });
  expect(sb.notices).toHaveLength(1);
});
test('existing pending request receives the chosen time rather than suppressing the save', async () => {
  const sb = client([{ id: 'request-1', customer_phone: '(555) 555-0101', notes: 'Existing note' }]);
  await saveTextBookingRequest(sb, '+15555550101', { description: 'Battery replacement' },
    { date: '2099-01-05', time: '12:30', accepted: true });
  expect(sb.writes[0].operation).toBe('update');
  expect(sb.writes[0].payload.requested_time_window).toBe('12:30 PM');
  expect(sb.writes[0].payload.notes).toContain('Existing note');
});
test('offering tomorrow at noon does not save a selected time without customer acceptance', async () => {
  const sb = client();
  await saveTextBookingRequest(sb, '+15555550101', { description: 'Battery replacement', preferred_day: 'tomorrow' },
    { date: '2099-01-05', time: '12:00', accepted: false });
  expect(sb.writes[0].payload.requested_date).toBeUndefined();
  expect(sb.notices).toHaveLength(0);
});
test('failed request lookup does not insert a duplicate or claim success', async () => {
  const sb = client([], true);
  await expect(saveTextBookingRequest(sb, '+15555550101', { description: 'Battery replacement' }, null)).rejects.toThrow();
  expect(sb.writes).toHaveLength(0);
});