import { dateFilterWindow, shiftDate, type CustomDates, type DatePreset } from './dateFilters';

export type ReportPreset = DatePreset | 'w' | 'custom';

/** Half-open report windows prevent later payments leaking into previous periods. */
export function reportPeriod(preset: ReportPreset, previous: boolean, days: number, now = new Date(), custom?: CustomDates) {
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
  } else if (preset === 'custom' && !custom) {
    start = shiftDays(now, -days);
    end = now;
    comparisonStart = shiftDays(start, -days);
  } else {
    const window = dateFilterWindow(custom && preset === 'custom' ? custom : preset === 'custom' ? '30' : preset, now);
    start = window.start;
    end = preset === 'custom' ? window.end : now;
    if (preset === 'wtd' || preset === 'qtd') {
      const currentStart = new Date(start);
      if (preset === 'wtd') {
        if (previous) start = shiftDate(start, -7);
        comparisonStart = shiftDate(start, -7);
      } else {
        if (previous) start = new Date(start.getFullYear(), start.getMonth() - 3, 1);
        comparisonStart = new Date(start.getFullYear(), start.getMonth() - 3, 1);
      }
      if (previous) end = currentStart;
    } else {
      const span = Math.max(1, Math.round((window.end.getTime() - start.getTime()) / 86400000));
      if (previous && preset !== 'all') {
        end = new Date(start);
        start = shiftDate(start, -span);
      }
      comparisonStart = shiftDate(start, -span);
    }
  }
  return { start, end, comparisonStart };
}