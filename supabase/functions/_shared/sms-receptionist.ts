// AI text receptionist: answers any inbound text that the booking bot isn't already handling.
import { sendSms, digits } from './booking-bot.ts';
import { smsAllowed } from './missed-call.ts';
import { oilChangeBlocked, OIL_CHANGE_MEMBERSHIP_REPLY, OIL_CHANGE_MEMBERSHIP_REPLY_ES } from './oil-change-eligibility.ts';

const AI_URL = 'https://ai.gateway.lovable.dev/v1/responses';

async function askAi(system: string, input: { role: string; content: string }[]) {
  const r = await fetch(AI_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'openai/gpt-6-astra', store: false, reasoning: { effort: 'low' }, instructions: system, input }),
  });
  if (!r.ok) throw new Error(`AI ${r.status}: ${await r.text()}`);
  const j = await r.json();
  const text = j.output_text ?? (j.output || []).flatMap((o: any) => o.content || []).map((c: any) => c.text || '').join('');
  const m = String(text).match(/\{[\s\S]*\}/);
  if (!m) throw new Error('AI returned no JSON');
  return JSON.parse(m[0]) as {
    reply: string; handoff?: boolean;
    booking?: { customer_name?: string; vehicle_info?: string; description?: string; service_address?: string; preferred_day?: string } | null;
  };
}

const nowEt = () => new Date().toLocaleString('en-US', { timeZone: 'America/New_York', weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });

