// Offer policy is separate from physical availability so staff calendars stay unchanged.
export function requestsMorning(text: string) {
  return /\bmorning\b|\bmañana\s+(?:por\s+la\s+mañana|temprano)\b|\bpor la mañana\b|\b(?:10|11)(?::[0-5]\d)?\s*(?:am|a\.m\.)\b|\b(?:10|11):[0-5]\d\b/i.test(text);
}

// From this Eastern date, the default offer window starts at 10 AM instead of noon.
export const TEN_AM_START_DATE = '2026-11-02';
export const defaultStartMinute = (date: string) => (date >= TEN_AM_START_DATE ? 600 : 720);

export function receptionistSlots<T extends { date: string; slots: number[] }>(days: T[], morningRequested = false): T[] {
  return days.map(day => ({ ...day, slots: day.slots.filter(minute => minute >= (morningRequested ? 600 : defaultStartMinute(day.date)) && minute <= 1020) }));
}