import { describe, expect, test } from 'bun:test';
import { clearCommunicationUnread } from '../src/lib/clearCommunicationUnread';
import { isSafeToReload } from '../src/hooks/useAutoRefresh';

describe('clearing communication indicators', () => {
  test('clears calls, texts and email, but only through the clear cutoff', async () => {
    const operations: Record<string, { update?: unknown; filters: unknown[] }> = {};
    const client = { from(table: string) {
      const op = operations[table] = { filters: [] };
      const query = {
        update(value: unknown) { op.update = value; return query; },
        is(...args: unknown[]) { op.filters.push(['is', ...args]); return query; },
        gt(...args: unknown[]) { op.filters.push(['gt', ...args]); return query; },
        lte(...args: unknown[]) { op.filters.push(['lte', ...args]); return Promise.resolve({ error: null }); },
      };
      return query;
    } };
    const cutoff = '2026-11-02T18:39:00.000Z';
    await clearCommunicationUnread(client, cutoff);
    expect(operations.call_logs).toEqual({ update: { read_at: cutoff }, filters: [['is', 'read_at', null], ['lte', 'created_at', cutoff]] });
    expect(operations.sms_threads).toEqual({ update: { unread_count: 0 }, filters: [['gt', 'unread_count', 0], ['lte', 'last_message_at', cutoff]] });
    expect(operations.inbound_messages).toEqual({ update: { read_at: cutoff }, filters: [['is', 'read_at', null], ['lte', 'received_at', cutoff]] });
  });
  test('does not report success if a source fails to clear', async () => {
    const client = { from: () => {
      const query = { update: () => query, is: () => query, gt: () => query, lte: async () => ({ error: new Error('denied') }) };
      return query;
    } };
    await expect(clearCommunicationUnread(client, '2026-11-02T18:39:00.000Z')).rejects.toThrow('denied');
  });
});

test('an open or scrolled phone thread blocks page refresh', () => {
  const oldDocument = globalThis.document;
  const oldWindow = globalThis.window;
  let blocked = true;
  Object.assign(globalThis, {
    window: {},
    document: { hidden: false, activeElement: null, querySelector: (selector: string) => selector.includes('data-auto-refresh-blocked') && blocked ? {} : null, querySelectorAll: () => [] },
  });
  try {
    expect(isSafeToReload()).toBe(false);
    blocked = false;
    expect(isSafeToReload()).toBe(true);
  } finally {
    Object.assign(globalThis, { document: oldDocument, window: oldWindow });
  }
});