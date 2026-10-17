import { describe, expect, test } from 'bun:test';
import { isReportSale, isReportTransaction, reportInvoiceRevenue } from './reportInvoice';

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