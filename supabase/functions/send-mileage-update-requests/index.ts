import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.95.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SITE_URL = 'https://mikesmautorepair.com';
const STALE_DAYS = 45;
const COOLDOWN_DAYS = 21;
const REMINDER_TYPE = 'mileage_update_request';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const sent: any[] = [];
  const skipped: any[] = [];
  const errors: any[] = [];

  const staleCutoff = new Date(Date.now() - STALE_DAYS * 86400000).toISOString();
  const cooldownCutoff = new Date(Date.now() - COOLDOWN_DAYS * 86400000).toISOString();

  // Vehicles that haven't had a mileage update in STALE_DAYS days (or never)
  const { data: vehicles, error } = await sb
    .from('vehicles')
    .select('id, owner_id, year, make, model, current_mileage, last_mileage_update_at')
    .eq('is_active', true)
    .or(`last_mileage_update_at.is.null,last_mileage_update_at.lt.${staleCutoff}`);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Owner cache
  const ownerCache = new Map<string, any>();
  async function getOwner(id: string) {
    if (ownerCache.has(id)) return ownerCache.get(id);
    const { data } = await sb
      .from('profiles')
      .select('id, full_name, email, marketing_opt_in')
      .eq('id', id)
      .maybeSingle();
    ownerCache.set(id, data);
    return data;
  }

  for (const v of vehicles || []) {
    try {
      const owner = await getOwner(v.owner_id);
      if (!owner?.email) { skipped.push({ vehicle_id: v.id, reason: 'no_email' }); continue; }
      if (owner.marketing_opt_in === false) { skipped.push({ vehicle_id: v.id, reason: 'opted_out' }); continue; }

      // Cooldown: skip if we already prompted recently
      const { data: recent } = await sb
        .from('service_reminders_sent')
        .select('id')
        .eq('reminder_type', REMINDER_TYPE)
        .eq('reference_id', v.id)
        .gte('sent_at', cooldownCutoff)
        .maybeSingle();
      if (recent) { skipped.push({ vehicle_id: v.id, reason: 'cooldown' }); continue; }

      // Generate token
      const { data: tok, error: tokErr } = await sb
        .from('mileage_update_tokens')
        .insert({ vehicle_id: v.id, customer_id: v.owner_id, channel: 'email' })
        .select('token')
        .single();
      if (tokErr || !tok) { errors.push({ vehicle_id: v.id, error: tokErr?.message }); continue; }

      const vehicleLabel = [v.year, v.make, v.model].filter(Boolean).join(' ') || 'your vehicle';
      const daysSince = v.last_mileage_update_at
        ? Math.floor((Date.now() - new Date(v.last_mileage_update_at).getTime()) / 86400000)
        : null;

      const { error: invErr } = await sb.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'mileage-update-request',
          recipientEmail: owner.email,
          idempotencyKey: `mileage-update-req-${v.id}-${new Date().toISOString().slice(0, 10)}`,
          templateData: {
            customerName: owner.full_name?.split(' ')[0],
            vehicle: vehicleLabel,
            lastMileage: v.current_mileage,
            daysSinceUpdate: daysSince,
            updateUrl: `${SITE_URL}/m/${tok.token}`,
          },
        },
      });

      await sb.from('service_reminders_sent').insert({
        customer_id: v.owner_id,
        reminder_type: REMINDER_TYPE,
        reference_id: v.id,
        message: 'Mileage update request',
        status: invErr ? 'failed' : 'sent',
        error: invErr?.message,
      });

      if (invErr) errors.push({ vehicle_id: v.id, error: invErr.message });
      else sent.push({ vehicle_id: v.id });
    } catch (e: any) {
      errors.push({ vehicle_id: v.id, error: e?.message || String(e) });
    }
  }

  return new Response(
    JSON.stringify({
      scanned: vehicles?.length ?? 0,
      sent: sent.length,
      skipped: skipped.length,
      errors: errors.length,
      details: { sent, skipped, errors },
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});
