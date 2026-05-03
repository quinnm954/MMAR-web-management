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

export const localLandingPages: LocalLandingPage[] = [
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
    canonical: "https://www.mikesmautorepair.com/brake-repair-lehigh-acres",
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
    canonical: "https://www.mikesmautorepair.com/alternator-repair-fort-myers",
    intro:
      "Battery light on, dim headlights, or a no-start after a jump? Mike's Mobile Auto Repair provides full mobile alternator repair and charging-system service in Fort Myers, FL — at your home, office, or roadside.",
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
  {
    slug: "mobile-battery-replacement-cape-coral",
    service: "Mobile Battery Replacement",
    citySlug: "cape-coral",
    categoryId: "electrical",
    h1: "Mobile Battery Replacement in Cape Coral, FL",
    metaTitle:
      "Mobile Battery Replacement in Cape Coral, FL | Mike's Mobile Auto Repair",
    metaDescription:
      "Same-day mobile car battery replacement in Cape Coral, FL. We test, deliver, and install — at your home, office, or roadside. Call (813) 501-7572.",
    intro:
      "Dead battery in Cape Coral? Skip the tow and the parts-store parking lot. Mike's Mobile Auto Repair delivers and installs fresh, quality car batteries anywhere in Cape Coral, FL — usually the same day.",
    paragraphs: [
      "Florida heat is brutal on car batteries. Most last only 2–3 years here before they start failing. When yours finally gives up, you don't need to ride along with a friend to the parts store and wrestle with corroded terminals — we bring the new battery to you, test the charging system to make sure it's not actually an alternator issue, and install everything cleanly.",
      "We carry batteries for cars, trucks, SUVs, and most light commercial vehicles, and we'll match the right group size, cold-cranking amps, and warranty for your specific vehicle. After installation we reset terminals, clean any corrosion, and verify proper charging voltage before we leave.",
      "We cover every Cape Coral ZIP — 33904, 33909, 33914, 33990, 33991, 33993 — from South Cape and Cape Harbour to Sandoval, Pelican, and up by Burnt Store Road. Need a battery right now? Call or text (813) 501-7572.",
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
      {
        q: "How much does a mobile battery replacement cost in Cape Coral?",
        a: "Most installed mobile battery replacements in Cape Coral run $180–$320 depending on group size and warranty. Premium AGM batteries cost more.",
      },
      {
        q: "How fast can you get to me?",
        a: "Same-day service is usually available across Cape Coral. For dead-battery emergencies we prioritize the call. Phone or text (813) 501-7572.",
      },
      {
        q: "What if it's not the battery?",
        a: "We test the charging system before replacing anything. If your alternator is the real culprit we'll tell you up front and quote that repair instead.",
      },
      {
        q: "Do you take the old battery?",
        a: "Yes — we haul away and properly recycle your old battery at no extra charge.",
      },
    ],
  },
  {
    slug: "emergency-mobile-mechanic-lehigh-acres",
    service: "Emergency Mobile Mechanic",
    citySlug: "lehigh-acres",
    categoryId: "electrical",
    h1: "Emergency Mobile Mechanic in Lehigh Acres, FL",
    metaTitle:
      "Emergency Mobile Mechanic in Lehigh Acres, FL | Mike's Mobile Auto Repair",
    metaDescription:
      "Stranded in Lehigh Acres? Emergency mobile mechanic and roadside service for breakdowns, dead batteries, no-starts, and lockouts. Call (813) 501-7572.",
    intro:
      "Broken down in Lehigh Acres? Mike's Mobile Auto Repair is your emergency mobile mechanic — on-call for dead batteries, no-starts, overheating, flat tires, lockouts, and roadside repairs across Lehigh Acres, FL.",
    paragraphs: [
      "When your car quits in a Publix parking lot, on the side of Lee Boulevard, or in your own driveway at 7pm, the last thing you want is to wait hours for a tow and another full day for a shop to look at it. Our emergency mobile service rolls to you with diagnostic scanners, jump packs, common parts, and the experience to get most vehicles running again on the spot.",
      "We handle the calls that strand drivers most often: dead batteries, failed alternators, bad starters, blown fuses, fuel-pump no-starts, overheating, flat tires, and accidental lockouts. If a repair can't be finished safely on the roadside, we'll diagnose the issue, give you a transparent quote, and schedule a same-day or next-day mobile follow-up at your home or workplace.",
      "Service is available across all Lehigh Acres ZIP codes (33936, 33971, 33972, 33973, 33974, 33976), evenings and weekends included whenever possible. If you're stranded right now, call or text (813) 501-7572 — a real technician answers, not a call center.",
    ],
    included: [
      "Roadside dead-battery jump and replacement",
      "On-site no-start diagnostics",
      "Alternator and starter replacement",
      "Overheating and cooling-system triage",
      "Flat tire repair and spare installation",
      "Lockout assistance",
      "Transparent up-front pricing",
    ],
    faqs: [
      {
        q: "How fast can you reach me in Lehigh Acres?",
        a: "Most Lehigh Acres emergency calls are reached within 30–90 minutes depending on time of day and current workload.",
      },
      {
        q: "Are you available evenings and weekends?",
        a: "Yes — emergency mobile service is offered evenings and weekends across Lehigh Acres whenever possible. Call or text (813) 501-7572 to confirm.",
      },
      {
        q: "What if my car can't be fixed roadside?",
        a: "We'll diagnose the issue on site, give you a transparent quote, and schedule a same-day or next-day mobile repair at your home or workplace.",
      },
      {
        q: "Do you charge a service-call fee?",
        a: "Any trip or diagnostic fee is disclosed up front before we dispatch — no surprise charges when we arrive.",
      },
    ],
  },
  // ===== Region-wide service-only landing pages =====
  {
    slug: "mobile-brake-repair",
    service: "Mobile Brake Repair",
    categoryId: "brakes",
    h1: "Mobile Brake Repair in Southwest Florida",
    metaTitle:
      "Mobile Brake Repair in SWFL | Pads, Rotors & Calipers At Your Driveway",
    metaDescription:
      "On-site mobile brake repair across Lehigh Acres, Fort Myers, Cape Coral, Estero, Bonita Springs and Naples. Pads, rotors, calipers, fluid. Call (813) 501-7572.",
    canonical: "https://www.mikesmautorepair.com/brake-repair",
    intro:
      "Squealing, grinding, or a soft pedal? Mike's Mobile Auto Repair brings full mobile brake service — pads, rotors, calipers, lines, fluid, and ABS diagnostics — to driveways and workplaces across Southwest Florida.",
    paragraphs: [
      "Brake jobs are the single most common reason SWFL drivers end up dealing with a tow truck and a long shop wait. We cut both out of the equation. Our mobile service truck arrives with quality pads and rotors for most makes and models, fresh DOT brake fluid, and the tools to handle the repair on the spot — usually in 60 to 90 minutes per axle.",
      "Florida driving is hard on brakes. Stop-and-go season traffic, daily red-light commuting, and the weight of larger trucks and SUVs all wear pads down faster than highway driving. If you're hearing squeal, feeling pulsation in the pedal, or noticing the brake warning light, it's time. Waiting turns a $200 pad job into a $500+ pad-and-rotor job, or worse.",
      "We service the whole region — every Lehigh Acres, Fort Myers, Cape Coral, Estero, Bonita Springs, and Naples ZIP code. Quotes are always up front and your wheels are torqued to manufacturer spec on every job. Call or text (813) 501-7572 to book.",
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
    h1: "Mobile Alternator Repair in Southwest Florida",
    metaTitle:
      "Mobile Alternator Repair in SWFL | On-Site Charging System Service",
    metaDescription:
      "Mobile alternator replacement and full charging-system service across Lehigh Acres, Fort Myers, Cape Coral, Estero, Bonita Springs and Naples. Call (813) 501-7572.",
    canonical: "https://www.mikesmautorepair.com/alternator-repair",
    intro:
      "Battery light on, dim headlights, or a no-start after a jump? Mike's Mobile Auto Repair handles full mobile alternator repair and charging-system testing across Southwest Florida — at your home, office, or roadside.",
    paragraphs: [
      "Alternator failures rarely happen at a convenient time. The good news: you don't need a tow. We arrive with professional charging-system testers, replacement alternators for most makes and models, and the tools to swap one out in your driveway or a parking lot — usually in 60 to 120 minutes.",
      "We always test the entire charging system before condemning a part — battery, alternator output under load, voltage drop on the main cables, and the serpentine belt and tensioner. That way you only pay for what's actually wrong. If the alternator is the issue, we install a quality replacement and verify a clean 13.8–14.7-volt charge before we leave.",
      "Service is available across every Lehigh Acres, Fort Myers, Cape Coral, Estero, Bonita Springs, and Naples ZIP. Stuck right now? Call or text (813) 501-7572 — same-day service is usually available.",
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
      { q: "How fast can you get to me?", a: "Same-day mobile service is usually available across SWFL." },
      { q: "How do I know it's the alternator and not the battery?", a: "We test both before recommending parts. A weak battery and a failing alternator can look very similar." },
    ],
  },
  {
    slug: "mobile-battery-replacement",
    service: "Mobile Battery Replacement",
    categoryId: "electrical",
    h1: "Mobile Car Battery Replacement in Southwest Florida",
    metaTitle:
      "Mobile Battery Replacement in SWFL | Same-Day Delivery & Install",
    metaDescription:
      "We deliver and install quality car batteries at your home, office, or roadside across SWFL. Free charging-system test included. Call (813) 501-7572.",
    canonical: "https://www.mikesmautorepair.com/battery-replacement",
    intro:
      "Dead battery? Skip the tow and the parts-store parking lot. We deliver and install quality car batteries anywhere in Southwest Florida — usually the same day.",
    paragraphs: [
      "Florida heat is brutal on batteries. Most last only 2–3 years here before they start failing. When yours finally gives up, we bring the new battery to you, test the charging system to make sure it's not actually an alternator issue, and install everything cleanly — terminals cleaned, hold-down secured, charge verified.",
      "We carry batteries for cars, trucks, SUVs, and most light commercial vehicles, and we'll match the right group size, cold-cranking amps, and warranty for your specific vehicle. AGM and standard flooded options available.",
      "We cover all of Lehigh Acres, Fort Myers, Cape Coral, Estero, Bonita Springs, and Naples. Need a battery now? Call or text (813) 501-7572.",
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
      { q: "How fast can you get to me?", a: "Same-day service is the norm; emergency calls get prioritized." },
      { q: "Do you take the old battery?", a: "Yes — we haul it away and properly recycle it at no extra charge." },
    ],
  },
  {
    slug: "mobile-starter-repair",
    service: "Mobile Starter Repair",
    categoryId: "electrical",
    h1: "Mobile Starter Repair & Replacement in Southwest Florida",
    metaTitle:
      "Mobile Starter Repair in SWFL | On-Site Starter Replacement",
    metaDescription:
      "Single click and no crank? We replace failed starters at your home or roadside across SWFL. Call (813) 501-7572 for same-day mobile service.",
    intro:
      "If you turn the key and just hear a click — or nothing at all — your starter has likely failed. Mike's Mobile Auto Repair replaces starters on site across Southwest Florida, no tow required.",
    paragraphs: [
      "A failing starter usually announces itself: single loud click with full dash lights, intermittent no-start that gets worse over a couple of weeks, or grinding noises during cranking. We test the starter circuit and battery before condemning the part, then install a quality replacement on site.",
      "Most starter replacements take 60 to 120 minutes depending on the vehicle. We carry starters for many common models and source same-day for most others. Service is available across all SWFL — Lehigh Acres, Fort Myers, Cape Coral, Estero, Bonita Springs, Naples.",
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
    h1: "Mobile Vehicle Diagnostics in Southwest Florida",
    metaTitle:
      "Mobile Car Diagnostics in SWFL | OBD-II Scan & Drivability Testing",
    metaDescription:
      "Professional mobile vehicle diagnostics with real OBD-II scanners and live data. Check engine lights, drivability, electrical. Call (813) 501-7572.",
    canonical: "https://www.mikesmautorepair.com/vehicle-diagnostics",
    intro:
      "Modern vehicles speak in trouble codes — and we speak the language. Mike's Mobile Auto Repair brings professional OBD-II scanners, live data analysis, and real drivability testing to your driveway anywhere in Southwest Florida.",
    paragraphs: [
      "Most parts-store 'free scans' just read codes and clear them. That's not diagnostics — that's a starting point. Real diagnostics means reading freeze-frame data, live sensor values, fuel trims, misfire counts, and sometimes wiring tests with a multimeter. We do the real work, find the actual cause, and quote the repair before any wrench turns.",
      "We diagnose check-engine lights, hard shifts, intermittent stalls, no-starts, electrical gremlins, AC faults, and ABS / traction-control warnings. If we can fix it on the spot we will; if it needs follow-up parts we'll quote it transparently.",
      "Available across Lehigh Acres, Fort Myers, Cape Coral, Estero, Bonita Springs, and Naples. Call or text (813) 501-7572 to book a diagnostic appointment.",
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
    slug: "emergency-roadside-mechanic",
    service: "Emergency Roadside Mechanic",
    categoryId: "electrical",
    h1: "Emergency Roadside Mechanic in Southwest Florida",
    metaTitle:
      "Emergency Roadside Mechanic in SWFL | Stuck? We Come to You",
    metaDescription:
      "Stranded? Emergency mobile mechanic across Lehigh Acres, Fort Myers, Cape Coral, Estero, Bonita Springs and Naples. Dead batteries, no-starts, lockouts. Call (813) 501-7572.",
    intro:
      "Broken down? Mike's Mobile Auto Repair is your emergency roadside mechanic — on-call across Southwest Florida for dead batteries, no-starts, overheating, flat tires, lockouts, and roadside repairs.",
    paragraphs: [
      "When your car quits in a parking lot, on the side of I-75, or in your own driveway after dark, the last thing you want is a 90-minute tow wait and another full day for a shop to look at it. We roll to you with diagnostic scanners, jump packs, common parts, and the experience to get most vehicles running again on the spot.",
      "We handle the calls that strand drivers most often: dead batteries, failed alternators, bad starters, blown fuses, fuel-pump no-starts, overheating, flat tires, and accidental lockouts. If a repair can't be finished safely on the roadside, we diagnose it, give you a transparent quote, and schedule a same-day or next-day mobile follow-up.",
      "Service is available across all of SWFL — every Lehigh Acres, Fort Myers, Cape Coral, Estero, Bonita Springs, and Naples ZIP — including evenings and weekends whenever possible. If you're stuck right now, call or text (813) 501-7572.",
    ],
    included: [
      "Roadside dead-battery jump and replacement",
      "On-site no-start diagnostics",
      "Alternator and starter replacement",
      "Overheating and cooling-system triage",
      "Flat tire repair and spare installation",
      "Lockout assistance",
      "Transparent up-front pricing",
    ],
    faqs: [
      { q: "How fast can you reach me?", a: "Most emergency calls in SWFL are reached in 30–90 minutes depending on time of day." },
      { q: "Available evenings and weekends?", a: "Yes — emergency mobile service is offered evenings and weekends whenever possible." },
      { q: "What if my car can't be fixed roadside?", a: "We diagnose on site and schedule a same-day or next-day mobile follow-up at your home or workplace." },
    ],
  },
  {
    slug: "mobile-oil-change",
    service: "Mobile Oil Change",
    categoryId: "oil-fluids",
    h1: "Mobile Oil Change Service in Southwest Florida",
    metaTitle:
      "Mobile Oil Change in SWFL | At Your Home or Office",
    metaDescription:
      "Conventional, blend, and full synthetic mobile oil changes across SWFL. We come to your driveway or office. Call (813) 501-7572.",
    intro:
      "Skip the oil-change shop wait. Mike's Mobile Auto Repair brings conventional, synthetic blend, and full synthetic oil changes to your home or workplace anywhere in Southwest Florida.",
    paragraphs: [
      "A typical oil change at a quick-lube shop eats up an hour of your day with the wait and the upsell pitch. Ours takes about 25 minutes in your driveway with no waiting room and no surprises. We use quality oil and a name-brand filter matched to your vehicle's spec.",
      "Florida heat is hard on engine oil. The hotter it runs, the faster it breaks down. We recommend interval checks every 3,000 miles for conventional, 5,000 for blends, and 7,500–10,000 for full synthetic — and we'll inspect belts, fluids, and tire pressure at every visit.",
      "Service available across Lehigh Acres, Fort Myers, Cape Coral, Estero, Bonita Springs, and Naples. Book at (813) 501-7572.",
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
    h1: "Mobile Suspension & Steering Repair in Southwest Florida",
    metaTitle:
      "Mobile Suspension & Steering Repair in SWFL | On-Site Service",
    metaDescription:
      "Shocks, struts, control arms, ball joints, tie rods, wheel bearings — mobile suspension and steering repair across SWFL. Call (813) 501-7572.",
    intro:
      "Clunks over bumps, vague steering, or pulling to one side? Mike's Mobile Auto Repair handles mobile suspension and steering repairs at your home or workplace across Southwest Florida.",
    paragraphs: [
      "Florida roads — and especially the patched-up surfaces around Lehigh Acres and east Lee County — are hard on suspension. Worn shocks and struts hurt ride quality and increase stopping distance; loose ball joints and tie rods are a safety issue.",
      "We replace shocks, struts, control arms, ball joints, sway bar links, tie rods, and wheel bearings on most vehicles right in your driveway. We also handle power-steering pump and rack diagnostics.",
      "Service available across SWFL. Call or text (813) 501-7572 for an on-site quote.",
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
    h1: "Mobile Engine Diagnostics in Southwest Florida",
    metaTitle:
      "Mobile Engine Diagnostics in SWFL | Check Engine Light & Drivability",
    metaDescription:
      "On-site engine diagnostics for check engine lights, misfires, rough idle, and drivability problems across SWFL. Call (813) 501-7572.",
    intro:
      "Check engine light on, misfiring, or running rough? Mike's Mobile Auto Repair brings full engine diagnostic capability to your driveway across Southwest Florida.",
    paragraphs: [
      "Engine drivability problems are usually a chain of small clues — a single misfire code, slightly off fuel trims, a vacuum leak, an ignition coil getting weak. Real diagnostics means looking at all of it, not just slapping in a part and hoping.",
      "We diagnose misfires, rough idle, hesitation, lack of power, knocking, oil leaks, coolant leaks, and emissions failures. Repairs we commonly handle on site include spark plugs, coils, sensors, valve cover gaskets, and serpentine belts.",
      "Available across SWFL. Book at (813) 501-7572.",
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
    h1: "Mobile No-Start Diagnostics in Southwest Florida",
    metaTitle:
      "Mobile No-Start Diagnostics in SWFL | Won't Crank or Won't Fire",
    metaDescription:
      "Car won't start? Mobile no-start diagnostics across SWFL — battery, starter, fuel, ignition, and security. Call (813) 501-7572.",
    canonical: "https://www.mikesmautorepair.com/no-start-diagnostics",
    intro:
      "Won't crank? Cranks but won't fire? Mike's Mobile Auto Repair specializes in mobile no-start diagnostics across Southwest Florida — at your driveway, parking lot, or roadside.",
    paragraphs: [
      "A no-start is the worst possible time to need a tow. Our mobile service truck arrives with battery testers, jump packs, fuel-pressure gauges, OBD-II scanners, and the experience to walk through every common cause systematically: battery, starter, fuel pressure, spark, security/immobilizer, and key sensors.",
      "Most no-starts get diagnosed and often repaired on the same visit. Common fixes we complete on site: battery replacement, starter replacement, alternator replacement, fuel-pump relay, crank sensor, and ignition switch.",
      "Available across all of SWFL. Stuck right now? Call or text (813) 501-7572 — a real tech answers.",
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
      { q: "How fast can you come?", a: "Same-day mobile service is usually available. Emergency calls get prioritized." },
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
      "Top-rated mobile mechanic in Lehigh Acres, FL. On-site diagnostics, brakes, batteries, alternators, and roadside repair. Same-day service. Call (813) 501-7572.",
    intro:
      "Looking for a trusted mobile mechanic in Lehigh Acres, FL? Mike's Mobile Auto Repair brings ASE-level service to your driveway, workplace, or roadside breakdown — no tow, no shop wait.",
    paragraphs: [
      "Lehigh Acres is one of the largest planned communities in the country and getting a stalled vehicle to a brick-and-mortar shop can swallow an entire day. We exist to take that pain away. Our mobile service truck rolls into your driveway with diagnostic scanners, quality parts, and the experience to handle most repairs in a single visit.",
      "We service every Lehigh Acres ZIP — 33936, 33971, 33972, 33973, 33974, and 33976 — and handle batteries, alternators, starters, brakes, AC recharges, oil changes, and full check-engine-light diagnostics. Up-front quotes, no surprises, and a real technician answers the phone.",
      "Need help right now? Call or text (813) 501-7572. Same-day appointments are usually available, plus evening and weekend coverage for genuine roadside emergencies anywhere in Lehigh Acres.",
    ],
    included: [
      "On-site diagnostics with real OBD-II scanners",
      "Brake pad, rotor, and caliper replacement",
      "Battery and alternator replacement",
      "Starter and no-start diagnostics",
      "AC recharge and cooling repairs",
      "Mobile oil changes and routine maintenance",
      "Emergency roadside service",
    ],
    faqs: [
      { q: "Are you really a mobile mechanic in Lehigh Acres?", a: "Yes — we live and work right here in SWFL. Service covers every Lehigh Acres ZIP code." },
      { q: "What do you charge for a service call?", a: "There's no separate trip fee inside our regular service area — you only pay for the diagnostic and the work performed, quoted up front." },
      { q: "How fast can you come out?", a: "Same-day appointments are usually available; emergency calls get prioritized." },
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
      "Trusted mobile mechanic in Fort Myers, FL. Diagnostics, brakes, batteries, AC, and emergency roadside service at your home or office. Call (813) 501-7572.",
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
      { q: "Do you cover all of Fort Myers?", a: "Yes — every ZIP code in Fort Myers, plus surrounding cities across SWFL." },
      { q: "Can you handle AC repairs in my driveway?", a: "Yes. AC recharges and many compressor and condenser jobs are routinely done on site." },
      { q: "How do payments work?", a: "We accept cards, ACH, and offer financing on qualifying repairs. Quotes are always up front." },
      { q: "Same-day service?", a: "Almost always for in-stock work. Special-order parts may push to next day." },
    ],
  },
  {
    slug: "mobile-mechanic-cape-coral",
    service: "Mobile Mechanic",
    citySlug: "cape-coral",
    categoryId: "engine",
    h1: "Mobile Mechanic in Cape Coral, FL",
    metaTitle: "Mobile Mechanic in Cape Coral, FL | Mike's Mobile Auto Repair",
    metaDescription:
      "On-call mobile mechanic in Cape Coral, FL. Diagnostics, brakes, batteries, alternators, AC, and roadside repair — at your home. Call (813) 501-7572.",
    intro:
      "Mike's Mobile Auto Repair is your trusted mobile mechanic in Cape Coral, FL — bringing professional diagnostics, quality parts, and honest pricing right to your driveway anywhere from South Cape to Burnt Store.",
    paragraphs: [
      "Cape Coral's sprawling layout means a simple shop visit can chew up half a day in traffic. We solve that. Skip the tow truck and the rideshare and let our mobile service truck come to you.",
      "We cover every Cape Coral ZIP including 33904, 33909, 33914, 33990, 33991, and 33993. Common jobs: brakes, batteries, alternators, starters, AC, and full computer diagnostics.",
      "Stranded on a Cape Coral road? Roadside help — jump starts, lockouts, flat repairs, dead-battery rescues — is just a call away. Call or text (813) 501-7572.",
    ],
    included: [
      "Mobile diagnostics with full code retrieval",
      "Brake repair and replacement on site",
      "Battery delivery and installation",
      "Alternator and starter replacement",
      "AC recharge and electrical work",
      "Emergency roadside assistance",
    ],
    faqs: [
      { q: "Do you serve all of Cape Coral?", a: "Yes — every Cape Coral ZIP and the surrounding Lee County area." },
      { q: "How long does a brake job take?", a: "Typically 60–90 minutes per axle on site." },
      { q: "Can you replace a battery in my driveway?", a: "Absolutely — usually under 30 minutes including a free charging-system test." },
      { q: "What hours do you work?", a: "Standard hours 7am–9pm, plus evening and weekend roadside emergencies." },
    ],
  },
  // ===== Short-slug SEO landing pages (region-wide service) =====
  {
    slug: "alternator-repair",
    service: "Alternator Repair",
    categoryId: "electrical",
    h1: "Alternator Repair in Southwest Florida",
    metaTitle: "Alternator Repair in SWFL | Mobile Charging-System Service",
    metaDescription:
      "Mobile alternator repair and replacement across Lehigh Acres, Fort Myers, Cape Coral, Estero, Bonita Springs and Naples. Call (813) 501-7572.",
    intro:
      "Battery light on, dim headlights, dying after a jump? We diagnose and replace failed alternators at your home, office, or roadside anywhere in Southwest Florida.",
    paragraphs: [
      "Alternator failure rarely happens at a convenient time. We arrive with professional charging-system testers and quality replacement alternators for most makes and models, then verify a clean 13.8–14.7-volt charge before we leave.",
      "We always test the entire charging system — battery, alternator output under load, voltage drops, and the serpentine belt — before condemning a part. You only pay for what's actually wrong.",
      "Service available in every SWFL ZIP. Call or text (813) 501-7572 for same-day mobile alternator service.",
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
    h1: "Car Battery Replacement in Southwest Florida",
    metaTitle: "Car Battery Replacement in SWFL | Same-Day Mobile Install",
    metaDescription:
      "Mobile car battery delivery and installation across SWFL. Free charging-system test included. Old battery hauled away. Call (813) 501-7572.",
    intro:
      "Dead battery? Skip the tow. We deliver and install quality car batteries anywhere in Southwest Florida — usually the same day.",
    paragraphs: [
      "Florida heat is brutal on batteries. Most last only 2–3 years here. When yours gives up, we bring the new one, test the charging system to make sure it's not actually an alternator, and install everything cleanly.",
      "We carry batteries for cars, trucks, SUVs, and most light commercial vehicles, in standard and AGM, with warranties up to 36 months.",
      "Service across all of SWFL. Need a battery now? Call or text (813) 501-7572.",
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
    h1: "Brake Repair in Southwest Florida",
    metaTitle: "Brake Repair in SWFL | Mobile Pads, Rotors & Calipers",
    metaDescription:
      "Mobile brake repair across SWFL — pads, rotors, calipers, fluid, ABS diagnostics. Done in your driveway. Call (813) 501-7572.",
    intro:
      "Squealing, grinding, or a soft pedal? We bring complete brake service to your driveway across Southwest Florida — pads, rotors, calipers, fluid, and ABS diagnostics.",
    paragraphs: [
      "Brake jobs are the single most common reason SWFL drivers waste a day at a shop. We cut that out. Our mobile truck carries quality pads and rotors for most makes and models, fresh DOT brake fluid, and the tools to handle most repairs in 60–90 minutes per axle.",
      "Florida driving is hard on brakes — stop-and-go season traffic, daily commuting, and heavy SUVs all wear pads faster. Waiting turns a $200 pad job into a $500+ pad-and-rotor job.",
      "Available in every SWFL ZIP. Quotes always up front; wheels torqued to spec. Call or text (813) 501-7572.",
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
    h1: "Vehicle Diagnostics in Southwest Florida",
    metaTitle: "Vehicle Diagnostics in SWFL | Mobile OBD-II & Live Data",
    metaDescription:
      "Real mobile vehicle diagnostics across SWFL — OBD-II, live data, drivability, electrical. Honest findings and up-front repair quotes. Call (813) 501-7572.",
    intro:
      "Modern vehicles speak in trouble codes — and we speak the language. We bring professional OBD-II scanners, live data, and real drivability testing to your driveway anywhere in Southwest Florida.",
    paragraphs: [
      "Most parts-store 'free scans' just read codes. Real diagnostics means freeze-frame data, live sensor values, fuel trims, misfire counts, and sometimes wiring tests. We do the real work and quote the repair before any wrench turns.",
      "We diagnose check-engine lights, hard shifts, intermittent stalls, no-starts, electrical issues, AC faults, and ABS / traction-control warnings. On-spot fixes when possible; transparent quotes when follow-up parts are needed.",
      "Service across all SWFL. Call or text (813) 501-7572 to book.",
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
      { q: "Same-day appointments?", a: "Usually available across SWFL." },
    ],
  },
  {
    slug: "no-start-diagnostics",
    service: "No-Start Diagnostics",
    categoryId: "electrical",
    h1: "No-Start Diagnostics in Southwest Florida",
    metaTitle: "No-Start Diagnostics in SWFL | Mobile Won't-Start Service",
    metaDescription:
      "Car won't start? Mobile no-start diagnostics across SWFL — battery, starter, fuel, ignition, security. Same-day. Call (813) 501-7572.",
    intro:
      "Won't crank? Cranks but won't fire? We specialize in mobile no-start diagnostics across Southwest Florida — at your driveway, parking lot, or roadside.",
    paragraphs: [
      "A no-start is the worst possible time to need a tow. Our mobile truck arrives with battery testers, jump packs, fuel-pressure gauges, and OBD-II scanners to systematically work every common cause: battery, starter, fuel pressure, spark, security/immobilizer, and key sensors.",
      "Most no-starts get diagnosed and often repaired on the same visit. Frequent on-site fixes: battery, starter, alternator, fuel-pump relay, crank sensor, ignition switch.",
      "Available across all SWFL. Stuck right now? Call or text (813) 501-7572 — a real tech answers.",
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
      { q: "How fast can you come?", a: "Same-day mobile service is usually available; emergency calls prioritized." },
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
      "Brakes wear out faster in Lehigh Acres than most people realize. Stop-and-go traffic on Lee Boulevard, Sunshine, Homestead, and Gunnery Road, paired with the heat and humidity of Southwest Florida, beats up pads, rotors, and brake fluid year-round. The result: most Lehigh Acres drivers need brake service every 30,000 to 45,000 miles — sometimes sooner on heavier SUVs and trucks.",
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
      "Battery light on, dim headlights, or a no-start after a jump in Fort Myers? Mike's Mobile Auto Repair handles complete alternator and charging-system service at your home, office, or roadside — no tow required.",
    paragraphs: [
      "Alternator failure is one of the most common electrical breakdowns we see across Fort Myers. Florida heat is brutal on alternator diodes, voltage regulators, and the battery itself, and the symptoms can be confusing — sometimes it looks like a dead battery, sometimes like a starter problem, sometimes the car runs fine for a few days then dies in the McGregor Costco parking lot.",
      "Our Fort Myers mobile mechanic service arrives with professional charging-system testers, a full inventory of replacement alternators for most makes and models, and the tools to swap one out in 60 to 120 minutes — right in your driveway, office lot, or roadside. We test the entire charging system before condemning a part: battery condition, alternator output under load, voltage drop on the main cables, and the serpentine belt and tensioner. If the battery is the actual problem, we tell you. If it's the alternator, we install a quality replacement and verify a clean 13.8–14.7-volt charge before we leave.",
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
      { q: "How fast can you get to me?", a: "Same-day mobile battery delivery is the norm across Lehigh Acres. Emergency calls get prioritized." },
      { q: "Do you take the old battery?", a: "Yes — we haul it away and recycle it properly at no extra charge." },
      { q: "What if it's actually the alternator?", a: "Every install includes a free charging-system test. If the alternator is the real culprit, we'll tell you up front and quote that repair separately." },
      { q: "Do you cover all of Lehigh Acres?", a: "Yes — every Lehigh Acres ZIP code plus the surrounding Lee County area." },
    ],
  },
  {
    slug: "roadside-mechanic-fort-myers",
    service: "Emergency Roadside Mechanic",
    citySlug: "fort-myers",
    categoryId: "engine",
    h1: "Emergency Roadside Mechanic in Fort Myers, FL",
    metaTitle: "Roadside Mechanic in Fort Myers, FL | Same-Day Mobile Help",
    metaDescription:
      "Stranded in Fort Myers? Mike's Mobile Auto Repair offers emergency roadside mechanic service — jump starts, no-starts, batteries, brakes. Call (813) 501-7572.",
    intro:
      "Stranded in Fort Myers? Mike's Mobile Auto Repair provides fast emergency roadside mechanic service — jump starts, no-start diagnostics, battery delivery, on-the-spot repairs, and more — anywhere from Downtown to Gateway.",
    paragraphs: [
      "When your car dies in Fort Myers traffic, the last thing you want is a 90-minute wait for a tow truck and another half-day at a brick-and-mortar shop. We exist to make that go away. Our roadside mechanic service responds across every Fort Myers ZIP (33901, 33907, 33908, 33912, 33913, 33916, 33919, 33966) and most of the surrounding Lee County area, usually within an hour for true emergency calls.",
      "We carry the equipment to actually fix most roadside problems on the spot — not just diagnose them and leave. Battery and charging-system testers, jump packs, alternators, batteries, starters, fuel-pressure gauges, brake parts for common vehicles, and full OBD-II diagnostic scanners. Most no-starts are a battery, an alternator, a starter, or a no-spark/no-fuel issue — and we can address all four in a parking lot.",
      "Common Fort Myers roadside calls: dead batteries in office lots and grocery store parking, no-starts at home in the morning, brakes that suddenly went metal-on-metal during a commute, overheating on US-41 or I-75, and check-engine lights that throw the vehicle into limp mode. We also handle lockouts (with a partner locksmith referral), flat-tire help, and post-accident drivability checks.",
      "Pricing is up front. No tow truck markup, no shop diagnostic fee on top of the repair. A real technician answers the phone — not a call center reading a script. Stuck right now in Fort Myers? Call or text (813) 501-7572.",
    ],
    included: [
      "Same-day emergency response",
      "Jump starts and battery testing",
      "Battery delivery and installation",
      "Mobile no-start diagnostics",
      "Alternator and starter replacement on site",
      "Roadside brake repair where safe",
      "Cooling-system and overheating help",
      "OBD-II diagnostics with full code retrieval",
    ],
    faqs: [
      { q: "How fast can you get to me in Fort Myers?", a: "Most emergency roadside calls in Fort Myers are reached within an hour. We'll give you an honest ETA when you call." },
      { q: "Can you really fix it on the road, or just diagnose it?", a: "Both. Most roadside issues — batteries, alternators, starters, brakes, overheating — are repaired on the spot." },
      { q: "What if I need a tow?", a: "If a tow is the right call, we'll tell you and coordinate one. We don't push unnecessary repairs." },
      { q: "What hours do you cover?", a: "Standard hours are 7am to 9pm, plus evening and weekend coverage for genuine roadside emergencies." },
      { q: "Do you cover the highways?", a: "Yes — I-75, US-41, Daniels Parkway, Colonial Boulevard, and most major Fort Myers corridors are within our regular service area." },
    ],
  },
  {
    slug: "oil-change-lehigh-acres",
    service: "Mobile Oil Change",
    citySlug: "lehigh-acres",
    categoryId: "maintenance",
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
];

export const getLandingPageBySlug = (slug: string) =>
  localLandingPages.find((p) => p.slug === slug);
