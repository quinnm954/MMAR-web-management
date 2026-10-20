import { describe, expect, test } from 'bun:test';
import { fullYearChart } from '../src/lib/reportChart';

describe('full-year report chart', () => {
  test('Year always includes January through December even with no data', () => {
    const chart = fullYearChart(2026, [], new Date(2027, 0, 1));
    expect(chart.map(row => row.label)).toEqual(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']);
    expect(chart.every(row => row.revenue === 0 && row.profit === 0)).toBe(true);
  });
  test('missing months are $0 while recorded revenue and profit are preserved', () => {
    const chart = fullYearChart(2026, [{ key: '2026-05', revenue: 1400, netProfit: 700 }, { key: '2026-10', revenue: 2800, netProfit: 1000 }], new Date(2026, 9, 20));
    expect(chart[4]).toEqual({ label: 'May', revenue: 1400, profit: 700 });
    expect(chart[9]).toEqual({ label: 'Oct', revenue: 2800, profit: 1000 });
    expect(chart[0]).toEqual({ label: 'Jan', revenue: 0, profit: 0 });
    expect(chart[11]).toEqual({ label: 'Dec', revenue: null, profit: null });
  });
  test('a refund month retains negative revenue rather than becoming zero', () => {
    expect(fullYearChart(2026, [{ key: '2026-10', revenue: -600, netProfit: -600 }])[9].revenue).toBe(-600);
  });
  test('future months stay blank until activity is recorded', () => {
    const chart = fullYearChart(2026, [{ key: '2026-12', revenue: 125, netProfit: 85 }], new Date(2026, 9, 20));
    expect(chart[9].revenue).toBe(0);
    expect(chart[10]).toEqual({ label: 'Nov', revenue: null, profit: null });
    expect(chart[11]).toEqual({ label: 'Dec', revenue: 125, profit: 85 });
  });
});