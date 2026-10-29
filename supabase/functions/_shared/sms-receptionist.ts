// AI text receptionist: answers any inbound text that the booking bot isn't already handling.
import { sendSms, digits, openSlots, label12, isSlotOpen, friendlyDate } from './booking-bot.ts';
import { receptionistSlots, receptionistFromDate, requestsMorning } from './receptionist-times.ts';
import { smsAllowed } from './missed-call.ts';
import { oilChangeBlocked, OIL_CHANGE_MEMBERSHIP_REPLY, OIL_CHANGE_MEMBERSHIP_REPLY_ES } from './oil-change-eligibility.ts';
import { checkedTextSlot, saveTextBookingRequest, resolvedTextBooking, missingTextContact, deferKnownCustomerDetails, type TextBooking, type OpenDay } from './sms-booking-request.ts';

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
    booking?: TextBooking | null;
    slot?: { date: string; time: string; accepted: boolean } | null;
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
  const deferDetails = history.some(m => m.role === 'user' && deferKnownCustomerDetails(m.content, Boolean(prof)));

  const blockOilChange = async (description: string) => {
    if (!(await oilChangeBlocked(sb, { customer_phone: from, customer_id: prof?.id, description }))) return false;
    const reply = /aceite|cambio/i.test(text) ? OIL_CHANGE_MEMBERSHIP_REPLY_ES : OIL_CHANGE_MEMBERSHIP_REPLY;
    if (await smsAllowed()) {
      await sendSms(sb, from, reply, 'ai');
    }
    return true;
  };
  if (await blockOilChange(text)) return;

  const morningRequested = history.some(m => m.role === 'user' && requestsMorning(m.content));
  let availability = 'Availability could not be checked. Take the preferred day and ask Mike to follow up; do not invent a time.';
  let days: OpenDay[] = [];
  try {
    days = receptionistSlots(await openSlots(sb, receptionistFromDate(null), 10), morningRequested);
    availability = days.map(day => `${day.date}: ${day.slots.length ? day.slots.map(label12).join(', ') : 'no openings'}`).join('\n');
  } catch (error) { console.error('sms availability', error); }

  const system = `You are the text receptionist for MMAR — Mike's Mobile Auto Repair, a mobile mechanic (we come to the customer). Now: ${nowEt()} Eastern.
Reply in the customer's language (English or Spanish). Warm, casual, very brief: 1–2 short sentences. Never claim to be Mike; you text for the shop.
Service areas:
${regionText}
Rules:${Date.now() < Date.parse('2026-11-02T05:00:00Z') ? `
- IMPORTANT TEMPORARY NOTICE: Mike's service vehicle is down, waiting on parts. In your first reply, briefly let the customer know we are taking requests for next week, with Monday Nov 2 the earliest possible day. Mike must confirm the time.` : ''}
- Never offer appointments before Monday Nov 2, 2026. After that date, continue the next-day minimum, not a rolling next-week delay.
- We do NOT offer tire work, alignments, or pre-purchase inspections. Say so briefly.
- Oil changes ONLY for MMAR Care members (our maintenance plan); pitch it briefly and offer to have Mike text sign-up details.
- Parts sourcing: whenever parts come up, FIRST suggest they order from the Advance Auto Parts website (advanceautoparts.com) with same-day delivery, and we install. If they insist we provide the parts, agree — we'll source them and Mike includes them in the written quote.
- The only price you may give is the diagnosis fee, only for unknown problems (warning light, noise, no-start, "not sure"): $100, with $50 credited to repair labor if they go ahead. Never quote labor, parts or repair prices — Mike sends a written quote.
- Default to noon–5 PM Eastern, except from Monday Nov 2, 2026 on the default is 10 AM–5 PM; before that, morning times only when the customer explicitly asks. When asked for tomorrow (or another day), OFFER the earliest checked time on that day in the same reply as any missing-detail question. Do not just call it a preferred day or wait for a name/address before offering. If that day has no openings, say so and offer the next listed day. All offers are pending Mike's final approval, NOT confirmed appointments. Appointments start the next day at the earliest. If availability failed, do not invent a time.
- Whenever offering or discussing a specific time, fill "slot" with its OPEN date/time. Set accepted=true ONLY when the customer chooses or agrees to that specific time, never just because they ask for tomorrow. Save an accepted time as a pending booking request even while collecting missing details. Never say a request was saved before it is saved. Use natural dates/times in the reply, not raw JSON formats.
OPEN times (Eastern, accounting for appointments, travel and blocked time):
${availability}
- For service, gather: name, vehicle (year/make/model + engine size, ask once), the problem, service address or city, preferred day. Don't re-ask what's already known. Fill "booking" using ALL known details when the customer accepts a specific slot (even if name/address is still missing), or when all intake details are collected. Do not replace known details with blanks. Mike must review and confirm every request.
- For a saved customer who says Mike already knows their details, acknowledge that and leave missing details to Mike. Do not ask the same intake questions again or invent their address. ${deferDetails ? 'This customer already said Mike knows: do not ask for name or address again; hand off missing details to Mike.' : ''}
- If they ask for Mike/a person, are upset, or it's urgent/unsafe, set handoff=true and say Mike will reach out shortly.
- Payment: cash is not accepted; customers pay the invoice, not the technician.
- If the message needs no reply (e.g. "thanks", "ok", emoji), reply with an empty string.
Customer: ${ctx}
Respond ONLY with JSON: {"reply": string, "handoff": boolean, "slot": null or {"date": "YYYY-MM-DD", "time": "HH:MM", "accepted": boolean}, "booking": null or {"customer_name": string, "vehicle_info": string, "description": string, "service_address": string, "preferred_day": string}}`;

  let ai;
  try { ai = await askAi(system, history); }
  catch (e) { console.error('sms receptionist ai', e); return; }

  if (ai.booking?.description && await blockOilChange(ai.booking.description)) return;

  const slot = checkedTextSlot(ai.slot, days);
  let reply = String(ai.reply || '').trim();
  const spanish = /mañana|puedes|nombre|dirección|ya sabe|ya lo sabe/i.test(text);
  const contactQuestion = (booking: TextBooking) => {
    const missing = missingTextContact(booking);
    if (deferDetails || !missing.length) return '';
    return spanish ? ` ¿Cuál es ${missing.map(f => f === 'name' ? 'tu nombre' : 'la dirección de servicio').join(' y ')}?`
      : ` What's your ${missing.join(' and ')}?`;
  };
  if (ai.slot && (!slot || !(await isSlotOpen(sb, slot.date, slot.time).catch(() => false)))) {
    reply = (spanish ? 'No pude verificar ese horario; Mike revisará la disponibilidad.'
      : "I couldn't verify that time; Mike will check availability.") + contactQuestion(resolvedTextBooking(ai.booking || {}, prof));
  } else if (ai.booking?.description) {
    try {
      const saved = await saveTextBookingRequest(sb, from, ai.booking, slot, prof);
      if (slot?.accepted) {
        const time = label12(Number(slot.time.slice(0, 2)) * 60 + Number(slot.time.slice(3)));
        reply = /mañana|puedes|nombre|dirección/i.test(text)
          ? `Solicitud guardada para ${friendlyDate(slot.date)} a las ${time}; Mike debe aprobar y confirmar la hora.`
          : `I've requested ${friendlyDate(slot.date)} at ${time}; Mike will review and text to confirm.`;
        reply += contactQuestion(saved);
      }
    } catch (error) {
      console.error('sms booking save', error);
      reply = "I couldn't save your request yet; Mike will follow up to confirm availability.";
    }
  } else if (slot?.accepted) {
    reply = "Mike will follow up about that time; it isn't confirmed yet." + contactQuestion(resolvedTextBooking({}, prof));
  }
  if (deferKnownCustomerDetails(text, Boolean(prof))) {
    reply = spanish ? 'Entendido, dejaré que Mike revise los detalles que faltan y te confirme.'
      : "Got it—I'll leave the remaining details to Mike and have him follow up to confirm.";
    ai.handoff = true;
  }
  if (ai.handoff) {
    await sb.rpc('_notify_staff_customer_action', { _title: 'Texter wants Mike', _body: `${prof?.full_name || from}: ${text.slice(0, 120)}`, _link: '/admin/phone' }).then(() => {}, () => {});
  }
  if (!reply || !(await smsAllowed())) return;
  await sendSms(sb, from, reply, 'ai');
}
