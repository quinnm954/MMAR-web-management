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
export type ChartGranularity = 'day' | 'week' | 'month' | 'year';
const pad = (n: number) => String(n).padStart(2, '0');
const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Local-time bucket key shared by report rows and chart fill. */
export function chartBucketKey(d: Date, g: ChartGranularity) {
  if (g === 'day') return dayKey(d);
  if (g === 'week') {
    const m = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
    return dayKey(m);
  }
  if (g === 'month') return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
  return String(d.getFullYear());
}

/** Every bucket in [start, end) appears, empty ones as $0, so any filter draws a full line. */
export function filledPeriodChart(start: Date, end: Date, g: ChartGranularity, rows: MonthlyValue[]) {
  const byKey = new Map(rows.map(r => [r.key, r]));
  const out: { label: string; revenue: number; profit: number }[] = [];
  let cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  if (g === 'week') cur = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() - ((cur.getDay() + 6) % 7));
  if (g === 'month') cur = new Date(cur.getFullYear(), cur.getMonth(), 1);
  if (g === 'year') cur = new Date(cur.getFullYear(), 0, 1);
  const last = new Date(end.getTime() - 1);
  for (let i = 0; cur <= last && i < 500; i++) {
    const key = chartBucketKey(cur, g);
    const row = byKey.get(key);
    const label = g === 'year' ? key : g === 'month'
      ? cur.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      : cur.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    out.push({ label, revenue: Math.round(row?.revenue ?? 0), profit: Math.round(row?.netProfit ?? 0) });
    cur = g === 'day' ? new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 1)
      : g === 'week' ? new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 7)
      : g === 'month' ? new Date(cur.getFullYear(), cur.getMonth() + 1, 1)
      : new Date(cur.getFullYear() + 1, 0, 1);
  }
  return out;
}
