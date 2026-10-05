// Staff-only: after a booking is confirmed, make sure its appointment has an estimate.
// Diagnostic/vague jobs get the diagnosis fee; specific jobs get labor-guide hours; otherwise an unsent draft.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { buildLaborQuote, createDraftEstimate } from '../_shared/labor-quote.ts';

const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '') || '';
    const { data: u } = await sb.auth.getUser(jwt);
    if (!u?.user) return json({ error: 'Unauthorized' }, 401);
    const { data: staff } = await sb.rpc('is_office_staff', { _user_id: u.user.id });
    if (!staff) return json({ error: 'Staff only' }, 403);

    const { bookingId } = await req.json().catch(() => ({}));
    if (typeof bookingId !== 'string' || !/^[0-9a-f-]{36}$/i.test(bookingId)) return json({ error: 'Invalid bookingId' }, 400);
    const { data: b } = await sb.from('booking_requests').select('*').eq('id', bookingId).maybeSingle();
    if (!b?.converted_appointment_id) return json({ error: 'Booking not confirmed yet' }, 400);
    const { data: appt } = await sb.from('appointments').select('id, customer_id').eq('id', b.converted_appointment_id).maybeSingle();
    if (!appt) return json({ error: 'Appointment not found' }, 404);

    // Estimates are never auto-sent; staff send them from Estimates.
    const { data: existing } = await sb.from('estimates').select('id').eq('appointment_id', appt.id).limit(1);
    if (existing?.length) return json({ ok: true, estimateId: existing[0].id, existed: true });

    // Reuse an auto-quote the text bot already made for this customer recently.
    const { data: recent } = await sb.from('estimates').select('id').eq('customer_id', appt.customer_id).is('appointment_id', null)
      .gte('created_at', new Date(new Date(b.created_at).getTime() - 3600_000).toISOString()).ilike('notes', 'Auto-drafted%').limit(1);
    if (recent?.length) {
      await sb.from('estimates').update({ appointment_id: appt.id }).eq('id', recent[0].id);
      return json({ ok: true, estimateId: recent[0].id, linked: true });
    }

    const q = await buildLaborQuote(sb, b);
    const id = await createDraftEstimate(sb, b, q, { appointmentId: appt.id, customerId: appt.customer_id });
    if (!id) return json({ error: 'Could not create estimate' }, 500);
    return json({ ok: true, estimateId: id, kind: q.kind });
  } catch (e) {
    console.error(e);
    return json({ error: String(e) }, 500);
  }
});
