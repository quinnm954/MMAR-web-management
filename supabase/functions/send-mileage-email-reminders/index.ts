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
const INTERVALS: Array<{ name: string; intervalMiles: number; keywords: string[]; competitorPriceRange: [number, number]; importance: string }> = [
  { name: 'Oil & filter change', intervalMiles: 5000, keywords: ['oil change', 'oil & filter', 'oil and filter', 'oil service'], competitorPriceRange: [85, 160], importance: 'Fresh oil keeps moving engine parts lubricated and cool. Skipping it leads to sludge buildup, accelerated wear, and eventually catastrophic engine damage — by far the cheapest service that prevents the most expensive repair.' },
  { name: 'Tire rotation', intervalMiles: 7500, keywords: ['tire rotation', 'rotate tires'], competitorPriceRange: [30, 60], importance: 'Front and rear tires wear at very different rates. Rotating them evens out tread depth, extends tire life by 20–25%, and keeps handling predictable in wet weather.' },
  { name: 'Multi-point inspection', intervalMiles: 10000, keywords: ['multi-point', 'multi point inspection', 'vehicle inspection'], competitorPriceRange: [50, 100], importance: 'A trained set of eyes catches small issues — leaking seals, worn bushings, cracked hoses — before they strand you. Most failures show warning signs months before they break.' },
  { name: 'Wheel alignment check', intervalMiles: 15000, keywords: ['alignment'], competitorPriceRange: [110, 200], importance: 'Even slight misalignment chews through tires unevenly and pulls the steering. A $100 alignment can save $400+ in premature tire replacement and improves fuel economy.' },
  { name: 'Brake inspection', intervalMiles: 15000, keywords: ['brake inspection', 'brake check'], competitorPriceRange: [50, 100], importance: 'Catching worn pads early means a simple pad swap. Ignore it and metal-on-metal grinding ruins the rotors — turning a $200 job into $700+.' },
  { name: 'Cabin air filter', intervalMiles: 20000, keywords: ['cabin air filter', 'cabin filter'], competitorPriceRange: [60, 140], importance: 'A clogged cabin filter restricts A/C airflow, makes the blower work harder, and dumps dust, pollen, and mold spores into the air you breathe. Florida humidity makes this much worse.' },
  { name: 'Battery test', intervalMiles: 25000, keywords: ['battery test', 'battery service'], competitorPriceRange: [30, 70], importance: 'Florida heat is brutal on batteries — most fail in 3–4 years with little warning. A 5-minute load test tells us if yours is on borrowed time so you don\'t get stranded.' },
  { name: 'Fuel system cleaning', intervalMiles: 30000, keywords: ['fuel system', 'fuel injector', 'induction service'], competitorPriceRange: [170, 320], importance: 'Carbon deposits on injectors and intake valves rob power and MPG. Cleaning restores spray pattern, smooths idle, and often recovers 1–2 MPG.' },
  { name: 'Engine air filter', intervalMiles: 30000, keywords: ['air filter', 'engine air filter'], competitorPriceRange: [55, 120], importance: 'A clogged air filter starves the engine of oxygen, hurting MPG, throttle response, and over time can foul the mass airflow sensor — a much pricier repair.' },
  { name: 'Brake fluid flush', intervalMiles: 30000, keywords: ['brake fluid'], competitorPriceRange: [140, 220], importance: 'Brake fluid absorbs water from the air. Old fluid boils under hard braking (causing pedal fade), corrodes ABS components, and shortens caliper life.' },
  { name: 'A/C system performance check', intervalMiles: 30000, keywords: ['a/c service', 'ac service', 'air conditioning'], competitorPriceRange: [110, 230], importance: 'In Florida, A/C is non-negotiable. Catching a slow refrigerant leak or weak compressor early avoids a $1,500+ compressor replacement later.' },
  { name: 'Brake pads & rotors', intervalMiles: 40000, keywords: ['brake pad', 'brake rotor', 'brakes replaced'], competitorPriceRange: [550, 1100], importance: 'The single most safety-critical wear item on the car. Worn pads dramatically increase stopping distance and damage rotors if pushed too far.' },
  { name: 'Power steering fluid flush', intervalMiles: 50000, keywords: ['power steering'], competitorPriceRange: [140, 220], importance: 'Old fluid turns abrasive and wears out the pump and rack seals. A flush is a fraction of the cost of a steering rack replacement ($1,200+).' },
  { name: 'Transmission fluid service', intervalMiles: 60000, keywords: ['transmission fluid', 'trans fluid'], competitorPriceRange: [240, 450], importance: 'Transmission rebuilds run $3,000–$5,000+. Fresh fluid keeps clutches and valves working smoothly — this is one of the highest-ROI services on the entire car.' },
  { name: 'Coolant flush', intervalMiles: 60000, keywords: ['coolant', 'antifreeze'], competitorPriceRange: [150, 280], importance: 'Coolant additives wear out and become acidic, corroding the radiator, water pump, and heater core. Overheating warps heads — a multi-thousand-dollar repair.' },
  { name: 'Spark plug replacement', intervalMiles: 60000, keywords: ['spark plug'], competitorPriceRange: [275, 650], importance: 'Worn plugs misfire, hurting MPG, dropping power, and dumping unburned fuel into the catalytic converter — which can fail at $1,000+ to replace.' },
  { name: 'Differential fluid service', intervalMiles: 60000, keywords: ['differential'], competitorPriceRange: [140, 280], importance: 'The differential takes the engine\'s torque to the wheels. Burnt fluid grinds the gears and bearings — a rebuild runs $1,500+.' },
  { name: 'Transfer case fluid (4WD/AWD)', intervalMiles: 60000, keywords: ['transfer case'], competitorPriceRange: [160, 320], importance: 'On AWD/4WD vehicles, the transfer case splits power between axles. Old fluid wears the chain and gears — replacement units start around $2,000.' },
  { name: 'PCV valve replacement', intervalMiles: 60000, keywords: ['pcv'], competitorPriceRange: [80, 170], importance: 'A stuck PCV valve causes oil leaks, rough idle, and oil burning. A $20 part can prevent gasket failures that cost hundreds in labor.' },
  { name: 'Serpentine belt inspection', intervalMiles: 60000, keywords: ['serpentine belt', 'drive belt'], competitorPriceRange: [150, 320], importance: 'This one belt drives the alternator, water pump, A/C, and power steering. If it snaps on the road, the car overheats within minutes and dies.' },
  { name: 'Fuel filter replacement', intervalMiles: 60000, keywords: ['fuel filter'], competitorPriceRange: [110, 280], importance: 'A clogged filter makes the fuel pump work harder and shortens its life. Pump replacement is a $700+ job on most vehicles.' },
  { name: 'Shocks & struts inspection', intervalMiles: 75000, keywords: ['shocks', 'struts'], competitorPriceRange: [60, 140], importance: 'Worn shocks lengthen stopping distance significantly and cause uneven tire wear. They degrade gradually so most drivers don\'t notice until they\'re replaced.' },
  { name: 'Timing belt replacement', intervalMiles: 90000, keywords: ['timing belt'], competitorPriceRange: [800, 1600], importance: 'On interference engines, a snapped timing belt destroys the engine instantly — bent valves, damaged pistons. Replacement is the single most important high-mileage service.' },
  { name: 'Oxygen sensor replacement', intervalMiles: 100000, keywords: ['oxygen sensor', 'o2 sensor'], competitorPriceRange: [275, 575], importance: 'A lazy O2 sensor causes the engine to run rich, hurting MPG by 10–15% and slowly poisoning the catalytic converter (a $1,000+ part).' },
];

