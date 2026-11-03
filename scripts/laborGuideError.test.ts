import { expect, test } from 'bun:test';
import { laborGuideFailure } from '../src/lib/laborGuideError';

test('model mismatch returns the provider choices without inventing a truck model', () => {
  const failure = laborGuideFailure({ detail: { error: { code: 'MODEL_OR_VARIANT_NOT_FOUND', availableModels: ['npr', 'rodeo', null] } } });
  expect(failure.models).toEqual(['npr', 'rodeo']);
});
test('provider authentication and quota errors remain distinguishable', () => {
  expect(laborGuideFailure({ detail: { error: { message: 'Monthly request limit exceeded' } } }).message).toBe('Monthly request limit exceeded');
  expect(laborGuideFailure({ error: 'Labor guide key not configured' }).message).toBe('Labor guide key not configured');
});