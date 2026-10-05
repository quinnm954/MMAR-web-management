// Staff-only: make sure a booking request's customer has a real account + profile
// before admin_confirm_booking_request runs (profiles.id must match an auth user).
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '') || '';
    const { data: u } = await sb.auth.getUser(jwt);
    if (!u?.user) return json({ error: 'Unauthorized' }, 401);
    const { data: staff } = await sb.rpc('is_staff', { _user_id: u.user.id });
    if (!staff) return json({ error: 'Staff only' }, 403);

    const { id } = await req.json().catch(() => ({}));
    if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id)) return json({ error: 'Invalid id' }, 400);
    const { data: b } = await sb.from('booking_requests').select('customer_name, customer_email, customer_phone, converted_appointment_id').eq('id', id).maybeSingle();
    if (!b) return json({ error: 'Not found' }, 404);
    if (b.converted_appointment_id) return json({ ok: true });

    const email = (b.customer_email || '').trim().toLowerCase();
    const phoneRaw = (b.customer_phone || '').trim();
    const digits = phoneRaw.replace(/\D/g, '').slice(-10);

    // Already a profile the confirm function will find?
    if (email) {
      const { data } = await sb.from('profiles').select('id').ilike('email', email).limit(1);
      if (data?.length) return json({ ok: true });
    }
    if (phoneRaw) {
      const { data } = await sb.from('profiles').select('id').eq('phone', phoneRaw).limit(1);
      if (data?.length) return json({ ok: true });
    }
    if (!email && digits.length !== 10) return json({ error: 'Booking has no email or valid phone' }, 400);

    const meta = { full_name: b.customer_name || '', phone: phoneRaw, source: 'booking_confirm', needs_enrollment: !email };
    const attrs = email ? { email, email_confirm: true, user_metadata: meta } : { phone: `+1${digits}`, phone_confirm: true, user_metadata: meta };
    let userId: string | null = null;
    const { data: c, error } = await sb.auth.admin.createUser(attrs);
    if (c?.user) userId = c.user.id;
    else {
      // Account exists already — find it.
      for (let page = 1; page <= 20 && !userId; page++) {
        const { data } = await sb.auth.admin.listUsers({ page, perPage: 1000 });
        const hit = data?.users.find((x) => email ? (x.email || '').toLowerCase() === email : (x.phone || '').replace(/\D/g, '').slice(-10) === digits);
        if (hit) userId = hit.id;
        if (!data || data.users.length < 1000) break;
      }
      if (!userId) return json({ error: `Could not create customer account: ${error?.message}` }, 500);
    }
    const { data: existing } = await sb.from('profiles').select('id, phone, email').eq('id', userId).maybeSingle();
    await sb.from('profiles').upsert({
      id: userId,
      email: existing?.email || email || null,
      full_name: b.customer_name || null,
      phone: email ? (existing?.phone || phoneRaw || null) : phoneRaw,
    });
    return json({ ok: true, created: true });
  } catch (e) {
    console.error(e);
    return json({ error: String(e) }, 500);
  }
});
