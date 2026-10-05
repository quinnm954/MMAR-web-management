// Booking follow-up bot: texts website bookers, agrees on a 10am–5pm slot, then converts to an appointment.
const TWILIO_GW = 'https://connector-gateway.lovable.dev/twilio';
const AI_URL = 'https://ai.gateway.lovable.dev/v1/responses';

export const digits = (p: string) => (p || '').replace(/\D/g, '').slice(-10);
const toE164 = (p: string) => `+1${digits(p)}`;

export async function sendSms(sb: any, to: string, body: string) {
  const KEY = Deno.env.get('LOVABLE_API_KEY');
  const TW = Deno.env.get('TWILIO_API_KEY');
  const FROM = Deno.env.get('TWILIO_FROM_NUMBER');
  if (!KEY || !TW || !FROM || !to) return false;
  const r = await fetch(`${TWILIO_GW}/Messages.json`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'X-Connection-Api-Key': TW, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ To: toE164(to), From: FROM, Body: body.slice(0, 1500) }),
  });
  if (!r.ok) { console.error('sms failed', r.status, await r.text()); return false; }
  const msg = await r.json().catch(() => null) as { sid?: string } | null;
  const phone = toE164(to);
  let { data: thread } = await sb.from('sms_threads').select('id').eq('phone', phone).maybeSingle();
  if (!thread) thread = (await sb.from('sms_threads').insert({ phone, last_message_preview: body.slice(0, 80) }).select('id').single()).data;
  if (thread) {
    await sb.from('sms_messages').insert({ thread_id: thread.id, direction: 'outbound', body, twilio_sid: msg?.sid ?? null, status: 'sent' });
    await sb.from('sms_threads').update({ last_message_at: new Date().toISOString(), last_message_preview: body.slice(0, 80) }).eq('id', thread.id);
  }
  return true;
}

