// Automatic labor quote for booking requests: Open Labor Project book times x shop rate.
// Parts are never priced here — customer can supply their own or the shop sources them.
import { cleanService, sendSms } from './booking-bot.ts';
import { sendAndLog } from './send-and-log.ts';
import { smsAllowed } from './missed-call.ts';
import { enrollSuffix } from './enroll.ts';
const SITE = 'https://mikesmautorepair.com';

export type LaborQuote = {
  kind: 'diagnosis' | 'labor' | 'none';
  rate: number;
  jobs?: { job: string; hours: number }[];
  engine?: string;
  engineMatched?: boolean;
  job?: string;
  vehicle?: string;
  results?: { engine: string; job: string; hours: number }[];
  vague?: boolean;
  lo?: number; // lowest hours across engines (for the range)
  hi?: number; // highest hours across engines
};

const DIAG = /diag|check engine|engine light|noise|won'?t start|no start|not sure|inspect|leak|overheat|smell|vibrat|general|something|problem|issue/i;
// Category titles from the website service pages — too broad to quote.
const BROAD = /suspension\s*&?\s*(and\s*)?steering|brake (repair|service)s?|engine repair|drivetrain|electrical|mobile .* repair$|repair & service|a\/?c (repair|service)|cooling system|heating/i;

export function parseVehicle(v?: string | null) {
  const m = (v || '').match(/\b(19[89]\d|20[0-3]\d)\s+([A-Za-z-]+)\s+([A-Za-z0-9-]+)/);
  return m ? { year: m[1], make: m[2], model: m[3] } : null;
}

async function shopRate(sb: any) {
  const { data } = await sb.from('labor_rates').select('hourly_rate, is_default').eq('is_active', true).order('is_default', { ascending: false }).limit(1);
  return Number(data?.[0]?.hourly_rate) || 125;
}

// A named part/repair in the request means a specific job, even if the service type is generic ("General Repair").
const PARTS = /starter|alternator|battery|brake|rotor|caliper|pads?\b|water pump|thermostat|radiator|serpentine|timing belt|timing chain|belt|timing|spark plug|ignition coil|fuel pump|o2 sensor|oxygen sensor|shocks?|struts?|tie rod|ball joint|control arm|wheel bearing|cv axle|axle|motor mount|oil change|tune.?up|ac compressor|condenser|blower motor|window regulator|headlight|tail ?light|hose|gasket|catalytic|muffler|exhaust/i;

