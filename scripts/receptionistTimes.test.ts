import { expect, test } from 'bun:test';
import { receptionistSlots, requestsMorning } from '../supabase/functions/_shared/receptionist-times';
import { buildOpener, openSlots } from '../supabase/functions/_shared/booking-bot';

const times = [{ date: '2026-10-30', slots: [600, 630, 690, 720, 750, 1020, 1050] }];
test('default receptionist offers are noon through 5 PM', () => {
  expect(receptionistSlots(times)[0].slots).toEqual([720, 750, 1020]);
});
test('explicit morning request enables morning times', () => {
  expect(receptionistSlots(times, requestsMorning('Can you come at 10 AM?'))[0].slots).toEqual([600, 630, 690, 720, 750, 1020]);
});
test('tomorrow in Spanish is not a morning request', () => {
  expect(requestsMorning('¿Puedes venir mañana?')).toBe(false);
  expect(requestsMorning('¿Puedes venir por la mañana?')).toBe(true);
});
test('filter never restores unavailable or blocked times', () => {
  expect(receptionistSlots([{ date: '2026-10-30', slots: [] }], true)[0].slots).toEqual([]);
});
test('booking opener selects noon rather than an earlier morning', () => {
  expect(buildOpener({}, times)).toContain('12:00 PM');
});
test('unavailable calendar reads never produce open offers', async () => {
  const sb = { from() {
    const query: any = { then(resolve: any) { return Promise.resolve({ data: null, error: { message: 'unavailable' } }).then(resolve); } };
    for (const method of ['select', 'gte', 'lte', 'not']) query[method] = () => query;
    return query;
  } };
  await expect(openSlots(sb, '2026-10-30', 1)).rejects.toThrow('Could not check appointments');
});

test('from Monday Nov 2 2026 the default window starts at 10 AM', () => {
  expect(receptionistSlots([{ date: '2026-11-02', slots: [570, 600, 720, 1050] }])[0].slots).toEqual([600, 720]);
});
