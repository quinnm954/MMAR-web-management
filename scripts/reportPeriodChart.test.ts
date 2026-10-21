import { test, expect } from 'bun:test';
import { filledPeriodChart } from '../src/lib/reportChart';

test('last 7 days shows all 7 days with empty days at $0', () => {
  const rows = filledPeriodChart(new Date(2026, 9, 15), new Date(2026, 9, 22), 'day', [{ key: '2026-10-18', revenue: 300, netProfit: 120 }]);
  expect(rows.length).toBe(7);
  expect(rows.filter(r => r.revenue === 300).length).toBe(1);
});

test('quarter to date shows each month of the quarter', () => {
  expect(filledPeriodChart(new Date(2026, 9, 1), new Date(2026, 11, 20), 'month', []).length).toBe(3);
});
