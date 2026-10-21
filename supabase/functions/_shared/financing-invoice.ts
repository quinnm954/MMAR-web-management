// Supports both pre-Basil and current Stripe invoice shapes.
export function financingInvoiceInput(invoice: any, contractId: string) {
  const line = invoice.lines?.data?.find((l: any) =>
    l.parent?.subscription_item_details || l.subscription || l.price?.recurring);
  const timestamp = invoice.billing_reason === 'subscription_create'
    ? invoice.created : line?.period?.start;
  if (!timestamp) throw new Error('Financing invoice has no installment period');
  const dueDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date(timestamp * 1000));
  return {
    _contract_id: contractId,
    _stripe_invoice_id: invoice.id,
    _due_date: dueDate,
    _down_payment: invoice.billing_reason === 'subscription_create',
    _amount: Number(invoice.amount_paid || 0) / 100,
    _paid_at: new Date((invoice.status_transitions?.paid_at || invoice.created) * 1000).toISOString(),
    _payment_intent_id: typeof invoice.payment_intent === 'string' ? invoice.payment_intent : invoice.payment_intent?.id || null,
  };
}

export function invoiceSubscriptionId(invoice: any): string | null {
  const sub = invoice.subscription || invoice.parent?.subscription_details?.subscription;
  return typeof sub === 'string' ? sub : sub?.id || null;
}

export async function syncFinancingInvoice(admin: any, stripe: any, invoice: any, expectedContractId?: string) {
  if (invoice.currency !== 'usd' || invoice.status !== 'paid' || !invoice.amount_paid) return false;
  const subscriptionId = invoiceSubscriptionId(invoice);
  if (!subscriptionId) return false;
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  const contractId = sub.metadata?.contract_id;
  if (!contractId) return false; // Membership or unrelated subscription.
  if (expectedContractId && expectedContractId !== contractId) return false;
  const { error } = await admin.rpc('record_financing_stripe_invoice', financingInvoiceInput(invoice, contractId));
  if (error) throw new Error(error.message);
  return true;
}