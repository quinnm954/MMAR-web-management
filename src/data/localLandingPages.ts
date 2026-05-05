export type FAQ = { q: string; a: string };

export type LocalLandingPage = {
  slug: string;
  service: string; // human readable service name
  citySlug?: string; // matches cities.ts slug — omit for service-only (region-wide) pages
  categoryId: string; // matches serviceCategories.ts id
  h1: string;
  metaTitle: string;
  metaDescription: string;
  /** Optional override for the canonical URL (e.g. point a long-slug duplicate at the short slug). */
  canonical?: string;
  intro: string;
  paragraphs: string[];
  included: string[];
  faqs: FAQ[];
};

const ALLOWED_CITY_SLUGS = new Set(["lehigh-acres", "fort-myers"]);

const _allLocalLandingPages: LocalLandingPage[] = [
  {
    slug: "mobile-brake-repair-lehigh-acres",
    service: "Mobile Brake Repair",
    citySlug: "lehigh-acres",
    categoryId: "brakes",
    h1: "Mobile Brake Repair in Lehigh Acres, FL",
    metaTitle:
      "Mobile Brake Repair in Lehigh Acres, FL | Mike's Mobile Auto Repair",
    metaDescription:
      "On-site brake pad, rotor, and caliper replacement in Lehigh Acres, FL. Same-day mobile brake repair at your home or workplace. Call (813) 501-7572.",
    canonical: "https://mikesmautorepair.com/brake-repair-lehigh-acres",
    intro:
      "Squealing, grinding, or a soft pedal? Mike's Mobile Auto Repair handles complete mobile brake repair in Lehigh Acres, FL — pads, rotors, calipers, lines, and ABS diagnostics — right in your driveway.",
    paragraphs: [
      "Brake jobs are one of the most common reasons Lehigh Acres drivers get stuck dealing with a tow truck and a long shop wait. We solve that by bringing the shop to you. Whether you live off Lee Boulevard, work near Sunshine, or your car finally bit the dust on Gunnery Road, our mobile service truck arrives with quality pads, rotors, fresh brake fluid, and the right tools to handle the repair on site.",
      "Most front-axle and rear-axle brake jobs are completed in 60–90 minutes. We test-drive after every repair, torque every wheel to spec, and bed the new pads in properly so you get a quiet, confident pedal from the very first stop. Pricing is quoted up front before any work begins — no surprise add-ons.",
      "We service every Lehigh Acres ZIP code (33936, 33971, 33972, 33973, 33974, 33976) and all surrounding neighborhoods. If your brakes are warning you, don't wait until they fail. Call or text (813) 501-7572 today for fast mobile brake service in Lehigh Acres.",
    ],
    included: [
      "Front and rear brake pad replacement",
      "Brake rotor replacement or resurfacing",
      "Caliper inspection, repair, and replacement",
      "Brake fluid flush and bleed",
      "ABS warning light diagnostics",
      "Parking brake adjustment",
      "Free brake inspection with any service",
    ],
    faqs: [
      {
        q: "How much does mobile brake repair cost in Lehigh Acres?",
        a: "Most front or rear pad-and-rotor jobs in Lehigh Acres run $180–$350 per axle depending on the vehicle and parts chosen. We quote you up front before starting any work.",
      },
      {
        q: "How long does a mobile brake job take?",
        a: "A standard pad-and-rotor service per axle takes about 60–90 minutes on site. Most customers in Lehigh Acres are back on the road the same day.",
      },
      {
        q: "Can you come the same day?",
        a: "Yes — same-day mobile brake repair is usually available across Lehigh Acres. Call or text (813) 501-7572 and we'll confirm a time window.",
      },
      {
        q: "Do you warranty your brake work?",
        a: "Yes. Parts and labor on brake repairs are backed by our standard mobile-service warranty. Ask for details when you book.",
      },
    ],
  },
  {
    slug: "mobile-alternator-repair-fort-myers",
    service: "Mobile Alternator Repair",
    citySlug: "fort-myers",
    categoryId: "electrical",
    h1: "Mobile Alternator Repair in Fort Myers, FL",
    metaTitle:
      "Mobile Alternator Repair in Fort Myers, FL | Mike's Mobile Auto Repair",
    metaDescription:
      "On-site alternator replacement and charging system repair in Fort Myers, FL. Same-day mobile service. Call or text (813) 501-7572 for a fast quote.",
    canonical: "https://mikesmautorepair.com/alternator-repair-fort-myers",
    intro:
      "Battery light on, dim headlights, or a no-start after a jump? Mike's Mobile Auto Repair provides full mobile alternator repair and charging-system service in Fort Myers, FL — at your home or office.",
    paragraphs: [
      "An alternator failure rarely happens at a convenient time. The good news: you don't need a tow. Our Fort Myers mobile mechanic service arrives with professional charging-system testers, replacement alternators for most makes and models, and the tools to swap one out quickly in a parking lot or driveway.",
      "We test the entire charging system before condemning a part — battery, alternator output under load, voltage drop on key cables, and the serpentine belt and tensioner. That way you only pay for what you actually need. If the alternator is the problem, we install a quality replacement and verify a clean 13.8–14.7-volt charge before we leave.",
      "We service every Fort Myers ZIP code including 33901, 33907, 33908, 33912, 33913, 33916, 33919, and 33966 — Downtown, McGregor, Gateway, Whiskey Creek, Iona, and beyond. Stuck right now? Call or text (813) 501-7572 for same-day mobile alternator repair in Fort Myers.",
    ],
    included: [
      "Full charging system test (battery, alternator, belt)",
      "Alternator replacement on most makes and models",
      "Battery testing and replacement if needed",
      "Serpentine belt and tensioner inspection",
      "Voltage drop and ground cable testing",
      "Post-install charging verification",
    ],
    faqs: [
      {
        q: "How much does mobile alternator replacement cost in Fort Myers?",
        a: "Typical alternator replacements in Fort Myers range from $350–$650 installed depending on the vehicle and alternator amperage. We quote you up front before any work.",
      },
      {
        q: "How long does the repair take on site?",
        a: "Most alternator swaps are completed in 60–120 minutes in a driveway or parking lot in Fort Myers.",
      },
      {
        q: "Can you come if my car won't start?",
        a: "Yes — that's exactly what mobile service is for. Call or text (813) 501-7572 and we'll come to you across Fort Myers.",
      },
      {
        q: "How do I know it's the alternator and not the battery?",
        a: "We test both. A weak battery and a failing alternator can look similar, so we check actual charging output and battery condition before recommending any parts.",
      },
    ],
  },
  // ===== Region-wide service-only landing pages =====
  {
    slug: "mobile-brake-repair",
    service: "Mobile Brake Repair",
    categoryId: "brakes",
    h1: "Mobile Brake Repair in Lehigh Acres and Fort Myers",
    metaTitle:
      "Mobile Brake Repair in Lehigh Acres and Fort Myers | Pads, Rotors & Calipers At Your Driveway",
    metaDescription:
      "On-site mobile brake repair across Lehigh Acres and Fort Myers. Pads, rotors, calipers, fluid. Call (813) 501-7572.",
    canonical: "https://mikesmautorepair.com/brake-repair",
    intro:
      "Squealing, grinding, or a soft pedal? Mike's Mobile Auto Repair brings full mobile brake service — pads, rotors, calipers, lines, fluid, and ABS diagnostics — to driveways and workplaces across Lehigh Acres and Fort Myers.",
    paragraphs: [
      "Brake jobs are the single most common reason Lehigh Acres and Fort Myers drivers end up dealing with a tow truck and a long shop wait. We cut both out of the equation. Our mobile service truck arrives with quality pads and rotors for most makes and models, fresh DOT brake fluid, and the tools to handle the repair on the spot — usually in 60 to 90 minutes per axle.",
      "Florida driving is hard on brakes. Stop-and-go season traffic, daily red-light commuting, and the weight of larger trucks and SUVs all wear pads down faster than highway driving. If you're hearing squeal, feeling pulsation in the pedal, or noticing the brake warning light, it's time. Waiting turns a $200 pad job into a $500+ pad-and-rotor job, or worse.",
      "We service the whole region — every Lehigh Acres and Fort Myers ZIP code. Quotes are always up front and your wheels are torqued to manufacturer spec on every job. Call or text (813) 501-7572 to book.",
    ],
    included: [
      "Front and rear brake pad replacement",
      "Brake rotor replacement or resurfacing",
      "Caliper inspection, repair, and replacement",
      "Brake fluid flush and bleed",
      "ABS warning light diagnostics",
      "Parking brake adjustment",
      "Free brake inspection with any service",
    ],
    faqs: [
      { q: "How much does mobile brake repair cost?", a: "Most pad-and-rotor jobs run $180–$350 per axle depending on the vehicle and parts chosen. Quoted up front before any work." },
      { q: "How long does it take?", a: "60–90 minutes per axle on site. Most customers are back on the road the same day." },
      { q: "Do you bring the parts?", a: "Yes — quality pads, rotors, and brake fluid for most makes and models come with us." },
      { q: "Is the work warrantied?", a: "Yes. Parts and labor on brake repairs are backed by our standard mobile-service warranty." },
    ],
  },
  {
    slug: "mobile-alternator-repair",
    service: "Mobile Alternator Repair",
    categoryId: "electrical",
    h1: "Mobile Alternator Repair in Lehigh Acres and Fort Myers",
    metaTitle:
      "Mobile Alternator Repair in Lehigh Acres and Fort Myers | On-Site Charging System Service",
    metaDescription:
      "Mobile alternator replacement and full charging-system service across Lehigh Acres and Fort Myers. Call (813) 501-7572.",
    canonical: "https://mikesmautorepair.com/alternator-repair",
    intro:
      "Battery light on, dim headlights, or a no-start after a jump? Mike's Mobile Auto Repair handles full mobile alternator repair and charging-system testing across Lehigh Acres and Fort Myers — at your home or office.",
    paragraphs: [
      "Alternator failures rarely happen at a convenient time. The good news: you don't need a tow. We arrive with professional charging-system testers, replacement alternators for most makes and models, and the tools to swap one out in your driveway or a parking lot — usually in 60 to 120 minutes.",
      "We always test the entire charging system before condemning a part — battery, alternator output under load, voltage drop on the main cables, and the serpentine belt and tensioner. That way you only pay for what's actually wrong. If the alternator is the issue, we install a quality replacement and verify a clean 13.8–14.7-volt charge before we leave.",
      "Service is available across every Lehigh Acres and Fort Myers ZIP. Stuck right now? Call or text (813) 501-7572 — same-day service is usually available.",
    ],
    included: [
      "Full charging-system test (battery, alternator, belt)",
      "Alternator replacement on most makes and models",
      "Battery testing and replacement if needed",
      "Serpentine belt and tensioner inspection",
      "Voltage drop and ground cable testing",
      "Post-install charging verification",
    ],
    faqs: [
      { q: "How much does it cost?", a: "Typical alternator replacements run $350–$650 installed depending on vehicle and amperage." },
      { q: "How fast can you get to me?", a: "Same-day mobile service is usually available across Lehigh Acres and Fort Myers." },
      { q: "How do I know it's the alternator and not the battery?", a: "We test both before recommending parts. A weak battery and a failing alternator can look very similar." },
    ],
  },
  {
    slug: "mobile-battery-replacement",
    service: "Mobile Battery Replacement",
    categoryId: "electrical",
    h1: "Mobile Car Battery Replacement in Lehigh Acres and Fort Myers",
    metaTitle:
      "Mobile Battery Replacement in Lehigh Acres and Fort Myers | Same-Day Delivery & Install",
    metaDescription:
      "We deliver and install quality car batteries at your home or office across Lehigh Acres and Fort Myers. Free charging-system test included. Call (813) 501-7572.",
    canonical: "https://mikesmautorepair.com/battery-replacement",
    intro:
      "Dead battery? Skip the tow and the parts-store parking lot. We deliver and install quality car batteries anywhere in Lehigh Acres and Fort Myers — usually the same day.",
    paragraphs: [
      "Florida heat is brutal on batteries. Most last only 2–3 years here before they start failing. When yours finally gives up, we bring the new battery to you, test the charging system to make sure it's not actually an alternator issue, and install everything cleanly — terminals cleaned, hold-down secured, charge verified.",
      "We carry batteries for cars, trucks, SUVs, and most light commercial vehicles, and we'll match the right group size, cold-cranking amps, and warranty for your specific vehicle. AGM and standard flooded options available.",
      "We cover all of Lehigh Acres and Fort Myers. Need a battery now? Call or text (813) 501-7572.",
    ],
    included: [
      "Free battery and charging-system test",
      "Quality replacement battery delivered to you",
      "Professional installation with terminal cleaning",
      "Old battery hauled away for recycling",
      "Post-install charging verification",
      "Battery warranty options up to 36 months",
    ],
    faqs: [
      { q: "How much does mobile battery replacement cost?", a: "Most installed batteries run $180–$320 depending on group size and warranty. AGM batteries cost more." },
      { q: "How fast can you get to me?", a: "Same-day service is the norm." },
      { q: "Do you take the old battery?", a: "Yes — we haul it away and properly recycle it at no extra charge." },
    ],
  },
  {
    slug: "mobile-starter-repair",
    service: "Mobile Starter Repair",
    categoryId: "electrical",
    h1: "Mobile Starter Repair & Replacement in Lehigh Acres and Fort Myers",
    metaTitle:
      "Mobile Starter Repair in Lehigh Acres and Fort Myers | On-Site Starter Replacement",
    metaDescription:
      "Single click and no crank? We replace failed starters at your home across Lehigh Acres and Fort Myers. Call (813) 501-7572 for same-day mobile service.",
    intro:
      "If you turn the key and just hear a click — or nothing at all — your starter has likely failed. Mike's Mobile Auto Repair replaces starters on site across Lehigh Acres and Fort Myers, no tow required.",
    paragraphs: [
      "A failing starter usually announces itself: single loud click with full dash lights, intermittent no-start that gets worse over a couple of weeks, or grinding noises during cranking. We test the starter circuit and battery before condemning the part, then install a quality replacement on site.",
      "Most starter replacements take 60 to 120 minutes depending on the vehicle. We carry starters for many common models and source same-day for most others. Service is available across Lehigh Acres and Fort Myers.",
      "Stuck and can't get the car going? Call or text (813) 501-7572. Real technician answers, not a call center.",
    ],
    included: [
      "Starter circuit and battery testing",
      "Starter motor and solenoid replacement",
      "Battery cable and ground inspection",
      "Post-install crank and verify",
      "Up-front pricing — no surprises",
    ],
    faqs: [
      { q: "How much does a starter replacement cost?", a: "Typical mobile starter jobs run $400–$750 installed depending on the vehicle and labor access." },
      { q: "Could it be the battery instead?", a: "Yes — we always test the battery first. Both can produce similar 'no-crank' symptoms." },
      { q: "Same day?", a: "Usually yes for common vehicles. Special-order parts may push to next day." },
    ],
  },
  {
    slug: "mobile-vehicle-diagnostics",
    service: "Mobile Vehicle Diagnostics",
    categoryId: "engine",
    h1: "Mobile Vehicle Diagnostics in Lehigh Acres and Fort Myers",
    metaTitle:
      "Mobile Car Diagnostics in Lehigh Acres and Fort Myers | OBD-II Scan & Drivability Testing",
    metaDescription:
      "Professional mobile vehicle diagnostics with real OBD-II scanners and live data. Check engine lights, drivability, electrical. Call (813) 501-7572.",
    canonical: "https://mikesmautorepair.com/vehicle-diagnostics",
    intro:
      "Modern vehicles speak in trouble codes — and we speak the language. Mike's Mobile Auto Repair brings professional OBD-II scanners, live data analysis, and real drivability testing to your driveway anywhere in Lehigh Acres and Fort Myers.",
    paragraphs: [
      "Most parts-store 'free scans' just read codes and clear them. That's not diagnostics — that's a starting point. Real diagnostics means reading freeze-frame data, live sensor values, fuel trims, misfire counts, and sometimes wiring tests with a multimeter. We do the real work, find the actual cause, and quote the repair before any wrench turns.",
      "We diagnose check-engine lights, hard shifts, intermittent stalls, no-starts, electrical gremlins, AC faults, and ABS / traction-control warnings. If we can fix it on the spot we will; if it needs follow-up parts we'll quote it transparently.",
      "Available across Lehigh Acres and Fort Myers. Call or text (813) 501-7572 to book a diagnostic appointment.",
    ],
    included: [
      "OBD-II scan with full code retrieval",
      "Freeze-frame and live data analysis",
      "Drivability testing and road test",
      "Electrical and wiring checks",
      "Honest, written diagnostic findings",
      "Repair quote up front",
    ],
    faqs: [
      { q: "How much does a mobile diagnostic cost?", a: "Standard diagnostic appointments run $80–$150 and are credited toward any repair we perform." },
      { q: "Can you reset my check engine light?", a: "Yes, but only after we identify and address the cause — clearing a code without fixing the issue just delays the problem." },
      { q: "Do you handle electrical and ABS issues?", a: "Yes — chassis-wide diagnostics including ABS, SRS warnings, and electrical faults." },
    ],
  },
  {
    slug: "mobile-oil-change",
    service: "Mobile Oil Change",
    categoryId: "oil-fluids",
    h1: "Mobile Oil Change Service in Lehigh Acres and Fort Myers",
    metaTitle:
      "Mobile Oil Change in Lehigh Acres and Fort Myers | At Your Home or Office",
    metaDescription:
      "Conventional, blend, and full synthetic mobile oil changes across Lehigh Acres and Fort Myers. We come to your driveway or office. Call (813) 501-7572.",
    intro:
      "Skip the oil-change shop wait. Mike's Mobile Auto Repair brings conventional, synthetic blend, and full synthetic oil changes to your home or workplace anywhere in Lehigh Acres and Fort Myers.",
    paragraphs: [
      "A typical oil change at a quick-lube shop eats up an hour of your day with the wait and the upsell pitch. Ours takes about 25 minutes in your driveway with no waiting room and no surprises. We use quality oil and a name-brand filter matched to your vehicle's spec.",
      "Florida heat is hard on engine oil. The hotter it runs, the faster it breaks down. We recommend interval checks every 3,000 miles for conventional, 5,000 for blends, and 7,500–10,000 for full synthetic — and we'll inspect belts, fluids, and tire pressure at every visit.",
      "Service available across Lehigh Acres and Fort Myers. Book at (813) 501-7572.",
    ],
    included: [
      "Up to 5 quarts of oil (extra by quart)",
      "Quality oil filter installed",
      "Top-off all under-hood fluids",
      "Tire pressure check and adjust",
      "Multi-point visual inspection",
      "Old oil and filter recycled responsibly",
    ],
    faqs: [
      { q: "How much does a mobile oil change cost?", a: "Conventional from $65, blend from $80, full synthetic from $100 (most vehicles). European and large trucks priced individually." },
      { q: "How long does it take?", a: "About 20–30 minutes per vehicle in your driveway." },
      { q: "Do you do fleet vehicles?", a: "Yes — multi-vehicle and recurring fleet service is available." },
    ],
  },
  {
    slug: "mobile-suspension-steering",
    service: "Mobile Suspension & Steering Repair",
    categoryId: "suspension",
    h1: "Mobile Suspension & Steering Repair in Lehigh Acres and Fort Myers",
    metaTitle:
      "Mobile Suspension & Steering Repair in Lehigh Acres and Fort Myers | On-Site Service",
    metaDescription:
      "Shocks, struts, control arms, ball joints, tie rods, wheel bearings — mobile suspension and steering repair across Lehigh Acres and Fort Myers. Call (813) 501-7572.",
    intro:
      "Clunks over bumps, vague steering, or pulling to one side? Mike's Mobile Auto Repair handles mobile suspension and steering repairs at your home or workplace across Lehigh Acres and Fort Myers.",
    paragraphs: [
      "Florida roads — and especially the patched-up surfaces around Lehigh Acres and east Lee County — are hard on suspension. Worn shocks and struts hurt ride quality and increase stopping distance; loose ball joints and tie rods are a safety issue.",
      "We replace shocks, struts, control arms, ball joints, sway bar links, tie rods, and wheel bearings on most vehicles right in your driveway. We also handle power-steering pump and rack diagnostics.",
      "Service available across Lehigh Acres and Fort Myers. Call or text (813) 501-7572 for an on-site quote.",
    ],
    included: [
      "Shock and strut replacement",
      "Control arm and ball joint replacement",
      "Tie rod and sway bar link replacement",
      "Wheel bearing replacement",
      "Power steering diagnostics",
      "Pre-repair suspension inspection",
    ],
    faqs: [
      { q: "Do I need an alignment afterward?", a: "Many suspension and steering repairs require an alignment after — we'll let you know up front." },
      { q: "Can you handle it on site?", a: "Most replacements yes. Heavy frame work or full ride-height changes may need a shop visit." },
    ],
  },
  {
    slug: "mobile-engine-diagnostics",
    service: "Mobile Engine Diagnostics",
    categoryId: "engine",
    h1: "Mobile Engine Diagnostics in Lehigh Acres and Fort Myers",
    metaTitle:
      "Mobile Engine Diagnostics in Lehigh Acres and Fort Myers | Check Engine Light & Drivability",
    metaDescription:
      "On-site engine diagnostics for check engine lights, misfires, rough idle, and drivability problems across Lehigh Acres and Fort Myers. Call (813) 501-7572.",
    intro:
      "Check engine light on, misfiring, or running rough? Mike's Mobile Auto Repair brings full engine diagnostic capability to your driveway across Lehigh Acres and Fort Myers.",
    paragraphs: [
      "Engine drivability problems are usually a chain of small clues — a single misfire code, slightly off fuel trims, a vacuum leak, an ignition coil getting weak. Real diagnostics means looking at all of it, not just slapping in a part and hoping.",
      "We diagnose misfires, rough idle, hesitation, lack of power, knocking, oil leaks, coolant leaks, and emissions failures. Repairs we commonly handle on site include spark plugs, coils, sensors, valve cover gaskets, and serpentine belts.",
      "Available across Lehigh Acres and Fort Myers. Book at (813) 501-7572.",
    ],
    included: [
      "Full OBD-II scan and live data",
      "Misfire and ignition system testing",
      "Vacuum and fuel trim analysis",
      "Spark plug and coil replacement",
      "Sensor replacement (O2, MAF, MAP, crank/cam)",
      "Honest written findings",
    ],
    faqs: [
      { q: "How much does engine diagnostics cost?", a: "Diagnostic appointments run $80–$150 and credit toward any repair." },
      { q: "Can you fix the issue on the same visit?", a: "Often yes for common parts; complex repairs may need a follow-up visit." },
    ],
  },
  {
    slug: "mobile-no-start-diagnostics",
    service: "Mobile No-Start Diagnostics",
    categoryId: "electrical",
    h1: "Mobile No-Start Diagnostics in Lehigh Acres and Fort Myers",
    metaTitle:
      "Mobile No-Start Diagnostics in Lehigh Acres and Fort Myers | Won't Crank or Won't Fire",
    metaDescription:
      "Car won't start? Mobile no-start diagnostics across Lehigh Acres and Fort Myers — battery, starter, fuel, ignition, and security. Call (813) 501-7572.",
    canonical: "https://mikesmautorepair.com/no-start-diagnostics",
    intro:
      "Won't crank? Cranks but won't fire? Mike's Mobile Auto Repair specializes in mobile no-start diagnostics across Lehigh Acres and Fort Myers — at your driveway or parking lot.",
    paragraphs: [
      "A no-start is the worst possible time to need a tow. Our mobile service truck arrives with battery testers, jump packs, fuel-pressure gauges, OBD-II scanners, and the experience to walk through every common cause systematically: battery, starter, fuel pressure, spark, security/immobilizer, and key sensors.",
      "Most no-starts get diagnosed and often repaired on the same visit. Common fixes we complete on site: battery replacement, starter replacement, alternator replacement, fuel-pump relay, crank sensor, and ignition switch.",
      "Available across all of Lehigh Acres and Fort Myers. Stuck right now? Call or text (813) 501-7572 — a real tech answers.",
    ],
    included: [
      "Full battery and charging-system test",
      "Starter circuit testing",
      "Fuel pressure check",
      "Spark and ignition testing",
      "Security/immobilizer diagnosis",
      "On-site repair where possible",
    ],
    faqs: [
      { q: "Can you really diagnose this in my driveway?", a: "Yes — almost every no-start can be narrowed down on site with proper tools." },
      { q: "How fast can you come?", a: "Same-day mobile service is usually available." },
    ],
  },
  // ===== Short-slug SEO landing pages (city) =====
  {
    slug: "mobile-mechanic-lehigh-acres",
    service: "Mobile Mechanic",
    citySlug: "lehigh-acres",
    categoryId: "engine",
    h1: "Mobile Mechanic in Lehigh Acres, FL",
    metaTitle: "Mobile Mechanic in Lehigh Acres, FL | Mike's Mobile Auto Repair",
    metaDescription:
      "Top-rated mobile mechanic in Lehigh Acres, FL. On-site diagnostics, brakes, batteries, and alternators. Same-day service. Call (813) 501-7572.",
    intro:
      "Looking for a trusted mobile mechanic in Lehigh Acres, FL? Mike's Mobile Auto Repair brings ASE-level service to your driveway or workplace — no tow, no shop wait.",
    paragraphs: [
      "Lehigh Acres is one of the largest planned communities in the country and getting a stalled vehicle to a brick-and-mortar shop can swallow an entire day. We exist to take that pain away. Our mobile service truck rolls into your driveway with diagnostic scanners, quality parts, and the experience to handle most repairs in a single visit.",
      "We service every Lehigh Acres ZIP — 33936, 33971, 33972, 33973, 33974, and 33976 — and handle batteries, alternators, starters, brakes, AC recharges, oil changes, and full check-engine-light diagnostics. Up-front quotes, no surprises, and a real technician answers the phone.",
      "Need help right now? Call or text (813) 501-7572. Same-day appointments are usually available, plus evening and weekend coverage anywhere in Lehigh Acres.",
    ],
    included: [
      "On-site diagnostics with real OBD-II scanners",
      "Brake pad, rotor, and caliper replacement",
      "Battery and alternator replacement",
      "Starter and no-start diagnostics",
      "AC recharge and cooling repairs",
      "Mobile oil changes and routine maintenance",
          ],
    faqs: [
      { q: "Are you really a mobile mechanic in Lehigh Acres?", a: "Yes — we live and work right here in Lehigh Acres and Fort Myers. Service covers every Lehigh Acres ZIP code." },
      { q: "What do you charge for a service call?", a: "There's no separate trip fee inside our regular service area — you only pay for the diagnostic and the work performed, quoted up front." },
      { q: "How fast can you come out?", a: "Same-day appointments are usually available." },
      { q: "Do you do brakes and batteries on site?", a: "Yes — both are among our most common Lehigh Acres jobs and almost always completed in a single visit." },
    ],
  },
  {
    slug: "mobile-mechanic-fort-myers",
    service: "Mobile Mechanic",
    citySlug: "fort-myers",
    categoryId: "engine",
    h1: "Mobile Mechanic in Fort Myers, FL",
    metaTitle: "Mobile Mechanic in Fort Myers, FL | Mike's Mobile Auto Repair",
    metaDescription:
      "Trusted mobile mechanic in Fort Myers, FL. Diagnostics, brakes, batteries, and AC at your home or office. Call (813) 501-7572.",
    intro:
      "Mike's Mobile Auto Repair is the on-call mobile mechanic in Fort Myers, FL. ASE-level repairs, transparent pricing, and we come to you — anywhere from Downtown to Gateway, McGregor to Iona.",
    paragraphs: [
      "Fort Myers traffic and Florida heat take a toll on cars year-round. We bring the shop to your driveway or office so you don't burn a workday at a waiting room. Our mobile truck carries diagnostic equipment and common parts to fix most issues in a single visit.",
      "We cover every major Fort Myers ZIP including 33901, 33907, 33908, 33912, 33913, 33916, 33919, and 33966. Most-called services here: AC recharges, battery and alternator replacements, brake jobs, and check-engine-light diagnostics.",
      "Local fleets — vans, work trucks, daily-use vehicles — also benefit from on-site maintenance with no shop downtime. Call or text (813) 501-7572 for a fast, transparent quote.",
    ],
    included: [
      "Mobile diagnostics and check-engine-light testing",
      "Brake pad and rotor replacement on site",
      "Battery and alternator replacement",
      "AC recharge and electrical repairs",
      "Starter and no-start diagnostics",
      "Mobile oil change and tune-ups",
      "Light fleet maintenance",
    ],
    faqs: [
      { q: "Do you cover all of Fort Myers?", a: "Yes — every ZIP code in Fort Myers, plus surrounding cities across Lehigh Acres and Fort Myers." },
      { q: "Can you handle AC repairs in my driveway?", a: "Yes. AC recharges and many compressor and condenser jobs are routinely done on site." },
      { q: "How do payments work?", a: "We accept cards, ACH, and offer financing on qualifying repairs. Quotes are always up front." },
      { q: "Same-day service?", a: "Almost always for in-stock work. Special-order parts may push to next day." },
    ],
  },
  // ===== Short-slug SEO landing pages (region-wide service) =====
  {
    slug: "alternator-repair",
    service: "Alternator Repair",
    categoryId: "electrical",
    h1: "Alternator Repair in Lehigh Acres and Fort Myers",
    metaTitle: "Alternator Repair in Lehigh Acres and Fort Myers | Mobile Charging-System Service",
    metaDescription:
      "Mobile alternator repair and replacement across Lehigh Acres and Fort Myers. Call (813) 501-7572.",
    intro:
      "Battery light on, dim headlights, dying after a jump? We diagnose and replace failed alternators at your home or office anywhere in Lehigh Acres and Fort Myers.",
    paragraphs: [
      "Alternator failure rarely happens at a convenient time. We arrive with professional charging-system testers and quality replacement alternators for most makes and models, then verify a clean 13.8–14.7-volt charge before we leave.",
      "We always test the entire charging system — battery, alternator output under load, voltage drops, and the serpentine belt — before condemning a part. You only pay for what's actually wrong.",
      "Service available in every Lehigh Acres and Fort Myers ZIP. Call or text (813) 501-7572 for same-day mobile alternator service.",
    ],
    included: [
      "Full charging-system test",
      "Quality alternator replacement",
      "Battery testing and replacement if needed",
      "Serpentine belt and tensioner inspection",
      "Voltage-drop and ground testing",
      "Post-install charging verification",
    ],
    faqs: [
      { q: "How much does alternator repair cost?", a: "Typical mobile alternator jobs run $350–$650 installed depending on vehicle and amperage." },
      { q: "How can you tell it's the alternator and not the battery?", a: "We test both under load before recommending parts." },
      { q: "Can you do it in my driveway?", a: "Yes — almost every alternator can be replaced on site without a tow." },
      { q: "Same-day service?", a: "Usually yes for common vehicles." },
    ],
  },
  {
    slug: "battery-replacement",
    service: "Car Battery Replacement",
    categoryId: "electrical",
    h1: "Car Battery Replacement in Lehigh Acres and Fort Myers",
    metaTitle: "Car Battery Replacement in Lehigh Acres and Fort Myers | Same-Day Mobile Install",
    metaDescription:
      "Mobile car battery delivery and installation across Lehigh Acres and Fort Myers. Free charging-system test included. Old battery hauled away. Call (813) 501-7572.",
    intro:
      "Dead battery? Skip the tow. We deliver and install quality car batteries anywhere in Lehigh Acres and Fort Myers — usually the same day.",
    paragraphs: [
      "Florida heat is brutal on batteries. Most last only 2–3 years here. When yours gives up, we bring the new one, test the charging system to make sure it's not actually an alternator, and install everything cleanly.",
      "We carry batteries for cars, trucks, SUVs, and most light commercial vehicles, in standard and AGM, with warranties up to 36 months.",
      "Service across all of Lehigh Acres and Fort Myers. Need a battery now? Call or text (813) 501-7572.",
    ],
    included: [
      "Free battery and charging-system test",
      "Quality replacement battery delivered",
      "Professional install with terminal cleaning",
      "Old battery recycled at no charge",
      "Post-install charge verification",
      "Battery warranty up to 36 months",
    ],
    faqs: [
      { q: "How much does mobile battery replacement cost?", a: "Most installed batteries run $180–$320 depending on group size and warranty." },
      { q: "Do you take the old battery?", a: "Yes — recycled at no extra charge." },
      { q: "How fast can you get to me?", a: "Same-day service is the norm." },
      { q: "Is the charging system included?", a: "Yes — a free charging-system test comes with every battery install." },
    ],
  },
  {
    slug: "brake-repair",
    service: "Brake Repair",
    categoryId: "brakes",
    h1: "Brake Repair in Lehigh Acres and Fort Myers",
    metaTitle: "Brake Repair in Lehigh Acres and Fort Myers | Mobile Pads, Rotors & Calipers",
    metaDescription:
      "Mobile brake repair across Lehigh Acres and Fort Myers — pads, rotors, calipers, fluid, ABS diagnostics. Done in your driveway. Call (813) 501-7572.",
    intro:
      "Squealing, grinding, or a soft pedal? We bring complete brake service to your driveway across Lehigh Acres and Fort Myers — pads, rotors, calipers, fluid, and ABS diagnostics.",
    paragraphs: [
      "Brake jobs are the single most common reason Lehigh Acres and Fort Myers drivers waste a day at a shop. We cut that out. Our mobile truck carries quality pads and rotors for most makes and models, fresh DOT brake fluid, and the tools to handle most repairs in 60–90 minutes per axle.",
      "Florida driving is hard on brakes — stop-and-go season traffic, daily commuting, and heavy SUVs all wear pads faster. Waiting turns a $200 pad job into a $500+ pad-and-rotor job.",
      "Available in every Lehigh Acres and Fort Myers ZIP. Quotes always up front; wheels torqued to spec. Call or text (813) 501-7572.",
    ],
    included: [
      "Front and rear pad replacement",
      "Rotor replacement or resurfacing",
      "Caliper inspection and replacement",
      "Brake fluid flush and bleed",
      "ABS warning-light diagnostics",
      "Free brake inspection with any service",
    ],
    faqs: [
      { q: "How much does brake repair cost?", a: "Most pad-and-rotor jobs run $180–$350 per axle, quoted up front." },
      { q: "How long does it take?", a: "60–90 minutes per axle on site." },
      { q: "Do you bring the parts?", a: "Yes — quality pads, rotors, and fluid for most vehicles." },
      { q: "Is the work warrantied?", a: "Yes, parts and labor are backed by our standard warranty." },
    ],
  },
  {
    slug: "vehicle-diagnostics",
    service: "Vehicle Diagnostics",
    categoryId: "engine",
    h1: "Vehicle Diagnostics in Lehigh Acres and Fort Myers",
    metaTitle: "Vehicle Diagnostics in Lehigh Acres and Fort Myers | Mobile OBD-II & Live Data",
    metaDescription:
      "Real mobile vehicle diagnostics across Lehigh Acres and Fort Myers — OBD-II, live data, drivability, electrical. Honest findings and up-front repair quotes. Call (813) 501-7572.",
    intro:
      "Modern vehicles speak in trouble codes — and we speak the language. We bring professional OBD-II scanners, live data, and real drivability testing to your driveway anywhere in Lehigh Acres and Fort Myers.",
    paragraphs: [
      "Most parts-store 'free scans' just read codes. Real diagnostics means freeze-frame data, live sensor values, fuel trims, misfire counts, and sometimes wiring tests. We do the real work and quote the repair before any wrench turns.",
      "We diagnose check-engine lights, hard shifts, intermittent stalls, no-starts, electrical issues, AC faults, and ABS / traction-control warnings. On-spot fixes when possible; transparent quotes when follow-up parts are needed.",
      "Service across all Lehigh Acres and Fort Myers. Call or text (813) 501-7572 to book.",
    ],
    included: [
      "OBD-II scan with full code retrieval",
      "Freeze-frame and live data analysis",
      "Drivability testing and road test",
      "Electrical and wiring checks",
      "Honest written diagnostic findings",
      "Repair quote up front",
    ],
    faqs: [
      { q: "How much does a mobile diagnostic cost?", a: "Standard appointments run $80–$150, credited toward any repair we perform." },
      { q: "Can you reset my check engine light?", a: "Yes — but only after we identify and address the cause." },
      { q: "Do you handle ABS and electrical issues?", a: "Yes, full chassis-wide diagnostics including ABS and SRS warnings." },
      { q: "Same-day appointments?", a: "Usually available across Lehigh Acres and Fort Myers." },
    ],
  },
  {
    slug: "no-start-diagnostics",
    service: "No-Start Diagnostics",
    categoryId: "electrical",
    h1: "No-Start Diagnostics in Lehigh Acres and Fort Myers",
    metaTitle: "No-Start Diagnostics in Lehigh Acres and Fort Myers | Mobile Won't-Start Service",
    metaDescription:
      "Car won't start? Mobile no-start diagnostics across Lehigh Acres and Fort Myers — battery, starter, fuel, ignition, security. Same-day. Call (813) 501-7572.",
    intro:
      "Won't crank? Cranks but won't fire? We specialize in mobile no-start diagnostics across Lehigh Acres and Fort Myers — at your driveway or parking lot.",
    paragraphs: [
      "A no-start is the worst possible time to need a tow. Our mobile truck arrives with battery testers, jump packs, fuel-pressure gauges, and OBD-II scanners to systematically work every common cause: battery, starter, fuel pressure, spark, security/immobilizer, and key sensors.",
      "Most no-starts get diagnosed and often repaired on the same visit. Frequent on-site fixes: battery, starter, alternator, fuel-pump relay, crank sensor, ignition switch.",
      "Available across all Lehigh Acres and Fort Myers. Stuck right now? Call or text (813) 501-7572 — a real tech answers.",
    ],
    included: [
      "Battery and charging-system test",
      "Starter circuit testing",
      "Fuel pressure check",
      "Spark and ignition testing",
      "Security/immobilizer diagnosis",
      "On-site repair where possible",
    ],
    faqs: [
      { q: "Can you really diagnose this in my driveway?", a: "Yes — almost every no-start can be narrowed down on site." },
      { q: "How fast can you come?", a: "Same-day mobile service is usually available." },
      { q: "Will you tow it if you can't fix it?", a: "We coordinate towing if needed, but most no-starts are repaired on the spot." },
      { q: "How much does it cost?", a: "Diagnostic appointments run $80–$150 and credit toward any repair." },
    ],
  },
  // ===== Short-slug city + service combo SEO pages =====
  {
    slug: "brake-repair-lehigh-acres",
    service: "Brake Repair",
    citySlug: "lehigh-acres",
    categoryId: "brakes",
    h1: "Brake Repair in Lehigh Acres, FL",
    metaTitle: "Brake Repair in Lehigh Acres, FL | Mobile Same-Day Service",
    metaDescription:
      "Mobile brake repair in Lehigh Acres, FL. Pads, rotors, calipers, and brake fluid done in your driveway. Same-day service. Call (813) 501-7572.",
    intro:
      "Need brake repair in Lehigh Acres? Mike's Mobile Auto Repair comes to your home or workplace and handles complete brake service — pads, rotors, calipers, fluid, and ABS diagnostics — usually in 60 to 90 minutes per axle.",
    paragraphs: [
      "Brakes wear out faster in Lehigh Acres than most people realize. Stop-and-go traffic on Lee Boulevard, Sunshine, Homestead, and Gunnery Road, paired with the heat and humidity of Lehigh Acres and Fort Myers, beats up pads, rotors, and brake fluid year-round. The result: most Lehigh Acres drivers need brake service every 30,000 to 45,000 miles — sometimes sooner on heavier SUVs and trucks.",
      "Instead of dropping your vehicle at a brick-and-mortar shop and burning a workday in a waiting room, our mobile service truck rolls to your driveway in any Lehigh Acres ZIP code (33936, 33971, 33972, 33973, 33974, 33976) with quality pads and rotors for most makes and models, fresh DOT brake fluid, calipers when needed, and the tools to handle the repair on site. We test-drive every job, torque every wheel to manufacturer spec, and bed your new pads in properly so the very first stop feels confident.",
      "We also handle the trickier stuff: stuck or seized calipers, dragging brakes, ABS warning lights, parking brake adjustments, and brake-fluid flushes. If your pedal feels soft, your truck is pulling under braking, or you're hearing a metal-on-metal grind, that's a now problem — not a next-month problem. Waiting turns a $200 pad job into a $500-plus pad-and-rotor job, and a destroyed rotor can damage the caliper too.",
      "Pricing is quoted up front before any work begins. No surprise add-ons, no shop diagnostic fee on top of a job we're already doing. Mike's Mobile Auto Repair is locally owned in Lee County, fully insured, and answered by a real technician — not a call center. Call or text (813) 501-7572 for same-day mobile brake repair in Lehigh Acres, FL.",
    ],
    included: [
      "Front and rear brake pad replacement",
      "Brake rotor replacement or resurfacing",
      "Caliper inspection, repair, or replacement",
      "Brake fluid flush and bleed",
      "ABS warning-light diagnostics",
      "Parking brake adjustment",
      "Free multi-point brake inspection",
      "Wheels torqued to manufacturer spec",
    ],
    faqs: [
      { q: "How much does brake repair cost in Lehigh Acres?", a: "Most front or rear pad-and-rotor jobs in Lehigh Acres run $180–$350 per axle depending on the vehicle and parts chosen. We quote you up front before starting any work and there are no shop fees added on top." },
      { q: "Can you come the same day?", a: "Yes — same-day mobile brake repair in Lehigh Acres is usually available. Call or text (813) 501-7572 and we'll confirm a time window." },
      { q: "How long does the repair take?", a: "A standard pad-and-rotor service per axle takes about 60–90 minutes on site. Most Lehigh Acres customers are back on the road the same morning or afternoon." },
      { q: "Do you warranty the work?", a: "Yes. Parts and labor on brake repairs are backed by our standard mobile-service warranty. See our warranty policy page for details." },
      { q: "What ZIP codes in Lehigh Acres do you cover?", a: "Every Lehigh Acres ZIP — 33936, 33971, 33972, 33973, 33974, and 33976 — plus all the surrounding Lee County area." },
    ],
  },
  {
    slug: "alternator-repair-fort-myers",
    service: "Alternator Repair",
    citySlug: "fort-myers",
    categoryId: "electrical",
    h1: "Alternator Repair in Fort Myers, FL",
    metaTitle: "Alternator Repair in Fort Myers, FL | Mobile Same-Day Service",
    metaDescription:
      "Mobile alternator repair and replacement in Fort Myers, FL. On-site charging-system testing and same-day install. Call (813) 501-7572.",
    intro:
      "Battery light on, dim headlights, or a no-start after a jump in Fort Myers? Mike's Mobile Auto Repair handles complete alternator and charging-system service at your home or office — no tow required.",
    paragraphs: [
      "Alternator failure is one of the most common electrical breakdowns we see across Fort Myers. Florida heat is brutal on alternator diodes, voltage regulators, and the battery itself, and the symptoms can be confusing — sometimes it looks like a dead battery, sometimes like a starter problem, sometimes the car runs fine for a few days then dies in the McGregor Costco parking lot.",
      "Our Fort Myers mobile mechanic service arrives with professional charging-system testers, a full inventory of replacement alternators for most makes and models, and the tools to swap one out in 60 to 120 minutes — right in your driveway or office lot. We test the entire charging system before condemning a part: battery condition, alternator output under load, voltage drop on the main cables, and the serpentine belt and tensioner. If the battery is the actual problem, we tell you. If it's the alternator, we install a quality replacement and verify a clean 13.8–14.7-volt charge before we leave.",
      "We service every Fort Myers ZIP including 33901, 33907, 33908, 33912, 33913, 33916, 33919, and 33966 — Downtown, McGregor, Gateway, Whiskey Creek, Iona, San Carlos Park, and beyond. Local fleets and work vans get the same on-site treatment so you never lose a vehicle for a half-day shop visit.",
      "Pricing is up front, work is warrantied, and a real technician answers the phone. Stuck right now in Fort Myers? Call or text (813) 501-7572 for same-day mobile alternator repair.",
    ],
    included: [
      "Full charging-system test (battery, alternator, belt)",
      "Quality alternator replacement on most makes and models",
      "Battery testing and replacement if needed",
      "Serpentine belt and tensioner inspection",
      "Voltage-drop and ground-cable testing",
      "Post-install charging verification",
      "Fleet and work-truck service available",
    ],
    faqs: [
      { q: "How much does alternator repair cost in Fort Myers?", a: "Typical mobile alternator replacement in Fort Myers runs $350–$650 installed, depending on vehicle and amperage. We quote up front before any work." },
      { q: "How can you tell it's the alternator and not the battery?", a: "We test both under load and check voltage drop on the main cables before recommending parts. A weak battery and a failing alternator can produce nearly identical symptoms." },
      { q: "Can you replace it in my office parking lot?", a: "Yes — almost every alternator job is completed on site in 60 to 120 minutes. No tow, no shop visit." },
      { q: "Is the work warrantied?", a: "Yes. Both parts and labor are backed by our standard mobile-service warranty." },
      { q: "Do you cover all of Fort Myers?", a: "Yes — every Fort Myers ZIP plus surrounding cities across Lee County." },
    ],
  },
  {
    slug: "battery-replacement-lehigh-acres",
    service: "Car Battery Replacement",
    citySlug: "lehigh-acres",
    categoryId: "electrical",
    h1: "Car Battery Replacement in Lehigh Acres, FL",
    metaTitle: "Car Battery Replacement in Lehigh Acres, FL | Mobile Same-Day",
    metaDescription:
      "Mobile car battery delivery and installation in Lehigh Acres, FL. Free charging-system test included. Old battery hauled away. Call (813) 501-7572.",
    intro:
      "Dead battery in Lehigh Acres? Skip the tow and the parts-store parking lot. Mike's Mobile Auto Repair delivers and installs quality car batteries anywhere in Lehigh Acres — usually the same day.",
    paragraphs: [
      "Florida heat is the number-one battery killer. Most batteries that would last 5+ years in a cooler climate barely make 2 to 3 years in Lehigh Acres before they start failing. The hot months cook the electrolyte, the cool months expose the weakness, and one morning your car just clicks. Sound familiar?",
      "When that happens, you don't need to roll-start it, push it, or pay for a tow to a chain shop. We bring the new battery directly to your driveway in any Lehigh Acres ZIP (33936, 33971, 33972, 33973, 33974, 33976), test the charging system to make sure it's not actually an alternator problem, and install everything cleanly — terminals cleaned, hold-down secured, and post-install charge verified before we leave.",
      "We carry batteries for cars, trucks, SUVs, and most light commercial vehicles, in standard flooded and AGM, with warranty options up to 36 months. We'll match the right group size and cold-cranking-amp rating to your specific vehicle so it starts the way the manufacturer intended — even on the hottest summer afternoon.",
      "We also handle the related electrical work that often goes hand-in-hand with a battery problem: corroded terminals, bad ground straps, parasitic draws, and failing alternators. Need a battery now in Lehigh Acres? Call or text (813) 501-7572 — we usually arrive same-day.",
    ],
    included: [
      "Free battery and charging-system test",
      "Quality replacement battery delivered to you",
      "Professional install with terminal cleaning",
      "Old battery hauled away and recycled",
      "Post-install charging verification",
      "AGM and standard flooded options",
      "Warranty options up to 36 months",
    ],
    faqs: [
      { q: "How much does a mobile battery replacement cost in Lehigh Acres?", a: "Most installed batteries run $180–$320 in Lehigh Acres depending on group size and warranty. AGM batteries cost more but last longer in Florida heat." },
      { q: "How fast can you get to me?", a: "Same-day mobile battery delivery is the norm across Lehigh Acres." },
      { q: "Do you take the old battery?", a: "Yes — we haul it away and recycle it properly at no extra charge." },
      { q: "What if it's actually the alternator?", a: "Every install includes a free charging-system test. If the alternator is the real culprit, we'll tell you up front and quote that repair separately." },
      { q: "Do you cover all of Lehigh Acres?", a: "Yes — every Lehigh Acres ZIP code plus the surrounding Lee County area." },
    ],
  },
  {
    slug: "oil-change-lehigh-acres",
    service: "Mobile Oil Change",
    citySlug: "lehigh-acres",
    categoryId: "oil-fluids",
    h1: "Mobile Oil Change in Lehigh Acres, FL",
    metaTitle: "Mobile Oil Change in Lehigh Acres, FL | At Your Driveway",
    metaDescription:
      "Mobile oil change in Lehigh Acres, FL — full synthetic, blend, or conventional, done in your driveway. Multi-point inspection included. Call (813) 501-7572.",
    intro:
      "Skip the oil-change shop wait. Mike's Mobile Auto Repair brings full synthetic, blended, and conventional oil changes right to your driveway anywhere in Lehigh Acres, FL — complete with a multi-point inspection.",
    paragraphs: [
      "An oil change is the cheapest thing you can do to extend the life of your engine — but only if it's actually done right. Wrong oil weight, wrong filter, missed top-offs on coolant, brake fluid, or washer fluid, and a missed visual inspection are the kind of things that turn a $50 mistake into a $5,000 engine repair down the road. We don't cut those corners.",
      "Every mobile oil change in Lehigh Acres includes the manufacturer-recommended oil weight and quantity, a quality filter, a full multi-point inspection (tires, brakes, belts, hoses, fluids, lights, suspension), top-offs on the other under-hood fluids, and a sticker reminder for your next service interval. We log everything so your maintenance history is easy to track for resale or warranty.",
      "We service every Lehigh Acres ZIP including 33936, 33971, 33972, 33973, 33974, and 33976. Whether you need a quick conventional change on a daily-driver Civic or a full-synthetic 0W-20 on a newer truck, we have the right oil and filter on the truck. Fleet and multi-vehicle households get bulk pricing.",
      "Most appointments take 30 to 45 minutes start to finish. Want it done at home this weekend? Call or text (813) 501-7572 to book a Lehigh Acres mobile oil change.",
    ],
    included: [
      "Full synthetic, blend, or conventional oil",
      "Quality OEM-grade oil filter",
      "Multi-point safety inspection (tires, brakes, fluids)",
      "Top-offs on coolant, brake, washer, and power-steering fluid",
      "Used oil and filter recycled at no charge",
      "Service sticker and reminder for next interval",
      "Fleet and multi-vehicle pricing available",
    ],
    faqs: [
      { q: "How much does a mobile oil change cost in Lehigh Acres?", a: "Conventional oil changes start around $60–$80 mobile. Full synthetic typically runs $90–$140 depending on capacity and oil weight. Quoted up front." },
      { q: "How long does it take?", a: "Most appointments are done in 30–45 minutes including the multi-point inspection." },
      { q: "What oil do you use?", a: "We carry full synthetic, synthetic blend, and conventional in the most common manufacturer-spec weights. We always match what your owner's manual recommends." },
      { q: "Do you take the old oil?", a: "Yes — used oil and filters are recycled at no extra charge." },
      { q: "Can you service my whole household?", a: "Yes. Multi-vehicle and fleet customers in Lehigh Acres get bulk pricing." },
    ],
  },
  {
    slug: "diagnostics-lehigh-acres",
    service: "Vehicle Diagnostics",
    citySlug: "lehigh-acres",
    categoryId: "engine",
    h1: "Mobile Vehicle Diagnostics in Lehigh Acres, FL",
    metaTitle: "Vehicle Diagnostics in Lehigh Acres, FL | Mobile OBD-II Scan",
    metaDescription:
      "Real mobile vehicle diagnostics in Lehigh Acres, FL — OBD-II, live data, drivability, electrical. Honest findings and up-front quotes. Call (813) 501-7572.",
    intro:
      "Check engine light on in Lehigh Acres? Modern vehicles speak in trouble codes, and we speak the language. Mike's Mobile Auto Repair brings professional OBD-II scanners, live data, and real drivability testing to your driveway anywhere in Lehigh Acres.",
    paragraphs: [
      "Most parts-store 'free scans' just read the code and hand you a list of every part it could possibly be. That's not a diagnosis — that's a guess that often costs Lehigh Acres drivers hundreds of dollars in unnecessary parts. Real diagnostics means freeze-frame data, live sensor values, fuel-trim analysis, misfire counters, and sometimes wiring tests with a multimeter or scope. We do the real work, then quote the actual repair before any wrench turns.",
      "We diagnose check-engine lights, hard shifts, intermittent stalls, no-starts, hesitation under acceleration, electrical glitches, AC faults, ABS and traction-control warnings, and emissions readiness for tag renewal. On-the-spot fixes are common when the problem is straightforward — sensors, gaskets, ignition components, fuel-pump relays — and we provide a transparent written quote when follow-up parts are needed.",
      "We service every Lehigh Acres ZIP including 33936, 33971, 33972, 33973, 33974, and 33976. The diagnostic appointment runs $80–$150 and is fully credited toward any repair we perform. No hidden 'shop fees' on top, no upselling parts you don't need.",
      "If your car is acting up — even intermittently — book a real diagnostic before the symptom turns into a tow. Call or text (813) 501-7572 to schedule mobile diagnostics in Lehigh Acres today.",
    ],
    included: [
      "OBD-II scan with full code retrieval",
      "Freeze-frame and live data analysis",
      "Drivability and road-test verification",
      "Electrical and wiring checks where needed",
      "Honest written diagnostic findings",
      "Up-front repair quote before any work",
      "Diagnostic fee credited toward repair",
    ],
    faqs: [
      { q: "How much does a mobile diagnostic cost in Lehigh Acres?", a: "Standard appointments run $80–$150 in Lehigh Acres and are credited toward any repair we perform on the same visit." },
      { q: "Can you reset my check-engine light?", a: "Yes — but only after we identify and address the actual cause. Resetting without fixing it just makes the light come back." },
      { q: "Do you handle ABS and electrical issues?", a: "Yes — full chassis-wide diagnostics including ABS, SRS (airbag), and body-control modules on most makes." },
      { q: "Same-day appointments?", a: "Same-day mobile diagnostics are usually available across Lehigh Acres. Call (813) 501-7572 to confirm a window." },
      { q: "What if it's something you can't fix on site?", a: "We give you a transparent written quote and, if needed, coordinate towing. We never push unnecessary repairs." },
    ],
  },
  {
    slug: "oil-change",
    service: "Mobile Oil Change",
    categoryId: "oil-fluids",
    h1: "Mobile Oil Change in Lehigh Acres and Fort Myers",
    metaTitle: "Mobile Oil Change in Lehigh Acres and Fort Myers | At Your Home or Office",
    metaDescription:
      "Full-service mobile oil change at your driveway across Lehigh Acres and Fort Myers. Call (813) 501-7572.",
    canonical: "https://mikesmautorepair.com/oil-change",
    intro:
      "Skip the quick-lube line. Mike's Mobile Auto Repair performs full-service oil changes — conventional, blend, or full synthetic — right in your driveway anywhere in Lehigh Acres and Fort Myers.",
    paragraphs: [
      "A mobile oil change is the easiest service to fit into a busy schedule. We arrive with quality oil and a new filter, set up containment, drain and replace the oil, swap the filter, top off fluids, reset the maintenance light, and properly recycle the used oil. The whole appointment usually takes 20–30 minutes and you never have to leave home.",
      "We carry conventional, synthetic-blend, and full-synthetic oils plus the right filter for your specific vehicle. Most modern cars and trucks need full synthetic — we'll confirm what's correct based on your owner's manual before we start. Pricing is up front and includes the multi-point inspection (tires, brakes, belts, hoses, lights) at no extra charge.",
      "We service every Lehigh Acres and Fort Myers ZIP code. Call or text (813) 501-7572 to book a mobile oil change today.",
    ],
    included: [
      "Up to 5 quarts of conventional, blend, or full synthetic oil",
      "New OE-equivalent oil filter",
      "Drain plug and gasket inspection",
      "Used oil and filter recycled at no charge",
      "Top-off of washer fluid and visible reservoirs",
      "Free multi-point safety inspection",
      "Maintenance reminder light reset",
    ],
    faqs: [
      { q: "How much does a mobile oil change cost?", a: "Conventional from $59, synthetic blend from $79, full synthetic from $99 — pricing depends on oil capacity and filter." },
      { q: "How long does it take?", a: "Most oil changes are completed in 20–30 minutes on site." },
      { q: "Do you take the old oil?", a: "Yes — we contain it on site and recycle it properly at no extra charge." },
      { q: "Will you remind me when I'm due again?", a: "Yes — we'll text you a reminder based on your driving and the oil type used." },
    ],
  },
  {
    slug: "diagnostics",
    service: "Mobile Vehicle Diagnostics",
    categoryId: "engine",
    h1: "Mobile Vehicle Diagnostics in Lehigh Acres and Fort Myers",
    metaTitle: "Mobile Vehicle Diagnostics in Lehigh Acres and Fort Myers | Real OBD-II Testing",
    metaDescription:
      "Real mobile diagnostics across Lehigh Acres and Fort Myers — OBD-II, live data, electrical. Call (813) 501-7572.",
    canonical: "https://mikesmautorepair.com/diagnostics",
    intro:
      "Check engine light on? Strange shifting, intermittent stalls, or an electrical gremlin? Mike's Mobile Auto Repair brings real vehicle diagnostics — OBD-II, live data, drivability, and electrical testing — to your driveway anywhere in Lehigh Acres and Fort Myers.",
    paragraphs: [
      "A parts-store 'free scan' just reads the code and hands you a list of every part it could possibly be. That's a guess, not a diagnosis, and it routinely costs Lehigh Acres and Fort Myers drivers hundreds of dollars in unnecessary parts. Real diagnostics means freeze-frame data, live sensor values, fuel-trim analysis, misfire counters, and — when needed — wiring tests with a multimeter or scope. We do the real work, then quote the actual repair before any wrench turns.",
      "We diagnose check-engine lights, hard shifts, intermittent stalls, no-starts, hesitation under acceleration, electrical glitches, AC faults, ABS and traction-control warnings, and emissions readiness for tag renewal. On-the-spot fixes are common when the problem is straightforward — sensors, gaskets, ignition components, fuel-pump relays — and we provide a transparent written quote when follow-up parts are needed.",
      "Service is available in every Lehigh Acres and Fort Myers ZIP. The diagnostic appointment runs $80–$150 and is fully credited toward any repair we perform. Call or text (813) 501-7572 to book.",
    ],
    included: [
      "OBD-II scan with full code retrieval",
      "Freeze-frame and live data analysis",
      "Drivability and road-test verification",
      "Electrical and wiring checks where needed",
      "ABS, SRS, and body-control module scanning",
      "Honest written diagnostic findings",
      "Up-front repair quote — diagnostic fee credited toward repair",
    ],
    faqs: [
      { q: "How much does a mobile diagnostic cost?", a: "Standard diagnostic appointments run $80–$150 and are credited toward any repair we perform the same visit." },
      { q: "Can you reset my check-engine light?", a: "Yes — but only after we identify and address the actual cause. Otherwise it just comes back." },
      { q: "Do you handle ABS and electrical issues?", a: "Yes — full chassis-wide diagnostics on most makes including ABS, SRS, and body-control modules." },
      { q: "Same-day appointments?", a: "Yes — same-day mobile diagnostics are usually available across Lehigh Acres and Fort Myers." },
    ],
  },
  {
    slug: "battery-alternator-starter",
    service: "Mobile Battery, Alternator & Starter Service",
    categoryId: "electrical",
    h1: "Mobile Battery, Alternator & Starter Service in Lehigh Acres and Fort Myers",
    metaTitle:
      "Mobile Battery, Alternator & Starter Repair | Lehigh Acres and Fort Myers | (813) 501-7572",
    metaDescription:
      "On-site battery, alternator, and starter testing and replacement across Lehigh Acres and Fort Myers. Call (813) 501-7572.",
    canonical: "https://mikesmautorepair.com/battery-alternator-starter",
    intro:
      "No-crank, single click, dim lights, or battery warning light? Mike's Mobile Auto Repair tests and replaces the entire starting and charging system — battery, alternator, and starter — at your home or office across Lehigh Acres and Fort Myers.",
    paragraphs: [
      "When a vehicle won't crank, the cause is almost always one of three parts: a dead battery, a failing alternator, or a bad starter. Symptoms overlap, so we test the whole starting and charging system before we recommend anything. That means a load test on the battery, an output test on the alternator under demand, voltage-drop tests on the main cables, and a starter draw test if needed. You only pay for what's actually wrong.",
      "Florida heat is brutal on starting systems. Most batteries last only 2–3 years here, alternators run hot under constant AC load, and starter solenoids weather faster than they should. We carry quality replacement batteries (standard and AGM), alternators for most makes and models, and source most starters same-day. Installation is on the spot — usually 30 to 90 minutes depending on the part — and we verify a clean 13.8–14.7-volt charge before we leave.",
      "Service is available across every Lehigh Acres and Fort Myers ZIP. Stuck right now with a no-start? Call or text (813) 501-7572 — same-day mobile service is usually available.",
    ],
    included: [
      "Free battery load test and charging-system test",
      "Battery replacement (standard and AGM)",
      "Alternator replacement on most makes and models",
      "Starter testing and replacement",
      "Voltage-drop testing on main cables and grounds",
      "Terminal cleaning and corrosion removal",
      "Old battery hauled away and properly recycled",
    ],
    faqs: [
      { q: "How do I know which part is bad?", a: "We test all three before recommending anything. A weak battery, a failing alternator, and a bad starter can produce identical symptoms." },
      { q: "How much does each repair cost?", a: "Battery: $180–$320 installed. Alternator: $350–$650 installed. Starter: $400–$750 installed. All quoted up front." },
      { q: "Can you do it in my driveway?", a: "Yes — almost every battery, alternator, and starter job is done on site without a tow." },
      { q: "Same-day service?", a: "Usually yes for common vehicles. Special-order parts may push to next day." },
    ],
  },
  // ===== City + service "-fl" SEO landing pages =====
  {
    slug: "mobile-mechanic-lehigh-acres-fl",
    service: "Mobile Mechanic",
    citySlug: "lehigh-acres",
    categoryId: "engine",
    h1: "Mobile Mechanic in Lehigh Acres, FL",
    metaTitle: "Mobile Mechanic in Lehigh Acres, FL | Same-Day On-Site Auto Repair",
    metaDescription:
      "Top-rated mobile mechanic in Lehigh Acres, FL. On-site diagnostics, brakes, batteries, alternators, AC, and oil changes. Same-day service. Call (813) 501-7572.",
    intro:
      "Looking for a trusted mobile mechanic in Lehigh Acres, FL? Mike's Mobile Auto Repair brings ASE-level service to your driveway, workplace, or roadside anywhere in Lehigh Acres — no tow, no shop wait, no surprise fees.",
    paragraphs: [
      "Lehigh Acres is one of the largest planned communities in the country, which means getting a stalled vehicle to a brick-and-mortar shop can swallow an entire workday. We exist to take that pain away. Our mobile service truck rolls into your Lehigh Acres driveway with professional OBD-II scanners, quality replacement parts, and the experience to handle most repairs in a single visit. From batteries and alternators to brakes, AC recharges, and full check-engine-light diagnostics, we cover the work a traditional shop covers — just at your home or office in Lehigh Acres.",
      "We service every Lehigh Acres ZIP code: 33936, 33971, 33972, 33973, 33974, and 33976. That includes the corridors most likely to leave you stranded — Lee Boulevard, Sunshine, Homestead, Gunnery, and Joel — plus every neighborhood in between. Most calls fall into a few buckets: no-start diagnostics, dead batteries, failing alternators, brake jobs, and AC failures during the long Florida summer. All of these are routinely handled in your Lehigh Acres driveway in a single visit.",
      "Pricing is always quoted up front before any wrench turns. There's no separate shop diagnostic fee added on top of a job we're already performing, no parts markup games, and no surprise add-ons at the end. A real technician answers the phone — not a call center — and you'll get straight answers about what your vehicle actually needs and what can wait. That kind of honesty is rare in the Lehigh Acres auto-repair market, and it's why most of our work comes from repeat customers and referrals.",
      "Our most-requested mobile services in Lehigh Acres include brake pad and rotor replacement, battery delivery and install, alternator and starter replacement, OBD-II and drivability diagnostics, AC recharges and compressor work, mobile oil changes, cooling-system repairs, and pre-purchase inspections. Local fleets and work-truck owners in Lehigh Acres also use us for on-site preventive maintenance so vehicles never sit idle at a shop.",
      "Same-day appointments are usually available across Lehigh Acres, with evening and weekend coverage when needed. Need help right now? Call or text (813) 501-7572 — your local mobile mechanic in Lehigh Acres, FL is one tap away.",
    ],
    included: [
      "On-site diagnostics with real OBD-II scanners",
      "Brake pad, rotor, and caliper replacement",
      "Battery delivery and installation",
      "Alternator and starter replacement",
      "AC recharge and cooling-system repairs",
      "Mobile oil changes and routine maintenance",
      "No-start and electrical diagnostics",
      "Pre-purchase vehicle inspections",
    ],
    faqs: [
      { q: "Are you really a full-service mobile mechanic in Lehigh Acres?", a: "Yes — we live and work in Lehigh Acres and Fort Myers, and we cover every Lehigh Acres ZIP code with full mobile mechanic service." },
      { q: "What do you charge for a mobile service call in Lehigh Acres?", a: "There's no separate trip fee inside our regular Lehigh Acres service area — you only pay for the diagnostic and the repair, quoted up front." },
      { q: "How fast can you get to me in Lehigh Acres?", a: "Same-day appointments are usually available across Lehigh Acres, including evenings and weekends." },
      { q: "Do you handle brakes and batteries on site in Lehigh Acres?", a: "Yes — both are among our most common Lehigh Acres jobs and almost always completed in a single mobile visit." },
      { q: "Is the work warrantied?", a: "Yes. Parts and labor are backed by our standard mobile-service warranty across all Lehigh Acres jobs." },
    ],
  },
  {
    slug: "mobile-mechanic-fort-myers-fl",
    service: "Mobile Mechanic",
    citySlug: "fort-myers",
    categoryId: "engine",
    h1: "Mobile Mechanic in Fort Myers, FL",
    metaTitle: "Mobile Mechanic in Fort Myers, FL | On-Site Auto Repair At Your Driveway",
    metaDescription:
      "Trusted mobile mechanic in Fort Myers, FL. Diagnostics, brakes, batteries, alternators, and AC at your home or office. Same-day service. Call (813) 501-7572.",
    intro:
      "Mike's Mobile Auto Repair is the on-call mobile mechanic in Fort Myers, FL. ASE-level repairs, transparent pricing, and we come to you — anywhere from Downtown Fort Myers to Gateway, McGregor to Iona, San Carlos Park to Whiskey Creek.",
    paragraphs: [
      "Fort Myers traffic and Florida heat take a real toll on cars year-round. Stop-and-go on Colonial, US-41, and Daniels Parkway wears brakes faster than highway driving, and the heat is brutal on batteries, alternators, and AC compressors. Instead of losing a workday at a brick-and-mortar shop in Fort Myers, our mobile truck comes to your driveway or office with diagnostic equipment and common parts on board, ready to fix most issues in a single visit.",
      "We cover every major Fort Myers ZIP code: 33901, 33907, 33908, 33912, 33913, 33916, 33919, and 33966. That includes Downtown Fort Myers, McGregor Boulevard, Gateway, Whiskey Creek, Iona, San Carlos Park, Page Field, and the corridors around Edison Mall and HealthPark. Most-called services in Fort Myers right now: AC recharges and compressor work, battery and alternator replacements, brake jobs, no-start diagnostics, and check-engine-light testing.",
      "Real diagnostics matter here. Modern vehicles speak in trouble codes, freeze-frame data, and live sensor values — not just a single 'check engine' light. We don't guess. We bring professional OBD-II scanners and we read fuel trims, misfire counts, and live data to find the actual cause before recommending any parts. That saves Fort Myers customers hundreds of dollars on the wrong repairs.",
      "Local Fort Myers fleets — vans, work trucks, daily-use vehicles — also benefit from on-site mobile maintenance with no shop downtime. Oil changes, brake jobs, batteries, alternators, and inspections all happen in your lot while your team keeps working. We accept cards, ACH, and offer financing on qualifying repairs across Fort Myers.",
      "Pricing is always quoted up front. No surprise fees, no padded labor, and a real technician answers the phone — not a call service. Most-called now: same-day mobile AC repair, mobile brake repair, and mobile alternator replacement across Fort Myers. Call or text (813) 501-7572 for a fast, transparent quote.",
    ],
    included: [
      "Mobile diagnostics with real OBD-II scanners",
      "Brake pad and rotor replacement on site",
      "Battery and alternator replacement",
      "AC recharge and electrical repairs",
      "Starter and no-start diagnostics",
      "Mobile oil change and tune-ups",
      "Light fleet and work-truck maintenance",
      "Pre-purchase vehicle inspections",
    ],
    faqs: [
      { q: "Do you cover all of Fort Myers?", a: "Yes — every Fort Myers ZIP code plus surrounding cities including Lehigh Acres." },
      { q: "Can you handle AC repairs in my Fort Myers driveway?", a: "Yes. AC recharges and many compressor and condenser jobs are routinely done on site in Fort Myers." },
      { q: "How do payments work?", a: "We accept cards, ACH, and offer financing on qualifying repairs across Fort Myers. Quotes are always up front." },
      { q: "Same-day service in Fort Myers?", a: "Almost always for in-stock work across Fort Myers. Special-order parts may push to next day." },
      { q: "Do you service Fort Myers fleets?", a: "Yes — light fleet and work-truck maintenance is a regular part of our Fort Myers service." },
    ],
  },
  {
    slug: "brake-repair-lehigh-acres-fl",
    service: "Brake Repair",
    citySlug: "lehigh-acres",
    categoryId: "brakes",
    h1: "Brake Repair in Lehigh Acres, FL",
    metaTitle: "Brake Repair in Lehigh Acres, FL | Mobile Same-Day Pads, Rotors & Calipers",
    metaDescription:
      "Mobile brake repair in Lehigh Acres, FL. Pads, rotors, calipers, and brake fluid done in your driveway. Same-day service. Call (813) 501-7572.",
    intro:
      "Need brake repair in Lehigh Acres, FL? Mike's Mobile Auto Repair comes to your home or workplace and handles complete brake service — pads, rotors, calipers, fluid, and ABS diagnostics — usually in 60 to 90 minutes per axle.",
    paragraphs: [
      "Brakes wear out faster in Lehigh Acres than most drivers realize. Stop-and-go traffic on Lee Boulevard, Sunshine, Homestead, and Gunnery, paired with the heat and humidity of Southwest Florida, beats up pads, rotors, and brake fluid year-round. The result: most Lehigh Acres drivers need brake service every 30,000 to 45,000 miles — sometimes sooner on heavier SUVs, work trucks, and towing vehicles common in Lehigh Acres.",
      "Instead of dropping your vehicle at a brick-and-mortar shop and burning a workday in a waiting room, our mobile service truck rolls right to your Lehigh Acres driveway in any ZIP — 33936, 33971, 33972, 33973, 33974, or 33976 — with quality pads and rotors for most makes and models, fresh DOT brake fluid, calipers when needed, and the tools to handle the entire repair on site. We test-drive every job, torque every wheel to manufacturer spec, and bed your new pads in properly so the very first stop in Lehigh Acres feels confident.",
      "We also handle the trickier brake work: stuck or seized calipers, dragging brakes, ABS warning lights, parking-brake adjustments, and complete brake-fluid flushes. If your pedal feels soft, your truck pulls under braking, or you're hearing a metal-on-metal grind anywhere in Lehigh Acres, that's a now problem — not a next-month problem. Waiting turns a $200 pad job into a $500-plus pad-and-rotor job, and a destroyed rotor can damage the caliper too.",
      "Pricing is quoted up front before any work begins. No surprise add-ons, no shop diagnostic fee on top of a job we're already doing, and no parts-markup games. Mike's Mobile Auto Repair is locally owned in Lee County, fully insured, and answered by a real technician — not a call center. Every brake job in Lehigh Acres is backed by our standard parts-and-labor warranty.",
      "Need same-day brake repair in Lehigh Acres, FL? Call or text (813) 501-7572 and we'll confirm a time window within minutes. Most Lehigh Acres customers are back on the road the same morning or afternoon.",
    ],
    included: [
      "Front and rear brake pad replacement",
      "Brake rotor replacement or resurfacing",
      "Caliper inspection, repair, or replacement",
      "Brake fluid flush and bleed",
      "ABS warning-light diagnostics",
      "Parking brake adjustment",
      "Free multi-point brake inspection",
      "Wheels torqued to manufacturer spec",
    ],
    faqs: [
      { q: "How much does brake repair cost in Lehigh Acres?", a: "Most front or rear pad-and-rotor jobs in Lehigh Acres run $180–$350 per axle depending on vehicle and parts. Quoted up front with no shop fees added on top." },
      { q: "Can you come the same day in Lehigh Acres?", a: "Yes — same-day mobile brake repair in Lehigh Acres is usually available. Call or text (813) 501-7572 to confirm a window." },
      { q: "How long does the repair take?", a: "A standard pad-and-rotor service per axle takes about 60–90 minutes on site. Most Lehigh Acres customers are back on the road the same day." },
      { q: "Do you warranty the brake work?", a: "Yes. Parts and labor on every Lehigh Acres brake job are backed by our standard mobile-service warranty." },
      { q: "What ZIP codes in Lehigh Acres do you cover?", a: "Every Lehigh Acres ZIP — 33936, 33971, 33972, 33973, 33974, and 33976 — plus all of surrounding Lee County." },
    ],
  },
  {
    slug: "alternator-repair-fort-myers-fl",
    service: "Alternator Repair",
    citySlug: "fort-myers",
    categoryId: "electrical",
    h1: "Alternator Repair in Fort Myers, FL",
    metaTitle: "Alternator Repair in Fort Myers, FL | Mobile Same-Day Charging-System Service",
    metaDescription:
      "Mobile alternator repair and replacement in Fort Myers, FL. On-site charging-system testing and same-day install. Call (813) 501-7572.",
    intro:
      "Battery light on, dim headlights, or a no-start after a jump in Fort Myers, FL? Mike's Mobile Auto Repair handles complete alternator and charging-system service at your home or office in Fort Myers — no tow required.",
    paragraphs: [
      "Alternator failure is one of the most common electrical breakdowns we see across Fort Myers. Florida heat is brutal on alternator diodes, voltage regulators, and the battery itself, and the symptoms can be confusing — sometimes it looks like a dead battery, sometimes like a starter problem, and sometimes the car runs fine for a few days then dies in the McGregor Costco parking lot or the Gateway commons in Fort Myers.",
      "Our Fort Myers mobile mechanic service arrives with professional charging-system testers, a full inventory of replacement alternators for most makes and models, and the tools to swap one out in 60 to 120 minutes — right in your Fort Myers driveway or office lot. We test the entire charging system before condemning a part: battery condition, alternator output under load, voltage drop on the main cables, and the serpentine belt and tensioner. If the battery is the actual problem, we'll tell you. If it's the alternator, we install a quality replacement and verify a clean 13.8–14.7-volt charge before we leave.",
      "We service every Fort Myers ZIP code including 33901, 33907, 33908, 33912, 33913, 33916, 33919, and 33966 — Downtown Fort Myers, McGregor, Gateway, Whiskey Creek, Iona, San Carlos Park, Page Field, and beyond. Local fleets, work vans, and daily-driver SUVs in Fort Myers all get the same on-site treatment so you never lose a vehicle for a half-day shop visit.",
      "What separates a good alternator repair from a bad one is the testing. A parts-store free check tells you 'alternator failed' but doesn't tell you why, and it doesn't catch a corroded ground cable or a worn-out battery that will kill the new alternator within months. We do the deeper voltage-drop and load tests every time, on every Fort Myers job, so the repair actually lasts.",
      "Pricing is up front, work is warrantied, and a real technician answers the phone — not a call center. Stuck right now in Fort Myers? Call or text (813) 501-7572 for same-day mobile alternator repair anywhere in Fort Myers, FL.",
    ],
    included: [
      "Full charging-system test (battery, alternator, belt)",
      "Quality alternator replacement on most makes and models",
      "Battery testing and replacement if needed",
      "Serpentine belt and tensioner inspection",
      "Voltage-drop and ground-cable testing",
      "Post-install charging verification",
      "Fleet and work-truck service available",
    ],
    faqs: [
      { q: "How much does alternator repair cost in Fort Myers?", a: "Typical mobile alternator replacement in Fort Myers runs $350–$650 installed, depending on vehicle and amperage. Quoted up front before any work." },
      { q: "How can you tell it's the alternator and not the battery?", a: "We test both under load and check voltage drop on the main cables before recommending parts. A weak battery and a failing alternator can produce nearly identical symptoms." },
      { q: "Can you replace it in my Fort Myers office parking lot?", a: "Yes — almost every alternator job is completed on site in Fort Myers in 60 to 120 minutes. No tow, no shop visit." },
      { q: "Is the work warrantied?", a: "Yes. Both parts and labor are backed by our standard mobile-service warranty on every Fort Myers job." },
      { q: "Do you cover all of Fort Myers?", a: "Yes — every Fort Myers ZIP plus surrounding cities across Lee County." },
    ],
  },
  // ===== Additional service-specific "-fl" SEO landing pages =====
  {
    slug: "battery-replacement-lehigh-acres-fl",
    service: "Battery Replacement",
    citySlug: "lehigh-acres",
    categoryId: "electrical",
    h1: "Mobile Battery Replacement in Lehigh Acres, FL",
    metaTitle: "Battery Replacement in Lehigh Acres, FL | Same-Day Mobile Install",
    metaDescription:
      "Mobile car battery replacement in Lehigh Acres, FL. Delivered and installed in your driveway. Same-day service. Call (813) 501-7572.",
    intro:
      "Dead battery in Lehigh Acres, FL? Mike's Mobile Auto Repair delivers and installs a quality replacement battery at your home, workplace, or roadside anywhere in Lehigh Acres — usually within the same day.",
    paragraphs: [
      "Florida heat is the number-one killer of car batteries, and Lehigh Acres summers are some of the hardest in the state. Most batteries in Lehigh Acres last only 3 to 4 years before they start cranking slow, struggling on hot mornings, or dying outright. Instead of pushing your car or paying for a tow to a brick-and-mortar shop, our mobile mechanic comes to you anywhere in Lehigh Acres with the right battery on the truck.",
      "We service every Lehigh Acres ZIP code: 33936, 33971, 33972, 33973, 33974, and 33976 — covering Lee Boulevard, Sunshine, Homestead, Gunnery, Joel, and every neighborhood in between. Before installing, we test the charging system to make sure the alternator isn't the real cause. A new battery in a Lehigh Acres driveway only fixes the problem if the alternator is actually charging it; otherwise you'll be stuck again next week.",
      "Our typical Lehigh Acres battery service includes battery delivery, full charging-system test, terminal cleaning, voltage-drop check on the main cables, install, and proper recycling of your old battery. Most jobs take 20 to 40 minutes on site. We carry batteries for cars, light trucks, SUVs, and most work vans common in Lehigh Acres.",
      "Pricing is quoted up front before any work — most Lehigh Acres mobile battery installs run $180 to $320 depending on group size and warranty. No trip fee inside the Lehigh Acres service area, no parts-markup games, and a real technician answers the phone. Every battery is backed by manufacturer warranty plus our mobile install warranty.",
      "Need a jump or a same-day battery install in Lehigh Acres, FL? Call or text (813) 501-7572 and we'll be on the way. Most Lehigh Acres customers are running again the same morning or afternoon.",
    ],
    included: [
      "Quality replacement battery delivered to you",
      "Full charging-system test before install",
      "Terminal cleaning and corrosion removal",
      "Voltage-drop check on main cables",
      "Old battery hauled away and recycled",
      "Manufacturer + mobile install warranty",
    ],
    faqs: [
      { q: "How much does battery replacement cost in Lehigh Acres?", a: "Most mobile battery installs in Lehigh Acres run $180–$320 depending on the group size and warranty length. Quoted up front." },
      { q: "Same-day service in Lehigh Acres?", a: "Yes — almost every Lehigh Acres battery call is handled the same day, including evenings and weekends." },
      { q: "Do you test the alternator too?", a: "Always. A new battery only solves the problem if the alternator in your Lehigh Acres vehicle is charging properly." },
      { q: "What about my old battery?", a: "We haul it away and recycle it properly at no extra charge anywhere in Lehigh Acres." },
    ],
  },
  {
    slug: "battery-replacement-fort-myers-fl",
    service: "Battery Replacement",
    citySlug: "fort-myers",
    categoryId: "electrical",
    h1: "Mobile Battery Replacement in Fort Myers, FL",
    metaTitle: "Battery Replacement in Fort Myers, FL | Same-Day Mobile Install",
    metaDescription:
      "Mobile car battery delivery and install in Fort Myers, FL. Tested charging system, hauled-away core, same-day service. Call (813) 501-7572.",
    intro:
      "Need a battery replacement in Fort Myers, FL today? Mike's Mobile Auto Repair brings the right battery to your driveway, parking lot, or roadside anywhere in Fort Myers — fully tested and installed on site.",
    paragraphs: [
      "Fort Myers heat is brutal on car batteries. Between long stretches in the sun on Colonial, US-41, and Daniels, plus the short trips most Fort Myers drivers do, batteries here often fail at 3 years instead of the rated 5. We see it every week — slow cranks, parasitic-draw deaths overnight, and surprise no-starts in the Edison Mall and HealthPark parking lots across Fort Myers.",
      "Our mobile service truck rolls into every Fort Myers ZIP code — 33901, 33907, 33908, 33912, 33913, 33916, 33919, and 33966 — with quality replacement batteries on board for cars, light trucks, SUVs, and work vans. Downtown Fort Myers, McGregor, Gateway, Whiskey Creek, Iona, San Carlos Park, Page Field — same coverage, same up-front pricing, same same-day install.",
      "Every Fort Myers battery job starts with a full charging-system test. We check battery state of health, alternator output, voltage drop on the main cables, and the ground straps. If the alternator is the real problem, you'll know before we sell you a battery. If it's just the battery, we install a quality replacement and verify a clean charge before we leave your Fort Myers driveway.",
      "Pricing is quoted up front. Most mobile battery installs in Fort Myers run $180 to $320 depending on group size and warranty. No surprise add-ons, no shop diagnostic fee, and we haul away and recycle your old battery at no charge across all of Fort Myers.",
      "Same-day mobile battery service in Fort Myers, FL is almost always available. Call or text (813) 501-7572 and we'll confirm a time window in minutes.",
    ],
    included: [
      "Quality replacement battery for most makes/models",
      "Full charging-system test before install",
      "Terminal and ground cleaning",
      "Voltage-drop testing on main cables",
      "Old battery hauled away and recycled",
      "Manufacturer + mobile install warranty",
    ],
    faqs: [
      { q: "How much is a mobile battery install in Fort Myers?", a: "Most Fort Myers mobile battery installs run $180–$320 depending on group size and warranty length. Quoted up front." },
      { q: "How fast can you get to me in Fort Myers?", a: "Same-day service is the norm anywhere in Fort Myers, including evenings and weekends." },
      { q: "Will a new battery fix a no-start in Fort Myers?", a: "Often yes, but only if the alternator and starter are healthy. We test all three on every Fort Myers call." },
      { q: "Do you cover Fort Myers fleets?", a: "Yes — light fleet and work-van battery service is a regular part of our Fort Myers route." },
    ],
  },
  {
    slug: "ac-repair-fort-myers-fl",
    service: "AC Repair",
    citySlug: "fort-myers",
    categoryId: "ac",
    h1: "Mobile AC Repair in Fort Myers, FL",
    metaTitle: "Mobile AC Repair in Fort Myers, FL | Same-Day Recharge & Compressor Service",
    metaDescription:
      "Mobile auto AC repair in Fort Myers, FL. Recharges, compressor service, and leak diagnosis at your driveway. Same-day. Call (813) 501-7572.",
    intro:
      "Auto AC blowing warm in Fort Myers, FL? Mike's Mobile Auto Repair handles complete on-site AC service — recharges, leak detection, compressor and condenser work — at your home or office anywhere in Fort Myers.",
    paragraphs: [
      "There's no city in Florida where a broken AC matters more than Fort Myers. From May through October, an AC failure in Fort Myers isn't an inconvenience — it's a safety issue. Our mobile mechanic comes to you so you don't have to drive a 100° vehicle across town to a brick-and-mortar shop and sit in a waiting room for hours.",
      "We cover every Fort Myers ZIP — 33901, 33907, 33908, 33912, 33913, 33916, 33919, and 33966 — including Downtown Fort Myers, McGregor Boulevard, Gateway, Whiskey Creek, Iona, San Carlos Park, and Page Field. Most-called AC service in Fort Myers right now: R-134a and R-1234yf recharges with proper evacuation, leak detection with UV dye and electronic sniffers, expansion-valve and orifice-tube replacement, condenser repairs after rock damage, and full compressor replacement when the clutch or internal pump fails.",
      "Real diagnostics matter. A 'free recharge' from a parts store puts refrigerant into a leaking system — sometimes the wrong amount of the wrong refrigerant — and the AC is warm again two weeks later. We pull a vacuum, hold it to verify the system is sealed, and only then charge to spec by weight. That's how a Fort Myers AC repair actually lasts through the summer.",
      "Pricing is up front. Most Fort Myers mobile AC recharges run $180–$280 depending on refrigerant and dye. Compressor jobs run higher and are quoted on site after diagnosis. No surprise add-ons, financing available on qualifying repairs, and a real technician answers the phone — not a call center.",
      "Need same-day mobile AC repair in Fort Myers, FL? Call or text (813) 501-7572 and we'll be in your driveway with cold air on the way.",
    ],
    included: [
      "R-134a and R-1234yf evacuation and recharge",
      "UV dye and electronic leak detection",
      "Expansion valve / orifice tube service",
      "Condenser repair and replacement",
      "Compressor and clutch replacement",
      "Cabin air filter inspection",
    ],
    faqs: [
      { q: "How much is mobile AC recharge in Fort Myers?", a: "Most Fort Myers mobile AC recharges run $180–$280 depending on refrigerant type. Compressor jobs are quoted on site." },
      { q: "Can you really do AC work in my driveway?", a: "Yes — recharges and most leak repairs and compressor jobs are completed on site across Fort Myers." },
      { q: "Why does my AC keep losing refrigerant?", a: "There's a leak — usually a Schrader valve, condenser, or O-ring. We find it with UV dye and electronic sniffers on every Fort Myers job." },
      { q: "Do you offer financing in Fort Myers?", a: "Yes — financing is available on qualifying AC repairs across Fort Myers." },
    ],
  },
  {
    slug: "ac-repair-lehigh-acres-fl",
    service: "AC Repair",
    citySlug: "lehigh-acres",
    categoryId: "ac",
    h1: "Mobile AC Repair in Lehigh Acres, FL",
    metaTitle: "Mobile AC Repair in Lehigh Acres, FL | Same-Day Recharge & Compressor Service",
    metaDescription:
      "Mobile auto AC repair in Lehigh Acres, FL. Recharges, leak detection, and compressor service at your driveway. Call (813) 501-7572.",
    intro:
      "Car AC blowing hot in Lehigh Acres, FL? Mike's Mobile Auto Repair handles full on-site AC service — recharges, leak detection, compressor and condenser work — at your driveway anywhere in Lehigh Acres.",
    paragraphs: [
      "An AC failure in Lehigh Acres during the summer is brutal. Long drives across Lee Boulevard, Sunshine, and Homestead in a 100° cabin are dangerous, especially with kids or older passengers in the vehicle. Our mobile mechanic service brings full AC repair to your Lehigh Acres driveway so you don't have to suffer through that drive twice — once to the shop, once back home.",
      "We cover every Lehigh Acres ZIP — 33936, 33971, 33972, 33973, 33974, and 33976 — and we carry the equipment and refrigerant on the truck. Most-called AC service in Lehigh Acres: proper R-134a and R-1234yf recharges, UV-dye leak detection, expansion-valve and orifice-tube replacement, condenser swaps after rock damage on Lee Boulevard, and full compressor replacement when the clutch or pump fails.",
      "We don't do parts-store-style 'recharge and hope.' Every Lehigh Acres job starts with diagnosis: pressure readings on both sides, leak detection with UV dye or electronic sniffer, and a vacuum hold test before any refrigerant goes in. That's how a Lehigh Acres AC repair lasts through the summer instead of failing again in three weeks.",
      "Pricing is quoted up front. Mobile AC recharges in Lehigh Acres typically run $180–$280 depending on refrigerant. Compressor and condenser work is quoted on site after diagnosis, with financing available on qualifying repairs. A real technician answers the phone, not a call center.",
      "Need same-day mobile AC repair in Lehigh Acres, FL? Call or text (813) 501-7572 and we'll have cold air blowing again the same day.",
    ],
    included: [
      "R-134a and R-1234yf evacuation and recharge",
      "UV dye and electronic leak detection",
      "Expansion valve / orifice tube service",
      "Condenser repair and replacement",
      "Compressor and clutch replacement",
      "Cabin air filter inspection",
    ],
    faqs: [
      { q: "How much does mobile AC recharge cost in Lehigh Acres?", a: "Most Lehigh Acres recharges run $180–$280 depending on refrigerant. Compressor work is quoted on site." },
      { q: "Can you do compressor jobs on site in Lehigh Acres?", a: "Yes — most compressor and condenser jobs are completed in your Lehigh Acres driveway in a single visit." },
      { q: "Same-day AC service in Lehigh Acres?", a: "Almost always, including evenings and weekends across Lehigh Acres." },
      { q: "Do you guarantee the repair?", a: "Yes — every Lehigh Acres AC job is backed by our parts-and-labor warranty." },
    ],
  },
  {
    slug: "engine-diagnostics-fort-myers-fl",
    service: "Engine Diagnostics",
    citySlug: "fort-myers",
    categoryId: "engine",
    h1: "Mobile Engine Diagnostics in Fort Myers, FL",
    metaTitle: "Engine Diagnostics in Fort Myers, FL | Mobile Check-Engine-Light Testing",
    metaDescription:
      "Mobile check-engine-light and engine diagnostics in Fort Myers, FL. Real OBD-II scanners, live data, up-front pricing. Call (813) 501-7572.",
    intro:
      "Check engine light on in Fort Myers, FL? Mike's Mobile Auto Repair brings professional OBD-II scanners and real diagnostic experience to your driveway anywhere in Fort Myers — no parts-store guesswork.",
    paragraphs: [
      "A check-engine light in Fort Myers can mean a $20 gas cap or a $2,000 catalytic converter. Most Fort Myers drivers find out the hard way that a free parts-store code reader only gives you a code — not a diagnosis. We bring full bidirectional scanners that read live sensor data, fuel trims, misfire counters, freeze-frame data, and module-specific codes to identify the actual cause before any parts are recommended.",
      "We cover every Fort Myers ZIP — 33901, 33907, 33908, 33912, 33913, 33916, 33919, and 33966 — Downtown Fort Myers, McGregor, Gateway, Whiskey Creek, Iona, San Carlos Park, and Page Field. Common Fort Myers diagnostic calls: misfires, P0420/P0430 catalyst codes, P0171/P0174 lean codes, EVAP small-leak codes, electrical no-starts, ABS and traction-control warnings, and intermittent stalling.",
      "Diagnostics are an investment in not buying the wrong part. We charge a fair, flat diagnostic fee in Fort Myers and apply it toward the repair if you go ahead with us. You walk away with a written list of what's actually wrong, what's optional, and what to budget for next — no upsells, no scare tactics.",
      "If the repair can be done on site in your Fort Myers driveway — which is most jobs — we'll schedule it the same day or the next morning. If it's a teardown that needs a lift, we'll tell you straight and recommend the right shop. That kind of honesty is rare in the Fort Myers auto-repair market.",
      "Don't drive around with a flashing check-engine light in Fort Myers — that's active engine damage. Call or text (813) 501-7572 and we'll diagnose it the same day in your driveway.",
    ],
    included: [
      "Full OBD-II and module scan (engine, ABS, SRS, body)",
      "Live data and freeze-frame analysis",
      "Misfire counter and fuel-trim review",
      "EVAP and emissions diagnosis",
      "Written diagnostic report",
      "Diagnostic fee applied to repair",
    ],
    faqs: [
      { q: "What does a diagnostic cost in Fort Myers?", a: "We charge a flat diagnostic fee in Fort Myers and apply it toward the repair if you go ahead with us. Quoted up front." },
      { q: "Is it safe to drive with the check engine light on in Fort Myers?", a: "A solid light is usually OK short term. A flashing light means active misfire — pull over and call us in Fort Myers right away." },
      { q: "Can you really diagnose modern cars in my driveway?", a: "Yes. Our Fort Myers scanners read every module the dealer reads, including bidirectional tests." },
      { q: "Same-day diagnostic service in Fort Myers?", a: "Almost always — call or text (813) 501-7572 to confirm a window today." },
    ],
  },
  {
    slug: "oil-change-lehigh-acres-fl",
    service: "Oil Change",
    citySlug: "lehigh-acres",
    categoryId: "engine",
    h1: "Mobile Oil Change in Lehigh Acres, FL",
    metaTitle: "Mobile Oil Change in Lehigh Acres, FL | At Your Driveway in 30 Minutes",
    metaDescription:
      "Mobile oil change in Lehigh Acres, FL. Synthetic and conventional, full multi-point inspection, in your driveway. Call (813) 501-7572.",
    intro:
      "Skip the oil-change waiting room in Lehigh Acres, FL. Mike's Mobile Auto Repair comes to your driveway anywhere in Lehigh Acres and handles the full service — oil, filter, multi-point inspection — in about 30 minutes.",
    paragraphs: [
      "Oil changes are the easiest service to put off — until they cause real engine damage. In Lehigh Acres heat, dirty oil breaks down faster than it does in cooler climates, especially on shorter trips around Lee Boulevard, Sunshine, Homestead, and Gunnery. Our mobile oil-change service makes it effortless: we come to your Lehigh Acres home or workplace, you keep working, and the job is done in 30 minutes.",
      "We service every Lehigh Acres ZIP — 33936, 33971, 33972, 33973, 33974, and 33976 — with full-synthetic, synthetic-blend, and conventional oils, plus diesel-rated oils for work trucks common in Lehigh Acres. We use OEM-spec or premium-aftermarket filters and verify the correct oil weight and capacity for your specific vehicle, every time.",
      "Every Lehigh Acres mobile oil change includes a free multi-point inspection: brakes, belts, hoses, tires, battery health, coolant condition, and any active warning lights. You'll get an honest read on what's healthy, what to watch, and what needs attention before the next service — no scare-tactic upsells, no fake 'safety alerts.'",
      "Pricing is up front. Synthetic-blend oil changes in Lehigh Acres typically start around $69, full synthetic around $89–$119, and diesels are quoted by capacity. No trip fees inside our regular Lehigh Acres service area, and a real technician answers the phone.",
      "Ready to skip the shop? Call or text (813) 501-7572 for same-day mobile oil change in Lehigh Acres, FL — at your home, office, or jobsite.",
    ],
    included: [
      "Synthetic, blend, conventional, or diesel oil",
      "OEM-spec or premium aftermarket filter",
      "Free multi-point inspection",
      "Tire pressure check and top-off",
      "Fluid top-offs (washer, coolant, power steering)",
      "Used oil and filter recycled properly",
    ],
    faqs: [
      { q: "How much is a mobile oil change in Lehigh Acres?", a: "Synthetic blend in Lehigh Acres starts around $69, full synthetic around $89–$119. Diesel quoted by capacity." },
      { q: "How long does it take?", a: "Most Lehigh Acres mobile oil changes are done in about 30 minutes in your driveway." },
      { q: "Do you do fleet oil changes in Lehigh Acres?", a: "Yes — fleet and work-truck oil-change routes are a regular part of our Lehigh Acres service." },
      { q: "Is there a trip fee in Lehigh Acres?", a: "No — there is no separate trip fee inside our regular Lehigh Acres service area." },
    ],
  },
];

export const localLandingPages: LocalLandingPage[] = _allLocalLandingPages.filter(
  (p) => !p.citySlug || ALLOWED_CITY_SLUGS.has(p.citySlug)
);

export const getLandingPageBySlug = (slug: string) =>
  localLandingPages.find((p) => p.slug === slug);
