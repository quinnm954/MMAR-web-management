import { describe, expect, test } from 'bun:test';
import { findEstimateInvoice, isFinalEstimate } from '../src/lib/estimateStatus';

const estimate = { appointment_id: 'job', created_at: '2026-10-20T12:00:00Z' };
const invoice = { id: 'invoice', appointment_id: 'job', status: 'paid', created_at: '2026-10-20T13:00:00Z' };
describe('estimate invoice completion', () => {
  test('a generated paid invoice is found through its appointment', () => {
    expect(findEstimateInvoice(estimate, [invoice], [])?.status).toBe('paid');
  });
  test('an unpaid invoice is not proof of completion', () => {
    expect(findEstimateInvoice(estimate, [{ ...invoice, status: 'partial' }], [])?.status).toBe('partial');
  });
  test('an older paid diagnosis cannot complete a later repair estimate', () => {
    expect(findEstimateInvoice(estimate, [{ ...invoice, created_at: '2026-10-19T13:00:00Z' }], [])).toBeUndefined();
  });
  test('an explicit unpaid invoice takes precedence over another paid invoice', () => {
    const explicit = { ...invoice, id: 'explicit', status: 'unpaid' };
    expect(findEstimateInvoice({ ...estimate, converted_to_invoice_id: 'explicit' }, [invoice, explicit], [])?.status).toBe('unpaid');
  });
  test('paid invoice linked through any service record is found', () => {
    expect(findEstimateInvoice(estimate, [{ ...invoice, appointment_id: null, service_record_id: 'second' }], [
      { id: 'first', appointment_id: 'job' }, { id: 'second', appointment_id: 'job' },
    ])?.status).toBe('paid');
  });
  test('completed estimates remain finalized instead of requiring approval again', () => {
    expect(isFinalEstimate('completed')).toBe(true);
    expect(isFinalEstimate('sent')).toBe(false);
  });
});