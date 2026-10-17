import { expect, test } from 'bun:test';
import { openSlots } from '../supabase/functions/_shared/booking-bot';

function calendarWithBlock(starts_at: string, ends_at: string) {
  return { from(table: string) {
    const result = { data: table === 'calendar_blocks' ? [{ starts_at, ends_at }] : [] };
    const query: any = { then: (resolve: any) => Promise.resolve(result).then(resolve) };
    for (const method of ['select', 'gte', 'lte', 'not', 'lt', 'gt']) query[method] = () => query;
    return query;
  } };
}

test('receptionist skips start times whose reserved slot overlaps blocked time', async () => {
  const [day] = await openSlots(calendarWithBlock('2099-01-05T19:00:00Z', '2099-01-05T22:00:00Z'), '2099-01-05', 1);
  expect(day.slots).toContain(12 * 60);
  expect(day.slots).not.toContain(13 * 60);
  expect(day.slots).not.toContain(13 * 60 + 30);
  expect(day.slots).not.toContain(14 * 60);
  expect(day.slots).not.toContain(16 * 60 + 30);
  expect(day.slots).toContain(17 * 60);
});

test('a full-day block leaves no receptionist slots', async () => {
  const [day] = await openSlots(calendarWithBlock('2099-01-05T05:00:00Z', '2099-01-06T05:00:00Z'), '2099-01-05', 1);
  expect(day.slots).toEqual([]);
});