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
  test('exports a loss of -45.20 as a numeric cell', () => {
    expect(csvCell((-45.2).toFixed(2))).toBe('"-45.20"');
    expect(csvCell(-45.2)).toBe('"-45.2"');
    expect(csvCell('-600.00')).toBe('"-600.00"');
    expect(csvCell('-0.50')).toBe('"-0.50"');
  });
  test('does not exempt expressions or disguised negatives as numbers', () => {
    for (const value of ['-45.20+1', '-1+2', '-SUM(A1)', '-1e2+3', ' -45.20', '\t-45.20', '-45\n']) {
      expect(csvCell(value).startsWith('"\'')).toBe(true);
    }
  });
});