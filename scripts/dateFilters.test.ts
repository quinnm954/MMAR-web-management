import { describe, expect, test } from 'bun:test';
import { dateFilterWindow, dateInFilter } from '../src/lib/dateFilters';
import { reportPeriod } from '../src/lib/reportPeriod';

const now = new Date(2026, 9, 20, 19, 53);
describe('admin calendar date filters', () => {
  test('week to date starts on Monday October 19', () => {
    expect(dateFilterWindow('wtd', now).start).toEqual(new Date(2026, 9, 19));
  });
  test('quarter to date starts October 1', () => {
    expect(dateFilterWindow('qtd', now).start).toEqual(new Date(2026, 9, 1));
  });
  test('custom range includes October 20 until midnight and excludes October 21', () => {
    const range = { from: new Date(2026, 9, 19), to: new Date(2026, 9, 20) };
    expect(dateInFilter(new Date(2026, 9, 20, 23, 59, 59).toISOString(), range, now)).toBe(true);
    expect(dateInFilter(new Date(2026, 9, 21).toISOString(), range, now)).toBe(false);
    expect(dateInFilter(new Date(2026, 9, 18, 23, 59).toISOString(), range, now)).toBe(false);
  });
  test('last seven days covers October 14–20 without future records', () => {
    expect(dateFilterWindow('7', now).start).toEqual(new Date(2026, 9, 14));
    expect(dateInFilter(new Date(2026, 9, 21).toISOString(), '7', now)).toBe(false);
  });
  test('previous week to date selects the complete prior Monday–Sunday', () => {
    const result = reportPeriod('wtd', true, 30, now);
    expect(result.start).toEqual(new Date(2026, 9, 12));
    expect(result.end).toEqual(new Date(2026, 9, 19));
  });
  test('previous quarter selects July through September', () => {
    const result = reportPeriod('qtd', true, 30, now);
    expect(result.start).toEqual(new Date(2026, 6, 1));
    expect(result.end).toEqual(new Date(2026, 9, 1));
  });
  test('custom reports compare the immediately preceding equal-length window', () => {
    const result = reportPeriod('custom', false, 30, now, { from: new Date(2026, 9, 19), to: new Date(2026, 9, 20) });
    expect(result.start).toEqual(new Date(2026, 9, 19));
    expect(result.end).toEqual(new Date(2026, 9, 21));
    expect(result.comparisonStart).toEqual(new Date(2026, 9, 17));
  });
  test('month and year to date start on their calendar boundaries', () => {
    expect(dateFilterWindow('m', now).start).toEqual(new Date(2026, 9, 1));
    expect(dateFilterWindow('y', now).start).toEqual(new Date(2026, 0, 1));
  });
});