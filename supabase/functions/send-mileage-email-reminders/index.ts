import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.95.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Standard mileage-based service intervals (miles).
// Match logic: a service_record counts toward an interval when its
// service_type contains any of the keywords (case-insensitive).
const INTERVALS: Array<{ name: string; intervalMiles: number; keywords: string[] }> = [
  { name: 'Oil & filter change', intervalMiles: 5000, keywords: ['oil change', 'oil & filter', 'oil and filter', 'oil service'] },
  { name: 'Tire rotation', intervalMiles: 7500, keywords: ['tire rotation', 'rotate tires'] },
  { name: 'Brake inspection', intervalMiles: 15000, keywords: ['brake inspection', 'brake check'] },
  { name: 'Cabin air filter', intervalMiles: 20000, keywords: ['cabin air filter', 'cabin filter'] },
  { name: 'Engine air filter', intervalMiles: 30000, keywords: ['air filter', 'engine air filter'] },
  { name: 'Brake fluid flush', intervalMiles: 30000, keywords: ['brake fluid'] },
  { name: 'Transmission fluid service', intervalMiles: 60000, keywords: ['transmission fluid', 'trans fluid'] },
  { name: 'Coolant flush', intervalMiles: 60000, keywords: ['coolant', 'antifreeze'] },
  { name: 'Spark plug replacement', intervalMiles: 60000, keywords: ['spark plug'] },
  { name: 'Differential fluid service', intervalMiles: 60000, keywords: ['differential'] },
];

const REMINDER_TYPE = 'mileage_email_reminder';
const REMINDER_COOLDOWN_DAYS = 30;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const sent: any[] = [];
  const skipped: any[] = [];
  const errors: any[] = [];

  // Pull all vehicles with mileage info + owner
  const { data: vehicles, error: vErr } = await sb
    .from('vehicles')
    .select('id, owner_id, year, make, model, current_mileage')
    .not('current_mileage', 'is', null)
    .gt('current_mileage', 0);

  if (vErr) {
    return new Response(JSON.stringify({ error: vErr.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const cooldownIso = new Date(Date.now() - REMINDER_COOLDOWN_DAYS * 86400000).toISOString();

  for (const v of vehicles || []) {
    try {
      // Cooldown: skip if reminder for this vehicle was sent recently
      const { data: recent } = await sb
        .from('service_reminders_sent')
        .select('id')
        .eq('reminder_type', REMINDER_TYPE)
        .eq('reference_id', v.id)
        .gte('sent_at', cooldownIso)
        .maybeSingle();
      if (recent) { skipped.push({ vehicle_id: v.id, reason: 'cooldown' }); continue; }

      // Owner profile + email
      const { data: profile } = await sb
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', v.owner_id)
        .maybeSingle();
      if (!profile?.email) { skipped.push({ vehicle_id: v.id, reason: 'no_email' }); continue; }

      // All service records for this vehicle (need mileage_at_service + service_type)
      const { data: records } = await sb
        .from('service_records')
        .select('service_type, mileage_at_service')
        .eq('vehicle_id', v.id)
        .not('mileage_at_service', 'is', null);

      const dueServices = INTERVALS.map((cfg) => {
        const matches = (records || []).filter((r) => {
          const t = (r.service_type || '').toLowerCase();
          return cfg.keywords.some((kw) => t.includes(kw));
        });
        const lastMiles = matches.length
          ? Math.max(...matches.map((m) => m.mileage_at_service as number))
          : null;
        // Assume nothing previously due was done: baseline is 0 if no record
        const baseline = lastMiles ?? 0;
        const overdueBy = (v.current_mileage as number) - (baseline + cfg.intervalMiles);
        return { name: cfg.name, intervalMiles: cfg.intervalMiles, lastServiceMiles: lastMiles, overdueBy };
      }).filter((s) => s.overdueBy >= 0);

      if (dueServices.length === 0) { skipped.push({ vehicle_id: v.id, reason: 'nothing_due' }); continue; }

      const vehicleLabel = [v.year, v.make, v.model].filter(Boolean).join(' ') || 'your vehicle';

      const { error: invErr } = await sb.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'mileage-service-reminder',
          recipientEmail: profile.email,
          idempotencyKey: `mileage-reminder-${v.id}-${new Date().toISOString().slice(0, 10)}`,
          templateData: {
            customerName: profile.full_name?.split(' ')[0] || undefined,
            vehicle: vehicleLabel,
            currentMileage: v.current_mileage,
            dueServices,
          },
        },
      });

      await sb.from('service_reminders_sent').insert({
        customer_id: v.owner_id,
        reminder_type: REMINDER_TYPE,
        reference_id: v.id,
        message: `Mileage reminder: ${dueServices.length} service(s) due`,
        status: invErr ? 'failed' : 'sent',
        error: invErr?.message,
      });

      if (invErr) errors.push({ vehicle_id: v.id, error: invErr.message });
      else sent.push({ vehicle_id: v.id, due_count: dueServices.length });
    } catch (e: any) {
      errors.push({ vehicle_id: v.id, error: e?.message || String(e) });
    }
  }

  return new Response(
    JSON.stringify({ scanned: vehicles?.length ?? 0, sent: sent.length, skipped: skipped.length, errors: errors.length, details: { sent, skipped, errors } }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
