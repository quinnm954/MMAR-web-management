import { supabase } from '@/integrations/supabase/client';

export type LineItem = {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  kind?: 'part' | 'labor' | 'fee';
  unit_cost?: number;
  labor_hours?: number;
};

/**
 * Move an approved estimate's appointment into active Repair Order state.
 */
export async function startRepairOrderFromEstimate(estimate: { id: string; appointment_id: string | null; status: string }) {
  if (!estimate.appointment_id) {
    throw new Error('This estimate is not linked to an appointment.');
  }
  if (estimate.status !== 'approved' && estimate.status !== 'partially_approved') {
    throw new Error('Only approved estimates can start a Repair Order.');
  }
  const { error: aErr } = await supabase
    .from('appointments')
    .update({ status: 'in_progress', board_column: 'in_progress' })
    .eq('id', estimate.appointment_id);
  if (aErr) throw aErr;
  const { error: eErr } = await supabase
    .from('estimates')
    .update({ status: 'converted' })
    .eq('id', estimate.id);
  if (eErr) throw eErr;
  return estimate.appointment_id;
}

/**
 * Generate an invoice for a Repair Order (appointment) from its approved estimate
 * line items. Invoice creation happens via service_records → trigger create_invoice_from_service_record.
 */
export async function generateInvoiceForRepairOrder(opts: {
  appointmentId: string;
  customerId: string;
  vehicleId: string | null;
  serviceType: string;
  approvedLineItems: LineItem[];
  invoiceTotal: number;
  mileage?: number | null;
  /** Estimate to mirror exactly on the invoice (subtotal/tax/shop/discount/total). */
  estimate?: {
    subtotal?: number | null;
    shop_supplies?: number | null;
    tax?: number | null;
    total?: number | null;
    discount_type?: string | null;
    discount_value?: number | null;
    discount_amount?: number | null;
    discount_reason?: string | null;
  } | null;
}) {
  const { appointmentId, customerId, vehicleId, serviceType, approvedLineItems, invoiceTotal, mileage, estimate } = opts;
  if (!vehicleId) throw new Error('Repair Order has no vehicle linked — add one before invoicing.');
  if (invoiceTotal <= 0) throw new Error('Nothing approved to invoice.');

  // 1. Insert a service record (the trigger create_invoice_from_service_record will issue an invoice)
  const { data: sr, error: sErr } = await supabase
    .from('service_records')
    .insert({
      appointment_id: appointmentId,
      customer_id: customerId,
      vehicle_id: vehicleId,
      service_type: serviceType,
      service_date: new Date().toISOString().slice(0, 10),
      mileage_at_service: mileage ?? null,
      labor_performed: approvedLineItems.map(l => `${l.quantity} × ${l.description}`).join('\n'),
      parts_used: approvedLineItems as any,
      invoice_total: invoiceTotal,
    })
    .select('id')
    .single();
  if (sErr) throw sErr;

  // 2. If we have the source estimate, override the auto-generated invoice totals
  //    so the invoice matches the approved estimate exactly (including flat
  //    diagnosis fees that should not be taxed).
  if (estimate) {
    const { data: inv } = await supabase
      .from('invoices')
      .select('id')
      .eq('service_record_id', sr.id)
      .maybeSingle();
    if (inv?.id) {
      const subtotal = Number(estimate.subtotal ?? invoiceTotal) || 0;
      const shop = Number(estimate.shop_supplies ?? 0) || 0;
      const tax = Number(estimate.tax ?? 0) || 0;
      const total = Number(estimate.total ?? (subtotal + shop + tax)) || 0;
      await supabase
        .from('invoices')
        .update({
          line_items: approvedLineItems as any,
          subtotal,
          shop_supplies: shop,
          tax,
          total,
          discount_type: (estimate.discount_type as any) ?? 'amount',
          discount_value: Number(estimate.discount_value ?? 0) || 0,
          discount_amount: Number(estimate.discount_amount ?? 0) || 0,
          discount_reason: estimate.discount_reason ?? null,
        })
        .eq('id', inv.id);
    }
  }

  // 3. Mark the appointment completed
  await supabase
    .from('appointments')
    .update({ status: 'completed', board_column: 'completed' })
    .eq('id', appointmentId);

  return sr.id;
}
