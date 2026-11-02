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

test('new texter accepting a time still supplies name street address and vehicle', async () => {
  const { handleReceptionistText } = await import('../supabase/functions/_shared/sms-receptionist');
  const originalFetch = globalThis.fetch;
  const originalDeno = (globalThis as any).Deno;
  const writes: any[] = [];
  const records: Record<string, any> = {
    phone_settings: { ai_sms_enabled: true }, profiles: [], employees: [], service_regions: [], user_service_regions: [],
    sms_messages: [{ direction: 'inbound', body: 'Monday noon works for my no-start', created_at: new Date().toISOString() }], booking_requests: [],
  };
  const sb = { from(table: string) {
    const query: any = { then(resolve: any) { return Promise.resolve({ data: records[table], error: null }).then(resolve); } };
    for (const method of ['select', 'eq', 'not', 'order', 'limit', 'maybeSingle', 'gte', 'in']) query[method] = () => query;
    query.insert = (payload: any) => { writes.push({ table, payload }); return query; };
    return query;
  }, async rpc() { return { error: null }; } };
  (globalThis as any).Deno = { env: { get: () => 'unit-test-only' } };
  globalThis.fetch = mock(async () => new Response(JSON.stringify({ output_text: JSON.stringify({
    reply: 'Got it.', slot: { date: '2099-01-05', time: '12:00', accepted: true }, booking: { description: 'No start', service_address: 'Lehigh Acres' },
  }) }))) as unknown as typeof fetch;
  try {
    const before = replies.length;
    await handleReceptionistText(sb, '+15555550102', 'Monday noon works for my no-start', 'thread-new');
    expect(writes[0]).toMatchObject({ table: 'booking_requests', payload: { status: 'new', requested_time_window: '12:00 PM' } });
    expect(replies).toHaveLength(before + 1);
    expect(replies[before]).toContain('name');
    expect(replies[before]).toContain('service street address');
    expect(replies[before]).toContain('vehicle year, make and model');
  } finally { globalThis.fetch = originalFetch; (globalThis as any).Deno = originalDeno; }
});

test('incomplete intake preserves diagnosis answers and checked offers on non-accepted turns', async () => {
  const { handleReceptionistText } = await import('../supabase/functions/_shared/sms-receptionist');
  const originalFetch = globalThis.fetch;
  const originalDeno = (globalThis as any).Deno;
  const writes: any[] = [];
  const records: Record<string, any> = {
    phone_settings: { ai_sms_enabled: true }, profiles: [], employees: [], service_regions: [], user_service_regions: [],
    sms_messages: [], booking_requests: [],
  };
  const sb = { from(table: string) {
    const query: any = { then(resolve: any) { return Promise.resolve({ data: records[table], error: null }).then(resolve); } };
    for (const method of ['select', 'eq', 'not', 'order', 'limit', 'maybeSingle', 'gte', 'in']) query[method] = () => query;
    query.insert = (payload: any) => { writes.push({ table, payload }); return query; };
    return query;
  }, async rpc() { return { error: null }; } };
  (globalThis as any).Deno = { env: { get: () => 'unit-test-only' } };
  try {
    for (const scenario of [
      { body: 'How much for a no-start diagnosis?', reply: 'Diagnosis is $100 with $50 credited to repair labor.', slot: null },
      { body: 'Can you come Monday? My 2015 Camry will not start.', reply: 'Monday at 12:00 PM is available pending Mike’s approval.', slot: { date: '2099-01-05', time: '12:00', accepted: false } },
      { body: 'My car will not start', reply: 'Diagnosis is $100. What is your name?', slot: null },
      { body: 'My car will not start', reply: '', slot: null },
    ]) {
      globalThis.fetch = mock(async () => new Response(JSON.stringify({ output_text: JSON.stringify({
        reply: scenario.reply, slot: scenario.slot, booking: { description: 'No start', vehicle_info: '2015 Camry' },
      }) }))) as unknown as typeof fetch;
      const before = replies.length;
      await handleReceptionistText(sb, '+15555550103', scenario.body, 'thread-prospect');
      expect(replies).toHaveLength(before + 1);
      const sent = replies[before];
      if (scenario.reply) expect(sent.startsWith(scenario.reply)).toBe(true);
      expect(sent.toLowerCase()).toContain('name');
      if (!scenario.reply.endsWith('?')) {
        expect(sent).toContain('service street address');
        expect(sent).toContain('vehicle year, make and model');
      } else {
        expect(sent).toBe(scenario.reply);
      }
    }
    expect(writes.every(w => w.table === 'booking_requests' && !w.payload.requested_date)).toBe(true);
    expect(writes).toHaveLength(4);
  } finally { globalThis.fetch = originalFetch; (globalThis as any).Deno = originalDeno; }
});