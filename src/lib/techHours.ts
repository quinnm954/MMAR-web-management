// Tech pay hours from a PAID invoice's line items.
// Rule: every diagnosis line pays the tech 1 hour; other labor lines pay their
// billed labor hours (labor_hours, else quantity for labor, else amount / $125).
export const SHOP_LABOR_RATE = 125;

export const isDiagnosisLine = (li: any) => {
  const k = String(li?.kind ?? '').toLowerCase();
  const desc = `${li?.name ?? ''} ${li?.description ?? ''}`.toLowerCase();
  return k === 'diagnosis' || k === 'diagnostic' || /diagnos|\bdiag\b/.test(desc);
};

const amountOf = (li: any) => Number(li?.amount ?? Number(li?.quantity ?? 1) * Number(li?.unit_price ?? 0)) || 0;

export function techHoursForLine(li: any): number {
  if (String(li?.status ?? '').toLowerCase() === 'declined') return 0;
  if (isDiagnosisLine(li)) return 1;
  const k = String(li?.kind ?? '').toLowerCase();
  if (k !== 'labor') return 0;
  const explicit = Number(li?.labor_hours ?? 0);
  if (explicit > 0) return explicit;
  return amountOf(li) / SHOP_LABOR_RATE;
}

export function techHoursForInvoice(items: any): number {
  return (Array.isArray(items) ? items : []).reduce((s, li) => s + techHoursForLine(li), 0);
}
