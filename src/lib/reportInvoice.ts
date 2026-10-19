type ReportInvoice = { status: string; total: number | null };

export const isReportSale = (invoice: ReportInvoice) => invoice.status === 'paid';
export const isReportTransaction = (invoice: ReportInvoice) =>
  isReportSale(invoice) || invoice.status === 'refunded';

/** Standalone refund receipts are money out, never sales or payable labor. */
export const reportInvoiceRevenue = (invoice: ReportInvoice) => {
  const total = Number(invoice.total || 0);
  if (invoice.status === 'refunded') return -Math.abs(total);
  return isReportSale(invoice) ? total : 0;
};

type PayInvoice = ReportInvoice & { amount_paid?: number | null; is_financed?: boolean | null };

/** Amount a customer can still pay online; refunds, void, paid and financed invoices owe 0. */
export const invoiceBalanceDue = (inv: PayInvoice) => {
  if (['paid', 'refunded', 'void'].includes(inv.status) || inv.is_financed) return 0;
  return Math.max(0, Number(inv.total || 0) - Number(inv.amount_paid || 0));
};
export const isPayableInvoice = (inv: PayInvoice) => invoiceBalanceDue(inv) > 0;
