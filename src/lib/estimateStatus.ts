type EstimateLink = {
  converted_to_invoice_id?: string | null;
  appointment_id?: string | null;
  created_at: string;
};
type InvoiceLink = {
  id: string;
  status: string;
  appointment_id?: string | null;
  service_record_id?: string | null;
  created_at: string;
};

/** Explicit links win; an older diagnosis invoice must not complete a newer repair estimate. */
export function findEstimateInvoice<T extends InvoiceLink>(
  estimate: EstimateLink,
  invoices: T[],
  serviceRecords: { id: string; appointment_id: string | null }[],
): T | undefined {
  if (estimate.converted_to_invoice_id) {
    return invoices.find(i => i.id === estimate.converted_to_invoice_id);
  }
  if (!estimate.appointment_id) return undefined;
  const candidates = invoices.filter(i => {
    const appointmentId = i.appointment_id || serviceRecords.find(sr => sr.id === i.service_record_id)?.appointment_id;
    return appointmentId === estimate.appointment_id && new Date(i.created_at).getTime() >= new Date(estimate.created_at).getTime();
  });
  return candidates.find(i => i.status === 'paid') || candidates[0];
}

export const isFinalEstimate = (status: string) => status === 'completed' || status === 'converted';
export const estimateStatusLabel = (status: string) => status === 'completed' ? 'Completed' : status === 'converted' ? 'In repair' : status.replace(/_/g, ' ');