export async function handleReceptionistText(sb: any, from: string, body: string, threadId: string) {
  const text = body.trim();
  if (!text || /^\s*(stop|stopall|unsubscribe|cancel|end|quit|start|unstop|help)\s*$/i.test(text)) return;
  const { data: ps } = await sb.from('phone_settings').select('ai_sms_enabled').eq('id', 1).maybeSingle();
  if (ps && ps.ai_sms_enabled === false) return;
  const key = digits(from);
  if (key.length !== 10) return; // short codes / automated senders

  // Skip staff/techs
  const { data: profs } = await sb.from('profiles').select('*').not('phone', 'is', null);
  const prof = (profs || []).find((p: any) => digits(p.phone) === key);
  const { data: emps } = await sb.from('employees').select('phone');
  if ((emps || []).some((e: any) => digits(e.phone) === key)) return;
  if (prof) {
    const { data: roles } = await sb.from('user_roles').select('role').eq('user_id', prof.id);
    if ((roles || []).some((r: any) => r.role !== 'customer' && r.role !== 'user')) return;
  }

  // Don't talk over Mike: skip if a human (non-receptionist) outbound text went out in the last 2h.
  const { data: recent } = await sb.from('sms_messages').select('direction, body, status, created_at')
    .eq('thread_id', threadId).order('created_at', { ascending: false }).limit(20);
  const twoH = Date.now() - 2 * 3600_000;
  if ((recent || []).some((m: any) => m.direction === 'outbound' && m.status !== 'ai' && new Date(m.created_at).getTime() > twoH)) return;

  // Customer context
  let ctx = 'Unknown number (not a saved customer).';
  if (prof) {
    const { data: veh } = await sb.from('vehicles').select('year, make, model, engine').eq('owner_id', prof.id).limit(5);
    ctx = `Saved customer: ${prof.full_name || 'name unknown'}; address: ${[prof.address_line1, prof.address_line2].filter(Boolean).join(', ') || 'none on file'}; vehicles: ${(veh || []).map((v: any) => [v.year, v.make, v.model, v.engine].filter(Boolean).join(' ')).join('; ') || 'none'}. Greet them by first name and confirm saved details instead of asking again.`;
  }
  const { data: regions } = await sb.from('service_regions').select('name, cities, active, slug');
  const { data: techRegions } = await sb.from('user_service_regions').select('region_slug');
  const staffed = new Set((techRegions || []).map((r: any) => r.region_slug));
  const regionText = (regions || []).filter((r: any) => r.active).map((r: any) =>
    `${r.name}${staffed.has(r.slug) ? '' : ' (WAITLIST ONLY: no tech yet — take details, no prices or times)'}: ${(r.cities || []).join(', ')}`).join('\n') || 'Fort Myers, Lehigh Acres';

  const history = [...(recent || [])].reverse().slice(-14).map((m: any) => ({
    role: m.direction === 'inbound' ? 'user' : 'assistant', content: String(m.body || '').slice(0, 800),
  })).filter((m) => m.content);
  if (!history.length || history[history.length - 1].role !== 'user') history.push({ role: 'user', content: text });

  const blockOilChange = async (description: string) => {
    if (!(await oilChangeBlocked(sb, { customer_phone: from, customer_id: prof?.id, description }))) return false;
    const reply = /aceite|cambio/i.test(text) ? OIL_CHANGE_MEMBERSHIP_REPLY_ES : OIL_CHANGE_MEMBERSHIP_REPLY;
    if (await smsAllowed()) {
      await sendSms(sb, from, reply);
      await sb.from('sms_messages').update({ status: 'ai' }).eq('thread_id', threadId).eq('direction', 'outbound').eq('body', reply).eq('status', 'sent');
    }
    return true;
  };
  if (await blockOilChange(text)) return;

  const system = `You are the text receptionist for MMAR — Mike's Mobile Auto Repair, a mobile mechanic (we come to the customer). Now: ${nowEt()} Eastern.
Reply in the customer's language (English or Spanish). Warm, casual, very brief: 1–2 short sentences. Never claim to be Mike; you text for the shop.
Service areas:
${regionText}
Rules:
- We do NOT offer tire work, alignments, or pre-purchase inspections. Say so briefly.
- Oil changes ONLY for MMAR Care members (our maintenance plan); pitch it briefly and offer to have Mike text sign-up details.
- Parts sourcing: whenever parts come up, FIRST suggest they order from the Advance Auto Parts website (advanceautoparts.com) with same-day delivery, and we install. If they insist we provide the parts, agree — we'll source them and Mike includes them in the written quote.
- The only price you may give is the diagnosis fee, only for unknown problems (warning light, noise, no-start, "not sure"): $100, with $50 credited to repair labor if they go ahead. Never quote labor, parts or repair prices — Mike sends a written quote.
- Never offer, book, or confirm appointment times. Collect a preferred day; Mike reviews and texts to confirm. Appointments start the next day at the earliest.
- For service, gather: name, vehicle (year/make/model + engine size, ask once), the problem, service address or city, preferred day. Don't re-ask what's already known. When you have name, vehicle, problem and address, fill "booking" and tell them Mike will review and text to confirm.
- If they ask for Mike/a person, are upset, or it's urgent/unsafe, set handoff=true and say Mike will reach out shortly.
- Payment: cash is not accepted; customers pay the invoice, not the technician.
- If the message needs no reply (e.g. "thanks", "ok", emoji), reply with an empty string.
Customer: ${ctx}
Respond ONLY with JSON: {"reply": string, "handoff": boolean, "booking": null or {"customer_name": string, "vehicle_info": string, "description": string, "service_address": string, "preferred_day": string}}`;

  let ai;
  try { ai = await askAi(system, history); }
  catch (e) { console.error('sms receptionist ai', e); return; }

  if (ai.booking?.description && await blockOilChange(ai.booking.description)) return;

  if (ai.booking && ai.booking.description) {
    const { data: existing } = await sb.from('booking_requests').select('id, customer_phone, status')
      .gte('created_at', new Date(Date.now() - 3 * 86400_000).toISOString()).in('status', ['new', 'contacted']);
    if (!(existing || []).some((r: any) => digits(r.customer_phone) === key)) {
      const b = ai.booking;
      const { error } = await sb.from('booking_requests').insert({
        customer_name: String(b.customer_name || prof?.full_name || 'Text customer').slice(0, 200),
        customer_phone: from,
        customer_email: prof?.email || null,
        vehicle_info: b.vehicle_info ? String(b.vehicle_info).slice(0, 200) : null,
        description: String(b.description).slice(0, 2000),
        service_address: b.service_address ? String(b.service_address).slice(0, 300) : ([prof?.address_line1, prof?.address_line2].filter(Boolean).join(', ') || null),
        service_type: 'General Repair',
        source: 'ai_phone',
        notes: ['Booked by AI text receptionist', b.preferred_day && `Preferred day: ${b.preferred_day}`].filter(Boolean).join('\n'),
      });
      if (error) console.error('sms booking insert', error);
    }
  }
  if (ai.handoff) {
    await sb.rpc('_notify_staff_customer_action', { _title: 'Texter wants Mike', _body: `${prof?.full_name || from}: ${text.slice(0, 120)}`, _link: '/admin/phone' }).then(() => {}, () => {});
  }
  const reply = String(ai.reply || '').trim();
  if (!reply || !(await smsAllowed())) return;
  await sendSms(sb, from, reply);
  // Tag the receptionist's reply so it isn't mistaken for Mike texting.
  await sb.from('sms_messages').update({ status: 'ai' }).eq('thread_id', threadId).eq('direction', 'outbound').eq('body', reply.slice(0, 1500)).eq('status', 'sent');
}
