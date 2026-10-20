import { describe, expect, test } from 'bun:test';
import { reportPeriod } from '../src/lib/reportPeriod';

const now = new Date(2026, 9, 20, 19, 26);
describe('previous report periods', () => {
  test('previous day is October 19 only', () => {
    const period = reportPeriod('d', true, 1, now);
    expect(period.start).toEqual(new Date(2026, 9, 19));
    expect(period.end).toEqual(new Date(2026, 9, 20));
  });
  test('previous week excludes the current seven-day window', () => {
    const period = reportPeriod('w', true, 7, now);
    expect(period.start).toEqual(new Date(2026, 9, 7));
    expect(period.end).toEqual(new Date(2026, 9, 14));
  });
  test('previous month covers all of September, not October', () => {
    const period = reportPeriod('m', true, 30, now);
    expect(period.start).toEqual(new Date(2026, 8, 1));
    expect(period.end).toEqual(new Date(2026, 9, 1));
    expect(period.comparisonStart).toEqual(new Date(2026, 7, 1));
  });
  test('previous year covers January through December 2025', () => {
    const period = reportPeriod('y', true, 365, now);
    expect(period.start).toEqual(new Date(2025, 0, 1));
    expect(period.end).toEqual(new Date(2026, 0, 1));
    expect(period.comparisonStart).toEqual(new Date(2024, 0, 1));
  });
});