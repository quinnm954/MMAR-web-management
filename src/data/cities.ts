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
      "Mike's Mobile Auto Repair is the trusted mobile mechanic in Lehigh Acres, FL. We bring full-service auto repair, diagnostics, and on-site repair to homes and workplaces across Lehigh — no tow truck and no waiting room required.",
    paragraphs: [
      "Lehigh Acres covers a huge area, and getting a stalled vehicle to a brick-and-mortar shop can be a real headache. That's where we come in. Whether you're stuck in a driveway off Lee Boulevard, parked at a workplace near Sunshine, or broken down on Gunnery Road, our fully-equipped mobile service truck rolls to you with the tools, diagnostic scanners, and parts to get the job done right the first time.",
      "We service every Lehigh Acres ZIP code — 33936, 33971, 33972, 33973, 33974, and 33976 — and handle everything from oil changes and brake jobs to alternator replacements, AC recharges, and check-engine-light diagnostics. Many repairs we complete in a single visit, and we always quote you up front before any work begins.",
      "Lehigh's climate is hard on cars in very specific ways. Summer heat regularly exceeds 95°F, which destroys lead-acid batteries in 2–3 years instead of the 4–5 they last up north. Humidity accelerates AC compressor failure and refrigerant loss. Long, flat commutes on Lee Boulevard and SR-82 wear brake pads quickly, especially for stop-and-go traffic into Fort Myers. We see all of it, every week, and we stock the right parts.",
      "Most Lehigh customers ask the same first question: do you really come to my house? The answer is yes. We work in driveways, condo parking lots, employer parking lots, and even side streets. We carry a portable lift, a full set of scan tools (OBD-II, ABS, SRS, manufacturer-specific), and the most common consumables — batteries, oil, filters, brake pads, rotors, alternators, starters — so most jobs are one-and-done.",
      "We also work with families that have multiple vehicles. If two cars need oil changes and one needs brakes, we can knock out all three in a single appointment instead of you running back and forth between shops. That's one of the biggest time savings of going mobile in a place like Lehigh, where the nearest shop might be a 25-minute drive each way.",
      "Need help right now? Call or text (813) 501-7572 and a real technician will respond — no call-center runaround. Same-day appointments are usually available, with evening and weekend coverage throughout Lehigh Acres.",
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
      "Looking for a reliable mobile mechanic in Fort Myers, FL? Mike's Mobile Auto Repair brings ASE-level service straight to your home or workplace anywhere in greater Fort Myers.",
    paragraphs: [
      "From Downtown to Gateway, McGregor to Iona, our Fort Myers customers get the same professional repairs they'd find in a traditional shop — without the tow bill, the rental car, or the wasted afternoon in a waiting room. Our mobile service truck carries the diagnostic equipment and common parts needed to handle most repairs on the spot.",
      "We cover every major Fort Myers ZIP code including 33901, 33907, 33908, 33912, 33913, 33916, 33919, and 33966. Common Fort Myers calls include AC recharges (Florida heat is brutal), brake jobs, battery and alternator replacements, oil changes, and computer diagnostics for stubborn check-engine lights.",
      "Fort Myers commuters spend a lot of time in stop-and-go on US-41, Colonial Boulevard, Daniels Parkway, and I-75 between Colonial and Alico. That kind of driving is uniquely punishing on brake systems and transmissions — we replace pads and rotors at almost double the rate we would in a less congested town. If your brakes are squealing or your pedal feels soft, get them checked before they damage rotors or calipers.",
      "Fort Myers also has a real fleet-maintenance market. Plumbers, HVAC techs, landscapers, locksmiths, and small delivery operators can't afford a vehicle being stuck at a shop for two days. We come to your shop, knock out the maintenance, and your truck is back on the road the same day. Ask about our scheduled fleet plans for businesses with 3+ vehicles.",
      "Closer to the coast — Iona, Fort Myers Beach, parts of South Fort Myers — salt air slowly destroys brake hardware, exhaust components, and electrical connectors. We routinely use stainless hardware and dielectric protection to slow that corrosion down. Tell us your car lives near the water and we'll plan for it.",
      "We also service local businesses with fleet maintenance — keep your vans, trucks, and work vehicles on the road without the downtime of shop visits. Call or text (813) 501-7572 for a fast, transparent quote anywhere in Fort Myers.",
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
