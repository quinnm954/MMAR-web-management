import { describe, expect, test } from 'bun:test';
import { financingInvoiceInput, invoiceSubscriptionId, syncFinancingInvoice } from '../supabase/functions/_shared/financing-invoice';

describe('financed invoice installments', () => {
  const invoice = { id: 'in_week1', currency: 'usd', status: 'paid', amount_paid: 6360,
    billing_reason: 'subscription_cycle', created: 1792602077,
    parent: { subscription_details: { subscription: 'sub_finance' } },
    lines: { data: [{ parent: { subscription_item_details: {} }, period: { start: 1792414800 } }] },
    status_transitions: { paid_at: 1792602077 } };
  test('a delayed $63.60 weekly payment maps to its original October 19 installment', () => {
    const input = financingInvoiceInput(invoice, 'contract');
    expect(input._amount).toBe(63.60);
    expect(input._due_date).toBe('2026-10-19');
    expect(input._down_payment).toBe(false);
    expect(invoiceSubscriptionId(invoice)).toBe('sub_finance');
  });
  test('the $806.66 checkout payment maps only to the down payment', () => {
    expect(financingInvoiceInput({ ...invoice, billing_reason: 'subscription_create', amount_paid: 80666 }, 'contract')._down_payment).toBe(true);
    expect(financingInvoiceInput({ ...invoice, billing_reason: 'subscription_create', amount_paid: 80666 }, 'contract')._amount).toBe(806.66);
  });
  test('uncollected invoices never mark a scheduled installment paid', async () => {
    let called = false;
    expect(await syncFinancingInvoice({ rpc: () => { called = true; } }, {}, { ...invoice, status: 'open', amount_paid: 0 })).toBe(false);
    expect(called).toBe(false);
  });
  test('a database failure fails the webhook so Stripe can retry', async () => {
    await expect(syncFinancingInvoice({ rpc: async () => ({ error: { message: 'save failed' } }) },
      { subscriptions: { retrieve: async () => ({ metadata: { contract_id: 'contract' } }) } }, invoice)).rejects.toThrow('save failed');
  });
});