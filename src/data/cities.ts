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
];



// Attach defaults (pricing + FAQs) without bloating the literals above.
for (const c of cities) {
  if (!c.pricing) c.pricing = PRICING_DEFAULT;
  if (!c.faqs) c.faqs = FAQ_BASE(c.name, c.state);
}

export const getCityBySlug = (slug: string) =>
  cities.find((c) => c.slug === slug);
