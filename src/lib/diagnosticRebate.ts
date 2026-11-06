export interface RebateLine {
  description: string;
  kind?: 'part' | 'labor' | 'fee';
  quantity: number;
  unit_price: number;
  amount: number;
  labor_hours?: number;
  credit_type?: 'diagnostic_rebate';
}

export const isDiagnosticRebate = (line: RebateLine) =>
  line.credit_type === 'diagnostic_rebate' ||
  (line.kind === 'fee' && line.description === 'Diagnostic rebate — credit toward repair labor' && line.unit_price < 0);

export function diagnosticRebateAmount(lines: RebateLine[]): number {
  const labor = lines.filter(line => line.kind === 'labor' && !/diagnos|\bdiag\b|inspection/i.test(line.description))
    .reduce((sum, line) => sum + Math.max(0, Number(line.labor_hours || 0) * Number(line.unit_price || 0)), 0);
  return Math.round(Math.min(50, labor) * 100) / 100;
}

// A fee credit changes the price without reversing worked hours, technician pay or parts tax.
export function withDiagnosticRebate<T extends RebateLine>(lines: T[], enabled = lines.some(isDiagnosticRebate)): (T | RebateLine)[] {
  const base = lines.filter(line => !isDiagnosticRebate(line));
  const amount = diagnosticRebateAmount(base);
  if (!enabled || amount <= 0) return base;
  return [...base, {
    description: 'Diagnostic rebate — credit toward repair labor',
    kind: 'fee', quantity: 1, unit_price: -amount, amount: -amount,
    labor_hours: 0, credit_type: 'diagnostic_rebate',
  }];
}