import { test, expect } from 'bun:test';
import { callCustomerName, callPhone } from '../src/lib/callContact';

const profiles = [{ id: 'customer', full_name: 'Angela Dabo', phone: '(239) 555-0123' }];
const incoming = { direction: 'inbound', from_number: '+12395550123', to_number: '+18135017572' };

test('incoming calls resolve saved names across phone formats', () => {
  expect(callCustomerName(incoming, profiles)).toBe('Angela Dabo');
});
test('outbound calls use the customer destination, not the shop', () => {
  const outgoing = { ...incoming, direction: 'outbound-api', from_number: incoming.to_number, to_number: incoming.from_number };
  expect(callPhone(outgoing)).toBe('+12395550123');
  expect(callCustomerName(outgoing, profiles)).toBe('Angela Dabo');
});
test('linked customers resolve even when their saved phone changed', () => {
  expect(callCustomerName({ ...incoming, customer_id: 'customer', from_number: '+12395550999' }, profiles)).toBe('Angela Dabo');
});
test('unknown or withheld numbers do not acquire another customer name', () => {
  expect(callCustomerName({ ...incoming, from_number: null }, profiles)).toBeNull();
  expect(callCustomerName({ ...incoming, from_number: '+12395550999' }, profiles)).toBeNull();
});