export interface QuoteLine { description: string; quantity: number; unit_price: number; amount: number; labor_hours?: number; kind?: 'part' | 'labor' | 'fee'; [k: string]: unknown }

const lineTotal = (l: QuoteLine) => (l.kind ?? 'part') === 'labor' ? Number(l.labor_hours || 0) * Number(l.unit_price) : Number(l.quantity) * Number(l.unit_price);

/**
 * Lowers only labor so the estimate total equals the competitor total.
 * Labor is untaxed, so total moves 1:1 with labor. Parts and fees are never changed.
 * Returns null when matching would need higher prices or labor below zero.
 */
export function matchLaborToTotal(lines: QuoteLine[], currentTotal: number, target: number): QuoteLine[] | null {
  const labor = lines.reduce((s, l) => (l.kind === 'labor' ? s + lineTotal(l) : s), 0);
  const cut = currentTotal - target;
  if (!(cut > 0) || labor <= 0 || cut > labor) return null;
  const factor = (labor - cut) / labor;
  return lines.map((l) => {
    if (l.kind !== 'labor') return l;
    const unit_price = Math.round(Number(l.unit_price) * factor * 100) / 100;
    return { ...l, unit_price, amount: Math.round(Number(l.labor_hours || 0) * unit_price * 100) / 100 };
  });
}
