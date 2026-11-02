import { afterEach, expect, mock, test } from 'bun:test';
import { z } from 'zod';
import { savedPhone } from '../supabase/functions/_shared/message-recipient.ts';

let handler: (req: Request) => Promise<Response>;
let roles = ['owner'];
let recipient = 'owner-customer@example.test';
let sends = 0;
let sessions = 0;
let queries: { table: string; filters: Record<string, unknown> }[] = [];
let savedProfile = true;
let savedInbound = false;
const originalDeno = (globalThis as any).Deno;
const originalFetch = globalThis.fetch;

function createClient() {
  return {
    auth: { getUser: async () => ({ data: { user: { id: 'owner-user' } }, error: null }) },
    from(table: string) {
      const filters: Record<string, unknown> = {};
      queries.push({ table, filters });
      const rows = () => {
        if (table === 'user_roles') return roles.map(role => ({ role }));
        if (table === 'profiles') return savedProfile && (!filters.email || filters.email === recipient) ? [{ id: 'customer-1', email: recipient, full_name: 'Customer', phone: '+15555550100' }] : [];
        if (table === 'inbound_messages') return savedInbound && filters.from_email === recipient ? [{ from_email: recipient }] : [];
        if (table === 'sms_threads') return filters.customer_id ? [{ phone: '+15555550100' }] : [{ phone: '+15555550100' }];
        if (table === 'invoices') return [{ id: 'invoice-1', customer_id: 'customer-1', total: 100, amount_paid: 0, status: 'sent', invoice_number: 'INV-1' }];
        if (table === 'memberships') return [{ id: 'membership-1', customer_id: 'customer-1', deposit_paid: false, plan: { deposit_amount: 100, name: 'Care', stripe_price_id: 'price_test' } }];
        return [];
      };
      const q: any = {
        select: () => q, eq: (key: string, value: unknown) => { filters[key] = value; return q; },
        in: (_key: string, values: string[]) => { filters.allowed = values; return q; },
        limit: () => q, order: () => q, insert: () => q, update: () => q,
        maybeSingle: async () => ({ data: rows().find(row => !filters.allowed || (filters.allowed as string[]).includes((row as any).role)) || null, error: null }),
        then: (resolve: any) => Promise.resolve({ data: rows(), error: null }).then(resolve),
      };
      return q;
    },
  };
}
mock.module('npm:@supabase/supabase-js@2', () => ({ createClient }));
mock.module('npm:@supabase/supabase-js@2.57.2', () => ({ createClient }));
mock.module('https://esm.sh/@supabase/supabase-js@2.95.0', () => ({ createClient }));
mock.module('npm:zod@3.23.8', () => ({ z }));
mock.module('npm:stripe@18.5.0', () => ({ default: class {
  checkout = { sessions: { create: async () => { sessions++; return { id: 'session-test', url: 'https://example.test/pay' }; } } };
} }));
mock.module('../supabase/functions/_shared/send-and-log.ts', () => ({ sendAndLog: async (options: any) => { recipient = options.recipientEmail; sends++; return { sent: true }; } }));
mock.module('../supabase/functions/_shared/contact-block.ts', () => ({ contactBlocked: async () => false }));

async function load(name: string) {
  (globalThis as any).Deno = { env: { get: (key: string) => key === 'SUPABASE_URL' ? 'https://example.test' : 'test-only' }, serve: (fn: typeof handler) => { handler = fn; } };
  const modules: Record<string, () => Promise<unknown>> = {
    sms: () => import('../supabase/functions/send-sms/index.ts'),
    email: () => import('../supabase/functions/send-admin-message/index.ts'),
    payment: () => import('../supabase/functions/create-payment-link/index.ts'),
  };
  await modules[name]();
  return handler;
}
async function request(fn: typeof handler, body: unknown) {
  return fn(new Request('https://example.test/functions/v1/test', { method: 'POST', headers: { Authorization: 'Bearer test-only', 'Content-Type': 'application/json' }, body: JSON.stringify(body) }));
}
afterEach(() => { roles = ['owner']; savedProfile = true; savedInbound = false; recipient = 'owner-customer@example.test'; sends = 0; sessions = 0; queries = []; globalThis.fetch = originalFetch; (globalThis as any).Deno = originalDeno; });

