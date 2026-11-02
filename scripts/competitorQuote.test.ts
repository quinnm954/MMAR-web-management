import { describe, expect, test } from 'bun:test';
import { matchLaborToTotal } from '../src/lib/competitorQuote';
import { isItemized } from '../supabase/functions/_shared/competitor-quote.ts';

const lines = [
  { description: 'Pads', kind: 'part' as const, quantity: 1, unit_price: 80, amount: 80 },
  { description: 'Labor', kind: 'labor' as const, quantity: 1, labor_hours: 2, unit_price: 125, amount: 250 },
];

describe('competitor quote matching', () => {
  test('a total with no line items does not qualify', () => {
    expect(isItemized([{ amount: 221 }])).toBe(false);
    expect(isItemized([{ amount: 80 }, { amount: 141 }])).toBe(true);
  });
  test('matching lowers labor only; parts never change', () => {
    const out = matchLaborToTotal(lines, 345, 295)!;
    expect(out[0]).toEqual(lines[0]);
    expect(out[1].amount).toBe(200);
  });
  test('no match when competitor is higher or labor cannot cover the gap', () => {
    expect(matchLaborToTotal(lines, 345, 400)).toBeNull();
    expect(matchLaborToTotal(lines, 345, 65)).toBeNull();
  });
});