function specificJob(text: string): string | null {
  const m = text.match(PARTS);
  if (!m) return null;
  if (/not sure|no idea|don'?t know|diagnos|check (it|out)|figure out|suspect|maybe|possibly/i.test(text)) return null;
  const part = m[0].toLowerCase();
  return /oil change|tune.?up|repair/.test(part) ? part : `${part} replacement`;
}

export async function buildLaborQuote(sb: any, req: any): Promise<LaborQuote> {
  const rate = await shopRate(sb);
  const text = `${req.service_type || ''} ${req.description || ''}`;
  const named = specificJob(text);
  const generic = cleanService(req.service_type);
  // A specific service type ("Timing Belt Replacement") wins over a single part word found in it.
  // Broad categories ("Suspension & Steering", "Brake Service") are NEVER sent to the labor guide —
  // only a named part/repair gets a labor quote; otherwise we clarify or use the diagnosis fee.
  const svc = (generic && !DIAG.test(generic) && PARTS.test(generic) && !BROAD.test(generic) ? generic : null) || named;
  if (!svc) return { kind: 'diagnosis', rate, vague: true } as LaborQuote;
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
    // Narrow to the customer's engine: liters (1.4, 1.4L, 1.4T, 1400cc) or cylinders (V6, I4, 4 cyl).
    const vtxt = `${req.engine || ''} ${req.vehicle_info || ''} ${req.description || ''}`;
    const cc = vtxt.match(/\b(\d{4})\s*cc\b/i)?.[1];
    const liters = vtxt.match(/\b(\d\.\d)\s*(?:l|t|liter|litre)?\b/i)?.[1] || (cc ? (Number(cc) / 1000).toFixed(1) : undefined);
    const cylM = vtxt.match(/\b(?:v|i|l)(4|5|6|8|10)\b|\b(4|5|6|8|10)[- ]?cyl/i);
    const cyl = cylM?.[1] || cylM?.[2];
    const engines = [...new Set(results.map((x) => x.engine))];
    let pick = results;
    if (liters) pick = results.filter((x) => x.engine.toLowerCase().startsWith(`${liters}l`) || x.engine.includes(liters));
    if (cyl && pick.length && [...new Set(pick.map((x) => x.engine))].length > 1) {
      const byCyl = pick.filter((x) => new RegExp(`\\b[vil]${cyl}\\b`, 'i').test(x.engine));
      if (byCyl.length) pick = byCyl;
    }
    if (!pick.length) pick = results;
    const engineMatched = engines.length === 1 || new Set(pick.map((x) => x.engine)).size === 1;
    // One line per job version (e.g. "Rear Shocks - Pair" vs "one side"), never a spread.
    const byJob = new Map<string, number>();
    for (const x of pick) byJob.set(x.job, Math.max(byJob.get(x.job) ?? 0, x.hours));
    let jobs = [...byJob].map(([job, hours]) => ({ job, hours }));
    if (jobs.length > 1) {
      // Prefer the job named exactly like the requested part (Starter, not Starter Solenoid).
      const base = svc.toLowerCase().replace(/ replacement$/, '').replace(/s$/, '');
      const exact = jobs.filter((j) => j.job.toLowerCase().replace(/ replacement$/, '').replace(/s$/, '') === base);
      if (exact.length) jobs = exact;
      else {
        // Keep only the jobs that best match the requested words (Timing Belt, not Ignition Timing Adjustment).
        const words = base.split(/\s+/).filter((w) => w.length > 2);
        const score = (j: string) => words.filter((w) => j.toLowerCase().includes(w)).length;
        const best = Math.max(...jobs.map((j) => score(j.job)));
        if (best > 0) jobs = jobs.filter((j) => score(j.job) === best);
        // Of equal matches prefer the plain job name (Timing Belt over Timing Belt Kit/Tensioner).
        if (jobs.length > 1) { const shortest = Math.min(...jobs.map((j) => j.job.length)); const s1 = jobs.filter((j) => j.job.length === shortest); if (!/kit|tensioner|all|pair|both|front|rear/i.test(text)) jobs = s1; }
      }
    }
    if (jobs.length > 1) {
      const wantsPair = /\b(pair|both|all|set|front and rear|2|two)\b/i.test(text);
      const wantsOne = /\b(one|single|1|left|right|driver|passenger)\b/i.test(text);
      const wantsFront = /\bfront\b/i.test(text), wantsRear = /\b(rear|back)\b/i.test(text);
      let f = jobs;
      if (wantsFront && !wantsRear) f = f.filter((j) => /front/i.test(j.job) || !/rear/i.test(j.job));
      if (wantsRear && !wantsFront) f = f.filter((j) => /rear/i.test(j.job) || !/front/i.test(j.job));
      if (wantsPair && !wantsOne) { const p = f.filter((j) => /pair|both|set/i.test(j.job)); if (p.length) f = p; }
      else if (wantsOne && !wantsPair) { const o = f.filter((j) => /one side|single|each/i.test(j.job)); if (o.length) f = o; }
      if (f.length) jobs = f;
    }
    // Range across engines for the chosen job(s): each engine uses its highest matching value.
    const names = new Set(jobs.map((j) => j.job));
    const perEngine = new Map<string, number>();
    for (const x of results) if (names.has(x.job)) perEngine.set(x.engine, Math.max(perEngine.get(x.engine) ?? 0, x.hours));
    const vals = [...perEngine.values()];
    const lo = vals.length ? Math.min(...vals) : undefined, hi = vals.length ? Math.max(...vals) : undefined;
    // Several items to choose from: keep only the highest labor value.
    if (jobs.length > 1) jobs = [jobs.reduce((a, b) => (b.hours > a.hours ? b : a))];
    const engine = engineMatched ? pick[0].engine : undefined;
    return { kind: 'labor', rate, job: svc, vehicle: `${veh.year} ${veh.make} ${veh.model}`, results, jobs, engine, engineMatched, lo, hi };
  } catch (e) { console.error('olp', e); return { kind: 'none', rate, job: svc }; }
}

const usd = (n: number) => `$${Math.round(n)}`;
const hr = (n: number) => `${Math.round(n * 10) / 10}`;

export function quoteSentence(q: LaborQuote) {
  if (q.kind === 'diagnosis') return (q as any).vague
    ? "What's it doing (noises, pulling, loose steering), or is there a specific part you want replaced? If you're not sure, diagnosis is $100 and $50 of that goes toward the repair labor."
    : 'Diagnosis is $100, and $50 of that goes toward the repair labor.';
  if (q.kind !== 'labor' || !q.jobs?.length) return '';
  const h = q.jobs[0].hours;
  // Engine unknown: quote cheapest to most expensive across engines.
  const lab = !q.engineMatched && q.lo != null && q.hi != null && q.hi > q.lo
    ? `Labor for the ${q.job} on your ${q.vehicle} runs about ${usd(q.lo * q.rate)} to ${usd(q.hi * q.rate)} depending on the engine.`
    : `Labor for the ${q.job}${q.engine ? ` on your ${q.engine}` : ''} is about ${hr(h)} hrs (${usd(h * q.rate)}).`;
  return `${lab} Parts are extra — we can get them for you or you can supply your own.`;
}

