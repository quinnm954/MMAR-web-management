import { expect, test } from 'bun:test';
import { singleFlight } from '../src/lib/singleFlight';

test('concurrent refreshes share work, but the next refresh gets fresh data', async () => {
  let calls = 0;
  const refresh = singleFlight(async () => ++calls);
  const first = refresh();
  expect(refresh()).toBe(first);
  expect(await first).toBe(1);
  expect(await refresh()).toBe(2);
});

test('a failed refresh can be retried', async () => {
  let calls = 0;
  const refresh = singleFlight(async () => {
    if (++calls === 1) throw new Error('offline');
    return calls;
  });
  await expect(refresh()).rejects.toThrow('offline');
  expect(await refresh()).toBe(2);
});