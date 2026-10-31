// Shared intake rules for new phone and text prospects. Saved-customer handoffs are separate.
export type ReceptionistDetails = { customer_name?: unknown; service_address?: unknown; vehicle_info?: unknown };
const value = (v: unknown) => typeof v === 'string' ? v.trim() : '';
export function missingReceptionistDetails(details: ReceptionistDetails): string[] {
  const name = value(details.customer_name);
  const address = value(details.service_address);
  const vehicle = value(details.vehicle_info);
  const missing: string[] = [];
  if (!name || /^(?:phone caller|text customer|unknown|lehigh acres|fort myers)$/i.test(name)) missing.push('name');
  if (!address || !(/\d+\s+\S+/.test(address) || /\b(?:street|st|road|rd|avenue|ave|lane|ln|drive|dr|court|ct|boulevard|blvd|way|trail|intersection|cross street)\b/i.test(address))) missing.push('service street address');
  if (!/\b(?:19|20)\d{2}\s+\S+\s+\S+/.test(vehicle)) missing.push('vehicle year, make and model');
  return missing;
}