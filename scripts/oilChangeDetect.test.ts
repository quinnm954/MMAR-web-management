import { test, expect } from 'bun:test';
import { isOilChange } from '../supabase/functions/_shared/oil-change-eligibility.ts';
test('oil & filter change is subscriber-only oil change', () => {
  for (const t of ['Oil & Filter Change', 'oil and filter change', 'oil + filter', 'change my oil', 'oil change']) expect(isOilChange(t)).toBe(true);
});
test('oil leak is not an oil change', () => { expect(isOilChange('oil leak')).toBe(false); });
