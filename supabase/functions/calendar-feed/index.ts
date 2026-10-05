// Public ICS calendar feed for staff. GET ?token=<hex>
import { createClient } from 'npm:@supabase/supabase-js@2';

const SITE = 'https://mikesmautorepair.com';
const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

const esc = (s: unknown) => String(s ?? '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
const fold = (line: string) => {
  const out: string[] = [];
  let s = line;
  while (s.length > 74) { out.push(s.slice(0, 74)); s = ' ' + s.slice(74); }
  out.push(s);
  return out.join('\r\n');
};
const utc = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const local = (date: string, hhmm: string) => `${date.replace(/-/g, '')}T${hhmm.replace(':', '')}00`;

function windowRange(w: string | null): [string, string] {
  const s = (w || '').toLowerCase();
  if (s.includes('early afternoon')) return ['12:00', '15:00'];
  if (s.includes('late afternoon')) return ['15:00', '17:00'];
  if (s.includes('morning')) return ['10:00', '12:00'];
  if (s.includes('afternoon') || s.includes('evening') || s.includes('late')) return ['13:00', '15:00'];
  const m = s.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
  if (m) {
    let h = +m[1]; if (m[3] === 'pm' && h < 12) h += 12; if (m[3] === 'am' && h === 12) h = 0;
    const st = `${String(h).padStart(2, '0')}:${m[2] || '00'}`;
    return [st, `${String(Math.min(h + 2, 23)).padStart(2, '0')}:${m[2] || '00'}`];
  }
  return ['10:30', '12:30'];
}

const VTZ = [
  'BEGIN:VTIMEZONE', 'TZID:America/New_York',
  'BEGIN:DAYLIGHT', 'TZOFFSETFROM:-0500', 'TZOFFSETTO:-0400', 'TZNAME:EDT', 'DTSTART:19700308T020000', 'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU', 'END:DAYLIGHT',
  'BEGIN:STANDARD', 'TZOFFSETFROM:-0400', 'TZOFFSETTO:-0500', 'TZNAME:EST', 'DTSTART:19701101T020000', 'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU', 'END:STANDARD',
  'END:VTIMEZONE',
];

Deno.serve(async (req) => {
  const token = new URL(req.url).searchParams.get('token') || '';
  if (!/^[a-f0-9]{16,96}$/.test(token)) return new Response('Not found', { status: 404 });
  const { data: tok } = await sb.from('calendar_feed_tokens').select('user_id').eq('token', token).maybeSingle();
  if (!tok) return new Response('Not found', { status: 404 });
  const { data: staff } = await sb.rpc('is_staff', { _user_id: tok.user_id });
  if (!staff) return new Response('Not found', { status: 404 });
  const { data: roles } = await sb.from('user_roles').select('role').eq('user_id', tok.user_id);
  const techOnly = !(roles || []).some((r) => ['owner', 'admin', 'manager', 'service_advisor'].includes(r.role));
  const LINK = techOnly ? `${SITE}/tech/jobs` : `${SITE}/admin`;

  const now = new Date();
  const from = new Date(now.getTime() - 14 * 86400000);
  const to = new Date(now.getTime() + 60 * 86400000);
  const fromD = from.toISOString().slice(0, 10), toD = to.toISOString().slice(0, 10);
  const stamp = utc(now);

  let apptQ = sb.from('appointments')
    .select('id,service_type,description,scheduled_at,requested_date,requested_time_window,service_address,status,technician_notes,customer_id,vehicle_id')
    .neq('status', 'cancelled').neq('status', 'canceled')
    .or(`and(scheduled_at.gte.${from.toISOString()},scheduled_at.lte.${to.toISOString()}),and(scheduled_at.is.null,requested_date.gte.${fromD},requested_date.lte.${toD})`);
  if (techOnly) apptQ = apptQ.eq('assigned_technician_id', tok.user_id);
  const { data: appts } = await apptQ;
  const { data: reqsAll } = await sb.from('booking_requests')
    .select('id,customer_name,customer_phone,vehicle_info,service_type,description,service_address,requested_date,requested_time_window,status')
    .not('status', 'in', '(declined,converted,confirmed,cancelled)')
    .gte('requested_date', fromD).lte('requested_date', toD);
  const reqs = techOnly ? [] : reqsAll;

  const custIds = [...new Set((appts || []).map((a) => a.customer_id).filter(Boolean))];
  const vehIds = [...new Set((appts || []).map((a) => a.vehicle_id).filter(Boolean))];
  const { data: profs } = custIds.length ? await sb.from('profiles').select('id,full_name,phone').in('id', custIds) : { data: [] };
  const { data: vehs } = vehIds.length ? await sb.from('vehicles').select('id,year,make,model').in('id', vehIds) : { data: [] };
  const P = new Map((profs || []).map((p) => [p.id, p]));
  const V = new Map((vehs || []).map((v) => [v.id, v]));

  const lines: string[] = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Garage Ace//Schedule//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    `X-WR-CALNAME:${techOnly ? 'My Garage Ace Jobs' : 'Garage Ace Schedule'}`, 'X-WR-TIMEZONE:America/New_York', 'REFRESH-INTERVAL;VALUE=DURATION:PT15M', 'X-PUBLISHED-TTL:PT15M', ...VTZ];

  for (const a of appts || []) {
    const p = P.get(a.customer_id), v = V.get(a.vehicle_id);
    const veh = v ? [v.year, v.make, v.model].filter(Boolean).join(' ') : '';
    const title = `${a.service_type || 'Service'}: ${p?.full_name || 'Customer'}${veh ? ` (${veh})` : ''}`;
    lines.push('BEGIN:VEVENT', `UID:appt-${a.id}@garageace`, `DTSTAMP:${stamp}`);
    if (a.scheduled_at) {
      const s = new Date(a.scheduled_at);
      lines.push(`DTSTART:${utc(s)}`, `DTEND:${utc(new Date(s.getTime() + 120 * 60000))}`);
    } else {
      const [st, en] = windowRange(a.requested_time_window);
      lines.push(`DTSTART;TZID=America/New_York:${local(a.requested_date, st)}`, `DTEND;TZID=America/New_York:${local(a.requested_date, en)}`);
    }
    const desc = [p?.phone && `Phone: ${p.phone}`, a.description, a.technician_notes && `Notes: ${a.technician_notes}`, `Status: ${a.status}`, LINK].filter(Boolean).join('\n');
    lines.push(`SUMMARY:${esc(title)}`, `LOCATION:${esc(a.service_address)}`, `DESCRIPTION:${esc(desc)}`, `URL:${LINK}`, 'STATUS:CONFIRMED', 'END:VEVENT');
  }

  for (const r of reqs || []) {
    if (!r.requested_date) continue;
    const [st, en] = windowRange(r.requested_time_window);
    const title = `PENDING: ${r.service_type || 'Request'}: ${r.customer_name || 'Customer'}${r.vehicle_info ? ` (${r.vehicle_info})` : ''}`;
    const desc = [r.customer_phone && `Phone: ${r.customer_phone}`, r.requested_time_window && `Asked for: ${r.requested_time_window}`, r.description, 'Not confirmed yet - confirm in Booking Requests.', LINK].filter(Boolean).join('\n');
    lines.push('BEGIN:VEVENT', `UID:req-${r.id}@garageace`, `DTSTAMP:${stamp}`,
      `DTSTART;TZID=America/New_York:${local(r.requested_date, st)}`, `DTEND;TZID=America/New_York:${local(r.requested_date, en)}`,
      `SUMMARY:${esc(title)}`, `LOCATION:${esc(r.service_address)}`, `DESCRIPTION:${esc(desc)}`, `URL:${LINK}`, 'STATUS:TENTATIVE', 'TRANSP:TRANSPARENT', 'END:VEVENT');
  }
  lines.push('END:VCALENDAR');

  return new Response(lines.map(fold).join('\r\n') + '\r\n', {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Cache-Control': 'no-cache, max-age=0', 'Content-Disposition': 'inline; filename="garage-ace.ics"' },
  });
});
