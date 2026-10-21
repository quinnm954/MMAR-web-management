import { describe, expect, test } from 'bun:test';
import { reminderDue, sendFinancingReminders } from '../supabase/functions/_shared/financing-reminders';

const at = Date.parse('2026-10-26T13:00:00Z') / 1000;
const now = new Date('2026-10-25T13:15:00Z');
function fixture(sentAt: string | null = null, status = 'scheduled', accepted = true) {
  const payment = { id: 'p2', seq: 2, due_date: '2026-10-26', amount: 63.60, status, withdrawal_reminder_for_at: sentAt };
  const messages: string[] = [];
  const updates: any[] = [];
  const sb = { from(table: string) {
    let update: any = null;
    const query: any = {
      select() { return query; }, not() { return query; }, limit() { return query; },
      eq() { return query; }, in() { return query; }, gt() { return query; }, order() { return query; },
      update(value: any) { update = value; return query; },
      maybeSingle: async () => ({ data: { full_name: 'Jose Navas', phone: '+15555550123' }, error: null }),
      then(resolve: any) {
        if (update) { updates.push(update); return Promise.resolve({ error: null }).then(resolve); }
        return Promise.resolve({ data: table === 'financing_contracts'
          ? [{ id: 'c', customer_id: 'u', client_name: 'Jose Navas', status: 'active', stripe_customer_id: 'cus' }]
          : status === 'paid' ? [] : [payment], error: null }).then(resolve);
      },
    }; return query;
  } };
  const stripe = {
    subscriptions: { list: async () => ({ data: [{ id: 'sub', metadata: { contract_id: 'c' }, status: 'active', collection_method: 'charge_automatically', items: { data: [{ current_period_end: at }] } }] }) },
    invoices: { list: async () => ({ data: [] }) },
  };
  return { sb, stripe, messages, updates, send: async (_phone: string, text: string) => { messages.push(text); return accepted; } };
}
describe('day-before withdrawal reminders', () => {
  test('October 26 withdrawal is due for reminder October 25, not October 24 or 26', () => {
    expect(reminderDue(at, now)).toBe(true);
    expect(reminderDue(at, new Date('2026-10-24T13:15:00Z'))).toBe(false);
    expect(reminderDue(at, new Date('2026-10-26T12:15:00Z'))).toBe(false);
  });
  test('previous calendar day holds across Eastern daylight-saving change', () => {
    expect(reminderDue(Date.parse('2026-11-02T13:00:00Z') / 1000, new Date('2026-11-01T14:15:00Z'))).toBe(true);
  });
  test('successful reminder records the Stripe withdrawal timestamp', async () => {
    const f = fixture();
    expect((await sendFinancingReminders(f.sb, f.stripe, now, f.send)).sent).toBe(1);
    expect(f.updates[0].withdrawal_reminder_for_at).toBe('2026-10-26T13:00:00.000Z');
  });
  test('same withdrawal is not reminded twice', async () => {
    const f = fixture('2026-10-26T13:00:00Z');
    await sendFinancingReminders(f.sb, f.stripe, now, f.send);
    expect(f.messages.length).toBe(0);
  });
  test('paid installment is never reminded', async () => {
    const f = fixture(null, 'paid');
    await sendFinancingReminders(f.sb, f.stripe, now, f.send);
    expect(f.messages.length).toBe(0);
  });
  test('failed SMS is not marked sent and can retry', async () => {
    const f = fixture(null, 'scheduled', false);
    const result = await sendFinancingReminders(f.sb, f.stripe, now, f.send);
    expect(result.sent).toBe(0);
    expect(f.updates.length).toBe(0);
    expect(result.errors.length).toBe(1);
  });
});