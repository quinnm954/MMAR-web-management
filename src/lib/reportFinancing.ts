import { supabase } from '@/integrations/supabase/client';
import { financingReceiptRevenue } from './reportInvoice';

/** Full cash receipts, not the principal-only mirror in invoice_payments. */
export async function financingReportReceipts(since: string, until: string, region: string) {
  const { data, error } = await supabase.from('financing_payments')
    .select('id, amount, status, paid_at, stripe_payment_intent_id, contract:financing_contracts!inner(invoice:invoices!inner(id, invoice_number, customer_id, technician_id, service_record_id, region_slug))')
    .eq('status', 'paid').gte('paid_at', since).lt('paid_at', until);
  if (error) throw error;
  return (data ?? []).flatMap(receipt => {
    const invoice = receipt.contract?.invoice;
    if (!invoice || !receipt.paid_at || (region !== 'all' && invoice.region_slug !== region)) return [];
    return [{
      ...invoice,
      id: receipt.id,
      total: financingReceiptRevenue(receipt),
      subtotal: 0,
      status: 'financing_receipt',
      created_at: receipt.paid_at,
      paid_at: receipt.paid_at,
      line_items: [],
      stripe_session_id: null,
      stripe_payment_intent_id: receipt.stripe_payment_intent_id,
      stripe_fee: null,
      stripe_fee_synced_at: null,
    }];
  });
}