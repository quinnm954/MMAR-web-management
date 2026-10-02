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

const ordinal = (n: number) => `${n}${[, 'st', 'nd', 'rd'][(n % 100 >> 3) ^ 1 && n % 10] || 'th'}`;

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

export function buildOpener(req: any) {
  const first = (req.customer_name || '').trim().split(/\s+/)[0];
  const svc = cleanService(req.service_type);
  const vehicle = (req.vehicle_info || '').trim();
  const city = cityFrom(req.service_address) || (req.service_type || '').match(/in ([A-Z][\w ]+),\s*FL/)?.[1];
  const what = svc ? `your ${svc} request` : 'your service request';
  const forCar = vehicle ? ` for the ${vehicle}` : '';
  const where = city ? ` in ${city}` : '';
  const day = friendlyDate(req.requested_date);
  const win = windowPart(req.requested_time_window);
  let ask: string;
  if (day && win) ask = `I see you asked for ${day} in the ${win.label}. Would ${win.suggest} work to lock that in, or is another time between 10am and 5pm better?`;
  else if (day) ask = `I see you asked for ${day}. What time works best? We're out any time between 10am and 5pm.`;
  else ask = `What day and time work best for you? We come out any day between 10am and 5pm.`;
  return `Hi${first ? ` ${first}` : ''}, this is Mike with Mike's Mobile Auto Repair! Got ${what}${forCar}${where}. ${ask} Reply STOP to opt out.`;
}

export async function startBot(sb: any, id: string) {
  const { data: req } = await sb.from('booking_requests')
    .update({ bot_status: 'active', bot_updated_at: new Date().toISOString() })
    .eq('id', id).is('bot_status', null).is('converted_appointment_id', null)
    .gte('created_at', new Date(Date.now() - 30 * 60_000).toISOString())
    .select('*').maybeSingle();
  if (!req || !req.customer_phone) return { skipped: true };
  const text = buildOpener(req);
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

  const history = [...(req.bot_history || []), { role: 'user', content: body }].slice(-20);
  const system = `You text customers for Mike's Mobile Auto Repair (mobile mechanic, Southwest Florida) to set an appointment for their booking request.
Now: ${nowEastern()} (Eastern).
Request: service "${req.service_type || ''}", vehicle "${req.vehicle_info || ''}", issue "${req.description || ''}", address "${req.service_address || ''}".
Rules: appointments any day, ONLY between 10:00 and 17:00 Eastern, never in the past. Offer the nearest valid time if they ask outside it. Keep replies short and friendly (1-2 sentences, SMS). Never quote prices. Once the customer clearly agrees to one specific date and time, set confirmed=true. If they ask for a person, are upset, or it's urgent/unsafe, set handoff=true and say Mike will reach out.
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
    const { error } = await sb.rpc('bot_confirm_booking_request', { _id: req.id, _date: ai.date, _time: ai.time });
    if (error) {
      reply = "Sorry, that time doesn't work. We book any day between 10am and 5pm. What other time works for you?";
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
