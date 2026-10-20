type MonthlyValue = { key: string; revenue: number; netProfit: number };

/** Keep every month visible, but do not plot unrecorded future activity. */
export function fullYearChart(year: number, rows: MonthlyValue[], now = new Date()) {
  const byMonth = new Map(rows.map(row => [row.key, row]));
  return Array.from({ length: 12 }, (_, month) => {
    const key = `${year}-${String(month + 1).padStart(2, '0')}`;
    const row = byMonth.get(key);
    const future = new Date(year, month, 1) > now;
    return {
      label: new Date(year, month, 1).toLocaleDateString('en-US', { month: 'short' }),
      revenue: row ? Math.round(row.revenue) : future ? null : 0,
      profit: row ? Math.round(row.netProfit) : future ? null : 0,
    };
  });
}