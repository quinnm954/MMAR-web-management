import { expect, test, mock } from 'bun:test';

const replies: string[] = [];
mock.module('../supabase/functions/_shared/booking-bot.ts', () => ({
  digits: (p: string) => p.replace(/\D/g, '').slice(-10),
  sendSms: async (_sb: unknown, _to: string, body: string) => { replies.push(body); return true; },
  openSlots: async () => [{ date: '2099-01-05', slots: [720] }],
  isSlotOpen: async () => true,
  hhmm: (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`,
  label12: () => '12:00 PM',
  friendlyDate: () => 'Monday, Jan 5th',
}));
mock.module('../supabase/functions/_shared/missed-call.ts', () => ({ smsAllowed: async () => true }));
mock.module('../supabase/functions/_shared/oil-change-eligibility.ts', () => ({ oilChangeBlocked: async () => false, OIL_CHANGE_MEMBERSHIP_REPLY: '', OIL_CHANGE_MEMBERSHIP_REPLY_ES: '' }));

test('David saying He knows it saves known name and hands off without repeating intake', async () => {
  const { handleReceptionistText } = await import('../supabase/functions/_shared/sms-receptionist');
  const originalFetch = globalThis.fetch;
  const originalDeno = (globalThis as any).Deno;
  const writes: any[] = [];
  const notices: any[] = [];
  (globalThis as any).Deno = { env: { get: () => 'unit-test-only' } };
  globalThis.fetch = mock(async () => new Response(JSON.stringify({ output_text: JSON.stringify({
    reply: "What's your name and service address?", slot: { date: '2099-01-05', time: '12:00', accepted: true },
    booking: { description: 'Auxiliary vacuum pump replacement' },
  }) }))) as unknown as typeof fetch;
  const records: Record<string, any> = {
    phone_settings: { ai_sms_enabled: true }, profiles: [{ id: 'david', full_name: 'David Case', phone: '+15555550101' }],
    employees: [], user_roles: [{ role: 'customer' }], vehicles: [], service_regions: [], user_service_regions: [],
    sms_messages: [{ direction: 'inbound', body: 'He knows it', created_at: new Date().toISOString() }],
    booking_requests: [{ id: 'request', customer_phone: '+15555550101', customer_name: 'David Case' }],
  };
  const sb = {
    from(table: string) {
      const query: any = { then(resolve: any) { return Promise.resolve({ data: records[table], error: null }).then(resolve); } };
      for (const method of ['select', 'eq', 'not', 'order', 'limit', 'maybeSingle', 'gte', 'in']) query[method] = () => query;
      query.update = (payload: any) => { writes.push({ table, payload }); return query; };
      return query;
    },
    async rpc(name: string, payload: any) { notices.push({ name, payload }); return { error: null }; },
  };
  try {
    await handleReceptionistText(sb, '+15555550101', 'He knows it', 'thread');
    expect(writes[0]).toMatchObject({ table: 'booking_requests', payload: { customer_name: 'David Case', requested_time_window: '12:00 PM', bot_status: 'handoff' } });
    expect(replies).toHaveLength(1);
    expect(notices.some(n => n.payload._title === 'Texter wants Mike')).toBe(true);
    expect(writes.some(w => w.table === 'appointments')).toBe(false);
    expect(writes[0].payload.service_address).toBeNull();
  } finally {
    globalThis.fetch = originalFetch;
    (globalThis as any).Deno = originalDeno;
  }
});