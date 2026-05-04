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

const _removedCities_unused = [
  {
    slug: "cape-coral",
    name: "Cape Coral",
    state: "FL",
    zips: ["33904", "33909", "33914", "33990", "33991", "33993"],
    geo: { lat: 26.5629, lng: -81.9495 },
    neighborhoods: [
      "South Cape",
      "Pelican",
      "Cape Harbour",
      "Sandoval",
      "Burnt Store",
      "North Cape",
    ],
    neighborhoodNotes: [
      { name: "South Cape", note: "Closest part of the Cape to the bridges and Fort Myers commute — heavy brake wear and battery turnover here." },
      { name: "Pelican & Cape Harbour", note: "Coastal corrosion is the silent killer. We watch hard for rusty brake lines, corroded battery terminals, and crusty ground straps." },
      { name: "Sandoval & Burnt Store", note: "Newer planned communities with HOA parking rules — we work cleanly and pack out our waste." },
      { name: "North Cape (33993, 33991)", note: "Long drives to almost anything mean batteries, alternators, and AC compressors take a beating in summer." },
    ],
    intro:
      "Mike's Mobile Auto Repair is your on-call mobile mechanic in Cape Coral, FL. We come to you with professional diagnostic tools, quality parts, and honest, up-front pricing — anywhere from South Cape to Burnt Store.",
    paragraphs: [
      "Cape Coral's sprawling layout means a simple shop visit can eat up half a day. Skip the tow truck and the rideshare — our mobile service truck handles brake jobs, AC repairs, batteries, alternators, starters, oil changes, and full computer diagnostics right in your driveway.",
      "We cover every Cape Coral ZIP code including 33904, 33909, 33914, 33990, 33991, and 33993. Whether you're near Cape Harbour, Sandoval, Pelican, or up by Burnt Store Road, we'll roll to your location with the right tools to fix it the first time.",
      "Cape Coral has a few unique vehicle issues you don't see as much elsewhere in Lee County. The big one is corrosion. Salt-laden air from the canals and the Gulf attacks brake lines, exhaust hangers, battery terminals, and any unprotected electrical connection. Cars that have lived their entire life in the Cape often need brake-line replacements at 8–10 years, when the same car in a dry climate would go 15+. We carry stainless hose kits and dielectric grease for exactly that reason.",
      "The second big one is sheer distance. North Cape is a 25-minute drive to almost anywhere — and if your battery dies on a Sunday afternoon, the alternative to mobile is a tow plus a Monday-morning shop visit. Our average response window for emergency battery and no-start calls in the Cape is under 90 minutes when we have a tech free.",
      "Most Cape Coral repairs are routine and predictable: AC recharges between April and October, batteries year-round (heat kills them faster than cold ever did), brakes for the daily Fort Myers commuters, and the occasional alternator. We'll quote everything in writing before we touch a tool.",
      "Need a mobile mechanic in Cape Coral? Call or text (813) 501-7572 to book or get a quote.",
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
      "Estero Park",
      "Miromar Lakes",
      "Corkscrew Road",
      "Pelican Sound",
      "Stoneybrook",
    ],
    neighborhoodNotes: [
      { name: "Coconut Point area", note: "Lots of two-car households running between work in Fort Myers and family in Bonita — we plan double-vehicle visits to save you the second appointment." },
      { name: "Miromar Lakes", note: "Gated and HOA-strict; we coordinate access and work cleanly inside the community." },
      { name: "Corkscrew Road", note: "Long, fast country drive — hard on tires and cooling systems. We see a lot of heat-related calls from Corkscrew." },
      { name: "Pelican Sound & Stoneybrook", note: "Mostly newer vehicles with regular maintenance. Synthetic oil services and AC checks are our common visits." },
    ],
    intro:
      "Mike's Mobile Auto Repair is the on-call mobile mechanic in Estero, FL. We bring full-service auto repair, diagnostics, and on-site repair to homes and businesses across the Estero area — from Coconut Point to Miromar Lakes.",
    paragraphs: [
      "Estero sits right between Fort Myers and Bonita Springs, and the daily commute on US-41 and I-75 is hard on cars — especially in summer heat. We come to your home or workplace with diagnostic scanners, quality parts, and the experience to handle most repairs in a single visit. No tow, no lost afternoon, no shop waiting room.",
      "We service every Estero ZIP code (33928, 33967, 34134, 34135) and handle batteries, alternators, brakes, AC recharges, oil changes, no-start diagnostics, and check-engine-light troubleshooting. Florida heat is brutal on batteries and AC systems — the two calls we get most often from Estero customers — and we keep both in our truck.",
      "Estero residents are often working professionals with packed schedules. The single biggest reason people call us instead of a brick-and-mortar shop is time. A traditional shop appointment in Lee or Collier county can eat a full half-day with the drive, the wait, and the rideshare home. A mobile appointment at your house typically costs you 5 minutes of conversation when we arrive and 5 minutes when we hand you the keys.",
      "We also service the corporate parks around Coconut Point and Miromar — if your car needs an oil change or brakes, we'll do it while you work. No personal time off required.",
      "If you're stranded near Coconut Point, Miromar, or anywhere along Corkscrew Road, call or text (813) 501-7572. A real technician answers and same-day mobile service is usually available.",
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
      "Imperial Bonita Estates",
      "Pelican Landing",
      "Bonita National",
      "Old 41",
      "Worthington",
    ],
    neighborhoodNotes: [
      { name: "Bonita Beach", note: "Salt air directly from the Gulf — we plan corrosion checks into every visit." },
      { name: "Pelican Landing & Bonita National", note: "Newer, well-maintained vehicles. Synthetic oil, AC checks, and brake jobs make up most calls." },
      { name: "Old 41", note: "Mix of older homes and businesses — we do a lot of fleet maintenance for small businesses on Old 41." },
      { name: "Imperial Bonita Estates", note: "Many multi-vehicle households; we'll service two or three cars in one visit." },
    ],
    intro:
      "Mike's Mobile Auto Repair is your trusted mobile mechanic in Bonita Springs, FL. Salt air, summer heat, and bumper-to-bumper season traffic take a real toll on vehicles — we bring the shop to your driveway so you don't lose a day of your week.",
    paragraphs: [
      "From Bonita Beach to Pelican Landing and Bonita National, our mobile service truck rolls to you with the tools and parts to handle most repairs on site. Brake jobs, battery and alternator replacements, AC service, oil changes, and computer diagnostics — all done at your home or workplace with up-front, transparent pricing.",
      "We service Bonita Springs ZIP codes 34134 and 34135 and the surrounding communities. The two most common calls here are AC recharges (Florida humidity is no joke) and battery replacements (heat kills batteries fast in coastal SWFL). Both are usually completed in under an hour.",
      "Season traffic on US-41 between Bonita Beach Road and Coconut Point is hard on brakes and transmissions — we see a noticeable spike in pad replacements every January through April. If your pedal feels soft or you hear a squeal, don't wait. Worn pads will cost you rotors very quickly.",
      "Bonita's coastal location means salt corrosion is real. We check brake hardware, electrical grounds, battery terminals, and exhaust hangers on every visit. A small problem caught early in a Bonita car is a 15-minute fix; the same problem ignored for six months is a brake-line replacement.",
      "Need help right now? Call or text (813) 501-7572 — same-day appointments are usually available across Bonita Springs, including evenings and weekends.",
    ],
  },
  {
    slug: "naples",
    name: "Naples",
    state: "FL",
    zips: [
      "34102","34103","34104","34105","34108","34109","34110","34112","34113","34114","34116","34117"
    ],
    geo: { lat: 26.1420, lng: -81.7948 },
    neighborhoods: [
      "Old Naples",
      "North Naples",
      "Park Shore",
      "Pelican Bay",
      "Golden Gate",
      "Vineyards",
      "Pine Ridge",
      "East Naples",
    ],
    neighborhoodNotes: [
      { name: "Old Naples & Park Shore", note: "High-end vehicles, condos with strict valet rules — we work cleanly and discreetly. Many luxury makes; we have the OEM-level scan tools to support them." },
      { name: "Pelican Bay", note: "Coastal corrosion on garaged cars is still real — humid garages are sometimes worse than open driveways. We catch it early." },
      { name: "Golden Gate", note: "Working families with daily-driver vehicles. Brakes, batteries, and AC make up the bulk of our Golden Gate calls." },
      { name: "Vineyards & Pine Ridge", note: "Single-family homes with comfortable driveways — perfect for mobile work." },
      { name: "East Naples", note: "Long commutes west on Davis and US-41 — heavy brake wear and tire wear are typical." },
    ],
    intro:
      "Mike's Mobile Auto Repair brings ASE-level mobile auto service to Naples, FL. From Old Naples and Park Shore to Golden Gate and East Naples, we come to your home, condo, or workplace with the tools, parts, and diagnostic scanners to handle most repairs on the spot.",
    paragraphs: [
      "Naples drivers deal with a unique mix of issues — long highway commutes up I-75, salt-air corrosion near the coast, and brutal summer heat that wears down batteries, AC compressors, and cooling systems. Our mobile service truck is built for exactly that environment.",
      "We service every Naples ZIP including 34102, 34103, 34108, 34109, 34112, and 34116. Common Naples calls include AC recharges, battery replacements, brake jobs, alternator and starter replacements, and computer diagnostics for stubborn check-engine lights.",
      "Naples has the highest concentration of luxury and European vehicles in our service area. We are equipped with OEM-level scan tools that handle BMW, Mercedes-Benz, Audi, Porsche, Land Rover, and Lexus diagnostics that lower-tier shops can't even read. If a chain shop told you they 'can't talk to your car,' call us — we very likely can.",
      "Coastal Naples — Old Naples, Park Shore, Pelican Bay — has serious corrosion exposure even for garaged cars. The salt and humidity that come in through open doors and windows still attack brake hardware, electrical grounds, and battery terminals. We pre-check those areas on every visit and tell you what we see, with photos.",
      "East Naples and Golden Gate are a different world — long daily commutes on Davis Boulevard and US-41 that punish brakes, tires, and suspension. We see a steady drumbeat of pad-and-rotor jobs, control arms, and ball joints from those neighborhoods.",
      "Whether you live in a Pelican Bay condo, a Vineyards single-family home, or anywhere across Greater Naples, call or text (813) 501-7572 for fast, transparent mobile auto repair. Same-day service is usually available.",
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
