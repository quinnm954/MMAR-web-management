import { describe, expect, test } from 'bun:test';
import { diagnosticRebateAmount, isDiagnosticRebate, withDiagnosticRebate } from '../src/lib/diagnosticRebate';

const labor = { description: 'Battery installation', kind: 'labor' as const, quantity: 1, unit_price: 125, labor_hours: 0.5, amount: 62.5 };
describe('advertised diagnostic rebate', () => {
  test('credits $50 toward repair labor without reducing labor hours', () => {
    const lines = withDiagnosticRebate([labor], true);
    expect(lines.reduce((sum, line) => sum + line.amount, 0)).toBe(12.5);
    expect(lines[0].labor_hours).toBe(0.5);
    expect(lines[1].amount).toBe(-50);
    expect(lines[1].kind).toBe('fee');
  });
  test('does not credit parts or the $100 diagnosis itself', () => {
    expect(diagnosticRebateAmount([
      { ...labor, description: 'Diagnosis', labor_hours: 0.8, amount: 100 },
      { description: 'Battery', kind: 'part', quantity: 1, unit_price: 200, amount: 200 },
    ])).toBe(0);
  });
  test('credit never exceeds repair labor', () => {
    expect(withDiagnosticRebate([{ ...labor, labor_hours: 0.25, amount: 31.25 }], true)[1].amount).toBe(-31.25);
  });
  test('repeated application cannot duplicate the rebate and removal restores total', () => {
    const lines = withDiagnosticRebate(withDiagnosticRebate([labor], true), true);
    expect(lines.filter(isDiagnosticRebate)).toHaveLength(1);
    expect(withDiagnosticRebate(lines, false).reduce((sum, line) => sum + line.amount, 0)).toBe(62.5);
  });
  test('editing labor recalculates the credit', () => {
    const lines = withDiagnosticRebate([labor], true);
    lines[0] = { ...labor, labor_hours: 0.1, amount: 12.5 };
    expect(withDiagnosticRebate(lines)[1].amount).toBe(-12.5);
    expect(withDiagnosticRebate(lines.filter(line => line.kind !== 'labor'))).toHaveLength(0);
  });
});