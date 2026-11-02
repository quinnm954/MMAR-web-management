/** Match only complete stored destinations, never fragments or caller-selected overrides. */
export function phoneKey(value: unknown): string {
  if (typeof value !== 'string') return '';
  const digits = value.replace(/\D/g, '');
  return digits.length === 10 ? `1${digits}` : digits;
}

export function savedPhone(requested: unknown, stored: readonly (string | null | undefined)[]): string | undefined {
  const available = stored.filter((value): value is string => typeof value === 'string' && /^\+?\d[\d ()-]{8,}$/.test(value) && /^\d{10,15}$/.test(phoneKey(value)));
  if (requested !== undefined && requested !== null && requested !== '') {
    const key = phoneKey(requested);
    return available.find(value => phoneKey(value) === key);
  }
  return available[0];
}