export type CityFAQ = { question: string; answer: string };
export type CityPriceRow = { service: string; range: string; note?: string };
export type NeighborhoodNote = { name: string; note: string };

export type City = {
  slug: string;
  name: string;
  state: string;
  zips: string[];
  neighborhoods: string[];
  neighborhoodNotes?: NeighborhoodNote[];
  intro: string;
  paragraphs: string[];
  geo: { lat: number; lng: number };
  pricing?: CityPriceRow[];
  faqs?: CityFAQ[];
  // Embed URL for an iframe-friendly map of the service area.
  mapEmbed?: string;
};

const PRICING_DEFAULT: CityPriceRow[] = [
  { service: "Conventional oil change (mobile)", range: "$65 – $95", note: "Up to 5 quarts, filter included" },
  { service: "Full synthetic oil change (mobile)", range: "$95 – $145" },
  { service: "Battery replacement (mobile, installed)", range: "$185 – $325", note: "Group 24/35/65 — varies by vehicle" },
  { service: "Alternator replacement", range: "$385 – $725", note: "Most domestic & import sedans" },
  { service: "Starter replacement", range: "$325 – $625" },
  { service: "Front brake pads + rotors", range: "$285 – $475", note: "Per axle, quality parts" },
  { service: "AC recharge with leak check", range: "$145 – $235", note: "R-134a or R-1234yf" },
  { service: "Check-engine-light diagnostic", range: "$95 – $145", note: "Waived if you book the repair" },
  { service: "No-start diagnostic (on-site)", range: "$95 – $165" },
];

const FAQ_BASE = (cityName: string, state: string): CityFAQ[] => [
  {
    question: `Do you really come to my driveway in ${cityName}, ${state}?`,
    answer: `Yes — we are a fully-equipped mobile repair truck. We service homes, condos, apartment complexes, and workplaces all across ${cityName}. Most repairs are completed on the spot with no tow needed.`,
  },
  {
    question: `How much does a mobile mechanic cost in ${cityName}?`,
    answer: `Most mobile services in ${cityName} cost about the same as a brick-and-mortar shop — and usually less when you factor in the tow and the rental car you don't need. We always quote up front, in writing, before any work begins.`,
  },
  {
    question: `Can you do same-day service in ${cityName}?`,
    answer: `Same-day appointments in ${cityName} are usually available, especially for batteries, brakes, AC issues, and no-start diagnostics. Call or text (813) 501-7572 and a real technician will respond.`,
  },
  {
    question: `What payment methods do you accept?`,
    answer: `We accept all major credit/debit cards, Apple Pay, Google Pay, Zelle, and cash. Financing is available on larger jobs — ask when you book.`,
  },
  {
    question: `Do you offer a warranty on mobile repairs in ${cityName}?`,
    answer: `Yes. All parts and labor are covered by our written warranty (12 months / 12,000 miles on most repairs). See our warranty policy page for full details.`,
  },
];

