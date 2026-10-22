// Shared, fail-closed eligibility gate. Never infer a subscription from a customer's claim.
export const isOilChange = (...text: unknown[]) => /\b(?:oil[\s-]*(?:and\s+filter\s+)?change|change\s+(?:the\s+)?oil|cambio\s+de\s+aceite)\b/i.test(text.filter(Boolean).join(' '));

export const OIL_CHANGE_MEMBERSHIP_REPLY = "Oil changes are only available to active MMAR Care subscribers. We haven't verified an active subscription for you, so no appointment is scheduled. Would you like Mike to send the sign-up details?";
export const OIL_CHANGE_MEMBERSHIP_REPLY_ES = 'Los cambios de aceite son solo para suscriptores activos de MMAR Care. No hemos verificado una suscripción activa para usted, así que no hay una cita programada. ¿Quiere que Mike le envíe los detalles para inscribirse?';

export async function hasOilChangeMembership(sb: any, phone?: string | null, customerId?: string | null): Promise<boolean> {
  try {
    const { data, error } = await sb.rpc('oil_change_eligible', { _phone: phone || '', _customer_id: customerId || null });
    return !error && data === true;
  } catch {
    return false;
  }
}

export async function oilChangeBlocked(sb: any, req: any, incoming = '') {
  if (!isOilChange(req.service_type, req.description, req.notes, incoming)) return false;
  return !(await hasOilChangeMembership(sb, req.customer_phone, req.customer_id));
}