// Show items overdue OR coming due within this many miles
const DUE_SOON_WINDOW = 2500;

// Regional cost-of-service multipliers applied to the BASE competitor prices above
// (which represent a US national average ≈ multiplier 1.00). Sourced from RepairPal
// city-level estimates and BLS Auto Repair CPI by metro. Lookup is by 3-digit ZIP
// prefix (ZIP3); unknown ZIPs fall back to NATIONAL.
interface Region { label: string; multiplier: number }
const NATIONAL: Region = { label: 'National average', multiplier: 1.0 };
const ZIP3_REGIONS: Record<string, Region> = {
  // --- Florida (primary service area) ---
  '339': { label: 'Fort Myers / Cape Coral, FL', multiplier: 1.05 },
  '341': { label: 'Naples / Marco Island, FL', multiplier: 1.12 },
  '342': { label: 'Naples / Bonita Springs, FL', multiplier: 1.12 },
  '338': { label: 'Lakeland / Polk County, FL', multiplier: 0.98 },
  '335': { label: 'Tampa, FL', multiplier: 1.04 },
  '336': { label: 'Tampa / St. Petersburg, FL', multiplier: 1.04 },
  '337': { label: 'St. Petersburg / Clearwater, FL', multiplier: 1.05 },
  '334': { label: 'West Palm Beach, FL', multiplier: 1.10 },
  '331': { label: 'Miami, FL', multiplier: 1.18 },
  '332': { label: 'Miami Beach, FL', multiplier: 1.18 },
  '333': { label: 'Fort Lauderdale, FL', multiplier: 1.14 },
  '320': { label: 'Jacksonville, FL', multiplier: 1.00 },
  '328': { label: 'Orlando, FL', multiplier: 1.03 },
  '329': { label: 'Orlando / Kissimmee, FL', multiplier: 1.03 },
  // --- Other major metros (handy if customer base spreads) ---
  '100': { label: 'New York, NY', multiplier: 1.35 },
  '101': { label: 'New York, NY', multiplier: 1.35 },
  '900': { label: 'Los Angeles, CA', multiplier: 1.28 },
  '941': { label: 'San Francisco, CA', multiplier: 1.40 },
  '606': { label: 'Chicago, IL', multiplier: 1.10 },
  '750': { label: 'Dallas, TX', multiplier: 1.00 },
  '770': { label: 'Houston, TX', multiplier: 1.00 },
  '787': { label: 'Austin, TX', multiplier: 1.05 },
  '981': { label: 'Seattle, WA', multiplier: 1.20 },
  '802': { label: 'Denver, CO', multiplier: 1.10 },
  '850': { label: 'Phoenix, AZ', multiplier: 1.02 },
  '300': { label: 'Atlanta, GA', multiplier: 1.00 },
  '021': { label: 'Boston, MA', multiplier: 1.25 },
  '191': { label: 'Philadelphia, PA', multiplier: 1.08 },
  '200': { label: 'Washington, DC', multiplier: 1.20 },
};