test('manual SMS is owner/admin only and sends to the stored conversation phone', async () => {
  const fn = await load('sms');
  for (const role of ['technician', 'parts', 'manager', 'service_advisor', 'customer']) {
    roles = [role];
    expect((await request(fn, { thread_id: 'thread-1', to: '+15555550100', body: 'hello' })).status).toBe(403);
  }
  globalThis.fetch = (async (_url, options) => {
    expect(new URLSearchParams(String(options?.body)).get('To')).toBe('+15555550100');
    sends++; return Response.json({ sid: 'test-sid', status: 'queued' });
  }) as typeof fetch;
  for (const role of ['owner', 'admin']) {
    roles = [role];
    expect((await request(fn, { thread_id: 'thread-1', to: '+15555550999', body: 'hello' })).status).toBe(400);
    expect((await request(fn, { thread_id: 'thread-1', to: '(555) 555-0100', body: 'hello' })).status).toBe(200);
  }
  expect(sends).toBe(2);
});

test('email sends only to a saved customer or genuine saved inbox sender', async () => {
  const fn = await load('email');
  const payload = { to: 'unknown@example.test', subject: 'Update', body: 'hello', threadId: 'client-chosen-thread' };
  expect((await request(fn, payload)).status).toBe(400);
  expect(sends).toBe(0);
  roles = ['technician'];
  expect((await request(fn, { ...payload, to: recipient })).status).toBe(403);
  roles = ['owner'];
  expect((await request(fn, { ...payload, to: recipient })).status).toBe(200);
  savedProfile = false; savedInbound = true;
  expect((await request(fn, { ...payload, to: recipient })).status).toBe(200);
  expect(sends).toBe(2);
});

test('invoice, membership and custom payment SMS rejects unknown phones before creating checkout', async () => {
  const fn = await load('payment');
  for (const kind of ['invoice', 'membership_deposit', 'membership_subscription', 'custom']) {
    const response = await request(fn, { kind, reference_id: 'reference-1', customer_id: 'customer-1', amount: 100, send_sms: true, phone: '+15555550999' });
    expect(response.status).toBe(400);
  }
  expect((await request(fn, { kind: 'custom', amount: 100, send_sms: true, phone: '+15555550100' })).status).toBe(400);
  expect(sessions).toBe(0);
  expect(sends).toBe(0);
  expect(queries.filter(q => q.table === 'profiles').every(q => q.filters.id === 'customer-1')).toBe(true);
});

test('a valid invoice payment text uses its customer rather than the supplied customer override', async () => {
  const fn = await load('payment');
  globalThis.fetch = (async (_url, options) => {
    expect(new URLSearchParams(String(options?.body)).get('To')).toBe('+15555550100');
    sends++; return Response.json({ sid: 'test-sid', status: 'queued' });
  }) as typeof fetch;
  const response = await request(fn, { kind: 'invoice', reference_id: 'invoice-1', customer_id: 'wrong-customer', send_sms: true });
  expect(response.status).toBe(200);
  expect(sessions).toBe(1);
  expect(sends).toBe(1);
  expect(queries.find(q => q.table === 'profiles')?.filters.id).toBe('customer-1');
});

test('payment phone resolver chooses stored contact and rejects overrides', () => {
  expect(savedPhone(undefined, ['+15555550100'])).toBe('+15555550100');
  expect(savedPhone('(555) 555-0100', ['+15555550100'])).toBe('+15555550100');
  expect(savedPhone('+15555550999', ['+15555550100'])).toBeUndefined();
  expect(savedPhone('+15555550100', [])).toBeUndefined();
});