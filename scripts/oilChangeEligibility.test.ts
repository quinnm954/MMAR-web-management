import { expect, test } from 'bun:test';
import { isOilChange, oilChangeBlocked, hasOilChangeMembership } from '../supabase/functions/_shared/oil-change-eligibility';
import { startBot, handleBotReply } from '../supabase/functions/_shared/booking-bot';

const req = { id: 'test', customer_phone: '+12397899190', customer_name: 'Test', service_type: 'Mobile Oil Change', description: '', bot_history: [] };
function client(eligible = false) {
  const writes: any[] = [];
  const reads: string[] = [];
  return { writes, reads,
    async rpc(name: string) { return { data: name === 'oil_change_eligible' ? eligible : null, error: null }; },
    from(table: string) {
      reads.push(table);
      const query: any = { then(resolve: any) { return Promise.resolve({ data: [req] }).then(resolve); }, maybeSingle: async () => ({ data: req }) };
      for (const method of ['eq', 'is', 'gte', 'select', 'order']) query[method] = () => query;
      query.update = (value: any) => { writes.push(value); return query; };
      return query;
    },
  };
}

test('mobile oil changes require an active subscription', async () => {
  expect(await oilChangeBlocked(client(false), req)).toBe(true);
});
test('verified active subscribers may request oil changes', async () => {
  expect(await oilChangeBlocked(client(true), req)).toBe(false);
});
test('generic repair descriptions cannot bypass the oil-change rule', async () => {
  expect(await oilChangeBlocked(client(false), { ...req, service_type: 'General Repair', description: 'Needs oil and filter change' })).toBe(true);
});
test('incoming oil-change messages are checked before proposing a time', async () => {
  expect(await oilChangeBlocked(client(false), { ...req, service_type: 'Other' }, 'change the oil')).toBe(true);
});
test('Spanish oil-change requests require membership', () => {
  expect(isOilChange('Necesito un cambio de aceite')).toBe(true);
});
test('oil cooler and oil pan repairs remain available to nonmembers', async () => {
  expect(await oilChangeBlocked(client(false), { service_type: 'Transmission oil cooler replacement', description: 'oil pan gasket leaking' })).toBe(false);
});
test('membership lookup failure never allows an oil change', async () => {
  expect(await hasOilChangeMembership({ rpc: async () => ({ data: true, error: { message: 'unavailable' } }) }, req.customer_phone)).toBe(false);
});
test('website follow-up for nonmembers hands off without reading available times', async () => {
  const sb = client();
  expect(await startBot(sb, req.id)).toEqual({ started: false, membershipRequired: true });
  expect(sb.reads).not.toContain('appointments');
  expect(sb.writes).toContainEqual(expect.objectContaining({ bot_status: 'handoff', requested_date: null, requested_time_window: null }));
});
test('reply to an existing oil-change bot cannot request a slot without membership', async () => {
  const sb = client();
  expect(await handleBotReply(sb, req.customer_phone, 'Friday works')).toBe(true);
  expect(sb.reads).not.toContain('appointments');
  expect(sb.writes).toContainEqual(expect.objectContaining({ bot_status: 'handoff', requested_date: null, requested_time_window: null }));
});