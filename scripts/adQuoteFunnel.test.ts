import { describe, expect, test } from 'bun:test';
import { quoteFunnel, type QuoteRow } from '../src/lib/adQuoteFunnel';

const row = (o: Partial<QuoteRow>): QuoteRow => ({ source: 'in_app', gclid: null, utm_source: null, utm_medium: null, converted_appointment_id: null, ...o });

describe('ad quote funnel', () => {
  test('only quote requests that became appointments count as confirmed', () => {
    const f = quoteFunnel([row({ gclid: 'g1', converted_appointment_id: 'a1' }), row({ gclid: 'g2' })]);
    expect(f.ad).toEqual({ quotes: 2, confirmed: 1, rate: 0.5 });
  });
  test('cancelled appointments do not count as customers', () => {
    const f = quoteFunnel([row({ gclid: 'g', converted_appointment_id: 'a', appointment_status: 'cancelled' })]);
    expect(f.ad.confirmed).toBe(0);
  });
  test('non-ad visitors and phone requests stay out of the ad numbers', () => {
    const f = quoteFunnel([row({}), row({ source: 'ai_phone', gclid: 'g' }), row({ utm_source: 'google', utm_medium: 'cpc' })]);
    expect(f.ad.quotes).toBe(1);
    expect(f.all.quotes).toBe(2);
  });
  test('no requests means no rate, not 0%', () => {
    expect(quoteFunnel([]).ad.rate).toBeNull();
  });
});
