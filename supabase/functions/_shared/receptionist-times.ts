// Offer policy is separate from physical availability so staff calendars stay unchanged.
export function requestsMorning(text: string) {
  return /\bmorning\b|\bmañana\s+(?:por\s+la\s+mañana|temprano)\b|\bpor la mañana\b|\b(?:10|11)(?::[0-5]\d)?\s*(?:am|a\.m\.)\b|\b(?:10|11):[0-5]\d\b/i.test(text);
}

export function receptionistSlots<T extends { date: string; slots: number[] }>(days: T[], morningRequested = false): T[] {
  return days.map(day => ({ ...day, slots: day.slots.filter(minute => minute >= (morningRequested ? 600 : 720) && minute <= 1020) }));
}