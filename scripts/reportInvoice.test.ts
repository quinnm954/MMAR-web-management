import { describe, expect, test } from 'bun:test';
import { financingReceiptRevenue, isReportSale, isReportTransaction, reportInvoiceRevenue } from '../src/lib/reportInvoice';

describe('completed refund reporting', () => {
  const alexRefund = { status: 'refunded', total: -600 };
  test('Alex’s completed $600 refund reduces revenue by $600', () => {
    expect(reportInvoiceRevenue(alexRefund)).toBe(-600);
    expect(reportInvoiceRevenue({ status: 'paid', total: 1000 }) + reportInvoiceRevenue(alexRefund)).toBe(400);
  });
  test('a refund is included in reports but not counted as a sale', () => {
    expect(isReportTransaction(alexRefund)).toBe(true);
    expect(isReportSale(alexRefund)).toBe(false);
    expect(isReportSale({ status: 'paid', total: 1000 })).toBe(true);
  });
  test('positive refund values still represent money out', () => {
    expect(reportInvoiceRevenue({ status: 'refunded', total: 600 })).toBe(-600);
  });
});

describe('financed cash revenue', () => {
  test('Jose’s received down payment adds $806.66 while the invoice stays partial', () => {
    expect(reportInvoiceRevenue({ status: 'partial', total: 1613.32, is_financed: true }) + financingReceiptRevenue({ status: 'paid', amount: 806.66, paid_at: '2026-10-13T14:01:19.764Z' })).toBe(806.66);
  });
  test('a received weekly installment includes the full $63.60 collected', () => {
    expect(financingReceiptRevenue({ status: 'paid', amount: 63.60, paid_at: '2026-10-26T13:00:00Z' })).toBe(63.60);
  });
  test('a failed or scheduled installment contributes nothing', () => {
    for (const status of ['failed', 'scheduled', 'pending']) {
      expect(financingReceiptRevenue({ status, amount: 63.60, paid_at: null })).toBe(0);
    }
  });
  test('closing the $1,613.32 financed invoice does not count its total again', () => {
    expect(reportInvoiceRevenue({ status: 'paid', total: 1613.32, is_financed: true })).toBe(0);
  });
});
import { invoiceBalanceDue, isPayableInvoice } from '../src/lib/reportInvoice';
describe('customer balance due', () => {
  test('the -$600 refund is not payable and adds $0', () => {
    expect(isPayableInvoice({ status: 'refunded', total: -600, amount_paid: 0 })).toBe(false);
    expect(invoiceBalanceDue({ status: 'refunded', total: -600, amount_paid: 0 })).toBe(0);
  });
  test('$1,000 unpaid with $400 paid owes $600', () => {
    expect(invoiceBalanceDue({ status: 'unpaid', total: 1000, amount_paid: 400 })).toBe(600);
  });
  test('financed invoices are not payable online', () => {
    expect(isPayableInvoice({ status: 'unpaid', total: 1613.32, amount_paid: 806.66, is_financed: true })).toBe(false);
  });
});
