// Automatic labor quote for booking requests: Open Labor Project book times x shop rate.
// Parts are never priced here — customer can supply their own or the shop sources them.
import { cleanService } from './booking-bot.ts';

export type LaborQuote = {
  kind: 'diagnosis' | 'labor' | 'none';
  rate: number;
  minHours?: number;
  maxHours?: number;
  job?: string;
  vehicle?: string;
  results?: { engine: string; job: string; hours: number }[];
};

const DIAG = /diag|check engine|engine light|noise|won'?t start|no start|not sure|inspect|leak|overheat|smell|vibrat|general|something|problem|issue/i;

export function parseVehicle(v?: string | null) {
  const m = (v || '').match(/\b(19[89]\d|20[0-3]\d)\s+([A-Za-z-]+)\s+([A-Za-z0-9-]+)/);
  return m ? { year: m[1], make: m[2], model: m[3] } : null;
}

async function shopRate(sb: any) {
  const { data } = await sb.from('labor_rates').select('hourly_rate, is_default').eq('is_active', true).order('is_default', { ascending: false }).limit(1);
  return Number(data?.[0]?.hourly_rate) || 125;
}

export async function buildLaborQuote(sb: any, req: any): Promise<LaborQuote> {
  const rate = await shopRate(sb);
  const svc = cleanService(req.service_type);
  const text = `${req.service_type || ''} ${req.description || ''}`;
  if (!svc || DIAG.test(text)) return { kind: 'diagnosis', rate };
  const veh = parseVehicle(req.vehicle_info);
  const key = Deno.env.get('OPEN_LABOR_API_KEY');
  if (!veh || !key) return { kind: 'none', rate, job: svc };
  try {
    const qs = new URLSearchParams({ year: veh.year, make: veh.make.toLowerCase(), model: veh.model.toLowerCase(), job: svc });
    const r = await fetch(`https://openlaborproject.com/api/v1/labor-times?${qs}`, { headers: { 'x-api-key': key } });
    if (!r.ok) { console.error('olp', r.status, await r.text()); return { kind: 'none', rate, job: svc }; }
    const d = (await r.json())?.data ?? {};
    const results: { engine: string; job: string; hours: number }[] = [];
    for (const e of d.engines ?? []) for (const t of e.laborTimes ?? []) if (typeof t.hours === 'number' && t.hours > 0) results.push({ engine: e.engine ?? '', job: t.job ?? svc, hours: t.hours });
    if (!results.length) return { kind: 'none', rate, job: svc };
    const hrs = results.map((x) => x.hours);
    return { kind: 'labor', rate, job: svc, vehicle: `${veh.year} ${veh.make} ${veh.model}`, results, minHours: Math.min(...hrs), maxHours: Math.max(...hrs) };
  } catch (e) { console.error('olp', e); return { kind: 'none', rate, job: svc }; }
}

const usd = (n: number) => `$${Math.round(n)}`;
const hr = (n: number) => `${Math.round(n * 10) / 10}`;

export function quoteSentence(q: LaborQuote) {
  if (q.kind === 'diagnosis') return 'Diagnosis is $100, and $50 of that goes toward the repair labor.';
  if (q.kind !== 'labor' || q.minHours == null || q.maxHours == null) return '';
  const lab = q.minHours === q.maxHours
    ? `about ${hr(q.minHours)} hrs (${usd(q.minHours * q.rate)})`
    : `about ${hr(q.minHours)}–${hr(q.maxHours)} hrs (${usd(q.minHours * q.rate)}–${usd(q.maxHours * q.rate)}) depending on engine`;
  return `Labor for the ${q.job} is typically ${lab}. Parts are extra — we can get them for you or you can supply your own.`;
}

// Draft estimate for admin review (only when the booker already has an account).
export async function createDraftEstimate(sb: any, req: any, q: LaborQuote) {
  if (q.kind === 'none') return null;
  const email = (req.customer_email || '').trim().toLowerCase();
  const phone = (req.customer_phone || '').replace(/\D/g, '').slice(-10);
  let prof: any = null;
  if (email) prof = (await sb.from('profiles').select('id').ilike('email', email).limit(1)).data?.[0];
  if (!prof && phone) prof = ((await sb.from('profiles').select('id, phone').not('phone', 'is', null)).data || []).find((p: any) => (p.phone || '').replace(/\D/g, '').slice(-10) === phone);
  if (!prof) return null;
  let line;
  if (q.kind === 'diagnosis') line = { description: 'Diagnosis fee ($50 credited to repair labor)', quantity: 1, unit_price: 100, amount: 100, kind: 'labor' };
  else {
    const h = q.maxHours!;
    line = { description: `${q.job} (book labor${q.minHours !== q.maxHours ? `, ${hr(q.minHours!)}–${hr(h)} hrs by engine` : ''})`, quantity: h, unit_price: q.rate, amount: h * q.rate, labor_hours: h, kind: 'labor' };
  }
  const total = line.amount;
  const valid = new Date(Date.now() + 30 * 86400_000).toISOString().slice(0, 10);
  const { data, error } = await sb.from('estimates').insert({
    customer_id: prof.id, status: 'draft', line_items: [line], subtotal: total, total, valid_until: valid,
    customer_phone: req.customer_phone || null,
    notes: `Auto-drafted from booking request (${req.vehicle_info || 'vehicle n/a'}). Labor times are estimates — verify hours and add parts before sending.`,
  }).select('id').single();
  if (error) { console.error('draft estimate', error); return null; }
  return data.id as string;
}

export function quoteNote(q: LaborQuote, estimateId: string | null) {
  const s = quoteSentence(q);
  if (!s) return '';
  return `[Auto quote] ${s}${estimateId ? ' Draft estimate created.' : ''}`;
}
