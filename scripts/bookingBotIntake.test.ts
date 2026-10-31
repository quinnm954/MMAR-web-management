import { expect, test } from 'bun:test';
import { handleBotReply } from '../supabase/functions/_shared/booking-bot';
test('active request missing vehicle and address falls through to inbound text intake', async () => {
  const records = [{ id: 'prospect', customer_phone: '+15555550103', customer_name: 'Alex Rivera', bot_status: 'active' }];
  const sb = { from() {
    const query: any = { then(resolve: any) { return Promise.resolve({ data: records, error: null }).then(resolve); } };
    for (const method of ['select', 'eq', 'gte', 'order']) query[method] = () => query;
    return query;
  } };
  expect(await handleBotReply(sb, '+15555550103', 'Monday works')).toBe(false);
});