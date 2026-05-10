import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.95.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Standard mileage-based service intervals (miles).
// Match logic: a service_record counts toward an interval when its
// service_type contains any of the keywords (case-insensitive).
// Competitor price ranges = typical SW Florida dealer / national chain (e.g. Firestone,
// Pep Boys, Tires Plus) pricing per RepairPal & KBB Service estimates. Used purely
// to show customers what they'd pay elsewhere — Mike's mobile pricing is usually lower.
const INTERVALS: Array<{ name: string; intervalMiles: number; keywords: string[]; competitorPriceRange: [number, number] }> = [
  { name: 'Oil & filter change', intervalMiles: 5000, keywords: ['oil change', 'oil & filter', 'oil and filter', 'oil service'], competitorPriceRange: [60, 120] },
  { name: 'Tire rotation', intervalMiles: 7500, keywords: ['tire rotation', 'rotate tires'], competitorPriceRange: [25, 50] },
  { name: 'Multi-point inspection', intervalMiles: 10000, keywords: ['multi-point', 'multi point inspection', 'vehicle inspection'], competitorPriceRange: [40, 90] },
  { name: 'Wheel alignment check', intervalMiles: 15000, keywords: ['alignment'], competitorPriceRange: [89, 150] },
  { name: 'Brake inspection', intervalMiles: 15000, keywords: ['brake inspection', 'brake check'], competitorPriceRange: [40, 90] },
  { name: 'Cabin air filter', intervalMiles: 20000, keywords: ['cabin air filter', 'cabin filter'], competitorPriceRange: [50, 110] },
  { name: 'Battery test', intervalMiles: 25000, keywords: ['battery test', 'battery service'], competitorPriceRange: [25, 60] },
  { name: 'Fuel system cleaning', intervalMiles: 30000, keywords: ['fuel system', 'fuel injector', 'induction service'], competitorPriceRange: [120, 250] },
  { name: 'Engine air filter', intervalMiles: 30000, keywords: ['air filter', 'engine air filter'], competitorPriceRange: [40, 95] },
  { name: 'Brake fluid flush', intervalMiles: 30000, keywords: ['brake fluid'], competitorPriceRange: [110, 175] },
  { name: 'A/C system performance check', intervalMiles: 30000, keywords: ['a/c service', 'ac service', 'air conditioning'], competitorPriceRange: [80, 180] },
  { name: 'Brake pads & rotors', intervalMiles: 40000, keywords: ['brake pad', 'brake rotor', 'brakes replaced'], competitorPriceRange: [350, 750] },
  { name: 'Power steering fluid flush', intervalMiles: 50000, keywords: ['power steering'], competitorPriceRange: [110, 175] },
  { name: 'Transmission fluid service', intervalMiles: 60000, keywords: ['transmission fluid', 'trans fluid'], competitorPriceRange: [180, 350] },
  { name: 'Coolant flush', intervalMiles: 60000, keywords: ['coolant', 'antifreeze'], competitorPriceRange: [120, 220] },
  { name: 'Spark plug replacement', intervalMiles: 60000, keywords: ['spark plug'], competitorPriceRange: [180, 450] },
  { name: 'Differential fluid service', intervalMiles: 60000, keywords: ['differential'], competitorPriceRange: [110, 220] },
  { name: 'Transfer case fluid (4WD/AWD)', intervalMiles: 60000, keywords: ['transfer case'], competitorPriceRange: [120, 230] },
  { name: 'PCV valve replacement', intervalMiles: 60000, keywords: ['pcv'], competitorPriceRange: [60, 130] },
  { name: 'Serpentine belt inspection', intervalMiles: 60000, keywords: ['serpentine belt', 'drive belt'], competitorPriceRange: [125, 250] },
  { name: 'Fuel filter replacement', intervalMiles: 60000, keywords: ['fuel filter'], competitorPriceRange: [80, 200] },
  { name: 'Shocks & struts inspection', intervalMiles: 75000, keywords: ['shocks', 'struts'], competitorPriceRange: [50, 120] },
  { name: 'Timing belt replacement', intervalMiles: 90000, keywords: ['timing belt'], competitorPriceRange: [600, 1200] },
  { name: 'Oxygen sensor replacement', intervalMiles: 100000, keywords: ['oxygen sensor', 'o2 sensor'], competitorPriceRange: [220, 500] },
];

// Show items overdue OR coming due within this many miles
const DUE_SOON_WINDOW = 2500;

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
        const baseline = lastMiles ?? 0;
        const overdueBy = (v.current_mileage as number) - (baseline + cfg.intervalMiles);
        return { name: cfg.name, intervalMiles: cfg.intervalMiles, lastServiceMiles: lastMiles, overdueBy, competitorPriceRange: cfg.competitorPriceRange };
      })
        .filter((s) => s.overdueBy >= -DUE_SOON_WINDOW)
        .sort((a, b) => b.overdueBy - a.overdueBy);

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