function nowEastern() {
  return new Date().toLocaleString('en-US', { timeZone: 'America/New_York', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

const ordinal = (n: number) => {
  const t = n % 100;
  if (t >= 11 && t <= 13) return `${n}th`;
  return `${n}${({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] || 'th'}`;
};

// "2026-10-05" -> "Monday, Oct 5th" (null if invalid or in the past)
export function friendlyDate(iso?: string | null) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return null;
  const d = new Date(`${iso.slice(0, 10)}T12:00:00Z`);
  if (isNaN(d.getTime())) return null;
  const todayEt = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
  if (iso.slice(0, 10) < todayEt) return null;
  const wd = d.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
  const mo = d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
  return `${wd}, ${mo} ${ordinal(d.getUTCDate())}`;
}

// Turns page titles like "Mobile Mechanic in Lehigh Acres, FL" into natural service wording.
export function cleanService(s?: string | null) {
  let t = (s || '').trim();
  if (!t) return null;
  t = t.replace(/\s+(in|near)\s+[A-Z][\w\s.]*,?\s*(FL|Florida)?\s*$/i, '').replace(/\s*[|–—-]\s*.*$/, '').trim();
  if (/^(mobile )?(mechanic|auto repair|car repair|service|repair|general|other|quote)s?$/i.test(t) || /mike'?s|mmar/i.test(t)) return null;
  return t.toLowerCase().replace(/\bac\b/g, 'AC').replace(/\babs\b/g, 'ABS');
}


// ---- Availability: no double booking, travel-aware lead time ----
export const LEAD_MIN = 90;   // minimum notice so Mike can finish up and drive over
export const BLOCK_MIN = 120; // each job holds ~1.5h work + 30m travel
const OPEN_MIN = 600, CLOSE_MIN = 1020, STEP = 30;

function etParts(d: Date) {
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(d);
  const g = (t: string) => f.find((x) => x.type === t)!.value;
  return { date: `${g('year')}-${g('month')}-${g('day')}`, mins: (Number(g('hour')) % 24) * 60 + Number(g('minute')) };
}
export const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
export const label12 = (m: number) => { const h = Math.floor(m / 60); return `${((h + 11) % 12) + 1}:${String(m % 60).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`; };
const addDays = (iso: string, n: number) => { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

// Open start times (minutes after midnight ET) per date, from `fromDate` for `days` days.
export async function openSlots(sb: any, fromDate: string | null, days = 7, excludeApptId?: string | null) {
  const now = etParts(new Date());
  const start = fromDate && fromDate > now.date ? fromDate : now.date;
  const end = addDays(start, days);
  const { data } = await sb.from('appointments').select('id, scheduled_at, status')
    .gte('scheduled_at', new Date(`${addDays(start, -1)}T00:00:00Z`).toISOString())
    .lte('scheduled_at', new Date(`${addDays(end, 1)}T23:59:59Z`).toISOString())
    .not('status', 'in', '(cancelled,canceled,declined,no_show)');
  const busy: Record<string, number[]> = {};
  for (const a of data || []) {
    if (!a.scheduled_at || a.id === excludeApptId) continue;
    const p = etParts(new Date(a.scheduled_at));
    (busy[p.date] ||= []).push(p.mins);
  }
  const out: { date: string; slots: number[] }[] = [];
  for (let i = 0; i < days; i++) {
    const date = addDays(start, i);
    const earliest = date === now.date ? Math.ceil((now.mins + LEAD_MIN) / STEP) * STEP : OPEN_MIN;
    const slots: number[] = [];
    for (let m = Math.max(OPEN_MIN, earliest); m <= CLOSE_MIN; m += STEP)
      if (!(busy[date] || []).some((b) => Math.abs(b - m) < BLOCK_MIN)) slots.push(m);
    out.push({ date, slots });
  }
  return out;
}

export async function isSlotOpen(sb: any, date: string, time: string, excludeApptId?: string | null) {
  const [h, mi] = time.split(':').map(Number);
  const m = h * 60 + mi;
  const [day] = await openSlots(sb, date, 1, excludeApptId);
  return day.date === date && day.slots.includes(m);
}

function windowRange(w?: string | null): [number, number] | null {
  const s = (w || '').toLowerCase();
  if (s.includes('late')) return [900, 1020];
  if (s.includes('afternoon') || s.includes('evening')) return [720, 900];
  if (s.includes('morning')) return [600, 720];
  return null;
}

function windowPart(w?: string | null) {
  const s = (w || '').toLowerCase();
  if (s.includes('late')) return { label: 'afternoon', suggest: '3:00 PM' };
  if (s.includes('afternoon') || s.includes('evening')) return { label: 'afternoon', suggest: '1:00 PM' };
  if (s.includes('morning')) return { label: 'morning', suggest: '10:30 AM' };
  return null;
}

function cityFrom(addr?: string | null) {
  const m = (addr || '').match(/([A-Za-z .]+),\s*(FL|Florida)\b/i);
  return m ? m[1].trim().split(/\s{2,}/).pop() : null;
}

export function buildOpener(req: any, avail: { date: string; slots: number[] }[] = []) {
  const first = (req.customer_name || '').trim().split(/\s+/)[0];
  const svc = cleanService(req.service_type);
  const vehicle = (req.vehicle_info || '').trim();
  const city = cityFrom(req.service_address) || (req.service_type || '').match(/in ([A-Z][\w ]+),\s*FL/)?.[1];
  const what = svc ? `your ${svc} request` : 'your service request';
  const forCar = vehicle ? ` for the ${vehicle}` : '';
  const where = city ? ` in ${city}` : '';
  const day = friendlyDate(req.requested_date);
  const win = windowPart(req.requested_time_window);
  const range = windowRange(req.requested_time_window);
  const reqDay = avail.find((d) => d.date === String(req.requested_date || '').slice(0, 10));
  const inWin = reqDay && range ? reqDay.slots.find((m) => m >= range[0] && m < range[1]) : undefined;
  const nextOpen = avail.flatMap((d) => d.slots.map((m) => ({ d: d.date, m })))[0];
  let ask: string;
  if (day && win && inWin !== undefined) ask = `I see you asked for ${day} in the ${win.label}. Would ${label12(inWin)} work to lock that in?`;
  else if (day && reqDay && reqDay.slots.length) ask = `I see you asked for ${day}. Our next opening that day is ${label12(reqDay.slots[0])} — would that work?`;
  else if (day && nextOpen) ask = `${day} is all booked up, sorry! The next opening is ${friendlyDate(nextOpen.d)} at ${label12(nextOpen.m)} — would that work?`;
  else if (day) ask = `I see you asked for ${day}. What time works best? We're out any time between 10am and 5pm.`;
  else if (nextOpen) ask = `Our next opening is ${friendlyDate(nextOpen.d)} at ${label12(nextOpen.m)} — would that work, or is another day better?`;
  else ask = `What day and time work best for you? We come out any day between 10am and 5pm.`;
  return `Hi${first ? ` ${first}` : ''}, this is Mike's Mobile Auto Repair! Got ${what}${forCar}${where}. ${ask} Reply STOP to opt out.`;
}

export async function startBot(sb: any, id: string) {
  const { data: req } = await sb.from('booking_requests')
    .update({ bot_status: 'active', bot_updated_at: new Date().toISOString() })
    .eq('id', id).is('bot_status', null).is('converted_appointment_id', null)
    .gte('created_at', new Date(Date.now() - 30 * 60_000).toISOString())
    .select('*').maybeSingle();
  if (!req || !req.customer_phone) return { skipped: true };
  const avail = await openSlots(sb, req.requested_date ? String(req.requested_date).slice(0, 10) : null, 7).catch(() => []);
  const text = buildOpener(req, avail);
  await sendSms(sb, req.customer_phone, text);
  await sb.from('booking_requests').update({ bot_history: [{ role: 'assistant', content: text }] }).eq('id', id);
  return { started: true };
}

async function askAi(system: string, history: { role: string; content: string }[]) {
  const r = await fetch(AI_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`, 'Content-Type': 'application/json', 'X-Lovable-AIG-SDK': 'fetch' },
    body: JSON.stringify({
      model: 'openai/gpt-6-astra', stream: true, store: false, reasoning: { effort: 'low' },
      instructions: system,
      input: history.map((m) => ({ role: m.role, content: m.content })),
    }),
  });
  if (!r.ok || !r.body) throw Object.assign(new Error(`AI ${r.status}: ${await r.text()}`), { status: r.status });
  const reader = r.body.pipeThrough(new TextDecoderStream()).getReader();
  let buf = '', out = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += value;
    const lines = buf.split('\n'); buf = lines.pop() || '';
    for (const l of lines) {
      if (!l.startsWith('data:')) continue;
      try { const e = JSON.parse(l.slice(5)); if (e.type === 'response.output_text.delta') out += e.delta; } catch { /* ignore */ }
    }
  }
  const m = out.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('AI returned no JSON');
  return JSON.parse(m[0]) as { reply: string; confirmed: boolean; date?: string; time?: string; handoff?: boolean };
}

// Returns true if the text was handled by the bot.
export async function handleBotReply(sb: any, from: string, body: string) {
  if (/^\s*(stop|cancel|unsubscribe|quit|end)\s*$/i.test(body)) {
    const { data } = await sb.from('booking_requests').select('id, customer_phone').eq('bot_status', 'active');
    for (const r of data || []) if (digits(r.customer_phone) === digits(from))
      await sb.from('booking_requests').update({ bot_status: 'stopped' }).eq('id', r.id);
    return false;
  }
  const { data: list } = await sb.from('booking_requests').select('*').eq('bot_status', 'active')
    .gte('created_at', new Date(Date.now() - 14 * 86400_000).toISOString()).order('created_at', { ascending: false });
  const req = (list || []).find((r: any) => digits(r.customer_phone) === digits(from));
  if (!req) return false;

  const avail = await openSlots(sb, null, 10, req.converted_appointment_id).catch(() => []);
  const availText = avail.map((d) => `${d.date} (${friendlyDate(d.date)}): ${d.slots.length ? d.slots.map(label12).join(', ') : 'FULLY BOOKED'}`).join('\n');
  const history = [...(req.bot_history || []), { role: 'user', content: body }].slice(-20);
  const system = `You text customers for Mike's Mobile Auto Repair (mobile mechanic, Southwest Florida) to set an appointment for their booking request.
Now: ${nowEastern()} (Eastern).
Request: service "${req.service_type || ''}", vehicle "${req.vehicle_info || ''}", issue "${req.description || ''}", address "${req.service_address || ''}".
Customer's requested date/window: ${req.requested_date || 'none'} ${req.requested_time_window || ''}.
OPEN start times (already account for existing appointments, drive time, and at least ${LEAD_MIN} minutes notice):
${availText}
Rules: ONLY offer or confirm times from the OPEN list above — never any other time, and never a time that's about to start. If they ask for a time that isn't listed, say it's taken and offer the closest open times. You are a text assistant for the shop: warm, casual, human, short (1-2 sentences). Never claim to personally be Mike — you text on behalf of the shop; if the customer asks for Mike or the owner by name, set handoff=true and say Mike will reach out. Never re-ask for info already given above or in the chat. Write dates like "Monday, Oct 5th" and times like "10:30 AM" — never raw formats like 2026-10-05 or 14:00. Never paste page titles or system wording. Never quote prices. Once the customer clearly agrees to one specific date and time, set confirmed=true. If they ask for a person, are upset, or it's urgent/unsafe, set handoff=true and say Mike will reach out.
Respond ONLY with JSON: {"reply": string, "confirmed": boolean, "date": "YYYY-MM-DD" or null, "time": "HH:MM" 24h or null, "handoff": boolean}`;

  let ai;
  try { ai = await askAi(system, history); }
  catch (e) {
    console.error('booking bot ai', e);
    await sb.from('booking_requests').update({ bot_status: 'handoff', bot_history: history, bot_updated_at: new Date().toISOString() }).eq('id', req.id);
    await sb.rpc('_notify_staff_customer_action', { _title: 'Booking bot needs you', _body: `${req.customer_name || from} replied; bot couldn't answer.`, _link: '/admin/dashboard?tab=bookings' }).catch(() => {});
    return true;
  }

  let reply = ai.reply;
  let status = ai.handoff ? 'handoff' : 'active';
  if (ai.confirmed && ai.date && ai.time) {
    const open = await isSlotOpen(sb, ai.date, ai.time, req.converted_appointment_id).catch(() => false);
    const { error } = open ? await sb.rpc('bot_confirm_booking_request', { _id: req.id, _date: ai.date, _time: ai.time }) : { error: 'taken' };
    if (error) {
      const day = avail.find((d) => d.date === ai.date)?.slots.length ? avail.find((d) => d.date === ai.date)! : avail.find((d) => d.slots.length);
      reply = day ? `Sorry, that time's already taken. I can do ${friendlyDate(day.date)} at ${day.slots.slice(0, 3).map(label12).join(', ')} — which works best?` : "Sorry, that time's already taken. What other day works for you?";
    } else {
      status = 'confirmed';
      const h = Number(ai.time.split(':')[0]);
      const label = `${((h + 11) % 12) + 1}:${ai.time.split(':')[1]} ${h < 12 ? 'AM' : 'PM'}`;
      const d = new Date(`${ai.date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
      reply = `You're booked for ${d} at ${label}. Mike will see you then! Text this number if anything changes.`;
    }
  }
  await sendSms(sb, from, reply);
  const update: Record<string, unknown> = { bot_history: [...history, { role: 'assistant', content: reply }], bot_updated_at: new Date().toISOString() };
  if (status !== 'confirmed') update.bot_status = status;
  await sb.from('booking_requests').update(update).eq('id', req.id);
  if (status === 'handoff') await sb.rpc('_notify_staff_customer_action', { _title: 'Customer wants Mike', _body: `${req.customer_name || from}: ${body.slice(0, 120)}`, _link: '/admin/dashboard?tab=frontdesk' }).catch(() => {});
  return true;
}
