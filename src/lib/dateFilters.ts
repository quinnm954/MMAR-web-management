export type DatePreset = 'all' | 'd' | 'wtd' | 'm' | 'qtd' | 'y' | '7' | '30' | '90';
export type CustomDates = { from: Date; to: Date };
export type DateFilter = DatePreset | CustomDates;

export const DATE_PRESETS: { value: DatePreset; label: string; group: string }[] = [
  { value: 'd', label: 'Today', group: 'To date' },
  { value: 'wtd', label: 'Week to date', group: 'To date' },
  { value: 'm', label: 'Month to date', group: 'To date' },
  { value: 'qtd', label: 'Quarter to date', group: 'To date' },
  { value: 'y', label: 'Year to date', group: 'To date' },
  { value: '7', label: 'Last 7 days', group: 'Rolling' },
  { value: '30', label: 'Last 30 days', group: 'Rolling' },
  { value: '90', label: 'Last 90 days', group: 'Rolling' },
  { value: 'all', label: 'All time', group: 'Rolling' },
];

export function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function shiftDate(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/** Calendar end dates include the entire selected day, with an exclusive next-day boundary. */
export function dateFilterWindow(filter: DateFilter, now = new Date()) {
  if (typeof filter !== 'string') {
    return { start: startOfDay(filter.from), end: shiftDate(startOfDay(filter.to), 1) };
  }
  const today = startOfDay(now);
  let start = today;
  if (filter === 'all') start = new Date(1970, 0, 1);
  else if (filter === 'wtd') start = shiftDate(today, -((today.getDay() + 6) % 7));
  else if (filter === 'm') start = new Date(today.getFullYear(), today.getMonth(), 1);
  else if (filter === 'qtd') start = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
  else if (filter === 'y') start = new Date(today.getFullYear(), 0, 1);
  else if (filter === '7' || filter === '30' || filter === '90') start = shiftDate(today, 1 - Number(filter));
  return { start, end: shiftDate(today, 1) };
}

export function dateInFilter(date: string | null | undefined, filter: DateFilter, now = new Date()) {
  if (filter === 'all') return true;
  if (!date) return false;
  const time = new Date(date).getTime();
  const { start, end } = dateFilterWindow(filter, now);
  return time >= start.getTime() && time < end.getTime();
}