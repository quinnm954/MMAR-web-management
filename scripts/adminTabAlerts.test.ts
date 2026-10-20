import { describe, expect, test } from 'bun:test';
import { tabForNotification } from '../src/lib/adminTabAlerts';

describe('tabForNotification', () => {
  test('texts go to Phone', () => expect(tabForNotification({ link: '/admin/dashboard?tab=sms', category: 'message_updates' })).toBe('phone'));
  test('calls go to Phone', () => expect(tabForNotification({ link: '/admin/dashboard?tab=calls', category: null })).toBe('phone'));
  test('booking requests go to Bookings', () => expect(tabForNotification({ link: '/admin/dashboard?tab=booking-requests', category: 'appointment_reminders' })).toBe('bookings'));
  test('repair order alerts go to Repair Orders', () => expect(tabForNotification({ link: '/admin?tab=dashboard', category: 'repair_order_updates' })).toBe('ros'));
  test('unknown goes to Home', () => expect(tabForNotification({ link: null, category: null })).toBe('dashboard'));
});