function regionForZip(zip?: string | null): Region {
  if (!zip) return NATIONAL;
  const digits = zip.replace(/\D/g, '');
  if (digits.length < 3) return NATIONAL;
  return ZIP3_REGIONS[digits.slice(0, 3)] ?? NATIONAL;
}

function applyRegion(range: [number, number], mult: number): [number, number] {
  // Round to nearest $5 for clean display
  const r = (n: number) => Math.max(5, Math.round((n * mult) / 5) * 5);
  return [r(range[0]), r(range[1])];
}

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
    .select('id, owner_id, year, make, model, current_mileage, avg_miles_per_day, last_mileage_update_at')
    .not('current_mileage', 'is', null)
    .gt('current_mileage', 0);

  if (vErr) {
    return new Response(JSON.stringify({ error: vErr.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const cooldownIso = new Date(Date.now() - REMINDER_COOLDOWN_DAYS * 86400000).toISOString();

  // Per-run cache: owner_id -> { profile, region }.
  // Avoids refetching the same owner profile (and re-resolving their ZIP region)
  // when a customer has multiple vehicles in this batch.
  type OwnerCacheEntry = {
    profile: { id: string; full_name: string | null; email: string | null; postal_code: string | null } | null;
    region: Region;
  };
  const ownerCache = new Map<string, OwnerCacheEntry>();
  let ownerCacheHits = 0;
  let ownerCacheMisses = 0;

  async function getOwner(ownerId: string): Promise<OwnerCacheEntry> {
    const cached = ownerCache.get(ownerId);
    if (cached) { ownerCacheHits++; return cached; }
    ownerCacheMisses++;
    const { data: profile } = await sb
      .from('profiles')
      .select('id, full_name, email, postal_code')
      .eq('id', ownerId)
      .maybeSingle();
    const entry: OwnerCacheEntry = {
      profile: profile ?? null,
      region: regionForZip(profile?.postal_code),
    };
    ownerCache.set(ownerId, entry);
    return entry;
  }

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

      // Owner profile + email + ZIP for regional pricing (cached per run)
      const { profile, region } = await getOwner(v.owner_id);
      if (!profile?.email) { skipped.push({ vehicle_id: v.id, reason: 'no_email' }); continue; }

      // All service records for this vehicle (need mileage_at_service + service_type)
      const { data: records } = await sb
        .from('service_records')
        .select('service_type, mileage_at_service')
        .eq('vehicle_id', v.id)
        .not('mileage_at_service', 'is', null);

      const avgPerDay = Number(v.avg_miles_per_day) || 0;
      const dueServices = INTERVALS.map((cfg) => {
        const allKeywords = [...cfg.keywords, cfg.name.toLowerCase()];
        const matches = (records || []).filter((r) => {
          const t = (r.service_type || '').toLowerCase();
          return allKeywords.some((kw) => t.includes(kw));
        });
        const lastMiles = matches.length
          ? Math.max(...matches.map((m) => m.mileage_at_service as number))
          : null;
        const baseline = lastMiles ?? 0;
        const overdueBy = (v.current_mileage as number) - (baseline + cfg.intervalMiles);
        // Project a due date when we have an average miles/day signal
        let projectedDueDate: string | undefined;
        if (avgPerDay > 0 && overdueBy < 0) {
          const daysOut = Math.round(Math.abs(overdueBy) / avgPerDay);
          const d = new Date(Date.now() + daysOut * 86400000);
          projectedDueDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
        return {
          name: cfg.name,
          intervalMiles: cfg.intervalMiles,
          lastServiceMiles: lastMiles,
          overdueBy,
          projectedDueDate,
          competitorPriceRange: applyRegion(cfg.competitorPriceRange, region.multiplier),
          importance: cfg.importance,
        };
      })
        .filter((s) => s.overdueBy >= -DUE_SOON_WINDOW)
        .sort((a, b) => b.overdueBy - a.overdueBy);

      if (dueServices.length === 0) { skipped.push({ vehicle_id: v.id, reason: 'nothing_due' }); continue; }

      const vehicleLabel = [v.year, v.make, v.model].filter(Boolean).join(' ') || 'your vehicle';

      const sbUrl = Deno.env.get('SUPABASE_URL')!;
      const sbKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93Z3B4dWpmeXRza2RmbXJoamdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MTQ5NDMsImV4cCI6MjA4MTM5MDk0M30.6zEygmSkP74HP3J8jrzIUmnZ82pMQc0FgbG6qeo_bFc';
      let invErr: string | undefined;
      try {
        const r = await fetch(`${sbUrl}/functions/v1/send-transactional-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sbKey}`, apikey: sbKey },
          body: JSON.stringify({
            templateName: 'mileage-service-reminder',
            recipientEmail: profile.email,
            idempotencyKey: `mileage-reminder-${v.id}-${new Date().toISOString().slice(0, 10)}`,
            templateData: {
              customerName: profile.full_name?.split(' ')[0] || undefined,
              vehicle: vehicleLabel,
              currentMileage: v.current_mileage,
              dueServices,
              priceRegionLabel: region.label,
            },
          }),
        });
        if (!r.ok) invErr = `send-transactional-email ${r.status}: ${(await r.text()).slice(0, 200)}`;
      } catch (e: any) {
        invErr = e?.message || String(e);
      }

      await sb.from('service_reminders_sent').insert({
        customer_id: v.owner_id,
        reminder_type: REMINDER_TYPE,
        reference_id: v.id,
        message: `Mileage reminder: ${dueServices.length} service(s) due`,
        status: invErr ? 'failed' : 'sent',
        error: invErr,
      });

      if (invErr) errors.push({ vehicle_id: v.id, error: invErr });
      else sent.push({ vehicle_id: v.id, due_count: dueServices.length });
    } catch (e: any) {
      errors.push({ vehicle_id: v.id, error: e?.message || String(e) });
    }
  }

  return new Response(
    JSON.stringify({ scanned: vehicles?.length ?? 0, sent: sent.length, skipped: skipped.length, errors: errors.length, owner_cache: { hits: ownerCacheHits, misses: ownerCacheMisses, unique_owners: ownerCache.size }, details: { sent, skipped, errors } }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
