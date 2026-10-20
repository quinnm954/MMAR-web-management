type MonthlyValue = { key: string; revenue: number; netProfit: number };

/** A yearly chart includes empty and future months, without inventing transactions. */
export function fullYearChart(year: number, rows: MonthlyValue[]) {
  const byMonth = new Map(rows.map(row => [row.key, row]));
  return Array.from({ length: 12 }, (_, month) => {
    const key = `${year}-${String(month + 1).padStart(2, '0')}`;
    const row = byMonth.get(key);
    return {
      label: new Date(year, month, 1).toLocaleDateString('en-US', { month: 'short' }),
      revenue: Math.round(row?.revenue ?? 0),
      profit: Math.round(row?.netProfit ?? 0),
    };
  });
}