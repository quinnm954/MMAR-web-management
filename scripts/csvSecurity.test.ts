import { describe, expect, test } from 'bun:test';
import { csvCell } from '../src/lib/csv';

describe('safe spreadsheet exports', () => {
  test('neutralizes formulas and disguised prefixes', () => {
    for (const value of ['=1+1', '+CMD', '-1+2', '@SUM(A1)', '  =1', '\t=1', '\r=1', '\n=1']) {
      expect(csvCell(value).startsWith('"\'')).toBe(true);
    }
  });
  test('preserves ordinary data and CSV quoting', () => {
    expect(csvCell('Mike, "Shop"')).toBe('"Mike, ""Shop"""');
    expect(csvCell(null)).toBe('""');
    expect(csvCell(125)).toBe('"125"');
  });
});