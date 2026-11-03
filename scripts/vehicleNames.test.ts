import { expect, test } from 'bun:test';
import { closestNames } from '../supabase/functions/_shared/vehicle-name-match';
test('Odessy ranks Odyssey first', () => {
  expect(closestNames('Odessy', ['Civic','Odyssey','Accord'])[0].name).toBe('Odyssey');
});
test('generic truck is not treated as an exact model', () => {
  expect(closestNames('Box Truck (14 ft)', ['NPR','NQR'])[0].distance).toBeGreaterThan(2);
});
test('nearby BMW variants remain separate choices', () => {
  expect(closestNames('328', ['328i','328xi']).map(r => r.name)).toEqual(['328i','328xi']);
});