import { expect, test } from 'bun:test';
import { buildLaborQuote } from '../supabase/functions/_shared/labor-quote';

const guide = ['Brake Booster', 'Brake Master Cylinder', 'Front Brake Pads', 'Rear Brake Pads', 'Front Brake Pads & Rotors', 'Rear Brake Pads & Rotors', 'Brake Lines'];
const sb = { from: () => ({ select: () => ({ eq: () => ({ order: () => ({ limit: async () => ({ data: [{ hourly_rate: 125 }] }) }) }) }) }) };
let asked = '';
(globalThis as any).Deno = { env: { get: () => 'key' } };
globalThis.fetch = (async (url: string) => {
  asked = new URL(url).searchParams.get('job') || '';
  return new Response(JSON.stringify({ data: { engines: [{ engine: '1.8L I4', laborTimes: guide.map((job, i) => ({ job, hours: 1 + i / 10 })) }] } }));
}) as any;
const quote = (description: string, service_type = 'Mobile Brake Repair') =>
  buildLaborQuote(sb, { description, service_type, vehicle_info: '2014 Honda Civic LX' });
const jobNames = (q: any) => (q.jobs || []).map((j: any) => j.job);

test('"back breaks replaced" quotes rear brakes, never the booster', async () => {
  const q: any = await quote('I need the back breaks replaced');
  expect(q.kind).toBe('labor');
  expect(jobNames(q).every((j: string) => j.startsWith('Rear Brake Pads'))).toBe(true);
});
test('"front brakes" quotes front brakes', async () => {
  const q: any = await quote('front brakes are grinding, replace them');
  expect(jobNames(q).every((j: string) => j.startsWith('Front Brake Pads'))).toBe(true);
});
test('plain "brakes" never picks booster, master cylinder or lines', async () => {
  const q: any = await quote('replace my brakes');
  expect(jobNames(q).some((j: string) => /booster|master|lines/i.test(j))).toBe(false);
});
test('the description wins over the website service name', async () => {
  await quote('replace the alternator', 'Mobile Battery Replacement');
  expect(asked).toBe('alternator replacement');
});
test('no clear part still gets the $100 diagnosis fee', async () => {
  const q: any = await quote('car making a weird problem, not sure', 'General Repair');
  expect(q.kind).toBe('diagnosis');
});
