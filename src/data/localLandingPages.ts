export type FAQ = { q: string; a: string };

export type LocalLandingPage = {
  slug: string;
  service: string; // human readable service name
  citySlug: string; // matches cities.ts slug
  categoryId: string; // matches serviceCategories.ts id
  h1: string;
  metaTitle: string;
  metaDescription: string;
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
];

export const getLandingPageBySlug = (slug: string) =>
  localLandingPages.find((p) => p.slug === slug);
