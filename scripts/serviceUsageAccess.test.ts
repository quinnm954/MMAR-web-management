import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { canReadServiceUsage } from '../supabase/functions/admin-service-usage/access';

test('admin home billing information is available to admins and owners', () => {
  assert.equal(canReadServiceUsage(['admin']), true);
  assert.equal(canReadServiceUsage(['owner']), true);
});

test('customers, technicians and other staff cannot read billing information', () => {
  for (const roles of [[], ['customer'], ['technician'], ['manager', 'parts', 'service_advisor']]) {
    assert.equal(canReadServiceUsage(roles), false);
  }
});