import type { City } from "./cities";

// South Florida (Broward & Palm Beach) city pages. Hidden until
// SOUTH_FLORIDA_WEBSITE_LIVE is turned on in src/lib/regions.ts.
type Seed = { slug: string; name: string; county: "Broward" | "Palm Beach"; zips: string[]; geo: { lat: number; lng: number }; neighborhoods: string[]; roads: string };

const seeds: Seed[] = [
  { slug: "fort-lauderdale", name: "Fort Lauderdale", county: "Broward", zips: ["33301", "33304", "33305", "33306", "33308", "33309", "33311", "33312", "33315", "33316"], geo: { lat: 26.1224, lng: -80.1373 }, neighborhoods: ["Victoria Park", "Las Olas", "Coral Ridge", "Rio Vista", "Imperial Point", "Harbor Beach"], roads: "I-95, US-1 and Sunrise Blvd" },
  { slug: "hollywood", name: "Hollywood", county: "Broward", zips: ["33019", "33020", "33021", "33023", "33024", "33025", "33026", "33027", "33028", "33029"], geo: { lat: 26.0112, lng: -80.1495 }, neighborhoods: ["Hollywood Lakes", "Emerald Hills", "Downtown Hollywood", "Hollywood Hills", "Park East"], roads: "I-95, US-1 and Hollywood Blvd" },
  { slug: "pembroke-pines", name: "Pembroke Pines", county: "Broward", zips: ["33024", "33025", "33026", "33027", "33028", "33029", "33082", "33084"], geo: { lat: 26.0078, lng: -80.2963 }, neighborhoods: ["Pembroke Falls", "Silver Lakes", "Chapel Trail", "Pembroke Lakes", "Century Village"], roads: "I-75, Florida's Turnpike and Pines Blvd" },
  { slug: "coral-springs", name: "Coral Springs", county: "Broward", zips: ["33065", "33067", "33071", "33073", "33075", "33076", "33077"], geo: { lat: 26.2712, lng: -80.2706 }, neighborhoods: ["Eagle Trace", "Heron Bay", "Ramblewood", "Maplewood", "Cypress Run"], roads: "the Sawgrass Expressway, University Dr and Atlantic Blvd" },
  { slug: "west-palm-beach", name: "West Palm Beach", county: "Palm Beach", zips: ["33401", "33405", "33406", "33407", "33409", "33411", "33412", "33413", "33415", "33417"], geo: { lat: 26.7153, lng: -80.0534 }, neighborhoods: ["El Cid", "Flamingo Park", "Northwood", "CityPlace", "Southend", "Palm Beach Lakes"], roads: "I-95, Okeechobee Blvd and Dixie Hwy" },
  { slug: "boca-raton", name: "Boca Raton", county: "Palm Beach", zips: ["33427", "33428", "33431", "33432", "33433", "33434", "33486", "33487", "33496", "33498"], geo: { lat: 26.3683, lng: -80.1289 }, neighborhoods: ["Mizner Park", "Boca Square", "Royal Palm Yacht & CC", "West Boca", "Boca Pointe"], roads: "I-95, Glades Rd and Palmetto Park Rd" },
  { slug: "delray-beach", name: "Delray Beach", county: "Palm Beach", zips: ["33444", "33445", "33446", "33483", "33484"], geo: { lat: 26.4615, lng: -80.0728 }, neighborhoods: ["Atlantic Ave", "Lake Ida", "Seagate", "Tropic Isle", "Kings Point"], roads: "I-95, Atlantic Ave and Federal Hwy" },
  { slug: "boynton-beach", name: "Boynton Beach", county: "Palm Beach", zips: ["33426", "33435", "33436", "33437", "33472", "33473"], geo: { lat: 26.5318, lng: -80.0905 }, neighborhoods: ["Downtown Boynton", "Leisureville", "Hunters Run", "Quail Ridge", "Canyon District"], roads: "I-95, Boynton Beach Blvd and Congress Ave" },
];

export const southFloridaCities: City[] = seeds.map((s) => ({
  slug: s.slug,
  name: s.name,
  state: "FL",
  zips: s.zips,
  geo: s.geo,
  neighborhoods: s.neighborhoods,
  intro: `Need a mobile mechanic in ${s.name}, FL? Mike's Mobile Auto Repair brings dealer-level diagnostics and quality parts to your driveway, condo lot or workplace anywhere in ${s.name} and greater ${s.county} County.`,
  paragraphs: [
    `${s.name} driving is hard on vehicles: stop-and-go traffic on ${s.roads} wears brakes and transmissions early, and South Florida heat and humidity push AC systems, batteries and cooling systems past their limits every summer. We adjust our inspection and parts choices for that workload.`,
    `We cover ${s.name} ZIP codes ${s.zips.join(", ")}, including ${s.neighborhoods.join(", ")}. Diagnostics run on professional scan tools with live data, so you see the actual failure — not just a code.`,
    `Common mobile jobs in ${s.name}: check-engine and no-start diagnostics, brake pads and rotors, starters, alternators, batteries, tune-ups and major repairs. Not sure what's wrong? A $100 diagnosis visit finds the cause, and $50 of it is credited to the repair labor.`,
    `Near the coast, salt air corrodes brake hardware and electrical connectors quickly. We use stainless hardware and seal every connector we open so the repair lasts.`,
    `Call or text (813) 501-7572 to book a mobile mechanic in ${s.name}. Every repair is quoted in writing before work begins and backed by our written warranty.`,
  ],
}));
