import { expect, mock, setSystemTime, test } from 'bun:test';

test('hourly worker sends no estimate reminders, including pre-expiry nudges', async () => {
  setSystemTime(new Date('2026-11-03T17:00:00Z'));
  const sends: unknown[] = [];
  const updates: { table: string; payload: unknown }[] = [];
  const estimates = [
    { id: 'one-day', customer_id: 'customer', status: 'sent', total: 100, followup_count: 0, sent_at: '2026-11-01T17:00:00Z', valid_until: '2026-11-10', customer_phone: '+12395550100' },
    { id: 'three-day', customer_id: 'customer', status: 'sent', total: 200, followup_count: 1, sent_at: '2026-10-29T17:00:00Z', valid_until: '2026-11-10', customer_phone: '+12395550100' },
    { id: 'expiring', customer_id: 'customer', status: 'sent', total: 300, followup_count: 2, sent_at: '2026-10-20T17:00:00Z', valid_until: '2026-11-05', customer_phone: '+12395550100' },
  ];
  const client = { from(table: string) {
    const q: any = {
      select() { return q; },
      update(payload: unknown) { updates.push({ table, payload }); return q; },
      maybeSingle: async () => ({ data: { full_name: 'Customer', phone: '+12395550100', email: 'customer@example.com' } }),
      then(resolve: any) { return Promise.resolve({ data: table === 'followup_worker_state' ? [{ id: 1 }] : table === 'estimates' ? estimates : [], count: 0 }).then(resolve); },
    };
    for (const name of ['eq', 'lt', 'lte', 'gte', 'not', 'is', 'or', 'order', 'limit', 'in']) q[name] = () => q;
    return q;
  } };
  mock.module('npm:@supabase/supabase-js@2', () => ({ createClient: () => client }));
  mock.module('npm:stripe@18.5.0', () => ({ default: class {} }));
  mock.module('../supabase/functions/_shared/internal-auth.ts', () => ({ requireInternal: async () => null }));
  mock.module('../supabase/functions/_shared/send-and-log.ts', () => ({ sendAndLog: async (args: unknown) => { sends.push(args); } }));
  mock.module('../supabase/functions/_shared/booking-bot.ts', () => ({ sendSms: async (...args: unknown[]) => { sends.push(args); } }));
  mock.module('../supabase/functions/_shared/missed-call.ts', () => ({ smsAllowed: async () => true }));
  mock.module('../supabase/functions/_shared/enroll.ts', () => ({ enrollSuffix: async () => '' }));
  mock.module('../supabase/functions/_shared/financing-reminders.ts', () => ({ sendFinancingReminders: async () => ({ sent: 0, errors: [] }) }));
  let handler: ((req: Request) => Promise<Response>) | undefined;
  const globals = globalThis as any;
  const previousDeno = globals.Deno;
  const previousFetch = globals.fetch;
  globals.Deno = { env: { get: (key: string) => key === 'STRIPE_SECRET_KEY' ? undefined : 'test' }, serve: (fn: typeof handler) => { handler = fn; } };
  globals.fetch = async () => new Response('{}');
  try {
    await import('../supabase/functions/followup-worker/index.ts');
    if (!handler) throw new Error('Worker handler was not registered');
    const response = await handler(new Request('http://localhost/worker', { method: 'POST' }));
    expect((await response.json()).estimates).toBe(0);
    expect(sends).toEqual([]);
    expect(updates).toContainEqual({ table: 'estimates', payload: { status: 'expired' } });
  } finally {
    globals.Deno = previousDeno;
    globals.fetch = previousFetch;
    setSystemTime();
    mock.restore();
  }
});