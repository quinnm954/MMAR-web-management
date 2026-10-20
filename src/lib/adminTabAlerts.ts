// Maps an in-app notification to the admin menu option it belongs to.
const ALIASES: Record<string, string> = {
  sms: 'phone', calls: 'phone', texts: 'phone', emails: 'phone', messages: 'phone',
  'booking-requests': 'bookings', checklists: 'inspections',
};
const BY_CATEGORY: Record<string, string> = {
  message_updates: 'phone',
  appointment_reminders: 'bookings',
  repair_order_updates: 'ros',
  estimate_updates: 'estimates',
  invoice_updates: 'invoices',
  inspection_updates: 'inspections',
  membership_updates: 'memberships',
};

export function tabForNotification(n: { link: string | null; category: string | null }): string {
  const link = n.link || '';
  if (link.startsWith('/admin/phone')) return 'phone';
  const m = link.match(/[?&]tab=([^&#]+)/);
  if (m) {
    const t = decodeURIComponent(m[1]);
    const mapped = ALIASES[t] ?? t;
    if (mapped !== 'dashboard' || !n.category || !BY_CATEGORY[n.category]) return mapped;
  }
  if (/customer|profile/i.test(link)) return 'customers';
  return (n.category && BY_CATEGORY[n.category]) || 'dashboard';
}