export const cities: City[] = [
  {
    slug: "lehigh-acres",
    name: "Lehigh Acres",
    state: "FL",
    zips: ["33936", "33971", "33972", "33973", "33974", "33976"],
    geo: { lat: 26.6121, lng: -81.6237 },
    neighborhoods: [
      "Lee Boulevard",
      "Sunshine Boulevard",
      "Gunnery Road",
      "Joel Boulevard",
      "Buckingham",
      "Alabama Road",
    ],
    neighborhoodNotes: [
      { name: "Lee Boulevard", note: "Heavy commuter corridor — the long stop-and-go to Fort Myers cooks brakes and batteries faster than most folks expect. We do a lot of brake jobs and battery swaps right at homes off Lee." },
      { name: "Sunshine Boulevard", note: "Older homes with shaded driveways — a great spot for mobile work. AC recharges and alternator swaps are our most common Sunshine calls." },
      { name: "Gunnery Road", note: "Long, flat, fast — and rough on suspension. Control arms, ball joints, and tire-pressure issues are the usual Gunnery calls." },
      { name: "Joel Boulevard", note: "Mix of single-family and rentals; we routinely service multi-vehicle households on a single visit." },
      { name: "Buckingham", note: "Semi-rural, longer driveways, plenty of room to work. Great for bigger jobs like timing belts and water pumps." },
      { name: "Alabama Road", note: "Fleet-vehicle territory — we keep a number of small-business trucks and vans on the road from Alabama Road shops." },
    ],
    intro:
      "Mike's Mobile Auto Repair delivers ASE-grade diagnostics and on-site repair across Lehigh Acres, FL. Our service truck arrives with bidirectional scan tools, OE-spec parts, and the same procedural discipline you'd expect from a brick-and-mortar shop — minus the tow and the waiting room.",
    paragraphs: [
      "Lehigh Acres' grid covers roughly 96 square miles, and the drive time to the nearest dealer service lane often exceeds 35 minutes in rush traffic. That logistical reality is exactly why mobile diagnostics make sense here. We arrive with a Snap-on Zeus or Autel MS909 capable of bidirectional control — actuating ABS pump motors, commanding EVAP solenoids, and registering BMS modules on 2014+ vehicles that demand a battery-monitor reset after replacement. Skipping that reset is the #1 reason a brand-new battery still throws charging-system codes within a week.",
      "We service every Lehigh Acres ZIP — 33936, 33971, 33972, 33973, 33974, 33976 — and tailor procedure to the failure mode, not just the symptom. A P0420 catalyst code on a Lee Boulevard commuter, for example, gets confirmed with pre- and post-cat O2 waveform capture before any cat replacement is quoted. A no-start gets a parasitic-draw isolation with an inductive amp clamp (target <50 mA after 40-minute module sleep) before we condemn the battery.",
      "Lehigh's climate punishes specific systems on a predictable schedule. Underhood temperatures routinely break 175°F in July, which depletes the calcium-grid lead-acid chemistry in standard flooded batteries 35–40% faster than northern averages — most fail the CCA load test by year three. Severe-service oil intervals apply to virtually every vehicle here: short trips under 10 miles in 90°F+ ambient cause moisture and fuel dilution to accumulate in the sump faster than the oil's TBN reserve can neutralize, especially in direct-injected turbo engines vulnerable to LSPI.",
      "Brake service in Lehigh is dictated by the stop-and-go on SR-82 and Lee Boulevard. We measure rotor thickness with a micrometer against the manufacturer's discard spec stamped on the hat, check lateral runout with a dial indicator (target <0.002\"), and use G3500-grade carbon castings on resurfaced or replacement rotors. Pads are matched to driving profile — ceramic for daily commuters, semi-metallic for fleet trucks pulling trailers off Alabama Road. Brake fluid is moisture-tested with a refractometer; anything over 3% gets a full DOT 4 flush, since boiling point degradation is what causes the soft-pedal complaints we hear most often.",
      "Electrical diagnostics are a Lehigh specialty. We see a lot of failing alternators where the rotor windings are still intact but the diode pack is leaking AC ripple — captured cleanly on an oscilloscope as a >500 mV peak-to-peak ripple on the B+ post — which silently destroys downstream modules and batteries. A standard parts-counter alternator test will pass these units. We don't.",
      "Need a real technician on-site today? Call or text (813) 501-7572. Same-day windows are typical for batteries, brakes, AC service, and no-start diagnostics throughout 33936, 33971, 33972, 33973, 33974, and 33976.",
    ],
    faqs: [
      {
        question: "What scan tool coverage do you bring to Lehigh Acres?",
        answer: "We carry Autel MS909 and Snap-on Zeus platforms with bidirectional control, plus manufacturer-specific software for GM (GDS2), Ford (FDRS), Chrysler (wiTECH), and Toyota (Techstream). That covers ABS bleeding, BMS battery registration, throttle-body relearn, EVAP solenoid actuation, and most module programming required after a sensor or actuator replacement.",
      },
      {
        question: "How do you confirm an alternator is actually bad before replacing it?",
        answer: "Three checks. First, voltage drop across the B+ and ground cables under load (target <0.3V each). Second, AC ripple at the B+ post with a scope — anything above 100 mV peak-to-peak indicates a failing diode. Third, a controlled load test with the AC, headlights, and rear defrost on, watching for system voltage to hold above 13.5V. Counter-style 'bench tests' miss diode failures routinely.",
      },
      {
        question: "Why do Lehigh batteries die so fast?",
        answer: "Underhood temperatures here regularly hit 175°F, and heat — not cold — is what destroys lead-acid plates. Calcium grids in standard flooded batteries lose roughly 35–40% of their service life vs. northern climates. We recommend AGM chemistry for any 2014+ vehicle with stop/start or a battery-monitor sensor, and we always perform the BMS reset after replacement so the charging system targets the correct voltage profile.",
      },
      {
        question: "Do you do AC work on R-1234yf systems?",
        answer: "Yes. We carry a dedicated R-1234yf recovery, vacuum, and recharge machine separate from our R-134a unit to prevent cross-contamination. Identification is done with a refrigerant identifier before any service — mixed refrigerant is the fastest way to destroy a compressor and contaminate a recovery machine.",
      },
      {
        question: "How much does a mobile mechanic cost in Lehigh Acres?",
        answer: "Most jobs price within 5–10% of a brick-and-mortar shop, and usually less once you remove the tow bill ($85–$150 round trip from Lehigh) and the lost workday. We quote in writing before any work begins, and the diagnostic fee is waived if you book the repair.",
      },
      {
        question: "Same-day service in Lehigh Acres?",
        answer: "Yes — batteries, brakes, AC service, alternator/starter replacement, and no-start diagnostics are typically same-day across 33936, 33971, 33972, 33973, 33974, and 33976. Call or text (813) 501-7572.",
      },
      {
        question: "Warranty on mobile repairs?",
        answer: "12 months / 12,000 miles on parts and labor for most repairs, in writing. See our warranty policy page for details.",
      },
    ],
  },
  {
    slug: "fort-myers",
    name: "Fort Myers",
    state: "FL",
    zips: ["33901", "33905", "33907", "33908", "33912", "33913", "33916", "33919", "33966", "33967"],
    geo: { lat: 26.6406, lng: -81.8723 },
    neighborhoods: [
      "Downtown Fort Myers",
      "McGregor",
      "Gateway",
      "Whiskey Creek",
      "Iona",
      "South Fort Myers",
      "Fort Myers Beach",
    ],
    neighborhoodNotes: [
      { name: "Downtown Fort Myers", note: "Tight parking and short windows — we work fast and clean for downtown condos and historic-district homes." },
      { name: "McGregor", note: "Older, mature neighborhoods with classic and well-loved cars. We do a lot of cooling-system and AC work for the McGregor crowd." },
      { name: "Gateway", note: "Newer construction and longer commutes east on Daniels — brakes, batteries, and oil services are the steady drumbeat here." },
      { name: "Whiskey Creek & Iona", note: "Heavy AC season demand. Florida humidity inside garages off McGregor wears compressors and condensers fast." },
      { name: "South Fort Myers", note: "Apartment and condo parking is fine for us — bring the keys, we bring the shop." },
      { name: "Fort Myers Beach", note: "Salt air corrodes brake hardware and electrical connectors quickly. We keep extra connectors, dielectric grease, and stainless brake hardware in the truck." },
    ],
    intro:
      "Need a mobile mechanic in Fort Myers, FL who works to OE service procedure? Mike's Mobile Auto Repair brings dealer-level diagnostics, factory-spec parts, and documented test data to your driveway or jobsite anywhere in greater Fort Myers.",
    paragraphs: [
      "Fort Myers is a dense, multi-ZIP service area where vehicle workload varies by neighborhood. Downtown and McGregor are dominated by short-trip, low-RPM use that depletes oil additive packages early and lets carbon build on intake valves of direct-injected engines. Gateway and the I-75 corridor punish brake systems and CVTs. Iona, Whiskey Creek, and Fort Myers Beach add a salt-air corrosion factor that destroys brake hardware, exhaust hangers, and connector pins on chassis harnesses. We adjust procedure and parts selection accordingly.",
      "Coverage spans 33901, 33905, 33907, 33908, 33912, 33913, 33916, 33919, 33966, and 33967. Diagnostics are run on Autel MS909 and Snap-on Zeus platforms with bidirectional control — required for ABS bleeding, BMS battery registration on stop/start vehicles, throttle-body relearns, EVAP solenoid actuation, and most module programming after sensor or actuator replacement. We document live-data captures so you see the failure, not just the code.",
      "Brake work in Fort Myers is high-volume because of stop-and-go on US-41, Colonial, Daniels, and the I-75 northbound morning crawl. Our procedure: pad measurement to the manufacturer's discard spec, rotor thickness with a micrometer, lateral runout under 0.002\" verified with a dial indicator, and G3500-grade carbon castings on replacement rotors. Caliper slide pins are cleaned and re-greased with high-temp synthetic — not generic chassis grease, which liquefies and migrates onto the friction surface in Florida heat. Brake fluid is moisture-tested with a refractometer; >3% triggers a full DOT 4 flush, since that's the threshold where boiling point drops into the soft-pedal range under hard use.",
      "AC service in Fort Myers is a year-round demand. We carry separate R-134a and R-1234yf machines to prevent cross-contamination, identify the refrigerant before any service, evacuate to 29 in Hg and hold for 30 minutes to verify a leak-free system, then charge by weight to OE spec — never by sight glass or low-side pressure. UV dye and electronic leak detection are used together on intermittent leaks, since condenser micro-leaks often show up only at high-side pressure under hood-closed conditions. Compressor replacements always include receiver/drier, orifice tube or expansion valve, system flush, and PAG oil charge calculated to OE volume.",
      "Coastal corrosion changes parts selection. On vehicles garaged in Iona, Sanibel-adjacent neighborhoods, or Fort Myers Beach, we use stainless brake hardware kits, dielectric grease on every connector we open, and corrosion-X on exposed grounds. We've seen 4-year-old brake calipers seized solid from salt intrusion when standard zinc hardware was used at the last service. The right parts cost a few dollars more and last 3–4x longer in this environment.",
      "Fleet and small-business work is a meaningful share of our Fort Myers volume — plumbers, HVAC, landscapers, locksmiths, and last-mile delivery. We schedule on-site preventive maintenance during your downtime windows so trucks aren't pulled from revenue. Call or text (813) 501-7572 for fleet rates or a same-day quote anywhere in Fort Myers.",
    ],
    faqs: [
      {
        question: "Do you do bidirectional ABS bleeds and module programming in Fort Myers?",
        answer: "Yes. ABS bleeding on most 2010+ vehicles requires the scan tool to cycle the HCU solenoids and pump motor — a manual two-person bleed will leave air trapped in the modulator and produce a low pedal. We run the procedure with Autel MS909 or manufacturer software (GDS2 for GM, FDRS for Ford, wiTECH for Chrysler/Stellantis, Techstream for Toyota).",
      },
      {
        question: "How do you diagnose an intermittent AC leak that won't show up at idle?",
        answer: "Static evacuation to 29 in Hg with a 30-minute hold isolates whether the system holds vacuum. If it does, we charge with UV dye plus the OE refrigerant weight, run the system through a heat-soak cycle (hood closed, high-side pressure pushed past 250 psi), then inspect with a UV light and an H10G electronic detector. Condenser micro-leaks and Schrader valve seeps almost always need that high-pressure soak to surface.",
      },
      {
        question: "Why do brake jobs in Fort Myers wear out faster than the manufacturer estimate?",
        answer: "Stop-and-go duty cycle. The MFR pad-life numbers assume mixed highway/city use; Fort Myers commuters on US-41 or I-75 between Colonial and Alico are running closer to severe-service. We typically install ceramic pads on daily commuters for lower dust and better fade resistance, and semi-metallic on trucks and SUVs that tow or haul.",
      },
      {
        question: "What's different about coastal-area service near Fort Myers Beach or Iona?",
        answer: "Salt air. We swap to stainless brake hardware kits, apply dielectric grease to every electrical connector we open, and use anti-seize on caliper bracket bolts and lug studs. Standard zinc-plated hardware from a parts-store brake kit will seize within 2–3 years near the coast.",
      },
      {
        question: "Do you handle fleet maintenance for small businesses in Fort Myers?",
        answer: "Yes — we run scheduled PM (oil, filters, tire rotation, brake inspection, fluid checks) for fleets of 3+ vehicles on-site at your shop or yard. We track each vehicle's mileage, service history, and recommended next-service date, and quote larger repairs in writing before any work begins.",
      },
      {
        question: "Pricing and payment in Fort Myers?",
        answer: "Pricing is at or below brick-and-mortar shop rates once tow and rental are factored in. We accept all major cards, Apple/Google Pay, Zelle, and cash, with financing available on larger jobs. Quotes are in writing before work starts.",
      },
      {
        question: "Warranty?",
        answer: "12 months / 12,000 miles on parts and labor for most repairs, in writing. Coastal corrosion warranty exclusions are documented up front — we'll tell you before the work, not after.",
      },
    ],
  },
  {
    slug: "cape-coral",
    name: "Cape Coral",
    state: "FL",
    zips: ["33904", "33909", "33914", "33990", "33991", "33993"],
    geo: { lat: 26.5629, lng: -81.9495 },
    neighborhoods: [
      "Pelican",
      "Cape Harbour",
      "Tarpon Point",
      "Sandoval",
      "Burnt Store",
      "Hancock",
      "Country Club",
      "Pine Island Road corridor",
    ],
    neighborhoodNotes: [
      { name: "Cape Harbour & Tarpon Point", note: "Waterfront salt-air territory — brake hardware, exhaust hangers, and electrical connectors corrode fast. We default to stainless brake kits and dielectric-greased connectors here." },
      { name: "Pelican & Country Club", note: "Established neighborhoods with longer-tenured vehicles. AC compressors, alternators, and water pumps are the steady drumbeat of work." },
      { name: "Sandoval & Burnt Store", note: "Newer construction, longer commutes south to Bonita and east to Fort Myers. Brake and CVT wear runs hot — we see a lot of fluid flushes and pad/rotor jobs." },
      { name: "Pine Island Road corridor", note: "Stop-and-go retail traffic punishes brakes and transmissions. We schedule a lot of mobile work in office parking lots while customers are at work." },
      { name: "Hancock", note: "Mix of single-family and rentals — multi-vehicle households we can knock out in one visit." },
    ],
    intro:
      "Mike's Mobile Auto Repair brings dealer-level diagnostics and on-site mechanical repair to driveways across Cape Coral, FL. From Pelican to Burnt Store, our service truck arrives with bidirectional scan tools, OE-spec parts, and the corrosion-resistant hardware that Cape Coral's salt-air environment demands.",
    paragraphs: [
      "Cape Coral spans more than 120 square miles of canals, waterfront, and master-planned neighborhoods. Most homes have two vehicles, and the drive to a brick-and-mortar shop — plus the wait, plus the second-car shuffle — eats half a day. We come to you. Coverage runs all six core ZIPs (33904, 33909, 33914, 33990, 33991, 33993) and we routinely service homes off Cape Coral Parkway, Del Prado, Pine Island Road, Veterans Parkway, and Burnt Store Road.",
      "Salt air is the single biggest variable on a Cape Coral repair. Within roughly two miles of the Caloosahatchee or the Gulf, brake hardware seizes 3–4x faster than inland averages, exhaust hangers crack at the welds, ground straps corrode through, and connector pins develop high resistance that the OBD-II port never reports. Our default Cape Coral procedure: stainless brake hardware kits, anti-seize on every threaded fastener we touch, dielectric grease on every connector we open, and a visual inspection of grounds anytime we're chasing an electrical fault. Standard zinc-plated parts-store hardware is a comeback waiting to happen on the south side.",
      "Brake work is high-volume here because of stop-and-go on Cape Coral Parkway, Del Prado, and Pine Island Road. Procedure is the same as anywhere we work: pad measurement to the discard spec, rotor thickness with a micrometer, lateral runout under 0.002\" verified with a dial indicator, G3500-grade carbon castings on replacement rotors, caliper slide pins cleaned and re-greased with high-temp synthetic. Brake fluid is moisture-tested with a refractometer; >3% triggers a full DOT 4 flush — and Cape Coral humidity drives moisture intrusion fast.",
      "AC service is year-round demand in Cape Coral. We carry separate R-134a and R-1234yf machines to prevent cross-contamination, identify the refrigerant before any service, evacuate to 29 in Hg with a 30-minute hold, then charge by weight to OE spec — never by sight glass or low-side pressure. Compressor replacements always include receiver/drier, orifice tube or expansion valve, system flush, and PAG oil charge calculated to OE volume. Cutting any of those corners is what turns a $900 compressor job into a $2,400 comeback.",
      "Electrical diagnostics in Cape Coral lean heavily on parasitic-draw testing and ground-circuit voltage drops. Salt corrosion on a single body ground can produce phantom no-starts, intermittent stalls, ABS faults, and infotainment glitches that no parts swap will fix. We isolate with an inductive amp clamp (target <50 mA after 40-minute module sleep) and a 20-amp DVOM on each ground point, and we replace corroded ring terminals with marine-grade tinned copper.",
      "Same-day windows are normally available across all Cape Coral ZIPs for batteries, brakes, AC service, alternators, starters, and no-start diagnostics. Call or text (813) 501-7572 — a real technician answers, not a dispatcher.",
    ],
    faqs: [
      {
        question: "Do you really come to my house in Cape Coral, including the south Cape and Cape Harbour?",
        answer: "Yes — every Cape Coral ZIP, including the south Cape, Cape Harbour, Tarpon Point, Burnt Store, and Pelican. We service waterfront homes routinely; salt-air corrosion is part of our default procedure here.",
      },
      {
        question: "Why does brake hardware fail so fast on the Cape?",
        answer: "Salt-laden humid air migrates into the caliper slide bores and onto unprotected hardware. We install stainless hardware kits, use anti-seize on all threaded fasteners, and re-grease slide pins with high-temp synthetic — not the generic chassis grease that liquefies in Florida heat.",
      },
      {
        question: "Can you handle a no-start at my house in Cape Coral?",
        answer: "Yes. No-start diagnosis is a default service. We bring a load tester, a parasitic-draw clamp, a scope for cranking-waveform analysis, and starter/alternator replacements in stock for most domestic and import vehicles. Most no-starts are diagnosed and repaired in a single visit.",
      },
      {
        question: "AC repair on R-1234yf vehicles — do you have the equipment?",
        answer: "Yes. We carry a dedicated R-1234yf recovery, vacuum, and recharge machine separate from our R-134a unit. Refrigerant is identified before any service to prevent cross-contamination, which is the fastest way to destroy a compressor.",
      },
      {
        question: "Same-day mobile mechanic in Cape Coral?",
        answer: "Yes — almost always for in-stock work like batteries, brakes, AC service, alternators, and no-start diagnosis. Special-order parts may push to next day. Call or text (813) 501-7572.",
      },
      {
        question: "Do you do fleet work for Cape Coral businesses?",
        answer: "Yes. We service contractor vans, landscape trucks, plumbing, HVAC, and last-mile delivery fleets across Cape Coral on scheduled PM windows so trucks aren't pulled from revenue.",
      },
    ],
  },
  {
    slug: "bonita-springs",
    name: "Bonita Springs",
    state: "FL",
    zips: ["34134", "34135"],
    geo: { lat: 26.3398, lng: -81.7787 },
    neighborhoods: [
      "Bonita Beach",
      "Pelican Landing",
      "Bonita Bay",
      "Worthington",
      "San Carlos Estates",
      "Spring Creek",
      "Imperial Parkway",
    ],
    neighborhoodNotes: [
      { name: "Bonita Beach & Pelican Landing", note: "Waterfront salt-air zone — corrosion-resistant hardware and dielectric-greased connectors are the default here." },
      { name: "Bonita Bay & Worthington", note: "Country-club homes with garaged vehicles — typically lower mileage, higher-trim cars where OE-spec parts and documented procedure matter." },
      { name: "San Carlos Estates", note: "Larger lots, longer driveways, plenty of room for bigger jobs like timing chains and water pumps." },
      { name: "Imperial Parkway corridor", note: "Stop-and-go between Bonita and Estero/Naples — brake and AC work runs hot in this corridor year round." },
      { name: "Spring Creek", note: "Mix of seasonal residents and full-timers; we routinely service vehicles that sit for months and need a full recommission before the next season." },
    ],
    intro:
      "Mike's Mobile Auto Repair delivers on-site mechanical service across Bonita Springs, FL — from Bonita Beach to Worthington and the Imperial Parkway corridor. We arrive with dealer-level scan tools, OE-spec parts, and the salt-air-resistant hardware that southwest Lee County demands.",
    paragraphs: [
      "Bonita Springs sits at the south edge of Lee County and shares the same coastal corrosion environment as Naples and Estero. The two core ZIPs (34134 east of US-41, 34135 west) cover roughly 41 square miles between Estero and the Collier County line. Our service truck handles every mechanical service except bodywork on driveways from Bonita Beach to San Carlos Estates.",
      "Seasonal residency is the variable that defines a lot of Bonita Springs work. A vehicle that sits in a garage from May through October needs a real recommission, not just a battery jump. We test fuel for ethanol-water phase separation, pull coolant for pH, check tire age (date code on the sidewall — anything over 6 years gets replaced regardless of tread), pressure-test the cooling system for slow leaks that emptied the reservoir while the car sat, and refresh brake fluid that has been sitting in 90°F humidity for half a year.",
      "Salt-air corrosion is identical to Cape Coral and Fort Myers Beach. Within two miles of the Gulf, we install stainless brake hardware, marine-grade tinned-copper ring terminals, dielectric grease on every connector we open, and anti-seize on every threaded fastener. A standard zinc brake hardware kit will seize within 24 months in this environment.",
      "AC work is a year-round demand in Bonita. R-134a and R-1234yf machines are kept separate. We identify refrigerant before service, evacuate to 29 in Hg with a 30-minute hold, charge by weight to OE spec, and on compressor replacements we always include receiver/drier, expansion valve or orifice tube, full system flush, and PAG oil charged to OE volume. Cutting corners on the flush or the drier is the #1 reason an AC system comes back within a year.",
      "Brake jobs in Bonita Springs are dictated by Imperial Parkway, Bonita Beach Road, and US-41 stop-and-go. Pad selection is matched to driving profile — ceramic for daily commuters, semi-metallic for trucks and SUVs that tow. Rotors are measured against the discard spec stamped on the hat, and lateral runout is verified with a dial indicator before reassembly. Brake fluid is moisture-tested with a refractometer; >3% triggers a DOT 4 flush.",
      "Same-day mobile mechanic windows are typical across both Bonita ZIPs. Call or text (813) 501-7572 — a real ASE-grade technician answers and quotes in writing before any work begins.",
    ],
    faqs: [
      {
        question: "Do you cover both 34134 and 34135 in Bonita Springs?",
        answer: "Yes — every neighborhood in Bonita Springs, from Bonita Beach and Pelican Landing on the west to Worthington, San Carlos Estates, and the Imperial Parkway corridor on the east.",
      },
      {
        question: "I'm a seasonal resident — can you recommission my car when I get back to Bonita?",
        answer: "Yes. Seasonal recommission is a defined service: we check fuel for phase separation, coolant pH, tire age (date code on the sidewall), brake fluid moisture, AC performance after a long sit, battery state-of-health, and pressure-test the cooling system for slow leaks. Most cars are road-ready in a single visit.",
      },
      {
        question: "Salt-air corrosion — what do you do differently for waterfront homes?",
        answer: "Stainless brake hardware kits, marine-grade tinned-copper ring terminals on grounds we replace, dielectric grease on every connector we open, and anti-seize on threaded fasteners. Standard zinc parts-store hardware will seize within 18–24 months this close to the Gulf.",
      },
      {
        question: "Can you do major work like timing chains or water pumps on a driveway in Bonita?",
        answer: "Yes — provided the driveway has level ground and a safe work area. We've done timing chains, water pumps, head gaskets, and transmission services on driveways from Pelican Landing to San Carlos Estates.",
      },
      {
        question: "What's your warranty in Bonita Springs?",
        answer: "12 months / 12,000 miles on parts and labor for most repairs, in writing. Coastal corrosion-related exclusions are documented up front — we tell you before the job, not after.",
      },
    ],
  },
  {
    slug: "estero",
    name: "Estero",
    state: "FL",
    zips: ["33928", "33967", "34134", "34135"],
    geo: { lat: 26.4381, lng: -81.8068 },
    neighborhoods: [
      "Coconut Point",
      "Grandezza",
      "The Brooks",
      "West Bay",
      "Fountain Lakes",
      "Pelican Sound",
      "Corkscrew Road corridor",
      "Miromar Lakes",
    ],
    neighborhoodNotes: [
      { name: "Coconut Point & Miromar", note: "High-end retail and restaurant traffic — we handle a lot of mobile work in office and retail parking lots while customers are inside." },
      { name: "The Brooks & Grandezza", note: "Country-club neighborhoods with garaged, low-mileage vehicles — OE-spec parts and dealer-level scan procedure are the default here." },
      { name: "West Bay & Pelican Sound", note: "Closer to the Gulf — we use stainless brake hardware and dielectric-grease connectors on coastal jobs." },
      { name: "Fountain Lakes & Corkscrew Road corridor", note: "Long commuter routes east to I-75 and west to US-41 punish brakes and CVTs — a steady stream of pad/rotor and fluid-flush work." },
    ],
    intro:
      "Mike's Mobile Auto Repair serves Estero, FL — from Coconut Point and Miromar Lakes to Grandezza and the Corkscrew Road corridor — with on-site mechanical diagnostics and repair. Dealer-level scan tools, OE-spec parts, transparent up-front quotes.",
    paragraphs: [
      "Estero sits between Bonita Springs and south Fort Myers, straddling I-75 with retail, country-club, and waterfront neighborhoods. We cover all four ZIPs that touch Estero (33928, 33967, plus the Bonita-overlap 34134/34135) and routinely service driveways, retail parking lots, and small-business yards from Coconut Point to Corkscrew Road.",
      "Estero's vehicle workload skews newer and higher-trim. Many homes are seasonal or country-club — vehicles spend more time garaged but accumulate short-trip, low-RPM use that depletes oil additive packs early and lets carbon build on direct-injection intake valves. Severe-service oil intervals apply almost universally here. We also see a lot of CVT fluid services on Nissans and Subarus that the dealer marked as 'lifetime fill' — that fill is rated for ideal conditions, not Florida heat plus stop-and-go.",
      "Brake work in Estero is driven by Corkscrew Road, US-41, and the I-75 corridor. Same procedure as everywhere we work: pad measurement to discard spec, rotor thickness with a micrometer, lateral runout under 0.002\" verified with a dial indicator, G3500-grade carbon castings on replacement rotors, and high-temp synthetic on slide pins. Brake fluid is moisture-tested with a refractometer.",
      "AC service is year-round. Separate R-134a and R-1234yf machines, refrigerant identified before service, vacuum to 29 in Hg with 30-minute hold, charge by weight. Compressor replacements always include receiver/drier, expansion device, system flush, and PAG oil to OE volume.",
      "Electrical diagnostics — alternator, starter, parasitic draw, no-start — are a defined service in Estero. We use bidirectional scan tools (Autel MS909, Snap-on Zeus) plus a scope for AC ripple and cranking-waveform analysis. Counter-style 'bench tests' miss diode failures and intermittent windings routinely; we don't.",
      "Same-day windows are normally available across all Estero ZIPs. Call or text (813) 501-7572 — real technician, real quote, in writing before any work starts.",
    ],
    faqs: [
      {
        question: "Do you service Coconut Point and Miromar Lakes?",
        answer: "Yes — Coconut Point, Miromar Lakes, Grandezza, The Brooks, West Bay, Pelican Sound, and the Corkscrew Road corridor. We routinely service vehicles in retail and office parking lots while customers are inside.",
      },
      {
        question: "My country-club community has rules about service vehicles — is that a problem?",
        answer: "Almost never. Our truck is unmarked enough to satisfy most HOAs and clean enough to satisfy the rest. We follow gate procedures, work quietly, and clean up after ourselves. If your association needs prior notice, we can text the gate ahead of arrival.",
      },
      {
        question: "Can you do a CVT fluid service in Estero?",
        answer: "Yes. CVT fluid is one of the most underserved fluids in southwest Florida — most dealers mark it 'lifetime' even on platforms (Nissan, Subaru, Honda) where the manufacturer's severe-service interval is closer to 30k–60k miles. We use OE-spec CVT fluid and the correct fill procedure for each transmission.",
      },
      {
        question: "Do you charge a trip fee in Estero?",
        answer: "No trip fee inside our standard service area, which includes all of Estero. Diagnostic time is billed normally and is waived if you book the repair.",
      },
      {
        question: "Same-day mobile mechanic in Estero?",
        answer: "Almost always for in-stock work — batteries, brakes, AC service, alternators, starters, no-start diagnostics. Special-order parts may push to next day.",
      },
    ],
  },
];



// Attach defaults (pricing + FAQs) without bloating the literals above.
for (const c of cities) {
  if (!c.pricing) c.pricing = PRICING_DEFAULT;
  if (!c.faqs) c.faqs = FAQ_BASE(c.name, c.state);
}

export const getCityBySlug = (slug: string) =>
  cities.find((c) => c.slug === slug);
