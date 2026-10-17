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