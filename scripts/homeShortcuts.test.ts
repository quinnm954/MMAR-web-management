import { test, expect } from 'bun:test';
import { orderShortcuts } from '../src/lib/homeShortcuts';

const items = [{ value: 'phone' }, { value: 'calendar' }, { value: 'invoices' }];

test('most opened page comes first', () => {
  expect(orderShortcuts(items, { invoices: 5, calendar: 2 }).map(i => i.value)).toEqual(['invoices', 'calendar', 'phone']);
});

test('unused pages keep the default order', () => {
  expect(orderShortcuts(items, {}).map(i => i.value)).toEqual(['phone', 'calendar', 'invoices']);
});
