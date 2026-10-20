export type ReportPreset = 'd' | 'w' | 'm' | 'y' | 'custom';

/** Half-open report windows prevent later payments leaking into previous periods. */
export function reportPeriod(preset: ReportPreset, previous: boolean, days: number, now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const shiftDays = (date: Date, count: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + count);
    return result;
  };
  let start: Date;
  let end: Date;
  let comparisonStart: Date;
  if (preset === 'd' || preset === 'w') {
    const span = preset === 'd' ? 1 : 7;
    const currentStart = shiftDays(today, 1 - span);
    start = previous ? shiftDays(currentStart, -span) : currentStart;
    end = previous ? currentStart : now;
    comparisonStart = shiftDays(start, -span);
  } else if (preset === 'm') {
    const offset = previous ? -1 : 0;
    start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    end = previous ? new Date(now.getFullYear(), now.getMonth(), 1) : now;
    comparisonStart = new Date(now.getFullYear(), now.getMonth() + offset - 1, 1);
  } else if (preset === 'y') {
    const year = now.getFullYear() - (previous ? 1 : 0);
    start = new Date(year, 0, 1);
    end = previous ? new Date(now.getFullYear(), 0, 1) : now;
    comparisonStart = new Date(year - 1, 0, 1);
  } else {
    start = shiftDays(now, -days);
    end = now;
    comparisonStart = shiftDays(start, -days);
  }
  return { start, end, comparisonStart };
}