// Draft estimate for admin review (only when the booker already has an account).
export async function createDraftEstimate(sb: any, req: any, q: LaborQuote, opts: { appointmentId?: string; customerId?: string } = {}) {
  if (q.kind === 'none' && !opts.appointmentId) return null;
  const email = (req.customer_email || '').trim().toLowerCase();
  const phone = (req.customer_phone || '').replace(/\D/g, '').slice(-10);
  let prof: any = opts.customerId ? { id: opts.customerId } : null;
  let isNew = false;
  if (!prof && email) prof = (await sb.from('profiles').select('id').ilike('email', email).limit(1)).data?.[0];
  if (!prof && phone) prof = ((await sb.from('profiles').select('id, phone').not('phone', 'is', null)).data || []).find((p: any) => (p.phone || '').replace(/\D/g, '').slice(-10) === phone);
  if (!prof && email) {
    // Auto-create a login-by-link account for new customers.
    const { data: c, error: ce } = await sb.auth.admin.createUser({ email, email_confirm: true, user_metadata: { full_name: req.customer_name || '', phone: req.customer_phone || '', source: 'auto_quote' } });
    if (ce) { console.error('create user', ce); return null; }
    await sb.from('profiles').upsert({ id: c.user.id, email, full_name: req.customer_name || null, phone: req.customer_phone || null });
    prof = { id: c.user.id }; isNew = true;
  }
  if (!prof && phone) {
    // No email: phone-only account; customer finishes enrolling (email + password) from a texted link.
    const { data: c, error: ce } = await sb.auth.admin.createUser({ phone: `+1${phone}`, phone_confirm: true, user_metadata: { full_name: req.customer_name || '', phone: req.customer_phone || '', source: 'auto_quote', needs_enrollment: true } });
    if (ce) { console.error('create phone user', ce); return null; }
    await sb.from('profiles').upsert({ id: c.user.id, email: null, full_name: req.customer_name || null, phone: req.customer_phone || null });
    prof = { id: c.user.id }; isNew = true;
  }
  if (!prof) return null;
  const valid = new Date(Date.now() + 30 * 86400_000).toISOString().slice(0, 10);
  if (q.kind === 'none') {
    // No labor match: leave an unsent draft on the appointment for staff to fill in.
    const { data, error } = await sb.from('estimates').insert({
      customer_id: prof.id, appointment_id: opts.appointmentId, status: 'draft', line_items: [], subtotal: 0, total: 0, valid_until: valid,
      customer_phone: req.customer_phone || null,
      notes: `Auto-created for confirmed booking (${req.service_type || 'service'}, ${req.vehicle_info || 'vehicle n/a'}). No labor guide match — add labor and parts, then send.`,
    }).select('id').single();
    if (error) { console.error('draft estimate', error); return null; }
    return data.id as string;
  }
  let lines: any[];
  if (q.kind === 'diagnosis') lines = [{ description: 'Diagnosis fee ($50 credited to repair labor)', quantity: 1, unit_price: 100, amount: 100, kind: 'fee' }];
  else lines = (q.jobs || []).map((j) => ({ description: `${j.job} (book labor)`, quantity: 1, unit_price: q.rate, amount: j.hours * q.rate, labor_hours: j.hours, kind: 'labor' }));
  const total = lines.reduce((s, l) => s + l.amount, 0);
  // Engine unknown and engines differ: leave an unsent draft for staff instead of guessing.
  if (q.kind === 'labor' && !q.engineMatched) {
    const { data, error } = await sb.from('estimates').insert({
      customer_id: prof.id, appointment_id: opts.appointmentId || null, status: 'draft', line_items: lines, subtotal: total, total, valid_until: valid,
      customer_phone: req.customer_phone || null,
      notes: `Auto-drafted (${req.vehicle_info || 'vehicle n/a'}). Engine size unknown — confirm engine, adjust hours, add parts, then send.`,
    }).select('id').single();
    if (error) { console.error('draft estimate', error); return null; }
    return data.id as string;
  }
  // Never auto-send: staff review the draft and press Send in Estimates.
  const { data, error } = await sb.from('estimates').insert({
    customer_id: prof.id, status: 'draft', line_items: lines, subtotal: total, total, valid_until: valid,
    customer_phone: req.customer_phone || null, appointment_id: opts.appointmentId || null,
    notes: `Auto-drafted from booking request (${req.vehicle_info || 'vehicle n/a'}). Labor times are estimates — verify hours, add parts, then send.`,
  }).select('id').single();
  if (error) { console.error('draft estimate', error); return null; }
  return data.id as string;
}

export function quoteNote(q: LaborQuote, estimateId: string | null) {
  const s = quoteSentence(q);
  if (!s) return '';
  return `[Auto quote] ${s}${estimateId ? ' Draft estimate created.' : ''}`;
}
