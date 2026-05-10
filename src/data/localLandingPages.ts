export type FAQ = { q: string; a: string };

export type LocalLandingPage = {
  slug: string;
  service: string;
  citySlug?: string;
  categoryId: string;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  /** Optional override for the canonical URL. */
  canonical?: string;
  intro: string;
  paragraphs: string[];
  included: string[];
  faqs: FAQ[];
};

const ALLOWED_CITY_SLUGS = new Set([
  "lehigh-acres",
  "fort-myers",
  "cape-coral",
  "bonita-springs",
  "estero",
]);

const _allLocalLandingPages: LocalLandingPage[] = [
  // ============================================================
  // BRAKES
  // ============================================================
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
      "Pulsing pedal under braking, a low-pitched groan that disappears once you're rolling, or a dash light that won't reset? Those are the three most common brake complaints we hear in Lehigh Acres, and they each point to a different failed component. We diagnose first, then repair on site.",
    paragraphs: [
      "A pulsing pedal almost always means rotor runout has exceeded about 0.003 inches — usually because the pads got cooked once on a long Lee Boulevard descent and laid down uneven friction material. Resurfacing buys time only if rotor thickness is still above the manufacturer's minimum stamped on the hat; otherwise it's replacement. We measure with a micrometer before we touch anything.",
      "A grind that goes away the moment you press the pedal is the wear indicator scraping the rotor — a designed-in audible warning that you have roughly 1,000 to 1,500 miles of pad left. A grind that gets worse with brake application means the backing plate is now eating the rotor, and you're looking at pads, rotors, and possibly a caliper bracket if it scored.",
      "An ABS dash light without a brake feel change usually traces to a wheel-speed sensor reading out of range — most often the front-passenger sensor in Lehigh Acres trucks because of how road grit and reclaimed-water spray accumulates in the hub area. We pull the chassis codes with a real bidirectional scanner, clean or replace the sensor, and clear the module.",
      "Every brake job we perform in Lehigh Acres includes torque-to-spec on the lug nuts (one of the most common shop oversights), proper pad bedding through 8 to 10 controlled stops from 35 mph, and a brake-fluid moisture check with a refractometer. Fluid above 3% water content boils at lower temps and causes pedal fade — we recommend flush at 3-year intervals in this climate.",
    ],
    included: [
      "Pre-repair micrometer measurement of rotor thickness",
      "Ceramic or semi-metallic pad selection per vehicle weight and use",
      "Caliper slide-pin clean, inspection, and re-grease with high-temp lube",
      "Lug nut torque-to-spec with calibrated torque wrench",
      "Controlled pad bed-in procedure (8–10 stops, 35→5 mph)",
      "Brake fluid moisture test with refractometer",
      "Wheel-speed sensor inspection and clean if ABS light is on",
    ],
    faqs: [
      {
        q: "How do I know if my Lehigh Acres rotors can be resurfaced or have to be replaced?",
        a: "We measure with a micrometer. If thickness is above the minimum stamped on the rotor hat (usually about 1mm of wear margin) and runout is correctable, we resurface. Below minimum, replacement is the only safe option — a too-thin rotor cannot dissipate heat fast enough and will warp again within months.",
      },
      {
        q: "Why does my pedal go almost to the floor before the brakes bite?",
        a: "Three common causes in Lehigh Acres vehicles: air in the lines from a recent caliper failure, a rear shoe out of adjustment on drum-equipped trucks, or — most common in cars 7+ years old — a master cylinder bypassing internally. We bench-bleed and pressure test before recommending parts.",
      },
      {
        q: "How long is mobile brake service in my driveway?",
        a: "Front pads and rotors with caliper hardware: 75–90 minutes. Rears with parking-brake adjustment add about 20 minutes. Brake-fluid flush is another 30. We do not rush the bed-in procedure — that's where shops cut corners and customers end up with brake dust shudder.",
      },
      {
        q: "What ZIP codes in Lehigh Acres do you cover?",
        a: "Every Lehigh Acres ZIP — 33936, 33971, 33972, 33973, 33974, and 33976 — plus the surrounding Lee County area.",
      },
    ],
  },
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
      "Brake heat fade is the underlying enemy in Lehigh Acres. The long stretches of stop-and-go on Lee Boulevard heading toward Fort Myers cycle pad temperatures from 200°F at cruise to 600°F under heavy braking, dozens of times per commute. That thermal load is what destroys cheap pads in 18 months and good pads in 3–4 years.",
    paragraphs: [
      "We choose pad friction material to match the vehicle and the driver. Daily-driver sedans in Lehigh Acres do best on low-dust ceramic compounds because they hold a stable coefficient of friction up to about 700°F and don't coat the wheels black. SUVs and half-ton trucks need a semi-metallic with a higher friction plateau (650–900°F operating range) because the curb weight pushes thermal load past where ceramics start to glaze.",
      "Rotor metallurgy matters more than most shops admit. The OE replacement rotors most chains install are gray cast iron with low carbon content — they're cheap to make and warp predictably under repeated heat cycles. We spec rotors with higher carbon content (G3500 or better), which costs about $15 more per rotor but extends life by 30–40% in Lehigh Acres conditions.",
      "Caliper service is the part shops skip to save 20 minutes. Slide pins seize from boot tears, especially in the rainy season; one frozen pin means uneven pad wear, increased stopping distance, and eventual rotor warpage. Every brake job includes pin removal, full clean, inspection of the boot, and high-temperature silicone grease — the only lubricant rated for the temperatures inside a caliper bracket.",
      "Brake fluid is hygroscopic — it absorbs water out of humid Florida air through the reservoir cap and through micro-permeable rubber lines. Once moisture content passes 3%, fluid boil point drops from 446°F to under 311°F, and the first hard stop on a hot day produces vapor lock. We test moisture content on every brake call and recommend a full flush every 36 months in Lehigh Acres.",
      "Same-day mobile brake service is usually available across all Lehigh Acres ZIPs. Call or text (813) 501-7572 and we'll quote up front, before any wrench turns.",
    ],
    included: [
      "Pad friction-compound selection matched to vehicle weight",
      "Higher-carbon rotor spec for thermal stability",
      "Full caliper slide-pin clean and re-grease",
      "Brake fluid moisture test (refractometer)",
      "Wheel-bearing play check on every corner",
      "Lug torque to manufacturer spec",
      "Test drive with progressive bed-in stops",
    ],
    faqs: [
      {
        q: "What's the actual lifespan of brakes in Lehigh Acres?",
        a: "On a daily-driver sedan with mostly Lee Boulevard / SR-82 commuting, expect 30,000–40,000 miles on front pads with quality ceramics. Rears typically last 60,000+ miles. Heavier SUVs and trucks see 25,000–35,000 on fronts.",
      },
      {
        q: "Should I always replace pads in pairs?",
        a: "Per axle, yes — never side-by-side only. Different pad thickness on the same axle creates a brake imbalance that pulls under braking and overworks one caliper. We always quote per axle.",
      },
      {
        q: "Do I need new hardware (clips, shims) every brake job?",
        a: "We replace abutment clips and shims on every Lehigh Acres pad job. The reason: old clips lose spring tension, which is what eliminates pad rattle and uneven seating. New hardware comes in our pad kits.",
      },
      {
        q: "Is parking-brake service included?",
        a: "Adjustment is included on rear-disc-with-drum-in-hat designs (the most common). Full shoe replacement is quoted separately if the parking brake itself has worn shoes.",
      },
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
      "Mobile brake repair in Lehigh Acres, FL. Caliper rebuilds, parking-brake service, ABS module diagnosis, fluid flush at your driveway. Call (813) 501-7572.",
    intro:
      "Stuck calipers, a parking brake that won't release, a soft pedal that won't bleed firm, or an ABS warning that comes back the moment you reset it — these are the four brake complaints most shops in Lehigh Acres talk customers into 'just doing pads' instead of fixing. We don't do that.",
    paragraphs: [
      "A stuck caliper in a Lehigh Acres vehicle is almost always a piston-bore corrosion issue, not a slide-pin issue. Florida humidity gets past the dust boot, the piston seal corrodes against the bore, and the piston no longer retracts after release. Symptoms: hot wheel after a short drive, fuel economy drop of 2–4 mpg, pad wear measured in weeks instead of years. We rebuild the caliper if the bore is salvageable, or replace if it's pitted past spec.",
      "Parking brakes in Lehigh Acres are a regional weak point because they so rarely get used in flat terrain — the cable seizes inside its sheath from inactivity. The fix isn't lubricant; it's cable replacement. Once the cable's inner wire has corroded, no spray penetrates well enough to last. We replace the cable, adjust the shoes (drum-in-hat designs) or the actuator (electronic parking brakes), and verify proper engagement and release.",
      "A pedal that won't bleed firm after pad replacement is almost always a master-cylinder issue — the internal seals have rolled past a corroded section of the bore and air keeps reappearing in the lines no matter how many times you bleed. The DIY fix is endless bleeding; the actual fix is master cylinder replacement and a power bleed. We carry pressure bleeders on the truck.",
      "ABS warnings in Lehigh Acres trace to wheel-speed sensors more than 70% of the time — fronts more than rears because the sensor sits low and reclaimed-water spray off Lehigh streets coats the reluctor ring with conductive grime. We pull live data from the ABS module, compare wheel-speed reads at 25 mph, and isolate the failed sensor by signal not by code. The other 30% are tone-ring failures, hub damage, or the module itself.",
      "Every brake repair in Lehigh Acres is quoted in writing before work starts and warranted parts and labor. Call or text (813) 501-7572 for same-day mobile service.",
    ],
    included: [
      "Caliper piston-bore inspection and rebuild or replacement",
      "Parking-brake cable, shoe, or actuator service",
      "Power-bleed brake fluid service after caliper or master work",
      "ABS wheel-speed sensor diagnosis with live module data",
      "Tone-ring inspection on each wheel",
      "Master cylinder bench test before condemning",
      "Written diagnosis with photos of failed components",
    ],
    faqs: [
      {
        q: "My brake light AND ABS light are both on in Lehigh Acres — what's that?",
        a: "Two lights together usually means the ABS module has detected a fault serious enough to disable both anti-lock and stability control. Most common cause: a single failed wheel-speed sensor, occasionally low fluid triggering the brake light independently. We diagnose the actual fault, not just clear codes.",
      },
      {
        q: "Why does my pedal feel fine cold but soft after 20 minutes of driving?",
        a: "Classic fluid moisture problem. Water in old brake fluid boils once the calipers heat up and creates compressible vapor in the lines. A flush with fresh DOT 3 or DOT 4 brings the boiling point back to spec. We test moisture content before recommending flush.",
      },
      {
        q: "Can you do an electronic parking brake on a newer vehicle in my driveway?",
        a: "Yes. Electronic parking brakes need a scan tool to retract the caliper for pad service — we have the bidirectional capability for most makes. Doing it without the tool will damage the actuator.",
      },
      {
        q: "Do you handle Lehigh Acres fleet brakes?",
        a: "Yes — we run scheduled brake inspections and pad swaps for several local Lehigh Acres fleets, with on-site service so vehicles never sit at a shop.",
      },
    ],
  },
  {
    slug: "brake-repair-fort-myers-fl",
    service: "Brake Repair",
    citySlug: "fort-myers",
    categoryId: "brakes",
    h1: "Mobile Brake Repair in Fort Myers, FL",
    metaTitle: "Brake Repair in Fort Myers, FL | Mobile Same-Day Pads, Rotors & Calipers",
    metaDescription:
      "Mobile brake repair in Fort Myers, FL. Coastal corrosion-resistant hardware, ABS diagnosis, pad-and-rotor service in your driveway. Call (813) 501-7572.",
    intro:
      "Fort Myers brake systems fight a war on two fronts: stop-and-go heat from Colonial, US-41, and Daniels Parkway, plus salt-air corrosion if you're anywhere west of McGregor. Our mobile brake service factors both into how we spec the parts and how we install them.",
    paragraphs: [
      "Coastal-area Fort Myers vehicles — Iona, Fort Myers Beach, parts of South Fort Myers — get a different brake hardware spec than Gateway or Page Field cars. We use stainless abutment clips, stainless caliper bolts where available, and dielectric protection on every electrical brake connection. Standard zinc-plated hardware corrodes within 18 months on coastal vehicles and seizes the pad in the bracket, which causes uneven wear and shudder.",
      "Brake shudder under highway braking on Daniels Parkway or I-75 is almost always rotor-related, but not always rotor warpage. A common alternative cause in Fort Myers is uneven pad-material transfer — the pad has laid down a thicker friction film on one section of the rotor face. Resurfacing or new rotors fixes it; identifying which is needed requires a runout measurement with a dial indicator, not a guess.",
      "ABS and stability-control systems on modern Fort Myers vehicles use up to four wheel-speed sensors, a yaw sensor, and a steering-angle sensor. Any one out of range will trigger lights and disable both systems. Our scan tool reads live data from each, lets us compare wheel speeds in real time at 25 mph, and isolates which sensor is actually drifting before any part is replaced.",
      "Every Fort Myers brake job ends with a controlled bed-in procedure: 8–10 progressive stops from 35 to 5 mph, then a 5-minute cool-down, then two slow rolls to settle the pads against fresh rotors. Skipping bed-in is the most common cause of 'new brakes that already shudder' complaints we hear on follow-up calls.",
      "Call or text (813) 501-7572 for mobile brake service anywhere in Fort Myers — Downtown, McGregor, Gateway, Whiskey Creek, Iona, or San Carlos Park.",
    ],
    included: [
      "Coastal-grade stainless brake hardware on coastal-area vehicles",
      "Dial-indicator rotor runout measurement before condemning",
      "Live ABS module data review for sensor diagnosis",
      "Caliper-bracket clean and corrosion treatment",
      "Controlled pad bed-in (8–10 progressive stops)",
      "Lug-nut torque to manufacturer spec",
      "Brake-fluid moisture test (refractometer)",
    ],
    faqs: [
      {
        q: "Why are my brakes squealing only in the morning in Fort Myers?",
        a: "Cold-morning squeal is usually surface rust on the rotor from overnight humidity — it goes away after the first 5–10 stops as the pad scrubs the rotor face clean. If the squeal persists once the rotor is warm, that's a hardware or pad-compound issue and we should look at it.",
      },
      {
        q: "My truck pulls to the right under heavy braking — what's wrong?",
        a: "Almost always a sticking caliper on the left side (not the right). The right brake is doing more work because the left isn't pulling its weight. We test caliper retraction and piston movement before recommending any parts.",
      },
      {
        q: "Are ceramic pads worth it in Fort Myers?",
        a: "Yes, on most cars and small SUVs — they run cleaner (less wheel dust), quieter, and hold friction up to about 700°F. For trucks over 5,500 lbs and anything towing regularly, semi-metallic compounds handle thermal load better.",
      },
      {
        q: "How quickly can you get to me in Fort Myers?",
        a: "Same-day mobile brake service is the norm across all Fort Myers ZIPs (33901, 33907, 33908, 33912, 33913, 33916, 33919, 33966).",
      },
    ],
  },
  {
    slug: "mobile-brake-repair",
    service: "Mobile Brake Repair",
    categoryId: "brakes",
    h1: "Mobile Brake Repair in Lehigh Acres and Fort Myers",
    metaTitle:
      "Mobile Brake Repair in Lehigh Acres and Fort Myers | Pads, Rotors & Calipers At Your Driveway",
    metaDescription:
      "Mobile brake repair across Lehigh Acres and Fort Myers — diagnostic-first pad and rotor service, caliper rebuilds, ABS testing. Call (813) 501-7572.",
    canonical: "https://mikesmautorepair.com/brake-repair",
    intro:
      "Brake symptoms tell a story if you know the language. A brake-light-only warning means low fluid (and probably a leak). An ABS-light-only warning means a wheel-speed sensor or module fault. Both lights together usually means the ABS module has disabled itself and you've lost stability control. We translate before we replace.",
    paragraphs: [
      "Friction is generated by the pad clamping the rotor; heat is what makes that friction work. Pads are a proprietary mixture of binders, fillers, lubricants (graphite, copper), and friction modifiers — the recipe determines whether the pad bites cold (organic), bites hot (semi-metallic), or stays middle-of-the-road quiet (ceramic). Picking the wrong compound for the vehicle is the most common cause of premature wear or noise complaints.",
      "Rotor warpage in the classic sense is rare. What feels like warpage is almost always one of two things: uneven pad-material transfer (correctable with re-bedding or resurface) or actual rotor thickness variation (DTV) measured with a micrometer at 8 points around the rotor face. We measure before we condemn.",
      "Caliper service across both Lehigh Acres and Fort Myers focuses on slide-pin freedom, piston retraction, and dust-boot integrity. A single seized pin causes uneven pad wear within 5,000 miles and accelerated rotor wear right after. We service the calipers on every pad job; that's part of why our brake repairs last longer than chain-shop equivalents.",
      "Brake fluid hygroscopy is real and underappreciated in Florida. DOT 3 fluid absorbs water through the reservoir cap and through the microscopic permeability of rubber brake lines. After 36 months in this climate, the fluid is typically 3% water by weight, and the boiling point has fallen from 446°F to under 311°F. The result is pedal fade after repeated heavy stops. We test with a refractometer and recommend flush at 36-month intervals.",
      "Service spans every Lehigh Acres and Fort Myers ZIP. Quotes are written before any work starts. Call or text (813) 501-7572.",
    ],
    included: [
      "Pad-compound selection by vehicle weight and use",
      "Rotor thickness and runout measurement",
      "Caliper slide-pin clean and re-grease",
      "Pressure-bleed fluid service when needed",
      "ABS live-data review for active warnings",
      "Stainless hardware for coastal vehicles",
      "Controlled pad bed-in and torque-to-spec",
    ],
    faqs: [
      {
        q: "How do you tell rotor warpage from uneven pad transfer?",
        a: "Dial-indicator runout measurement on the rotor face. Below 0.003 inches and the issue is pad transfer — re-bed or resurface. Above that, the rotor is mechanically distorted and replacement is the right call.",
      },
      {
        q: "What's the actual difference between ceramic and semi-metallic pads?",
        a: "Ceramic: cleaner, quieter, stable to ~700°F, ideal for sedans and small SUVs. Semi-metallic: higher friction at high temperature (700–900°F), handles heavy loads better, more wheel dust. We pick by vehicle weight and use case.",
      },
      {
        q: "Do you offer financing on big brake jobs?",
        a: "Yes — financing is available on qualifying repairs across Lehigh Acres and Fort Myers. Ask when you book.",
      },
      {
        q: "Will my warranty be honored if you do the brakes?",
        a: "Yes. Magnuson-Moss federal law protects your factory warranty when an independent shop performs maintenance to manufacturer spec.",
      },
    ],
  },
  {
    slug: "brake-repair",
    service: "Brake Repair",
    categoryId: "brakes",
    h1: "Brake Repair in Lehigh Acres and Fort Myers",
    metaTitle: "Brake Repair in Lehigh Acres and Fort Myers | Mobile Pads, Rotors & Calipers",
    metaDescription:
      "Mobile brake repair across Lehigh Acres and Fort Myers — pad and rotor work, caliper rebuilds, ABS diagnosis. Call (813) 501-7572.",
    intro:
      "Brake repair is one of the few services where doing it cheap actually costs more, faster. Bargain pads glaze under heat and wear rotors uneven; warped rotors destroy new pads in 8,000 miles; a seized caliper torches a $200 set of pads in a single weekend. Our approach is to fix what's actually wrong on the first visit.",
    paragraphs: [
      "Diagnosis is step one on every brake call across Lehigh Acres and Fort Myers. We listen to the symptom (squeal, grind, pulse, drift, fade), look at pad and rotor wear patterns, measure with calipers and a micrometer, and inspect caliper function. Often a 'I need brakes' call turns out to be a single seized slide pin and a $120 hardware service rather than a $600 rebuild — but only if someone bothers to look.",
      "Modern brake systems are integrated with stability control, traction control, hill-hold, and on newer vehicles regenerative braking blending. Replacing pads on a hybrid or EV requires using a scan tool to retract the caliper electronically — pushing the piston back manually damages the parking-brake actuator. Our scan tools cover that on most domestic, Asian, and European makes.",
      "Brake hardware — clips, shims, springs — is consumable. We replace it on every pad job. Re-using old hardware is the single most common reason a 'fresh' brake job is back making noise within 90 days. The clips lose tension, the shims lose their shim coating, the pad rattles in the bracket and either squeals or wears unevenly.",
      "Brake fluid service belongs in every preventive plan in this climate. Florida humidity drives moisture into the fluid through the reservoir cap and lines; once moisture passes 3%, you have a safety problem on the first hot day. We test with a refractometer, not by looking at fluid color.",
      "Service across every Lehigh Acres and Fort Myers ZIP. Same-day appointments usually available. Call or text (813) 501-7572.",
    ],
    included: [
      "Diagnostic before any parts are recommended",
      "New abutment clips and shims with every pad job",
      "Caliper inspection and pin service",
      "Rotor runout and thickness measurement",
      "Brake-fluid moisture test",
      "Scan-tool caliper retraction on EVs/hybrids",
      "Lug torque verification and bed-in road test",
    ],
    faqs: [
      {
        q: "Can I drive on grinding brakes safely for a few days?",
        a: "No. Grinding means metal-on-metal contact, and every additional mile is scoring the rotor (and possibly the caliper bracket). The repair gets meaningfully more expensive every day. We can be there same day.",
      },
      {
        q: "Why do new brakes squeal sometimes?",
        a: "Most often: skipped bed-in procedure, missing or worn anti-rattle shims, or pad backing plate corrosion. Less often: incompatible pad compound. We re-bed and inspect under warranty if it happens after our service.",
      },
      {
        q: "Should I get the brake fluid flushed?",
        a: "Every 36 months in Florida is the realistic interval. Sooner if the moisture test shows >3% water content.",
      },
      {
        q: "Do you handle European and luxury brakes?",
        a: "Yes — including Audi, BMW, Mercedes, Volvo. We carry the right friction compounds and use the scan tool to retract electronic parking-brake calipers.",
      },
    ],
  },

  // ============================================================
  // ALTERNATOR
  // ============================================================
  {
    slug: "mobile-alternator-repair-fort-myers",
    service: "Mobile Alternator Repair",
    citySlug: "fort-myers",
    categoryId: "electrical",
    h1: "Mobile Alternator Repair in Fort Myers, FL",
    metaTitle:
      "Mobile Alternator Repair in Fort Myers, FL | Mike's Mobile Auto Repair",
    metaDescription:
      "On-site alternator replacement in Fort Myers. Charging-system load testing, ground-cable diagnosis, post-install voltage verification. Call (813) 501-7572.",
    canonical: "https://mikesmautorepair.com/alternator-repair-fort-myers",
    intro:
      "An alternator failure usually shows up in this order: battery light flickers under load (headlights + AC + wipers all on), then the battery starts dying overnight, then a no-start. By the time the dash light is steady, the alternator is producing under 12.6 volts and the battery is finishing its job for it.",
    paragraphs: [
      "Alternator output is rated by amperage, not voltage. A typical Fort Myers sedan needs 120–140 amps to keep up with AC compressor draw, headlights, and the dozens of electronic modules now standard on every vehicle. Trucks and tow vehicles need 160–220 amps. Installing a 105-amp parts-store unit on a vehicle that needs 140 amps is the most common reason a 'fresh' alternator fails again within a year — it never gets to coast, it's always at full output.",
      "The diagnostic that separates real alternator work from a parts-store guess is a voltage-drop test on the main charge cable, the battery negative cable, and the engine-to-chassis ground strap. A drop of more than 0.3 volts on any one of those means the new alternator is working harder than rated to overcome resistance — and will fail early. We test all three before installing.",
      "Diode failure is the failure mode we see most in Fort Myers. The internal rectifier converts the alternator's three-phase AC output to DC; when one diode fails (heat is the usual cause in this climate), the alternator can still charge but produces 'AC ripple' that confuses electronic modules. Symptoms: warning-light gremlins, infotainment glitches, intermittent stalls. We test for ripple with a scope on every charging-system call.",
      "Belt and tensioner condition affects the alternator more than most drivers realize. A glazed belt slips under high electrical load, the alternator under-produces, and the system stays in a constant voltage-drop state that cooks the rotor windings. We check belt tension with a gauge and replace if cracked, glazed, or noisy.",
      "Service covers every Fort Myers ZIP. Stuck right now? Call or text (813) 501-7572.",
    ],
    included: [
      "Charging-system test under live electrical load",
      "Voltage-drop test on charge cable, battery ground, engine ground",
      "AC-ripple test with oscilloscope (diode failure detection)",
      "Belt and tensioner inspection",
      "Alternator amperage matched to vehicle requirement",
      "Post-install verification (13.8–14.7V at idle, full load)",
      "Battery state-of-health test included",
    ],
    faqs: [
      {
        q: "How can I tell if it's the alternator or the battery in Fort Myers?",
        a: "Quick test: jump-start the vehicle and disconnect the jumper. If it dies within 60 seconds, alternator is not charging. If it keeps running but won't restart later, battery is bad. Real diagnosis uses a load tester on each — we always check both.",
      },
      {
        q: "How long does an alternator job take in my Fort Myers driveway?",
        a: "Typical sedan: 60–75 minutes. Truck or van with serpentine routing through accessories: 90–120 minutes. Some V6s with rear-mounted alternators run longer and may need different access.",
      },
      {
        q: "Do you use rebuilt or new alternators?",
        a: "Quality remanufactured units from established brands for most jobs — they meet OE spec at lower cost. New OE on request, especially for newer vehicles still under hybrid or warranty consideration.",
      },
      {
        q: "Can a bad ground cable look like a bad alternator?",
        a: "Absolutely. A corroded battery negative or engine ground will mimic alternator failure exactly. That's why voltage-drop testing is non-negotiable before condemning the alternator.",
      },
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
      "Mobile alternator repair in Fort Myers, FL. Diode testing, ground-strap analysis, output-amperage matching. Call (813) 501-7572.",
    intro:
      "Most alternator misdiagnosis we see in Fort Myers comes from one shortcut: testing the alternator on its own instead of testing the entire charging circuit. The alternator can pass a bench test and still fail to charge the vehicle if the cabling is degraded.",
    paragraphs: [
      "The charging circuit is alternator → main charge cable → battery positive → battery negative → engine ground → engine block. A failure or excessive resistance anywhere in that loop produces the same dash light and the same low-voltage symptom. Replacing only the alternator without checking the cabling is the reason customers come to us with a third 'fresh' alternator that already isn't working.",
      "Engine-to-chassis ground straps in Fort Myers vehicles corrode predictably between years 5 and 8. The strap looks fine externally but the copper braid under the heat-shield insulation has oxidized. The fix is replacement, not cleaning — once the copper has lost cross-section to corrosion, no amount of brushing restores conductivity.",
      "Newer Fort Myers vehicles (2014 and later, especially GM and Ford) use 'smart' charging systems that vary alternator output based on battery state-of-charge as commanded by the body control module. Replacing the alternator on a smart-charging vehicle without resetting the battery monitor sensor produces the symptom 'new alternator overcharges or undercharges.' Our scan tool resets the battery sensor on every applicable job.",
      "AGM batteries, common in Fort Myers stop-start vehicles, require a charging system that can hold 14.6–14.8 volts at temperature, higher than a flooded battery's 13.8–14.4. Mismatching the alternator profile to the battery type cooks the battery in 12 months. We confirm battery type before recommending the alternator part.",
      "Same-day mobile alternator service usually available. Call or text (813) 501-7572.",
    ],
    included: [
      "Full charging-circuit voltage-drop test",
      "Engine-ground and battery-ground strap inspection",
      "Smart-charging battery sensor reset (scan tool)",
      "AGM-vs-flooded charge profile verification",
      "Alternator output verification under load",
      "Belt, tensioner, idler pulley check",
      "Post-install road test with charge monitoring",
    ],
    faqs: [
      {
        q: "What does a 'smart' charging system change about alternator service?",
        a: "The alternator output is commanded by the body control module based on battery state-of-charge. After replacing the alternator or battery on a smart-charging vehicle, the battery monitor must be reset with a scan tool — otherwise the system thinks it has an old battery and over-charges the new one.",
      },
      {
        q: "How long should an alternator last in Fort Myers?",
        a: "OE alternators typically last 7–10 years here; shorter on stop-start vehicles where the alternator cycles more often. Heat is the killer — engine bay temperatures of 200°F+ during summer accelerate diode and bearing wear.",
      },
      {
        q: "Will a new alternator fix my dim headlights?",
        a: "Maybe. Dim lights at idle that brighten with RPM means the alternator can't keep up at low speed — bad alternator or weak battery. Dim at all speeds means a wiring or grounding issue. We test before recommending parts.",
      },
      {
        q: "Do you offer warranty on the alternator install?",
        a: "Yes — parts and labor warranty on every Fort Myers alternator job.",
      },
    ],
  },
  {
    slug: "alternator-repair-lehigh-acres-fl",
    service: "Alternator Repair",
    citySlug: "lehigh-acres",
    categoryId: "electrical",
    h1: "Mobile Alternator Repair in Lehigh Acres, FL",
    metaTitle: "Alternator Repair in Lehigh Acres, FL | Mobile Charging-System Service",
    metaDescription:
      "Mobile alternator repair in Lehigh Acres, FL. Smart-charging system reset, battery monitor calibration, load-tested install. Call (813) 501-7572.",
    intro:
      "If your battery light flickers only when you turn the steering wheel hard or hit a bump, you almost certainly don't need an alternator — you need to find and tighten a loose connection. We diagnose intermittent charging issues before we replace anything.",
    paragraphs: [
      "Intermittent battery-light symptoms in Lehigh Acres vehicles come from one of three things: a loose battery terminal (most common), a partially corroded engine-to-chassis ground, or a worn alternator brush set inside the case. A bench test won't catch any of these — only a chassis test under live driving load will. We test the system the way it's actually used.",
      "Alternator brushes are the wear item inside the alternator. They're spring-loaded carbon contacts that ride against the slip rings to deliver field current to the rotor. When they wear past about 5mm of length (typically at 150,000+ miles in Lehigh Acres), output gets unstable — fine at idle, weak under load, then total failure. Some alternators support brush-only service; most don't, and it's a full replacement.",
      "Pulley engagement is overlooked. A one-way clutch pulley (OAD) decouples the alternator from belt deceleration to reduce belt fatigue — when it fails, the symptom is a chirp on engine shutdown or a rattle at idle, and the alternator behind it eventually overheats from belt-shock. We inspect the OAD on every alternator service.",
      "Lehigh Acres heat is the underlying stressor. Engine bay temperatures regularly exceed 220°F in summer, and the alternator sits inches from that heat. Diode rectifiers fail thermally, voltage regulators drift with temperature, and bearings dry out. Quality remanufactured alternators with new diodes, new bearings, and new regulators cost about 20% more than basic units and last roughly twice as long here.",
      "Same-day service across all Lehigh Acres ZIPs. Call or text (813) 501-7572.",
    ],
    included: [
      "Live-load charging system test (not bench-style)",
      "Battery terminal and ground strap inspection",
      "OAD pulley function check",
      "Brush set inspection where serviceable",
      "Quality remanufactured or new alternator with proper diodes",
      "Smart-charging battery sensor reset where applicable",
      "Voltage verification at idle, 1500 rpm, and full load",
    ],
    faqs: [
      {
        q: "What's an OAD pulley and why does it matter?",
        a: "Overrunning Alternator Decoupler — a one-way clutch in the alternator pulley that absorbs belt-system deceleration shock. When it fails, you'll hear a rattle at idle or a chirp at engine-off. A failed OAD will eat the new alternator behind it, so we always check.",
      },
      {
        q: "Can heat alone kill an alternator in Lehigh Acres?",
        a: "Yes. Repeated cycling above 200°F engine-bay temp degrades the diode rectifier and dries out the bearings. Heat is the #1 reason alternators here fail at 7 years instead of 12.",
      },
      {
        q: "Will my AC stop working if the alternator fails?",
        a: "Eventually, yes — the AC compressor clutch needs constant 12V to engage, and a weak charging system will cause the BCM to disable AC to preserve battery for ignition.",
      },
      {
        q: "Are remanufactured alternators reliable?",
        a: "Quality reman units (with new diodes, new bearings, new regulator) are reliable. Cheap reman units that re-use old internals are not. We spec the right ones.",
      },
    ],
  },
  {
    slug: "mobile-alternator-repair",
    service: "Mobile Alternator Repair",
    categoryId: "electrical",
    h1: "Mobile Alternator Repair in Lehigh Acres and Fort Myers",
    metaTitle: "Mobile Alternator Repair in Lehigh Acres and Fort Myers | On-Site Charging-System Service",
    metaDescription:
      "Mobile alternator repair across Lehigh Acres and Fort Myers — circuit-level diagnosis and load-tested install. Call (813) 501-7572.",
    canonical: "https://mikesmautorepair.com/alternator-repair",
    intro:
      "An alternator works hard in Florida. AC compressor pulls 30–60 amps, electric cooling fans pull another 30, headlights and electronics another 25 — sustained 100+ amp draw at idle is normal here, and a marginal alternator fails fast under that load.",
    paragraphs: [
      "Charging-system testing on every call across Lehigh Acres and Fort Myers includes alternator output under live load, voltage drop on the main charge cable, ground-circuit integrity, AC-ripple measurement, belt condition, and battery state-of-health. Skipping any of those steps means a meaningful chance the new alternator fails again early — which isn't acceptable for a mobile job.",
      "Selection of replacement amperage matters. We don't downgrade a 160A truck alternator to a 105A 'universal fit' unit because that's what's cheap on the shelf. We match or exceed the OE rating, especially on Lehigh Acres trucks and Fort Myers tow vehicles that pull at full demand for hours.",
      "Smart-charging vehicles (2014+ from most makes) require a battery-monitor reset after alternator or battery replacement. Without the reset, the body control module commands wrong output and either undercharges or cooks the battery. We carry the right scan-tool coverage for most makes.",
      "Belt-system geometry is often the hidden culprit. A failing tensioner, glazed belt, or misaligned idler pulley produces belt slip under load, which produces low alternator output, which the customer reads as 'bad alternator.' Replacing the alternator without addressing the belt issue means the new unit lasts a few months at best.",
      "Same-day mobile service across every Lehigh Acres and Fort Myers ZIP. Call or text (813) 501-7572.",
    ],
    included: [
      "Full charging-circuit test (load + voltage drop)",
      "AC-ripple measurement for diode integrity",
      "OE-or-better amperage rating on replacement",
      "Smart-charging battery-monitor reset",
      "Belt, tensioner, and pulley inspection",
      "Post-install voltage verification under load",
      "Battery state-of-health test included",
    ],
    faqs: [
      {
        q: "How quickly will a failing alternator strand me?",
        a: "Once the dash light is steady, you have roughly 30–60 minutes of driving on battery alone before voltage drops below what the engine needs to fire injectors or coils. Lower if AC and headlights are on.",
      },
      {
        q: "Why do alternators in Florida fail earlier than in cooler climates?",
        a: "Heat. Engine bay temperatures of 200°F+ are routine here, and that thermal environment shortens diode and bearing life by 30–50% compared to northern climates.",
      },
      {
        q: "Can you handle European alternators on site?",
        a: "Most of them, yes — including BMW, Mercedes, and VAG group. Some require coding after install which we handle with the scan tool.",
      },
      {
        q: "What's covered by warranty?",
        a: "Parts and labor on every alternator install, with warranty terms varying by part brand. Specifics quoted at booking.",
      },
    ],
  },
  {
    slug: "alternator-repair",
    service: "Alternator Repair",
    categoryId: "electrical",
    h1: "Alternator Repair in Lehigh Acres and Fort Myers",
    metaTitle: "Alternator Repair in Lehigh Acres and Fort Myers | Mobile Charging-System Service",
    metaDescription:
      "Mobile alternator repair across Lehigh Acres and Fort Myers — battery, alternator, ground, and belt diagnosis. Call (813) 501-7572.",
    intro:
      "Three failure modes account for over 90% of alternator complaints we diagnose across Lehigh Acres and Fort Myers: failed diode rectifier (cook the battery with AC ripple), worn brushes (intermittent output), and seized bearing (squeal then seizure). Each looks identical from the dash and each needs different verification.",
    paragraphs: [
      "Diode failure is the sneaky one. The alternator still produces voltage, the battery light may not even come on, but the AC ripple confuses CAN-bus modules and the customer complains of warning-light gremlins, infotainment quirks, or random transmission shifts. Scope-checking the alternator output on every charging call catches this — a multimeter doesn't see ripple.",
      "Brush wear shows up as intermittent charging that gets worse with vibration. Most common Lehigh Acres / Fort Myers symptom: dash voltage drops by a few tenths every time you go over a speed bump or hit Lee Boulevard's rougher patches. The brushes momentarily lose contact with the slip rings.",
      "Bearing failure announces itself with a high-pitched squeal under acceleration, audible from the front of the engine. Once it starts, you have weeks at most before the bearing seizes — and a seized alternator pulley snaps the serpentine belt and disables every belt-driven accessory at once.",
      "Belt-driven accessories are integrated. A weak alternator can mask a tensioner problem, and a tensioner problem can mask a weak alternator. We inspect the entire belt path on every alternator call and replace the belt with the alternator if it has more than 60,000 miles or shows any glazing.",
      "Same-day service available. Call or text (813) 501-7572.",
    ],
    included: [
      "Diode-rectifier test (oscilloscope ripple measurement)",
      "Output testing at idle and high RPM",
      "Belt and tensioner inspection",
      "Battery load test included",
      "Voltage-drop test on charge and ground circuits",
      "Quality reman or new alternator with new internals",
      "Post-install verification at idle and full load",
    ],
    faqs: [
      {
        q: "Can a bad alternator damage my car's computer?",
        a: "Yes — AC ripple from a failing diode rectifier can cook control modules over time and definitely confuses CAN-bus communication. That's why we scope-test the alternator output, not just measure voltage.",
      },
      {
        q: "How long can I drive with the battery light on?",
        a: "Typically 20–60 minutes once the light is steady. Less if AC, headlights, or wipers are on. Pull over at the first safe spot and call.",
      },
      {
        q: "Why does my battery keep dying overnight?",
        a: "Could be an alternator that isn't fully recharging during your daily drive, or a parasitic draw bleeding the battery while parked. We test both before recommending parts.",
      },
      {
        q: "Do you cover Lehigh Acres AND Fort Myers?",
        a: "Yes — every ZIP in both cities, same-day service standard.",
      },
    ],
  },

  // ============================================================
  // BATTERY
  // ============================================================
  {
    slug: "mobile-battery-replacement",
    service: "Mobile Battery Replacement",
    categoryId: "electrical",
    h1: "Mobile Car Battery Replacement in Lehigh Acres and Fort Myers",
    metaTitle:
      "Mobile Battery Replacement in Lehigh Acres and Fort Myers | Same-Day Delivery & Install",
    metaDescription:
      "Mobile car battery delivery and install across Lehigh Acres and Fort Myers. AGM, EFB, and flooded options. Call (813) 501-7572.",
    canonical: "https://mikesmautorepair.com/battery-replacement",
    intro:
      "Battery technology has fragmented. A 2010 sedan takes a flooded battery; a 2018 with stop-start needs an EFB or AGM; a 2022 with regenerative braking needs an AGM with specific cold-cranking-amps and reserve-capacity ratings. Installing the wrong type causes early failure or charging-system damage.",
    paragraphs: [
      "Flooded lead-acid is the traditional vented battery — cheap, reliable, and the right choice for older vehicles without stop-start or aggressive electrical loads. In Lehigh Acres and Fort Myers heat, expect 30–42 months of service life from a quality flooded battery.",
      "EFB (Enhanced Flooded Battery) is the entry-level upgrade for stop-start vehicles. It tolerates the higher cycle count of stop-start operation and costs roughly 30% more than flooded. Most 2015+ economy cars with stop-start need EFB or better; installing flooded shortens battery life to 12–18 months.",
      "AGM (Absorbed Glass Mat) is sealed, vibration-resistant, and the only correct choice for vehicles with regenerative braking, premium audio, or significant key-off electrical load. AGM holds higher voltage (12.85V resting versus 12.6V for flooded) and tolerates deep discharge cycles flooded batteries can't. Cost is roughly double flooded; service life is typically 4–6 years even in Florida.",
      "Group size, cold-cranking amps, reserve capacity, and terminal layout all need to match the vehicle. Wrong group size means the battery doesn't fit the tray. Wrong CCA leaves marginal cold cranking. Wrong reserve capacity means accessories drain it faster. We carry the right specs for most vehicles and install with proper terminal cleaning, hold-down torque, and post-install voltage verification.",
      "Service across every Lehigh Acres and Fort Myers ZIP. Same-day standard. Call or text (813) 501-7572.",
    ],
    included: [
      "Battery type matched to vehicle (flooded / EFB / AGM)",
      "Group size, CCA, and reserve capacity verification",
      "Old battery hauled and recycled at no charge",
      "Terminal clean and corrosion-prevention treatment",
      "Hold-down torqued to factory spec",
      "Battery monitor reset on smart-charging vehicles",
      "Post-install resting voltage and load test",
    ],
    faqs: [
      {
        q: "How do I know if my vehicle needs AGM?",
        a: "Check the original battery sticker or owner's manual. Vehicles with stop-start, regen braking, or 'battery management system' labeling need AGM. Most 2018+ luxury vehicles do as well.",
      },
      {
        q: "Why does my new battery only last a year?",
        a: "Three common reasons: wrong battery type (flooded in a stop-start), undersized CCA for the climate, or an undiagnosed parasitic draw discharging it nightly. We check the charging system AND parasitic draw on every battery install.",
      },
      {
        q: "Do you reset the radio code when the battery comes out?",
        a: "Most modern radios don't need a code anymore, but if yours does we use a memory saver during install so radio, presets, and module learn-data stay intact.",
      },
      {
        q: "How much does battery delivery and install cost?",
        a: "$180–$320 for most flooded and EFB; AGM runs $260–$425 depending on size and warranty. Quoted up front.",
      },
    ],
  },
  {
    slug: "battery-replacement",
    service: "Car Battery Replacement",
    categoryId: "electrical",
    h1: "Car Battery Replacement in Lehigh Acres and Fort Myers",
    metaTitle: "Car Battery Replacement in Lehigh Acres and Fort Myers | Same-Day Mobile Install",
    metaDescription:
      "Mobile car battery replacement across Lehigh Acres and Fort Myers. Parasitic-draw test included. Call (813) 501-7572.",
    intro:
      "The number-one reason a 'new' battery fails within a year in Florida is a parasitic draw nobody checked for. A trunk light that doesn't shut off, an aftermarket dash camera wired wrong, or a glove-box bulb that stays lit will pull 50–500 milliamps continuously and drain the battery overnight while you sleep.",
    paragraphs: [
      "Healthy parasitic draw on a modern vehicle is under 50 milliamps after the modules sleep — usually 10–30 minutes after the doors are locked. Above 50mA continuous and the battery is being slowly bled. Above 200mA and it's being killed within a few days. We measure with an inductive amp clamp on every battery install in Lehigh Acres and Fort Myers, and trace any excessive draw to the offending circuit before installing the new battery.",
      "Battery state-of-health is more meaningful than voltage. A 12.6V resting battery looks fine on a multimeter but may fail a 50% load test if internal sulfation has reduced capacity. Our load testers measure cold-cranking-amp output under simulated start load — that's the only test that reveals usable battery condition.",
      "Heat is what kills batteries in Lehigh Acres and Fort Myers. The chemical reaction that produces electricity accelerates with temperature, but so does internal grid corrosion and water loss. A battery rated for 60 months in Minnesota will deliver 30–36 months here. AGM construction tolerates heat better than flooded; that's why we recommend AGM for any vehicle that parks outdoors regularly.",
      "Charging-system condition determines whether the new battery has a chance. An alternator producing 13.5V instead of the spec 14.2V will undercharge the battery for its entire life. An alternator with diode ripple will produce charge but cook the battery from electrolyte agitation. We test both before declaring the install complete.",
      "Same-day service. Call or text (813) 501-7572.",
    ],
    included: [
      "Parasitic-draw measurement with inductive clamp",
      "Battery load test (CCA under simulated start)",
      "Charging-system output and ripple verification",
      "Terminal clean and dielectric protection",
      "Battery monitor reset where applicable",
      "Old battery recycled at no charge",
      "Manufacturer plus mobile-install warranty",
    ],
    faqs: [
      {
        q: "How do you find a parasitic draw?",
        a: "Inductive amp clamp on the battery cable while pulling fuses one at a time. Whichever fuse drops the draw is the offending circuit. We trace from there.",
      },
      {
        q: "Will a battery from a parts store work as well as your install?",
        a: "Same brands are available — the difference is the install. Terminal corrosion, hold-down torque, charging system not verified, parasitic draw not checked. Those are why parts-store installs fail early.",
      },
      {
        q: "What if my dash lights stay on after install?",
        a: "Most likely a tire-pressure or steering-angle sensor that needs a relearn after voltage interruption. Our scan tool handles those resets on most makes.",
      },
      {
        q: "Are batteries warrantied?",
        a: "Yes — manufacturer warranty (typically 24–48 months) plus our mobile-install labor warranty.",
      },
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
      "Mobile car battery delivery and installation in Lehigh Acres, FL. Parasitic draw test, charging-system verification. Call (813) 501-7572.",
    intro:
      "Most Lehigh Acres battery failures we diagnose at first call aren't actually batteries — they're cable corrosion. The chalky white-green crust on the terminal looks cosmetic but adds enough resistance to drop starting voltage by a full volt at the starter solenoid. The car cranks slow, the customer thinks 'battery,' and a new battery only postpones the real fix by a few weeks.",
    paragraphs: [
      "Cable corrosion in Lehigh Acres comes from battery off-gassing reacting with humidity. The fix is full removal of both clamps, wire-brush of the terminal posts, hot-water rinse of the clamps, and dielectric grease on reassembly. Battery hold-down torqued to factory spec — loose batteries vibrate, vibration cracks internal plates, and the new battery dies in months.",
      "Parasitic-draw testing is part of every Lehigh Acres battery install. We measure with an inductive clamp after the vehicle has been locked and gone through its sleep cycle (typically 30 minutes). Above 50 mA continuous draw means something isn't sleeping properly — most common offenders in this market are aftermarket alarm modules, dash cameras hard-wired incorrectly, and trunk lights with failed pin switches.",
      "Battery selection depends on vehicle. A daily-driver Camry doesn't need AGM. A 2020 F-150 with stop-start absolutely does. A 2017 Ram with trailer-tow package needs higher CCA than the base model. We carry battery references for most makes and don't 'universal-fit' a battery into a vehicle that needs a specific spec.",
      "Lehigh Acres summers cycle a battery between 100°F engine-off heat soak and 200°F+ engine-on heat. That thermal stress is what cuts service life from a rated 60 months down to a real-world 30–36 months. We mention AGM upgrade on every install for vehicles that park outdoors all summer; in our experience the longer life justifies the price difference within the second year.",
      "Same-day Lehigh Acres mobile battery service. Call or text (813) 501-7572.",
    ],
    included: [
      "Battery removal and full terminal corrosion cleanup",
      "Hold-down inspection and torque to spec",
      "Parasitic-draw test post-install",
      "Charging-system output verification",
      "AGM upgrade option for outdoor-parked vehicles",
      "Old battery recycled at no charge",
      "Battery monitor reset (smart-charging vehicles)",
    ],
    faqs: [
      {
        q: "Why does my Lehigh Acres battery only last 2 years?",
        a: "Heat, almost always. Outdoor-parked vehicles in Lehigh Acres see 200°F+ underhood temps daily for months — that thermal cycling shortens flooded-battery life by 40–50% versus a cooler climate. AGM construction handles it much better.",
      },
      {
        q: "Do I need AGM in my older car?",
        a: "Probably not — AGM's main benefits (deep-cycle tolerance, vibration resistance, sealed safety) matter most on stop-start, high-electrical-load, or premium-audio vehicles. Older daily drivers do fine on a quality flooded battery.",
      },
      {
        q: "Can you jump-start me first if it's a no-start?",
        a: "Yes — we carry jump packs and arrive ready to crank-start. If the battery is dead but recoverable, we can confirm before recommending replacement.",
      },
      {
        q: "How much will the install cost in Lehigh Acres?",
        a: "Most flooded and EFB batteries: $180–$320 installed. AGM: $260–$425. Quoted up front before work.",
      },
    ],
  },
  {
    slug: "battery-replacement-lehigh-acres-fl",
    service: "Battery Replacement",
    citySlug: "lehigh-acres",
    categoryId: "electrical",
    h1: "Mobile Battery Replacement in Lehigh Acres, FL",
    metaTitle: "Battery Replacement in Lehigh Acres, FL | Same-Day Mobile Install",
    metaDescription:
      "Mobile car battery replacement in Lehigh Acres, FL. Smart-charging reset and parasitic-draw test included. Call (813) 501-7572.",
    intro:
      "A battery that won't hold charge after sitting overnight is rarely a bad battery — it's almost always a parasitic-draw problem. We diagnose before we replace, because installing a battery on top of an unfixed parasitic draw means the new battery fails within months.",
    paragraphs: [
      "Common parasitic-draw culprits in Lehigh Acres vehicles: aftermarket dash cameras wired to constant-12V (should be wired to switched accessory), aftermarket subwoofer amps with leaky power capacitors, trunk-light pin switches that have lost their detent, glove-box bulbs that stay on, and door-courtesy modules that fail to enter sleep mode after lock.",
      "The diagnostic procedure: lock the vehicle, wait 30 minutes for modules to sleep, then place an inductive amp clamp on the negative battery cable. Healthy reading: under 50mA. Anything higher gets traced fuse-by-fuse until the offending circuit is identified.",
      "Smart-charging vehicles (most 2014+) use a current sensor on the negative battery cable to monitor state-of-charge. Disconnecting the battery without scan-tool reset can confuse the sensor, causing the alternator to over- or under-charge for weeks. We perform the reset on every applicable Lehigh Acres install.",
      "Steering-angle sensors, throttle-body relearns, and idle-air relearns are common 'comebacks' on vehicles where the customer notices unusual behavior after battery disconnect. Our scan tool handles all of those resets at install — no separate trip to a dealer.",
      "Same-day Lehigh Acres service across all six ZIPs. Call or text (813) 501-7572.",
    ],
    included: [
      "Parasitic-draw test (post-sleep inductive clamp)",
      "Fuse-by-fuse trace if draw exceeds 50mA",
      "Smart-charging battery monitor reset",
      "Post-install module relearns (throttle, steering angle, idle)",
      "Memory-saver during install for radio/preset retention",
      "Old battery hauled and recycled",
      "Charging-system output verification",
    ],
    faqs: [
      {
        q: "What's a parasitic draw and how much is normal?",
        a: "Current the vehicle pulls while parked and locked. Normal is under 50 milliamps once modules sleep (about 30 minutes). Above that and your battery will discharge over a few days to a few weeks.",
      },
      {
        q: "Why do I need a 'reset' after a battery change?",
        a: "Modern vehicles store learned values for throttle response, idle, transmission shift points, etc. A battery disconnect erases those, and the vehicle drives oddly until they relearn — sometimes weeks. Scan-tool relearn restores them in minutes.",
      },
      {
        q: "Can you do AGM in my driveway in Lehigh Acres?",
        a: "Yes — we carry AGM inventory and install in driveways across Lehigh Acres same-day.",
      },
      {
        q: "Is the install warrantied?",
        a: "Yes — battery manufacturer warranty plus our mobile-install labor warranty.",
      },
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
      "Mobile car battery delivery and install in Fort Myers, FL. AGM, EFB, flooded. Smart-charging reset. Call (813) 501-7572.",
    intro:
      "Fort Myers vehicles often get the wrong battery installed. Stop-start trucks routinely show up with flooded batteries (dead in 14 months). Coastal Iona and Beach vehicles get standard-grade batteries when they should have sealed AGM (corroded terminals in 8 months). We carry the spec match and install with the climate in mind.",
    paragraphs: [
      "Battery type matters more than the brand label. A 2016+ truck or SUV with stop-start needs at minimum an EFB and ideally AGM — putting a flooded battery in cycles the chemistry past its design life and the battery is finished within a year. Pickups, large SUVs, and any vehicle with the 'eco' stop-start system: EFB or AGM, no exceptions.",
      "Coastal Fort Myers vehicles (Iona, Fort Myers Beach, parts of South Fort Myers, McGregor near the river) need sealed AGM construction for one specific reason: the vented gas from a flooded battery reacts with salt-laden humid air to form acidic crust that destroys the terminals and surrounding metal in months. AGM is sealed, no venting, no terminal corrosion.",
      "Charging-system testing is non-negotiable on every install. An alternator producing low voltage will undercharge the new battery for its life; an alternator with diode ripple will cook it from inside. We measure both before declaring the install complete.",
      "Battery monitor sensors on smart-charging Fort Myers vehicles need to be reset with a scan tool after install. Skip the reset and the alternator commands wrong output for weeks until the system relearns — meanwhile the new battery is being mishandled. Our scan tool covers most makes.",
      "Same-day Fort Myers mobile battery service across every ZIP. Call or text (813) 501-7572.",
    ],
    included: [
      "Battery type matched to vehicle (AGM/EFB/flooded)",
      "Sealed-construction recommendation for coastal vehicles",
      "Charging-system voltage and ripple verification",
      "Smart-charging monitor reset",
      "Terminal clean and dielectric protection",
      "Hold-down torque to spec",
      "Old battery hauled and recycled",
    ],
    faqs: [
      {
        q: "How do I know if my Fort Myers truck has stop-start?",
        a: "Check for an A button with a circle-arrow (auto-stop disable) near the shifter. Also check the engine bay for a battery-monitor sensor on the negative cable. Either indicates stop-start and an EFB/AGM requirement.",
      },
      {
        q: "Why do my battery terminals corrode so fast in Fort Myers?",
        a: "Salt-laden humid air plus vented battery gases. Switch to a sealed AGM and use a corrosion-prevention spray on the terminals — corrosion will be near-zero.",
      },
      {
        q: "Can you cover Fort Myers Beach?",
        a: "Yes — Fort Myers Beach is part of our regular service area, same-day available.",
      },
      {
        q: "How long should an AGM battery last in Fort Myers?",
        a: "Typically 4–6 years with a healthy charging system, even in this climate. Flooded: 30–36 months. EFB: 36–48 months.",
      },
    ],
  },

  // ============================================================
  // STARTER
  // ============================================================
  {
    slug: "mobile-starter-repair",
    service: "Mobile Starter Repair",
    categoryId: "electrical",
    h1: "Mobile Starter Repair & Replacement in Lehigh Acres and Fort Myers",
    metaTitle:
      "Mobile Starter Repair in Lehigh Acres and Fort Myers | On-Site Starter Replacement",
    metaDescription:
      "Single click and no crank? Mobile starter replacement across Lehigh Acres and Fort Myers. Voltage-drop tested. Call (813) 501-7572.",
    intro:
      "Starter symptoms divide into three patterns: single click + no crank (solenoid contact failure), rapid clicking (battery or cable), and slow grinding crank (worn brushes or bushing failure). Each has a different root cause and a different fix; we test before we replace.",
    paragraphs: [
      "Single-click starter symptoms in Lehigh Acres and Fort Myers vehicles are most often pitted solenoid contacts — the heavy copper discs inside the starter solenoid that burn over thousands of starts. The classic test: tap the starter housing with a hammer while a helper holds the key in start; if it cranks, the solenoid contacts are pitted and the starter needs rebuild or replacement.",
      "Voltage-drop testing on the starter circuit is where DIY diagnosis usually fails. The cables and connections look fine, voltage at the battery is fine, but voltage at the starter under crank load drops below the 9.6V minimum for solenoid engagement. The problem is often a corroded ground strap or a high-resistance positive cable connection — not the starter at all.",
      "Heat-soak no-start is a common Lehigh Acres / Fort Myers starter complaint. The car starts fine cold; after a 20-minute drive and a 10-minute heat soak (engine off, exhaust radiating onto the starter), it won't restart. Cool the starter with a wet rag and it cranks. That's a heat-failed starter — internal solenoid windings have lost insulation integrity.",
      "Replacement starters need to match the OE spec exactly, including pinion tooth count, gear-reduction ratio, and mounting bolt pattern. 'Universal fit' starters that close-enough at a parts store often have wrong rotation timing and grind on engagement. We carry direct-fit OE-equivalent units.",
      "Same-day mobile starter service across both cities. Call or text (813) 501-7572.",
    ],
    included: [
      "Battery and ground-cable voltage-drop test",
      "Solenoid-contact diagnosis (the hammer test, properly done)",
      "Heat-soak no-start verification when applicable",
      "Direct-fit OE-equivalent starter selection",
      "Starter-circuit relay and ignition-switch test",
      "Post-install crank verification (voltage and current draw)",
      "Hauled-away core",
    ],
    faqs: [
      {
        q: "Could it be the ignition switch instead of the starter?",
        a: "Yes — especially on vehicles 10+ years old. A worn ignition switch can fail to send the start signal. We test the start-circuit voltage at the solenoid before condemning the starter.",
      },
      {
        q: "What's a starter relay and could it be the problem?",
        a: "Most modern vehicles use a relay (often the 'starter' or 'ST' relay in the underhood fuse box) to handle the high-current path. A failed relay produces identical no-crank symptoms; we swap-test before replacing the starter.",
      },
      {
        q: "How long does a starter last in Florida?",
        a: "Typically 100,000–180,000 miles in this climate. Heat shortens life vs. cooler climates by maybe 15–20%.",
      },
      {
        q: "Can you do a starter on a car that won't move?",
        a: "Yes — starter replacement is mobile-friendly. We work in driveways, parking lots, and roadside as long as we can safely lift one corner.",
      },
    ],
  },

  // ============================================================
  // VEHICLE / ENGINE DIAGNOSTICS
  // ============================================================
  {
    slug: "mobile-vehicle-diagnostics",
    service: "Mobile Vehicle Diagnostics",
    categoryId: "engine",
    h1: "Mobile Vehicle Diagnostics in Lehigh Acres and Fort Myers",
    metaTitle:
      "Mobile Car Diagnostics in Lehigh Acres and Fort Myers | OBD-II Scan & Drivability Testing",
    metaDescription:
      "Mobile vehicle diagnostics across Lehigh Acres and Fort Myers — bidirectional scan tools, live data, mode-6 testing. Call (813) 501-7572.",
    canonical: "https://mikesmautorepair.com/vehicle-diagnostics",
    intro:
      "A check-engine code is a starting point, not a diagnosis. P0420 means 'catalyst efficiency below threshold' — that's the symptom. The cause might be a failed catalytic converter, a lazy upstream O2 sensor, an exhaust leak before the cat, an ignition misfire fouling the cat, or a fueling issue burning rich. Five very different repairs, all from one code.",
    paragraphs: [
      "Real diagnostics across Lehigh Acres and Fort Myers means using OBD-II Mode 6 data (the on-board test results the ECU runs continuously) to see how close each monitored system is to its threshold. A P0420 with catalyst monitor at 0.78 (threshold 0.45) tells a different story than the same code with catalyst monitor at 0.46. The first is a marginal sensor; the second is a dying catalyst.",
      "Live-data freeze-frame data from the moment the code set is the next layer. RPM, load, coolant temp, short-term and long-term fuel trims, speed, throttle position — all captured at code-set. That snapshot tells you whether the fault occurred at idle, cruise, full throttle, cold, or hot. We don't recommend a repair without reviewing freeze frame.",
      "Bidirectional control is what separates a $200 scan tool from real diagnostic equipment. We can command individual injectors off to identify a misfiring cylinder, command the EVAP solenoid to test for leaks, command the ABS module to cycle individual wheel modulators, and command transmission solenoids to verify mechanical function. None of that is possible with a code reader.",
      "Mode-6 emission monitor data tells us readiness status for state inspection in advance — useful before tag renewal. We also pull pending codes (faults that haven't matured to MIL-on yet) which often catch problems early enough to avoid a tow.",
      "Diagnostic appointments across Lehigh Acres and Fort Myers run $80–$150 and are credited toward any repair. Call or text (813) 501-7572.",
    ],
    included: [
      "All-module scan (engine, ABS, SRS, BCM, transmission, HVAC)",
      "Mode-6 monitor data and freeze-frame review",
      "Bidirectional component testing (injectors, solenoids, actuators)",
      "Pending-code retrieval",
      "Live-data analysis (fuel trims, sensor outputs, misfire counters)",
      "Written diagnostic findings with photo documentation",
      "Diagnostic fee credited toward repair",
    ],
    faqs: [
      {
        q: "Why do I need a real diagnostic instead of a parts-store free scan?",
        a: "A free scan reads a code and gives you a parts list. Real diagnosis identifies which of those parts is actually failing and why. Customers who go the parts-store route often spend $400+ on the wrong parts before paying for proper diagnosis.",
      },
      {
        q: "What's Mode 6?",
        a: "OBD-II Mode 6 is the continuous on-board test data the ECU records — like seeing the test results, not just the pass/fail summary. Lets us catch failures before they trigger a code, and quantify how marginal a passing system actually is.",
      },
      {
        q: "Can you diagnose intermittent issues?",
        a: "Sometimes — depends on the symptom. We can leave a data logger on the vehicle for a customer to capture an intermittent event, then review the data on follow-up. Quoted separately.",
      },
      {
        q: "Will my diagnostic cost apply to the repair?",
        a: "Yes — the full diagnostic fee credits toward any repair we perform on the same visit.",
      },
    ],
  },
  {
    slug: "vehicle-diagnostics",
    service: "Vehicle Diagnostics",
    categoryId: "engine",
    h1: "Vehicle Diagnostics in Lehigh Acres and Fort Myers",
    metaTitle: "Vehicle Diagnostics in Lehigh Acres and Fort Myers | Mobile OBD-II & Live Data",
    metaDescription:
      "Mobile vehicle diagnostics across Lehigh Acres and Fort Myers — bidirectional scan tools, mode-6 data, scope work. Call (813) 501-7572.",
    intro:
      "Three of every four 'diagnose my check engine light' calls we take across Lehigh Acres and Fort Myers ultimately involve the diagnosis being different from what a parts-store free scan suggested. A real diagnostic doesn't read codes — it interprets them, in context, with live data and bidirectional testing.",
    paragraphs: [
      "Fuel-trim analysis is a core diagnostic skill that doesn't involve any code at all. Long-term fuel trims (LTFT) above +10% indicate a lean condition the ECU is compensating for — vacuum leak, weak fuel pump, dirty MAF, restricted injector. Below -10% indicates rich — leaking injector, stuck-open EVAP purge, contaminated O2 sensor. We read trims at idle and at 2500 RPM cruise and triangulate from there.",
      "Misfire counters by cylinder are stored in the ECU and accessible through the scan tool — even if no misfire code has set. A single cylinder showing 30 misfires per 1000 cycles is well below the threshold for a P030X code, but it points at a specific coil, plug, or injector to investigate before the misfire matures.",
      "Network communication faults — U-codes — are increasingly common on 10+ year old vehicles in Lehigh Acres and Fort Myers. A failed module, broken CAN-bus wire, or corrupted firmware can disable multiple systems and produce confusing symptoms (no-start, no dash, won't shift). We pull all-module scans on every diagnostic so U-codes don't get missed.",
      "Scope work is reserved for the harder cases — verifying ignition coil primary waveform, checking fuel injector pulse-width and current ramp, capturing crankshaft position sensor signal at no-start. Most diagnostics don't need a scope, but the few that do can't be solved without one.",
      "Service across all of Lehigh Acres and Fort Myers. Call or text (813) 501-7572.",
    ],
    included: [
      "Fuel-trim analysis at idle and cruise",
      "Per-cylinder misfire counter review",
      "All-module scan with U-code retrieval",
      "Live data graphing (multiple parameters at once)",
      "Bidirectional output tests where applicable",
      "Scope work for ignition and injector waveforms when needed",
      "Written report with diagnosis and recommended repair",
    ],
    faqs: [
      {
        q: "What's a fuel trim and why does it matter?",
        a: "How much extra (or less) fuel the ECU is adding to maintain stoichiometric mixture. Above +10% means the engine is running lean and the ECU is compensating. Below -10% means rich. Either is a flag for upstream investigation regardless of any active code.",
      },
      {
        q: "What's a U-code?",
        a: "Network communication fault between modules. U-codes often produce dramatic symptoms (no-start, no dash, transmission won't shift) and require all-module scanning to identify the failed node.",
      },
      {
        q: "Can you diagnose hybrids and EVs?",
        a: "Most hybrids yes — including Toyota, Honda, Ford. EV high-voltage diagnostics are limited to certain platforms; we'll confirm coverage at booking.",
      },
      {
        q: "How long does a diagnostic take?",
        a: "Typical: 60–90 minutes including scan, live data review, and written findings. Complex intermittent cases can require a follow-up.",
      },
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
      "Mobile vehicle diagnostics in Lehigh Acres, FL — Mode-6 data, bidirectional scan, live data graphing. Call (813) 501-7572.",
    intro:
      "Most Lehigh Acres check-engine calls fall into a small handful of code families: P0420 (catalyst efficiency), P0171/P0174 (system lean), P0300-series (misfire), P0440-series (EVAP leak), and P0700-series (transmission). Each family has typical real-world causes specific to the vehicle, and pattern recognition speeds the diagnosis.",
    paragraphs: [
      "P0420 catalyst codes on common Lehigh Acres vehicles (Camry, Civic, Altima, Corolla) at 130,000+ miles are real catalyst failures more often than sensor failures. The original-equipment catalysts wear out from heat cycling. We confirm with downstream O2 sensor activity — a healthy downstream O2 reads near steady; a failing cat lets the downstream signal start mimicking the upstream, and the threshold is breached.",
      "P0171/P0174 lean codes in Lehigh Acres vehicles are usually intake-side: a torn PCV hose, a cracked intake boot after the MAF, or a leaking EVAP purge solenoid letting unmeasured air into the manifold. We smoke-test the intake on every lean-code diagnosis to find the leak directly rather than guessing.",
      "P0300 random-misfire codes in older Lehigh Acres vehicles (10+ years) are most often coil packs or spark plugs at end of life — Florida humidity is hard on coil insulation and platinum plugs degrade by 60,000-80,000 miles. Cylinder-specific misfire codes (P0301, P0302, etc) point at the individual coil, plug, or injector for that cylinder.",
      "P0440-series EVAP codes are easy to misdiagnose because the leak is rarely visible. We pressurize the EVAP system with smoke and watch for emissions at the gas cap, the canister vent valve, the purge solenoid, and the fuel filler neck. Most EVAP leaks turn out to be a $20 gas cap or a $40 vent valve — but only if we identify which.",
      "Diagnostic appointments in Lehigh Acres run $80–$150 and credit toward any repair. Call or text (813) 501-7572.",
    ],
    included: [
      "Code family pattern matching by vehicle and miles",
      "Smoke-test for intake and EVAP leaks",
      "Catalyst efficiency verification with downstream O2 graphing",
      "Per-cylinder misfire counter review",
      "Network and module scanning (engine, trans, ABS, BCM)",
      "Repair quote with parts and labor up front",
      "Diagnostic fee applied to repair",
    ],
    faqs: [
      {
        q: "Will resetting the code make it pass inspection?",
        a: "Florida doesn't require emissions inspection for tag renewal, so this is rarely an issue here. But: clearing a code resets the readiness monitors, and they take 50-200 miles of varied driving to re-set. The light usually returns once the underlying problem reappears.",
      },
      {
        q: "Can you diagnose ABS and airbag lights?",
        a: "Yes — full chassis-wide diagnostics across all modules on most makes.",
      },
      {
        q: "What if the light is intermittent?",
        a: "We can pull pending codes (set but not yet matured to MIL) and freeze-frame data from any past code. For truly intermittent issues we can leave a data logger on the vehicle to capture the next event.",
      },
      {
        q: "Same day in Lehigh Acres?",
        a: "Almost always.",
      },
    ],
  },
  {
    slug: "diagnostics",
    service: "Mobile Vehicle Diagnostics",
    categoryId: "engine",
    h1: "Mobile Vehicle Diagnostics in Lehigh Acres and Fort Myers",
    metaTitle: "Mobile Vehicle Diagnostics in Lehigh Acres and Fort Myers | Real OBD-II Testing",
    metaDescription:
      "Mobile diagnostics across Lehigh Acres and Fort Myers. Mode-6, freeze-frame, smoke-test. Call (813) 501-7572.",
    canonical: "https://mikesmautorepair.com/diagnostics",
    intro:
      "Diagnostic accuracy comes from layering tests, not from a single tool. Code → freeze frame → live data → bidirectional command → physical inspection. Each layer narrows the cause; skipping a layer is how shops misdiagnose.",
    paragraphs: [
      "Layer one: code data. The DTC tells us the symptom and which monitor flagged it. Useful starting point, never a final answer. We pull current codes, pending codes, history codes, and permanent codes (the EPA-mandated hard-to-erase set on 2010+ vehicles).",
      "Layer two: freeze frame. The conditions at the moment the code set — RPM, load, temp, fuel trims, speed, throttle position. Tells us whether the failure was at idle, cruise, full load, cold or hot. Indispensable for intermittent codes.",
      "Layer three: live data review with the vehicle running. Watching multiple parameters in real time catches relationships — for example, a MAF reading that doesn't match throttle position, or an O2 voltage that's stuck mid-band. Graphing is more useful than numbers alone for spotting trends.",
      "Layer four: bidirectional commands. Tell the EVAP purge to open and watch for vacuum. Disable an injector and watch RPM drop. Cycle an ABS modulator and feel the pedal pulse. These tests confirm whether a suspected component is mechanically functional.",
      "Layer five: physical inspection guided by data. Smoke-test the intake. Pressure-test the cooling system. Scope the ignition. Resistance-test a sensor. The data tells us where to look; the inspection tells us what's actually broken.",
      "Available across every Lehigh Acres and Fort Myers ZIP. Call or text (813) 501-7572.",
    ],
    included: [
      "Current, pending, history, and permanent code retrieval",
      "Freeze-frame data review",
      "Multi-parameter live-data graphing",
      "Bidirectional component command testing",
      "Physical inspection guided by diagnostic data",
      "Written report with cause, recommended repair, and quote",
      "Diagnostic fee credited toward repair",
    ],
    faqs: [
      {
        q: "What's a permanent code?",
        a: "A DTC that can only be cleared by the ECU after the underlying fault has been resolved and verified through driving cycles. Introduced on 2010+ vehicles to prevent emission cheating by clearing codes before inspection.",
      },
      {
        q: "Can you diagnose an intermittent shifting issue?",
        a: "Often, yes — through transmission live data (line pressure, gear ratio errors, solenoid commands). Some intermittent issues require a logger to capture the event in real-world driving.",
      },
      {
        q: "Will the diagnostic damage my car?",
        a: "No. Reading data and running commanded tests is non-invasive. We don't cycle anything that can hurt the vehicle.",
      },
      {
        q: "How fast can you respond?",
        a: "Same-day across Lehigh Acres and Fort Myers is standard.",
      },
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
      "Mobile engine diagnostics in Fort Myers, FL. Misfire isolation, fuel-trim analysis, EVAP smoke testing. Call (813) 501-7572.",
    intro:
      "A flashing check-engine light in Fort Myers means active misfire. Drive on it and the unburned fuel washes the catalyst — a $30 ignition coil becomes a $1,800 catalyst job in under 100 miles. We diagnose flashing-MIL situations same-day and prioritize them.",
    paragraphs: [
      "Misfire isolation by cylinder is straightforward with a modern scan tool — the ECU keeps individual misfire counters per cylinder. Cylinder #4 with 800 misfires versus cylinders #1, #2, #3 at zero is a clear pointer at the #4 coil, plug, or injector. We swap-test by moving suspect parts to a known-good cylinder and watching whether the misfire moves with them.",
      "Misfire root causes in Fort Myers vehicles, in approximate order of frequency: failing ignition coil (most common, especially on coil-on-plug systems past 80,000 miles), worn spark plug (overdue service interval), dirty or leaking injector, vacuum leak on a single intake runner, failing oxygen sensor causing wrong fueling, low compression on the affected cylinder. We test in that order.",
      "Fuel-trim analysis catches a lot of Fort Myers no-MIL drivability complaints. Long-term trims at idle versus at cruise tell us whether the issue is unmetered air entering after the MAF (idle-only trim deviation) or a fueling issue across the operating range (uniform trim deviation). The diagnosis path forks based on that data.",
      "EVAP small-leak codes (P0442, P0455, P0456) account for a meaningful share of Fort Myers MIL calls. The fix is usually inexpensive — gas cap, vent valve, purge solenoid — but only if we find the actual leak with smoke testing instead of replacing parts speculatively.",
      "Diagnostic appointments in Fort Myers credit toward repair. Call or text (813) 501-7572.",
    ],
    included: [
      "Per-cylinder misfire isolation and swap-testing",
      "Coil, plug, injector, and compression testing as needed",
      "Fuel-trim analysis at idle and cruise",
      "EVAP smoke test for small-leak codes",
      "All-module scan with pending and permanent codes",
      "Written diagnosis with photos of identified issues",
      "Diagnostic fee credited toward repair",
    ],
    faqs: [
      {
        q: "How urgent is a flashing check-engine light?",
        a: "Very. Flashing MIL means active misfire and ongoing catalyst damage. Pull over at the next safe spot and call. Same-day diagnosis is the norm in Fort Myers.",
      },
      {
        q: "Can a bad gas cap really cause a check-engine light?",
        a: "Yes — modern EVAP systems test for vapor leaks down to 0.020 inch, and a gas cap that doesn't seal properly will trigger P0455 or P0456 codes. Always one of the first things we check on EVAP codes.",
      },
      {
        q: "Why does my engine run rough only sometimes?",
        a: "Most common: temperature-related — a coil that fails when hot but works cold, or vice versa. We can capture freeze-frame data from past events and often diagnose without waiting for the symptom to recur.",
      },
      {
        q: "Same-day in Fort Myers?",
        a: "Yes — diagnosis is one of our most common same-day Fort Myers services.",
      },
    ],
  },
  {
    slug: "engine-diagnostics-lehigh-acres-fl",
    service: "Engine Diagnostics",
    citySlug: "lehigh-acres",
    categoryId: "engine",
    h1: "Mobile Engine Diagnostics in Lehigh Acres, FL",
    metaTitle: "Engine Diagnostics in Lehigh Acres, FL | Mobile Check-Engine-Light Testing",
    metaDescription:
      "Mobile engine diagnostics in Lehigh Acres, FL. Compression testing, leak-down, scope work. Call (813) 501-7572.",
    intro:
      "Engine drivability complaints in Lehigh Acres usually fall into one of three categories: hesitation (bad acceleration response), surging (RPM hunting at steady throttle), or rough idle (uneven engine speed at stop). Each has a distinct diagnostic path; we don't shotgun parts.",
    paragraphs: [
      "Hesitation under throttle in Lehigh Acres vehicles is almost always one of: a lazy or contaminated MAF sensor, a failing throttle position sensor, dirty injectors restricting spray pattern, or an EGR valve stuck partially open. We test in that order using live-data trends — MAF reading versus expected for the throttle position is the quickest tell.",
      "Surging at steady cruise is usually closed-loop fueling instability — the O2 sensors are sending erratic signals and the ECU is over-correcting. Common causes: a lazy upstream O2 (slow-responding), a small intake or vacuum leak that's most obvious at low load, or an EVAP purge solenoid stuck partially open. Scope work on the O2 voltage signal makes the diagnosis fast.",
      "Rough idle in Lehigh Acres trucks past 100,000 miles is frequently a vacuum leak — cracked intake hoses, deteriorated PCV grommets, or a torn brake-booster diaphragm. Smoke-testing the intake makes the leak visible directly. Less common but real: a single dead cylinder from a failed coil or a burned exhaust valve.",
      "Compression and leak-down testing get pulled out for the harder cases — a misfiring cylinder that doesn't respond to coil/plug/injector swap, or a no-start with no obvious cause. A 30% leak-down on a single cylinder points at a valve issue; uniform low compression across all cylinders points at a timing chain stretch.",
      "Diagnostic appointments in Lehigh Acres run $80–$150 and credit toward repair. Call or text (813) 501-7572.",
    ],
    included: [
      "Drivability diagnosis (hesitation/surge/rough idle)",
      "Compression and leak-down testing when warranted",
      "MAF, TPS, O2 sensor live-data analysis",
      "Vacuum-leak smoke testing",
      "Scope work for ignition and injector waveforms",
      "Written diagnosis and parts/labor quote",
      "Diagnostic fee credited toward repair",
    ],
    faqs: [
      {
        q: "What's the difference between a misfire and a rough idle?",
        a: "A misfire is the ECU detecting that a cylinder didn't fire — it sets a code. A rough idle is the engine running unevenly without necessarily setting a misfire code; could be vacuum leak, EGR issue, or marginal fueling without a hard fault.",
      },
      {
        q: "When do you need compression testing?",
        a: "When other diagnostic data points at internal mechanical failure — persistent single-cylinder misfire that doesn't respond to coil/plug/injector swap, or a no-start with crank, fuel, and spark all confirmed present.",
      },
      {
        q: "Can you do timing-chain diagnosis in Lehigh Acres?",
        a: "Yes — chain stretch shows up as P0008/P0017 codes, lower-than-expected compression, or scan-tool cam-vs-crank correlation off-spec. We can confirm the issue and quote replacement separately.",
      },
      {
        q: "Same day diagnostics in Lehigh Acres?",
        a: "Yes — same-day diagnostic appointments are the norm here.",
      },
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
      "Mobile engine diagnostics across Lehigh Acres and Fort Myers — misfire isolation, compression testing, scope work. Call (813) 501-7572.",
    intro:
      "Engine diagnostics is mostly process-of-elimination guided by data. Codes set under specific conditions; live data narrows the cause; targeted testing confirms the failed component. Done in that order, the diagnosis is usually right the first time.",
    paragraphs: [
      "Compression testing tells us about the mechanical health of each cylinder. Healthy values cluster within 10% of each other and within 15% of factory spec. A single cylinder 25% low points at a valve, ring, or head-gasket issue depending on the wet-test response. We don't compression-test every drivability complaint — only when the data suggests internal failure.",
      "Cylinder leak-down testing is the next layer when compression is low. With the cylinder at TDC compression stroke and pressurized through the spark-plug hole, we listen for escape: at the intake (intake valve), at the exhaust (exhaust valve), at the dipstick (rings), at the radiator (head gasket). The location of escape identifies the exact failure.",
      "Scope work on ignition primary current ramps catches coil failures that don't quite trigger a misfire code. The current ramp shape tells us whether the coil's primary winding has degraded — a flat-topped ramp means weak coil, a normal saw-tooth means healthy. Same approach for injector pulse-width and current.",
      "EGR-related drivability issues in Florida vehicles are common because the system rarely sees long highway cleaning cycles in stop-and-go traffic. Carbon builds in the EGR passages, the valve sticks open or closed, and idle quality suffers. We can decarbon the EGR system on most vehicles as part of repair.",
      "Service across every Lehigh Acres and Fort Myers ZIP. Call or text (813) 501-7572.",
    ],
    included: [
      "Compression and cylinder leak-down testing",
      "Scope work on ignition and injectors",
      "EGR system carbon assessment and cleaning",
      "Vacuum-leak smoke testing",
      "Pre-purchase engine condition assessment",
      "Written report with photos and quote",
      "Diagnostic fee credited toward repair",
    ],
    faqs: [
      {
        q: "How accurate is compression testing for diagnosing internal engine issues?",
        a: "Very accurate when done with leak-down follow-up. Compression alone tells you a cylinder is weak; leak-down tells you exactly which sealing surface (valve, ring, gasket) is failing.",
      },
      {
        q: "Can you decarbon a direct-injection engine?",
        a: "Yes — direct-injection vehicles (most 2010+ Audi, BMW, Ford EcoBoost, GM, Hyundai) build intake-valve carbon because there's no fuel washing the back of the valve. Walnut blasting is the proper fix; we can perform on most platforms or refer to a partner shop for specialized cases.",
      },
      {
        q: "What does it mean if all cylinders have low compression?",
        a: "Usually timing chain stretch (cam timing retarded, valves opening late). Confirmed with cam-vs-crank correlation on the scan tool.",
      },
      {
        q: "Same day across both cities?",
        a: "Yes — diagnostics are one of our most common same-day jobs.",
      },
    ],
  },

  // ============================================================
  // NO-START
  // ============================================================
  {
    slug: "mobile-no-start-diagnostics",
    service: "Mobile No-Start Diagnostics",
    categoryId: "electrical",
    h1: "Mobile No-Start Diagnostics in Lehigh Acres and Fort Myers",
    metaTitle:
      "Mobile No-Start Diagnostics in Lehigh Acres and Fort Myers | Won't Crank or Won't Fire",
    metaDescription:
      "Won't crank or won't fire? Mobile no-start diagnostics across Lehigh Acres and Fort Myers — battery, starter, fuel, ignition, security. Call (813) 501-7572.",
    canonical: "https://mikesmautorepair.com/no-start-diagnostics",
    intro:
      "No-start splits into two distinct families: 'won't crank' (no engine rotation when the key is in start) and 'cranks but won't fire' (engine rotates but doesn't catch). Each has a completely different diagnostic path. The first 30 seconds of testing tells us which family we're in.",
    paragraphs: [
      "Won't-crank diagnosis starts at the battery (load test for usable cranking amps), then moves to the starter circuit (voltage at the solenoid during the start command), then to the start signal (does the key, switch, or push-button actually deliver a command to the relay), then to the relay itself, then to the starter. Each test takes seconds; the failure rarely takes more than 15 minutes to isolate.",
      "Cranks-but-won't-fire diagnosis follows the three-things-an-engine-needs framework: spark, fuel, compression. We verify each. Spark: pull a coil and check for spark to ground during crank. Fuel: check fuel-pressure with a gauge during crank — should read at or near spec. Compression: usually presumed if the engine cranks at normal speed and recently ran fine, otherwise verified with a compression gauge.",
      "Security/immobilizer is the one Lehigh Acres / Fort Myers no-start that often gets missed. The engine cranks normally, has spark, has fuel, but won't fire because the immobilizer hasn't authorized the start. Symptom is identical to a fueling or ignition problem unless you're looking for the security light flashing on the dash — which most diagnostic shortcuts skip.",
      "Crank-position sensor failures account for a significant share of cranks-but-won't-fire calls in this region. The sensor often fails heat-related — works cold, dies after the engine warms up, comes back after the sensor cools. We've seen vehicles towed three times before someone identified a heat-failed crank sensor.",
      "Same-day no-start service across all of Lehigh Acres and Fort Myers — these are priority calls. Call or text (813) 501-7572.",
    ],
    included: [
      "Battery, starter circuit, and start-signal verification",
      "Spark and fuel-pressure testing during crank",
      "Compression check if mechanically uncertain",
      "Immobilizer/security system status check",
      "Crank-position sensor signal verification (scope or scan tool)",
      "On-the-spot repair when parts are commonly carried",
      "Written diagnosis and quote for any follow-up parts",
    ],
    faqs: [
      {
        q: "I just need a jump — can you do that?",
        a: "Yes, we carry jump packs. But we also test the battery, alternator, and parasitic draw at the same time so you understand whether you need a new battery, a charging-system repair, or just a one-time jump.",
      },
      {
        q: "How long should diagnosis take?",
        a: "Won't-crank: usually 15–30 minutes to isolate. Cranks-won't-fire: 30–60 minutes depending on the failure mode. Security-related no-starts can run longer if module reprogramming is needed.",
      },
      {
        q: "Can you fix it on the spot?",
        a: "Most no-starts are repaired on the spot. Common spot-repaired items: battery, starter, alternator, ignition coil, crank sensor, fuel-pump relay. Some failures (fuel pump in tank, immobilizer module) need follow-up parts.",
      },
      {
        q: "What if my car is at home and won't start?",
        a: "Perfect — that's exactly what mobile no-start diagnostics are for. We come to your driveway across all of Lehigh Acres and Fort Myers.",
      },
    ],
  },
  {
    slug: "no-start-diagnostics",
    service: "No-Start Diagnostics",
    categoryId: "electrical",
    h1: "No-Start Diagnostics in Lehigh Acres and Fort Myers",
    metaTitle: "No-Start Diagnostics in Lehigh Acres and Fort Myers | Mobile Won't-Start Service",
    metaDescription:
      "Mobile no-start diagnostics across Lehigh Acres and Fort Myers — won't crank, won't fire, intermittent. Call (813) 501-7572.",
    intro:
      "Three diagnostic facts solve most no-start cases in under an hour: cranking voltage at the starter, fuel pressure during crank, and spark presence during crank. With those three numbers, we can isolate which system has failed — and most of them are repairable on site.",
    paragraphs: [
      "Cranking voltage at the starter motor (not at the battery) under load tells us whether the starter is being properly fed. Below 9.6V at the solenoid during crank means a battery, cable, or connection problem upstream. Above 10.5V with no engine rotation means the starter itself or the ignition switch is the issue.",
      "Fuel pressure during crank should read at or near manufacturer spec — typically 40-60 psi for port-injected gasoline engines, 800-2200 psi for direct injection. Zero pressure during crank: dead fuel pump, blown fuel-pump fuse, or failed fuel-pump relay. Pressure that rapidly bleeds off after key-off: failed fuel-pressure regulator or leaking injector.",
      "Spark verification: pull one coil-on-plug or one plug wire, ground the plug to a clean engine surface, crank the engine. Visible blue spark means ignition system is functional. No spark or weak yellow spark points at coil, ignition control module, or — for cranks-but-no-spark — most often the crankshaft position sensor.",
      "If all three (voltage, fuel, spark) are present and the engine still won't fire, the path narrows quickly to: timing-chain skipped (cam-vs-crank correlation off), security/immobilizer block, or — rarest — internal mechanical failure like jumped timing belt or hydrolocked cylinder.",
      "Priority same-day service. Call or text (813) 501-7572.",
    ],
    included: [
      "Cranking-voltage measurement at the starter",
      "Fuel-pressure testing during crank",
      "Spark verification at the coil/wire",
      "Cam-vs-crank correlation check (scan tool)",
      "Immobilizer status check",
      "On-site repair when parts are common-carry",
      "Written diagnosis and quote",
    ],
    faqs: [
      {
        q: "What's the most common no-start cause in Florida?",
        a: "Battery, by a wide margin — heat shortens battery life and sneaks up. Second most common: failed crank position sensor (heat-related failure). Third: failed fuel-pump relay.",
      },
      {
        q: "Why does my car start sometimes but not others?",
        a: "Most often: a heat-failed component (crank sensor, fuel-pump relay, ignition switch). The part works when cool, fails when hot. We can capture freeze-frame data from a past failure to confirm.",
      },
      {
        q: "What if you can't fix it on site?",
        a: "We coordinate towing if needed. Honest answer: about 80% of no-starts get repaired on the spot.",
      },
      {
        q: "Available across both cities?",
        a: "Yes — same-day no-start response across all of Lehigh Acres and Fort Myers.",
      },
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
      "The starting-and-charging triangle: battery, alternator, starter. A failure in any one looks like a failure in the others, which is why misdiagnosis is so common. Test all three before condemning any one.",
    paragraphs: [
      "Battery condition is measured in cold-cranking-amp output under load — not voltage. A 12.6V resting battery looks fine but may produce only 50% of its rated CCA output, which is not enough to start a hot engine. Carbon-pile or electronic load testers (we carry both) measure actual usable capacity.",
      "Alternator condition is measured by output voltage at idle (should be 13.8V minimum), output under full electrical load (lights, AC, defroster on — should hold 13.5V minimum), and AC ripple (should be under 50 mV). A pass on voltage but a fail on ripple means the diode rectifier is failing and will kill the next battery.",
      "Starter condition is measured by current draw during crank — typically 150-250 amps for a healthy small-engine starter, 300-450 for a large V8. High draw means worn brushes or armature; low draw with no rotation means ignition-side or circuit problem upstream.",
      "Cabling and grounds are the system's hidden weak point. A corroded battery cable, a failing engine-to-chassis ground strap, or a high-resistance starter solenoid lead can mimic any of the three component failures. Voltage-drop testing isolates these in minutes.",
      "We test all three components plus cabling on every starting-and-charging call across Lehigh Acres and Fort Myers. Same-day service standard. Call or text (813) 501-7572.",
    ],
    included: [
      "Battery CCA load test",
      "Alternator output and ripple measurement",
      "Starter current-draw test",
      "Voltage-drop on charge cable, ground strap, and start circuit",
      "Battery monitor reset (smart-charging vehicles)",
      "Replacement part matched to OE spec",
      "Post-install full-system verification",
    ],
    faqs: [
      {
        q: "How do I know which one is bad?",
        a: "You don't — the symptoms overlap. We test all three and the cabling. Diagnosis time: usually 30 minutes start to finish.",
      },
      {
        q: "Can I just replace the battery and see?",
        a: "You can, but if the alternator is the actual problem, the new battery dies in days. If the starter is the issue, replacing the battery solves nothing. Test first, replace second.",
      },
      {
        q: "What's the typical service life of each?",
        a: "Battery: 30–48 months in Florida. Alternator: 7–10 years. Starter: 100,000–180,000 miles. All shortened by heat and by frequent short trips.",
      },
      {
        q: "Same-day in both cities?",
        a: "Yes — these are priority no-start calls.",
      },
    ],
  },

  // ============================================================
  // OIL CHANGES
  // ============================================================
  {
    slug: "mobile-oil-change",
    service: "Mobile Oil Change",
    categoryId: "oil-fluids",
    h1: "Mobile Oil Change Service in Lehigh Acres and Fort Myers",
    metaTitle:
      "Mobile Oil Change in Lehigh Acres and Fort Myers | At Your Home or Office",
    metaDescription:
      "Conventional, blend, and full synthetic mobile oil changes across Lehigh Acres and Fort Myers. Multi-point inspection included. Call (813) 501-7572.",
    intro:
      "An oil change is a 25-minute service that, done wrong, costs you a $5,000 engine. Wrong viscosity, wrong specification, missed fill level, double-stacked filter gaskets — those are the actual mistakes that destroy engines. We do the boring fundamentals correctly every time.",
    paragraphs: [
      "Oil specification matters as much as viscosity. Modern engines often require oils with specific OEM approvals — VW 502 00, Mercedes 229.5, GM dexos1 Gen 3, Ford WSS-M2C946-B1. Using a 'meets manufacturer requirements' oil that doesn't actually carry the approval can cause turbo failure, timing chain wear, or LSPI (low-speed pre-ignition) on direct-injected engines. We verify the spec before we pour.",
      "Filter quality determines how well the oil stays clean between services. A bypass-valve filter at the wrong opening pressure dumps unfiltered oil into the engine the moment the filter restricts. We use OEM or premium aftermarket filters with the correct bypass setting and the correct anti-drainback valve to prevent dry-start wear.",
      "Drain-plug and crush-washer integrity matters. A reused crush washer leaks slowly; a stripped drain plug leaks fast. We replace the crush washer on every oil change and torque the drain plug to manufacturer spec — most are 18-25 ft-lbs, not 'as tight as you can get it.'",
      "Full multi-point inspection is included on every oil change in Lehigh Acres and Fort Myers — brake pad measurement, tire tread depth, belt and hose condition, coolant level and condition, battery state-of-health, and a check of all under-hood fluids. The point isn't to upsell you; it's to give you advance warning before something becomes a roadside breakdown.",
      "Service available across every Lehigh Acres and Fort Myers ZIP. Most appointments take 30 minutes. Call or text (813) 501-7572.",
    ],
    included: [
      "OEM-approved oil for the specific vehicle (verified, not assumed)",
      "OEM or premium aftermarket filter",
      "New crush washer; drain plug torqued to spec",
      "Multi-point inspection (brakes, tires, belts, hoses, fluids)",
      "Service-light reset on most makes",
      "Used oil and filter recycled at no charge",
      "Service record for resale and warranty",
    ],
    faqs: [
      {
        q: "Why does the wrong oil specification matter?",
        a: "Modern engines have very tight tolerances and specific additive packages they need (turbo bearing protection, LSPI prevention on direct injection, timing chain wear additives). Wrong-spec oil can cause real engine damage even if the viscosity is correct.",
      },
      {
        q: "How long can I go between oil changes?",
        a: "Conventional: 3,000-5,000 miles. Synthetic blend: 5,000-7,500. Full synthetic: 7,500-10,000 (some up to 15,000 with manufacturer extended-drain interval). Severe service (heat, short trips, towing) — cut all those by 25%, which is most Lehigh Acres / Fort Myers driving.",
      },
      {
        q: "Do you do diesel oil changes?",
        a: "Yes — including light-duty diesels (Cummins, Duramax, Powerstroke) with the correct heavy-duty engine oil and capacity quote.",
      },
      {
        q: "What's the price?",
        a: "Conventional from $65, blend from $80, full synthetic from $95-$130 depending on capacity. Diesel quoted by capacity.",
      },
    ],
  },
  {
    slug: "oil-change",
    service: "Mobile Oil Change",
    categoryId: "oil-fluids",
    h1: "Mobile Oil Change in Lehigh Acres and Fort Myers",
    metaTitle: "Mobile Oil Change in Lehigh Acres and Fort Myers | At Your Home or Office",
    metaDescription:
      "Mobile oil change at your driveway across Lehigh Acres and Fort Myers. OEM-spec oils and filters. Call (813) 501-7572.",
    canonical: "https://mikesmautorepair.com/oil-change",
    intro:
      "Florida heat is hard on engine oil. The same 5W-30 that lasts 7,500 miles in Vermont breaks down 1,000-2,000 miles sooner here because the oil sees more time at high operating temperature. Following the severe-service interval — not the normal interval — is the right call in this climate.",
    paragraphs: [
      "Severe-service intervals are listed in every owner's manual under conditions including: 'frequent short trips,' 'consistent operation in temperatures over 90°F,' 'idling in stop-and-go traffic.' Lehigh Acres and Fort Myers driving meets all three. The recommended severe-service interval is typically 25-40% shorter than the normal interval.",
      "Modern oils are formulated with an additive package that depletes over time. The base oil might still look clean at 8,000 miles, but the detergent, anti-wear, and friction-modifier additives are spent. The result: piston-deposit accumulation, increased ring wear, and (on direct-injected engines) intake-valve carbon buildup. Following the interval matters even when the oil looks fine.",
      "Synthetic versus conventional is mostly a question of how long the additive package lasts under heat. Synthetic base stocks resist thermal breakdown; conventional doesn't. For Florida-driven vehicles, full synthetic is usually the right call even when the manufacturer permits conventional.",
      "Oil-filter selection matters more than the brand on the box. Filter media (synthetic versus cellulose), bypass-valve opening pressure, and anti-drainback valve quality all affect engine wear. We use OEM or top-tier aftermarket — not bargain filters that compromise on media or valve quality.",
      "Service across every Lehigh Acres and Fort Myers ZIP. Call or text (813) 501-7572.",
    ],
    included: [
      "Full synthetic, blend, or conventional per vehicle spec",
      "OEM or premium aftermarket filter",
      "Severe-service interval guidance",
      "All under-hood fluid inspection and top-off",
      "Tire pressure check and adjustment",
      "Service light reset",
      "Used oil recycled responsibly",
    ],
    faqs: [
      {
        q: "Should I follow the maintenance-minder or the severe-service interval?",
        a: "Maintenance minders use algorithms based on driving conditions — generally accurate for Florida. If the minder hits before your mileage interval, follow the minder. If you do mostly short trips, severe-service interval is safer.",
      },
      {
        q: "Why does my engine consume oil between changes?",
        a: "Some consumption is normal (manufacturer specs allow up to 1 quart per 1,000 miles on many engines). Excessive: typically piston-ring wear or valve-stem-seal degradation. We can confirm with a compression and leak-down test if you're concerned.",
      },
      {
        q: "Do you stock European-spec oils?",
        a: "Yes — we carry VW/Audi 502 00 / 504 00, Mercedes 229.5 / 229.51, BMW LL-04, Porsche A40 spec oils for direct-fit applications.",
      },
      {
        q: "How long does it take?",
        a: "Most oil changes are 25-30 minutes including multi-point inspection.",
      },
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
      "Mobile oil change in Lehigh Acres, FL — full synthetic, blend, or conventional. Multi-point inspection. Call (813) 501-7572.",
    intro:
      "Most Lehigh Acres oil-change customers we pick up after a chain shop have one of three problems waiting: wrong viscosity for the vehicle, wrong specification (no OEM approval), or overfilled by 0.5-1 quart. Those mistakes are how a quick-lube saves five minutes and costs you a turbo.",
    paragraphs: [
      "Overfilling is the most common chain-shop error we find. A vehicle that takes 5.7 quarts gets 6.0 because the tech rounded up — sounds harmless, but high oil level reaches the crankshaft at idle, gets foamed by the rotating crank, and the engine starts seeing aerated oil at the bearings. Symptoms: oil-pressure light flicker, eventual bearing wear. We measure capacity to the tenth of a quart.",
      "Wrong-viscosity oil is the second-most-common mistake. A modern engine specifying 0W-20 with a 5W-30 in the sump runs higher oil pressure, slower oil flow at startup, and (on engines with variable-valve-timing using oil pressure as actuation) erratic VVT behavior. Symptoms can be subtle: hesitation under throttle, MIL with a P0011 or P0014 code.",
      "Wrong-specification oil is the sneakiest. The viscosity is right and the brand is reputable, but the oil doesn't carry the manufacturer's specific approval (dexos1, 502 00, 229.5, etc.). Direct-injected gasoline engines using non-approved oil can experience LSPI (low-speed pre-ignition) — a destructive event that breaks pistons. Approved oils are formulated to prevent it.",
      "Every Lehigh Acres oil change we perform verifies the OEM-approved oil and filter spec for the specific vehicle, measures capacity to the tenth, includes new crush washer, and torques the drain plug to manufacturer ft-lbs. Those four steps eliminate the most common chain-shop failure modes.",
      "Service across all six Lehigh Acres ZIPs. Same-day available. Call or text (813) 501-7572.",
    ],
    included: [
      "Verified OEM-approved oil and filter for the specific vehicle",
      "Capacity measured to the tenth of a quart",
      "New crush washer and torque-to-spec drain plug",
      "Multi-point inspection (brakes, belts, fluids, tires)",
      "Tire pressure adjustment",
      "Service light reset on most makes",
      "Recycled oil and filter at no charge",
    ],
    faqs: [
      {
        q: "Why is my Lehigh Acres oil change pricier than a quick-lube?",
        a: "We use OEM or top-tier aftermarket filters and OEM-spec oil. Quick-lubes often substitute. Over the life of the engine, the difference matters; on a single oil change, it's usually $15-30.",
      },
      {
        q: "How often should I change oil in Lehigh Acres?",
        a: "Severe-service interval — most synthetic-oil vehicles every 5,000-7,500 miles, conventional every 3,000-4,000. The heat and short trips here justify shorter intervals than the manual's 'normal' schedule.",
      },
      {
        q: "Can you do larger trucks and diesels in Lehigh Acres?",
        a: "Yes — heavy-duty pickups, work vans, and light-duty diesels are routine. Capacity quoted by vehicle.",
      },
      {
        q: "Will you remind me when I'm due?",
        a: "Yes — we text a reminder based on your mileage and oil type used.",
      },
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
      "Mobile oil change in Lehigh Acres, FL. OEM-spec oils, dealer-grade filters, multi-point inspection. Call (813) 501-7572.",
    intro:
      "If you drive a 2014-or-newer car in Lehigh Acres, your engine almost certainly has direct injection — and direct-injected engines have specific oil requirements that most quick-lubes don't follow. Wrong oil here doesn't just mean shortened service life; it can mean a broken piston from LSPI.",
    paragraphs: [
      "Low-speed pre-ignition (LSPI) is a real phenomenon on small-displacement turbocharged direct-injected engines — Ford EcoBoost, GM 1.4T/2.0T, Hyundai 1.6T/2.0T, Honda 1.5T, etc. Under high load at low RPM, the air-fuel mixture can self-ignite before the spark plug fires, producing a destructive pressure spike that can break pistons and connecting rods. The cure is oils formulated specifically to suppress LSPI — typically those carrying dexos1 Gen 3, GF-6, or specific OEM approvals.",
      "Direct-injected engines also build carbon on the back of intake valves because, unlike port injection, no fuel washes the valve. Quality oil with low Noack volatility (resistant to evaporating into the intake) reduces but doesn't eliminate this. Walnut-blast cleaning every 60,000-80,000 miles is the proper preventive — we can perform this on most platforms.",
      "Turbocharged engines need oil that resists thermal breakdown at the turbo center-section, where temperatures routinely exceed 400°F at engine-off heat soak. Synthetic base stocks handle this; conventional does not. Many turbo failures we diagnose trace back to conventional oil used in a turbo engine that specified synthetic.",
      "Lehigh Acres oil-change service includes verified OEM-approved oil for your vehicle, a quality filter, a new crush washer, drain-plug torque to spec, multi-point inspection, and service-light reset. No upsell scripts, no 'we found these other things' surprise items.",
      "Same-day across all Lehigh Acres ZIPs. Call or text (813) 501-7572.",
    ],
    included: [
      "LSPI-rated oil for turbocharged direct-injected engines",
      "Synthetic base stock for any turbo or direct-injection engine",
      "OEM-approved oil verified by manufacturer specification",
      "Premium filter with proper bypass and anti-drainback valves",
      "Multi-point inspection",
      "Service light reset",
      "Recycled used oil",
    ],
    faqs: [
      {
        q: "What is LSPI and why does it matter?",
        a: "Low-speed pre-ignition — destructive abnormal combustion in turbocharged direct-injection engines under low-RPM high-load conditions. Modern oils with dexos1 Gen 3 or similar approvals are formulated to prevent it. Wrong oil = broken piston risk.",
      },
      {
        q: "Does my vehicle have direct injection?",
        a: "Most 2012-and-newer turbocharged engines and most 2014-and-newer naturally aspirated engines. We verify by VIN before recommending oil spec.",
      },
      {
        q: "Why do you charge more than a quick-lube?",
        a: "Verified-spec oil and a real filter cost more than no-name 5W-30 and a $4 filter. The difference matters on a $30,000+ vehicle.",
      },
      {
        q: "How long does the service take?",
        a: "About 30 minutes including the inspection.",
      },
    ],
  },
  {
    slug: "oil-change-fort-myers-fl",
    service: "Oil Change",
    citySlug: "fort-myers",
    categoryId: "engine",
    h1: "Mobile Oil Change in Fort Myers, FL",
    metaTitle: "Mobile Oil Change in Fort Myers, FL | At Your Driveway in 30 Minutes",
    metaDescription:
      "Mobile oil change in Fort Myers, FL. OEM-approved synthetic oils, dealer-grade filters, multi-point. Call (813) 501-7572.",
    intro:
      "Fort Myers stop-and-go on Colonial, US-41, and Daniels Parkway is among the harshest service Florida engines see — frequent thermal cycling, long idle times, short trips between cooled-off intervals. The severe-service interval, not the normal interval, is the right reference here.",
    paragraphs: [
      "Severe-service is defined in every owner's manual as some combination of: frequent short trips, sustained operation above 90°F, extended idling, dusty conditions. Fort Myers driving routinely meets at least three of those. The severe-service oil-change interval is typically 25-40% shorter than the normal interval.",
      "Idle time is harder on oil than miles. An engine idling in Fort Myers traffic at 80 RPM for 10 minutes accumulates the wear-equivalent of about 7 highway miles. Oil-life monitors on most modern vehicles factor this; if your maintenance-minder hits well before your mileage interval, that's why.",
      "Synthetic oils carry pour-point depressants and viscosity-index improvers that retain stability across the temperature range Florida engines see. Conventional oils lose viscosity faster at sustained high temperature and shear in turbocharger bearings sooner. Synthetic is the right choice for any Fort Myers vehicle with a turbo, direct injection, or stop-start.",
      "Filter quality is where chain shops cut margin. A budget filter with weak bypass-valve calibration or compromised filter media lets unfiltered oil through under cold-start or high-RPM conditions. We use OEM-grade filters that match the vehicle's design specifications.",
      "Same-day mobile oil change across every Fort Myers ZIP. Call or text (813) 501-7572.",
    ],
    included: [
      "Synthetic, synthetic blend, conventional, or diesel-rated oil",
      "OEM-grade filter with correct bypass and anti-drainback valves",
      "Multi-point inspection (brakes, tires, belts, hoses, battery)",
      "All under-hood fluid top-offs",
      "Tire pressure adjustment",
      "Service light reset on most makes",
      "Used oil recycled at no charge",
    ],
    faqs: [
      {
        q: "How short is too short for an oil-change interval in Fort Myers?",
        a: "We don't recommend going under 3,000 miles on conventional or 5,000 on synthetic in normal use. If your maintenance-minder commands shorter, follow the minder.",
      },
      {
        q: "Do I need synthetic?",
        a: "Strongly recommended in Fort Myers heat, especially for turbo and direct-injected engines. The cost difference per change is small; the engine-life benefit is substantial.",
      },
      {
        q: "Can you do my fleet trucks in Fort Myers?",
        a: "Yes — fleet routes are a regular part of our Fort Myers service. Volume pricing on 3+ vehicles.",
      },
      {
        q: "Will the multi-point inspection cost extra?",
        a: "No — inspection is included with every oil change.",
      },
    ],
  },

  // ============================================================
  // SUSPENSION
  // ============================================================
  {
    slug: "mobile-suspension-steering",
    service: "Mobile Suspension & Steering Repair",
    categoryId: "suspension",
    h1: "Mobile Suspension & Steering Repair in Lehigh Acres and Fort Myers",
    metaTitle:
      "Mobile Suspension & Steering Repair in Lehigh Acres and Fort Myers | On-Site Service",
    metaDescription:
      "Shocks, struts, control arms, ball joints, tie rods, wheel bearings — mobile suspension repair across Lehigh Acres and Fort Myers. Call (813) 501-7572.",
    intro:
      "Suspension complaints break into three families: ride quality (clunks, harshness, body roll), steering feel (vague, wandering, pulling), and tire wear (cupping, edge wear, feathering). The same repair list — control arms, ball joints, tie rods, struts, sway bar links, wheel bearings — fixes all three, but the diagnostic path differs.",
    paragraphs: [
      "Ride-quality complaints are usually shocks/struts (controlled body movement gone), worn ball joints (clunks over bumps), or sway-bar end links (rattling at low speed). Bounce test on each corner: push down hard and release; the car should return to ride height in one cycle. Two or three cycles means struts are worn.",
      "Steering complaints — vague feel, wandering, pulling — usually trace to tie rods (inner or outer), worn rack bushings, low or contaminated power-steering fluid, or alignment that's drifted from worn components. We check tie-rod free play with the tires off the ground and the steering centered; any vertical or lateral movement at the rod end is replacement.",
      "Tire wear patterns tell a clear story. Inner-edge wear: negative camber excess, often from worn upper control arm or strut mount. Outer-edge wear: positive camber excess, often from sagged spring or strut. Cupping: usually shocks/struts past their useful life. Feathering: toe out of spec from worn tie rods.",
      "Wheel bearings announce themselves with a steady hum that changes pitch with vehicle speed and changes loudness with steering input. Loaded turn (vehicle leaning on the bearing) typically makes a bad bearing louder; unloaded turn makes it quieter. Confirms which side has failed without disassembly.",
      "Most suspension and steering repairs are mobile-friendly across Lehigh Acres and Fort Myers. Some require alignment afterward — we'll quote that separately or refer to a local alignment partner. Call or text (813) 501-7572.",
    ],
    included: [
      "Strut/shock function test (bounce, leak inspection)",
      "Ball joint and tie-rod free-play check",
      "Sway-bar bushing and end-link inspection",
      "Wheel-bearing diagnosis by load/unload technique",
      "Tire-wear pattern assessment for root cause",
      "Power-steering fluid condition check",
      "Alignment-after-repair recommendation when needed",
    ],
    faqs: [
      {
        q: "Do I need an alignment after a tie rod or control arm replacement?",
        a: "Tie rod: yes, always. Control arm: usually yes if the arm carries a camber adjustment or the bushing rebuild changes ride height. Strut replacement: sometimes, depending on whether it carries the camber adjustment.",
      },
      {
        q: "Can you do struts in my driveway?",
        a: "Yes — strut assemblies (with new spring and mount) are direct-fit on most vehicles. Loaded struts (preassembled) eliminate the need for a spring compressor.",
      },
      {
        q: "How long do wheel bearings last in Florida?",
        a: "OE bearings typically 100,000-180,000 miles. Sealed coastal exposure (Iona, Beach areas) can shorten this; salt water gets past the seals.",
      },
      {
        q: "Do you do European suspensions?",
        a: "Yes — including air-spring vehicles where the part is mobile-replaceable. Some air-spring failures need shop equipment for safety.",
      },
    ],
  },

  // ============================================================
  // AC
  // ============================================================
  {
    slug: "ac-repair-fort-myers-fl",
    service: "AC Repair",
    citySlug: "fort-myers",
    categoryId: "ac-heating",
    h1: "Mobile AC Repair in Fort Myers, FL",
    metaTitle: "Mobile AC Repair in Fort Myers, FL | Same-Day Recharge & Compressor Service",
    metaDescription:
      "Mobile auto AC repair in Fort Myers, FL. Leak detection, evacuation, recharge by weight, compressor service. Call (813) 501-7572.",
    intro:
      "An AC system that 'needs a recharge' every year doesn't need a recharge — it has a leak. Topping it off with refrigerant from the parts store fixes nothing and often introduces moisture and incorrect refrigerant volume. We find the leak first, fix it, then evacuate and charge to spec.",
    paragraphs: [
      "Refrigerant identification is step one on any Fort Myers AC service. R-134a (most pre-2017 vehicles) and R-1234yf (most 2017-newer) are not interchangeable — equipment is different, lubricants are different, and mixing them ruins the compressor. We identify before connecting any equipment.",
      "Leak detection is done with electronic leak detectors and UV-dye injection. Most leaks in Fort Myers vehicles trace to one of: Schrader-valve cores in the service ports (under $20 to fix, common on aged systems), condenser punctures from highway debris, evaporator core leaks (more involved repair, usually requires dash work), and O-ring failures at line connections (preventive replacement during any disassembly).",
      "Evacuation is non-negotiable before charging. The system must be pulled to vacuum (typically 29 inches Hg) and held for at least 30 minutes — moisture in the system reacts with refrigerant to form acids that destroy the compressor and clog expansion devices. A 'top off' from a parts-store can does not vacuum the system.",
      "Charging by weight to OE specification — typically printed on the underhood AC label — is the only correct method. Charging 'until it gets cold' overcharges the system, raises high-side pressures past safe limits, and either trips the high-pressure cutout or damages the compressor.",
      "Mobile AC service across every Fort Myers ZIP. Compressor and condenser jobs are doable on site for most vehicles. Call or text (813) 501-7572.",
    ],
    included: [
      "Refrigerant identification (R-134a / R-1234yf)",
      "Electronic and UV-dye leak detection",
      "Schrader-valve and O-ring inspection",
      "System evacuation to ≥29 in Hg, 30-minute hold",
      "Charge by weight to OE specification",
      "Pressure verification at idle and 1500 RPM",
      "Cabin-air filter inspection",
    ],
    faqs: [
      {
        q: "Why is my AC cold one day and warm the next in Fort Myers?",
        a: "Almost always a slow refrigerant leak combined with marginal charge level. The system works at full charge and gets weak as charge drops. Find the leak, fix it, recharge by weight.",
      },
      {
        q: "Can you replace my AC compressor in my driveway?",
        a: "Yes for most Fort Myers vehicles. Compressor replacement requires recovery of existing refrigerant (we have certified equipment), proper evacuation, and recharge by weight. Mobile-friendly on most platforms.",
      },
      {
        q: "What's a TXV / expansion valve?",
        a: "Thermal expansion valve — the metering device that controls refrigerant flow into the evaporator. When it sticks (common after moisture intrusion), the AC blows warm or freezes up. Usually requires evaporator-area access.",
      },
      {
        q: "Same-day in Fort Myers?",
        a: "Yes — AC failures are priority calls in summer.",
      },
    ],
  },
  {
    slug: "ac-repair-lehigh-acres-fl",
    service: "AC Repair",
    citySlug: "lehigh-acres",
    categoryId: "ac-heating",
    h1: "Mobile AC Repair in Lehigh Acres, FL",
    metaTitle: "Mobile AC Repair in Lehigh Acres, FL | Same-Day Recharge & Compressor Service",
    metaDescription:
      "Mobile auto AC repair in Lehigh Acres, FL. Proper evacuation, charge by weight, compressor service. Call (813) 501-7572.",
    intro:
      "Most Lehigh Acres AC failures we diagnose break down to one of three things: a leak that's gone unaddressed, a clogged condenser from road debris and bug grit, or a compressor clutch that won't engage because of low refrigerant cutoff or electrical fault. The diagnosis takes 20 minutes; the repair takes longer.",
    paragraphs: [
      "Compressor-clutch no-engage is the most common Lehigh Acres AC complaint we see. The clutch is electromagnetically activated when the AC is requested; it won't engage if low-pressure cutoff is open (refrigerant low), if the AC relay or fuse has failed, or if the clutch coil itself has shorted. We test in that order — quick to isolate.",
      "Condenser airflow restriction is the second-most-common Lehigh Acres complaint. The condenser sits in front of the radiator and accumulates road debris, bug grit, and cottonwood fluff over years. Restricted airflow means the high side can't shed heat, pressures climb, and the high-pressure cutoff trips. A condenser cleaning often restores function without any refrigerant work at all.",
      "Refrigerant leaks in Lehigh Acres vehicles most often originate at: AC service-port Schrader valves (cheap to replace), the condenser core itself (after rock damage on Lee Boulevard or SR-82), or evaporator core (older vehicles, requires dash R&R for replacement). UV dye injection identifies the leak location within 1-2 weeks of operation.",
      "Charging by weight to OE spec is the only correct method. Most modern AC systems hold 1.5-2.5 lbs of refrigerant total — over-charging by even 4-6 ounces raises high-side pressure into the danger zone and either trips the cutoff or damages the compressor. We use a recover/recycle/recharge machine that measures to the gram.",
      "Same-day mobile AC service across all Lehigh Acres ZIPs. Call or text (813) 501-7572.",
    ],
    included: [
      "Compressor clutch electrical and mechanical test",
      "Condenser airflow inspection and cleaning",
      "Refrigerant identification (R-134a / R-1234yf)",
      "UV dye and electronic leak detection",
      "System evacuation to vacuum, 30-minute hold",
      "Recharge by weight to OE spec",
      "Pressure and temperature verification at vents",
    ],
    faqs: [
      {
        q: "Why does my Lehigh Acres AC blow cold at highway speed but warm at idle?",
        a: "Two common causes: the cooling fan that pulls air through the condenser at idle has failed or is on low speed, or the system is undercharged enough that idle conditions are marginal. We test fan operation and verify charge level by weight.",
      },
      {
        q: "Can a clogged cabin filter cause warm AC?",
        a: "Yes — restricted airflow over the evaporator means the air at the vents was never properly cooled. Easy fix; we check the filter on every AC complaint.",
      },
      {
        q: "How long does an AC recharge take in my Lehigh Acres driveway?",
        a: "Recovery + evacuation + recharge: about 60-75 minutes. Plus diagnosis and any leak repair on top of that.",
      },
      {
        q: "Are AC repairs warranted?",
        a: "Yes — parts and labor warranty on every AC job.",
      },
    ],
  },

  // ============================================================
  // CITY-LEVEL "MOBILE MECHANIC" PAGES
  // ============================================================
  {
    slug: "mobile-mechanic-lehigh-acres",
    service: "Mobile Mechanic",
    citySlug: "lehigh-acres",
    categoryId: "engine",
    h1: "Mobile Mechanic in Lehigh Acres, FL",
    metaTitle: "Mobile Mechanic in Lehigh Acres, FL | Mike's Mobile Auto Repair",
    metaDescription:
      "ASE-level mobile mechanic in Lehigh Acres, FL. Bidirectional diagnostics, brake/electrical/AC service at your driveway. Call (813) 501-7572.",
    intro:
      "Mobile mechanic work isn't 'shop work in a driveway' — it's a different discipline. The diagnostic goes first, parts get ordered or pulled from the truck after the diagnosis, and the repair has to be right the first time because there's no second-day shop visit. That's how we run every Lehigh Acres call.",
    paragraphs: [
      "Truck inventory determines what we can fix on the first visit. We carry common-failure parts for the vehicles most prevalent in Lehigh Acres — Camry/Corolla water pumps and timing components, F-150 / Silverado / Ram brake hardware and ignition coils, Civic / CR-V / Accord starter and alternator, Altima / Sentra serpentine belts and tensioners, plus universal items like batteries (multiple group sizes), brake pads (most common applications), fluids, and filters.",
      "Diagnostic tools matter. Our scan-tool coverage includes most domestic, Asian, and European platforms with bidirectional capability — meaning we can command components on, not just read codes. We carry a smoke machine for vacuum/EVAP testing, oscilloscope for ignition and injector waveforms, refractometer for brake-fluid moisture, leak-down tester for cylinder integrity, and the standard array of pressure gauges, multimeters, and inspection cameras.",
      "Repairs we routinely complete in a single Lehigh Acres visit: brake pads/rotors (front and rear), battery delivery and install, alternator replacement, starter replacement, water pump (most platforms), serpentine belt and tensioner, ignition coils, spark plugs, oxygen sensors, MAF / MAP / TPS sensors, fuel-pump relays, AC recharges and most leak repairs, oil changes, timing belts (some vehicles), control arms / ball joints / tie rods, wheel bearings (most), and EVAP system repairs.",
      "Repairs that may need a follow-up visit or a referral: head gaskets (long labor in confined spaces), clutch and transmission internal work, body and frame work, alignment (we work with local alignment partners), and some fuel-pump-in-tank jobs that need a lift. We tell you up front when a job is or isn't mobile-friendly.",
      "Same-day service across all Lehigh Acres ZIPs (33936, 33971, 33972, 33973, 33974, 33976). Call or text (813) 501-7572.",
    ],
    included: [
      "Bidirectional scan-tool coverage on most makes",
      "Smoke testing, scope work, leak-down testing on the truck",
      "Common-failure parts inventory matched to local vehicle mix",
      "Brake, electrical, AC, and engine repairs in single visit",
      "Honest first-visit/second-visit assessment",
      "Written diagnosis and quote before any repair",
      "Parts and labor warranty on every job",
    ],
    faqs: [
      {
        q: "What can't you do mobile in Lehigh Acres?",
        a: "Head gaskets, transmission internals, frame work, alignment, and a few fuel-pump-in-tank jobs are typically not mobile-friendly. We tell you up front and refer to a vetted shop if needed.",
      },
      {
        q: "Do you carry parts for less-common vehicles?",
        a: "We don't stock everything — but most parts are sourceable same-day from local distributors. We confirm at booking.",
      },
      {
        q: "How are payments handled?",
        a: "Cards, ACH, and financing on qualifying repairs. Quotes always given in writing before work.",
      },
      {
        q: "Do you handle Lehigh Acres fleet maintenance?",
        a: "Yes — scheduled maintenance for small fleets across Lehigh Acres is a regular service.",
      },
    ],
  },
  {
    slug: "mobile-mechanic-lehigh-acres-fl",
    service: "Mobile Mechanic",
    citySlug: "lehigh-acres",
    categoryId: "engine",
    h1: "Mobile Mechanic in Lehigh Acres, FL",
    metaTitle: "Mobile Mechanic in Lehigh Acres, FL | Same-Day On-Site Auto Repair",
    metaDescription:
      "Top-rated mobile mechanic in Lehigh Acres, FL. Bidirectional diagnostics, brakes, batteries, alternators, AC, oil. Call (813) 501-7572.",
    intro:
      "What makes a mobile mechanic in Lehigh Acres genuinely useful (versus a 'we'll come look at it' mobile call) is the equipment and inventory on the truck. Diagnose, source the part, install it, verify it — all in one visit, most of the time.",
    paragraphs: [
      "Equipment-on-truck for Lehigh Acres calls includes: portable lift system rated for most passenger vehicles and light trucks, full hand-tool sets including specialty tools for common Lehigh Acres applications (Toyota, Honda, Ford, GM, Ram, Hyundai/Kia), full air-tool capability via portable compressor, and a full electrical workstation including soldering, crimping, and heat-shrink for wiring repair done correctly.",
      "Parts sourcing is the second half of mobile speed. We have working accounts with local Lehigh Acres parts distributors who deliver direct to job sites — meaning we can diagnose at 9 AM, source a part at 10, and have it installed by 1 PM. Common-failure parts for high-volume Lehigh Acres vehicles are already on the truck.",
      "Diagnostic-first service philosophy. Most no-start, drivability, and electrical complaints get a real diagnostic before any parts are recommended. The diagnostic fee credits toward repair on the same visit. This eliminates the parts-store guessing that drives up customer cost on most of these jobs.",
      "Lehigh Acres specifics that affect how we work: long driveways (great for setup), shaded driveways under live oaks (ideal for AC and electrical work in summer), dirt roads in the Buckingham area (we plan service around weather), long distances between calls (we batch routing for efficiency).",
      "Same-day appointments across every Lehigh Acres ZIP. Call or text (813) 501-7572.",
    ],
    included: [
      "Portable lift for safe under-vehicle work",
      "Local distributor parts sourcing within hours",
      "Diagnostic-first approach with fee credit toward repair",
      "Truck-stocked common-failure parts for high-volume Lehigh Acres vehicles",
      "Wiring repair done correctly (solder, heat-shrink, no quick splices)",
      "Written quote before any work begins",
      "Standard mobile-service warranty on parts and labor",
    ],
    faqs: [
      {
        q: "Are you really just one tech, or do you have a team?",
        a: "Owner-operator model — we keep overhead low so prices stay fair. For larger jobs (multi-vehicle fleet days, complex jobs needing two sets of hands), we coordinate accordingly.",
      },
      {
        q: "Will you tell me if I should go to a shop instead?",
        a: "Yes — if a job is genuinely better done on a lift in a controlled environment, we'll say so and refer to a vetted shop. We don't take work that doesn't make sense to do mobile.",
      },
      {
        q: "What about diagnosing and fixing on the same visit in Lehigh Acres?",
        a: "Most of the time, yes — we diagnose, source the part, and install on the same visit. Some specialized parts require next-day return.",
      },
      {
        q: "Are diagnostics free?",
        a: "No — they cost $80-$150 and credit toward any repair. 'Free diagnostics' usually means the shop is making money on overpriced parts to compensate.",
      },
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
      "Mobile mechanic in Fort Myers, FL. Bidirectional diagnostics, brakes, AC, batteries at your driveway or office. Call (813) 501-7572.",
    intro:
      "Fort Myers is a mobile-mechanic-friendly city: most parking lots, condo association lots, office complexes, and residential driveways accommodate mobile service. We work in all of them, plus roadside if needed, with the equipment and parts inventory to fix most issues in one visit.",
    paragraphs: [
      "Common Fort Myers mobile call patterns: AC failures in summer (about 40% of summer calls), brake jobs (year-round high volume due to stop-and-go on Colonial, US-41, Daniels), batteries (every season but spike in summer from heat-shortened life), no-starts (year-round), check-engine-light diagnostics (year-round), and oil services (steady weekly volume).",
      "Specific Fort Myers vehicle mix shapes our truck inventory: high count of Camry, Civic, Accord, Corolla, F-150, Silverado, Ram, Altima, Sentra. We carry brake pads, ignition coils, batteries, and starters for these platforms. Less-common vehicles get parts sourced same-day from local distributors.",
      "Coastal-area Fort Myers (Iona, Beach, parts of South Fort Myers) gets a different parts spec for hardware-exposed components: stainless brake hardware, sealed AGM batteries, dielectric protection on every electrical connection. The salt-air corrosion is real and predictable; we plan for it.",
      "Fort Myers fleet support is a meaningful part of our work — small businesses (HVAC, plumbing, landscaping, locksmith, mobile detailing, delivery) running 2-12 vehicles. Scheduled on-site maintenance keeps trucks earning instead of sitting at a shop. We invoice consolidated monthly for fleet customers.",
      "Same-day mobile mechanic service across every Fort Myers ZIP. Call or text (813) 501-7572.",
    ],
    included: [
      "Mobile mechanic service at home, office, or roadside",
      "Inventory matched to Fort Myers vehicle mix",
      "Coastal-grade hardware for waterfront-area vehicles",
      "Fleet maintenance for small businesses",
      "Bidirectional scan-tool diagnostics",
      "Up-front written quotes",
      "Parts and labor warranty",
    ],
    faqs: [
      {
        q: "Can you work in my office parking lot?",
        a: "Yes — most office and condo lots are fine. We'll confirm at booking and work around any property restrictions.",
      },
      {
        q: "Do you cover Fort Myers Beach?",
        a: "Yes — Fort Myers Beach is part of our regular service area, including same-day where possible.",
      },
      {
        q: "Do you handle European cars in Fort Myers?",
        a: "Yes — Audi, BMW, Mercedes, VW, Volvo, Mini are all routine. Some specialized service may go to a partner shop.",
      },
      {
        q: "What about fleet pricing?",
        a: "Consolidated monthly invoicing and per-vehicle service rates for 3+ vehicle fleets. Inquire at booking.",
      },
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
      "Mobile mechanic in Fort Myers, FL. ASE-level diagnostics, brakes, AC, batteries at your home or office. Call (813) 501-7572.",
    intro:
      "There are two kinds of 'mobile mechanic' service in Fort Myers: the call-center model (a dispatch service that routes work to whoever's nearest, no continuity, mixed quality) and the owner-operator model (one technician, one truck, accountable for every job). We're the second kind.",
    paragraphs: [
      "Owner-operator means the tech who diagnoses your problem is the one who fixes it, who calls you back, and who answers if anything needs follow-up. There's no dispatcher between you and the work, no quota-driven 'recommended additional services,' no rotating cast of techs with different skill levels.",
      "The trade-off: we're not 24/7. Hours run roughly 8 AM to 7 PM seven days a week with same-day availability for most calls. Genuine emergencies (no-starts, brake failures, AC out in 95° weather) are prioritized.",
      "Quality control is built into the workflow. Every job ends with a verification — test drive, scan for fault recurrence, road-condition check. Comebacks under warranty are handled by us, on us, with no runaround.",
      "Fort Myers community involvement: we live and work in Lee County, support local fleets, and stake our reputation on every job. The Google reviews are from real Fort Myers customers; we read them and respond.",
      "Same-day mobile mechanic service across every Fort Myers ZIP. Call or text (813) 501-7572.",
    ],
    included: [
      "Owner-operator mobile mechanic service",
      "Same-day availability for most calls",
      "Priority response for no-starts and emergency repairs",
      "Verified completion (test drive, scan, road check)",
      "Warranty comebacks handled by the same tech",
      "Local fleet maintenance contracts",
      "Cards, ACH, and financing accepted",
    ],
    faqs: [
      {
        q: "Are you on call 24/7?",
        a: "No — hours are roughly 8 AM to 7 PM, seven days. Genuine emergencies handled outside hours when possible. Predictable hours let us provide consistent service.",
      },
      {
        q: "What happens if a repair has a problem after you leave?",
        a: "Call back — same tech, same truck, no dispatcher. Warranty comebacks are resolved at no additional charge.",
      },
      {
        q: "Can you handle hybrids and EVs in Fort Myers?",
        a: "Hybrids: yes, most platforms. EVs: most service items (brakes, suspension, 12V battery, AC) are routine. High-voltage diagnostics on EVs are limited to specific platforms; we'll confirm at booking.",
      },
      {
        q: "Same-day in Fort Myers?",
        a: "Almost always for in-stock work; sometimes next-day for special-order parts.",
      },
    ],
  },
];

import { buildMatrixPages } from "./serviceCityMatrix";

const _handWritten = _allLocalLandingPages.filter(
  (p) => !p.citySlug || ALLOWED_CITY_SLUGS.has(p.citySlug)
);

// Track (categoryId × citySlug) pairs already covered by hand-written pages
// so the matrix generator doesn't duplicate them under a different slug.
const _coveredPairs = new Set(
  _handWritten
    .filter((p) => p.citySlug)
    .map((p) => `${p.categoryId}|${p.citySlug}`)
);
const _existingSlugs = new Set(_handWritten.map((p) => p.slug));

const _matrix = buildMatrixPages(_existingSlugs).filter(
  (p) => !_coveredPairs.has(`${p.categoryId}|${p.citySlug}`)
);

export const localLandingPages: LocalLandingPage[] = [
  ..._handWritten,
  ..._matrix,
];

export const getLandingPageBySlug = (slug: string) =>
  localLandingPages.find((p) => p.slug === slug);

