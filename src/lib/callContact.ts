export type CallContactRow = {
  direction: string;
  from_number: string | null;
  to_number: string | null;
  customer_id?: string | null;
};

export type CallContactProfile = { id: string; full_name: string | null; phone: string | null };

export const callPhoneKey = (phone?: string | null) => (phone || '').replace(/\D/g, '').slice(-10);
export const callPhone = (call: CallContactRow) => call.direction.startsWith('outbound') ? call.to_number : call.from_number;

export function callCustomerName(call: CallContactRow, profiles: CallContactProfile[]): string | null {
  const linked = profiles.find(profile => profile.id === call.customer_id);
  if (linked?.full_name?.trim()) return linked.full_name.trim();
  const key = callPhoneKey(callPhone(call));
  if (key.length !== 10) return null;
  return profiles.find(profile => callPhoneKey(profile.phone) === key && profile.full_name?.trim())?.full_name?.trim() || null;
}