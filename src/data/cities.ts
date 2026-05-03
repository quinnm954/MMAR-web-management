export type City = {
  slug: string;
  name: string;
  state: string;
  zips: string[];
  neighborhoods: string[];
  intro: string;
  paragraphs: string[];
};

export const cities: City[] = [
  {
    slug: "lehigh-acres",
    name: "Lehigh Acres",
    state: "FL",
    zips: ["33936", "33971", "33972", "33973", "33974", "33976"],
    neighborhoods: [
      "Lee Boulevard",
      "Sunshine Boulevard",
      "Gunnery Road",
      "Joel Boulevard",
      "Buckingham",
      "Alabama Road",
    ],
    intro:
      "Mike's Mobile Auto Repair is the trusted mobile mechanic in Lehigh Acres, FL. We bring full-service auto repair, diagnostics, and roadside help to homes, workplaces, and roadside breakdowns across Lehigh — no tow truck and no waiting room required.",
    paragraphs: [
      "Lehigh Acres covers a huge area, and getting a stalled vehicle to a brick-and-mortar shop can be a real headache. That's where we come in. Whether you're stuck in a driveway off Lee Boulevard, parked at a workplace near Sunshine, or broken down on Gunnery Road, our fully-equipped mobile service truck rolls to you with the tools, diagnostic scanners, and parts to get the job done right the first time.",
      "We service every Lehigh Acres ZIP code — 33936, 33971, 33972, 33973, 33974, and 33976 — and handle everything from oil changes and brake jobs to alternator replacements, AC recharges, and check-engine-light diagnostics. Many repairs we complete in a single visit, and we always quote you up front before any work begins.",
      "Need help right now? Call or text (813) 501-7572 and a real technician will respond — no call-center runaround. Same-day appointments are usually available, and emergency roadside service is offered evenings and weekends throughout Lehigh Acres.",
    ],
  },
  {
    slug: "fort-myers",
    name: "Fort Myers",
    state: "FL",
    zips: ["33901", "33905", "33907", "33908", "33912", "33913", "33916", "33919", "33966", "33967"],
    neighborhoods: [
      "Downtown Fort Myers",
      "McGregor",
      "Gateway",
      "Whiskey Creek",
      "Iona",
      "South Fort Myers",
      "Fort Myers Beach",
    ],
    intro:
      "Looking for a reliable mobile mechanic in Fort Myers, FL? Mike's Mobile Auto Repair brings ASE-level service straight to your home, workplace, or roadside breakdown anywhere in greater Fort Myers.",
    paragraphs: [
      "From Downtown to Gateway, McGregor to Iona, our Fort Myers customers get the same professional repairs they'd find in a traditional shop — without the tow bill, the rental car, or the wasted afternoon in a waiting room. Our mobile service truck carries the diagnostic equipment and common parts needed to handle most repairs on the spot.",
      "We cover every major Fort Myers ZIP code including 33901, 33907, 33908, 33912, 33913, 33916, 33919, and 33966. Common Fort Myers calls include AC recharges (Florida heat is brutal), brake jobs, battery and alternator replacements, oil changes, and computer diagnostics for stubborn check-engine lights.",
      "We also service local businesses with fleet maintenance — keep your vans, trucks, and work vehicles on the road without the downtime of shop visits. Call or text (813) 501-7572 for a fast, transparent quote anywhere in Fort Myers.",
    ],
  },
  {
    slug: "cape-coral",
    name: "Cape Coral",
    state: "FL",
    zips: ["33904", "33909", "33914", "33990", "33991", "33993"],
    neighborhoods: [
      "South Cape",
      "Pelican",
      "Cape Harbour",
      "Sandoval",
      "Burnt Store",
      "North Cape",
    ],
    intro:
      "Mike's Mobile Auto Repair is your on-call mobile mechanic in Cape Coral, FL. We come to you with professional diagnostic tools, quality parts, and honest, up-front pricing — anywhere from South Cape to Burnt Store.",
    paragraphs: [
      "Cape Coral's sprawling layout means a simple shop visit can eat up half a day. Skip the tow truck and the rideshare — our mobile service truck handles brake jobs, AC repairs, batteries, alternators, starters, oil changes, and full computer diagnostics right in your driveway.",
      "We cover every Cape Coral ZIP code including 33904, 33909, 33914, 33990, 33991, and 33993. Whether you're near Cape Harbour, Sandoval, Pelican, or up by Burnt Store Road, we'll roll to your location with the right tools to fix it the first time.",
      "Stranded on a Cape Coral road? Roadside help — jump starts, lockouts, flat tire repairs, and dead-battery rescues — is just a phone call away. Call or text (813) 501-7572 to book or get a quote.",
    ],
  },
];

export const getCityBySlug = (slug: string) =>
  cities.find((c) => c.slug === slug);
