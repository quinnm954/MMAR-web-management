// Programmatic service × city landing-page generator.
// Fills out matrix coverage (Top 5 Lee County cities × every mechanical
// service category except bodywork) without overwriting any hand-written
// page in localLandingPages.ts.
//
// Each generated page is unique (city + service interpolated into intro,
// paragraphs, FAQs, included list, and meta) so Google sees real
// long-form content per URL — required for Map Pack ranking signals.

import type { LocalLandingPage } from "./localLandingPages";
import { categories } from "./serviceCategories";
import { cities } from "./cities";

// Top 5 Lee County target cities (matrix scope).
const MATRIX_CITY_SLUGS = new Set([
  "fort-myers",
  "cape-coral",
  "lehigh-acres",
  "bonita-springs",
  "estero",
]);

// Maps a service category id to a URL-friendly service slug.
const CATEGORY_SLUGS: Record<string, string> = {
  engine: "mobile-engine-repair",
  "oil-fluids": "mobile-oil-change",
  brakes: "mobile-brake-repair",
  electrical: "mobile-electrical-repair",
  "ac-heating": "mobile-ac-repair",
  cooling: "mobile-cooling-system-repair",
  transmission: "mobile-transmission-repair",
  suspension: "mobile-suspension-repair",
  "tires-wheels": "mobile-tire-service",
  "fuel-exhaust": "mobile-fuel-exhaust-repair",
  inspections: "mobile-vehicle-inspection",
};

// Friendly service name used in copy + meta.
const SERVICE_LABEL: Record<string, string> = {
  engine: "Mobile Engine Repair",
  "oil-fluids": "Mobile Oil Change",
  brakes: "Mobile Brake Repair",
  electrical: "Mobile Electrical & Battery Repair",
  "ac-heating": "Mobile AC Repair",
  cooling: "Mobile Cooling System Repair",
  transmission: "Mobile Transmission Repair",
  suspension: "Mobile Suspension & Steering Repair",
  "tires-wheels": "Mobile Tire Service",
  "fuel-exhaust": "Mobile Fuel & Exhaust Repair",
  inspections: "Mobile Vehicle Inspection",
};

// Short service-specific opening sentence used in intro / meta.
const SERVICE_OPENER: Record<string, string> = {
  engine: "On-site engine diagnostics, tune-ups, and repair — from misfires and timing components to check-engine-light troubleshooting",
  "oil-fluids": "Mobile oil changes and full fluid services — conventional, blend, and full synthetic, with OE-spec filters",
  brakes: "On-site brake pad, rotor, caliper, and ABS service with up-front, written quotes",
  electrical: "Mobile battery, alternator, starter, and electrical-system diagnostics with bidirectional scan tools",
  "ac-heating": "On-site AC diagnostics, recharge, and compressor work — R-134a and R-1234yf supported, never cross-contaminated",
  cooling: "Mobile cooling-system service — radiators, water pumps, thermostats, hoses, and overheating diagnostics",
  transmission: "On-site transmission diagnostics, fluid services, CV axles, clutch and drivetrain repair",
  suspension: "Mobile shocks, struts, control arms, ball joints, tie rods, and wheel-bearing service at your location",
  "tires-wheels": "Mobile flat-tire repair, rotation, TPMS service, and wheel-hub work in your driveway",
  "fuel-exhaust": "On-site fuel pump, injector, exhaust, oxygen sensor, and catalytic converter diagnostics",
  inspections: "Mobile pre-purchase, multi-point, safety, and fleet inspections at your home or jobsite",
};

// Service-specific procedure paragraph (unique per service).
const SERVICE_PARAGRAPH: Record<string, string> = {
  engine:
    "Engine diagnostics start with a documented live-data capture, not a parts-cannon. We pull mode-six monitors, fuel-trim history, misfire counters, and freeze-frame data, then verify with a scope on suspect circuits. Timing-component work is done to OE service procedure — including TDC verification, tensioner reset, and cam-correlation re-learn where required.",
  "oil-fluids":
    "Oil services use OE-spec filters and the correct viscosity per the manufacturer's published chart for ambient temperature — Florida's heat moves a lot of vehicles to a different grade than the door sticker suggests. Severe-service intervals apply to almost everyone here. Drain plugs are torqued to spec; filters are pre-filled where the OE design allows.",
  brakes:
    "Pad measurement to discard spec, rotor thickness with a micrometer, lateral runout under 0.002\" verified with a dial indicator, G3500-grade carbon castings on replacement rotors, caliper slide pins cleaned and re-greased with high-temp synthetic. Brake fluid moisture is tested with a refractometer; >3% triggers a DOT 4 flush.",
  electrical:
    "Voltage drop on B+ and ground cables under load (target <0.3V each), AC ripple at the B+ post on a scope (anything over 100 mV peak-to-peak indicates a failing diode pack), parasitic-draw isolation with an inductive amp clamp (<50 mA after 40-minute module sleep). BMS battery registration on stop/start vehicles is mandatory after every battery replacement.",
  "ac-heating":
    "Refrigerant identified before any service to prevent cross-contamination, evacuation to 29 in Hg with a 30-minute hold, charge by weight to OE spec — never by sight glass or low-side pressure. Compressor replacements always include receiver/drier, expansion device, full system flush, and PAG oil charged to OE volume.",
  cooling:
    "Cooling-system pressure test before any teardown, coolant pH check with strips, electric-fan command via bidirectional scan tool, thermostat verification with an IR thermometer at the housing inlet/outlet. Coolant is refilled with the OE-correct chemistry — IAT, OAT, HOAT, and Si-OAT are not interchangeable.",
  transmission:
    "Transmission fluid is OE-spec only — the wrong friction modifier will cause shift flare or shudder within weeks. CVT fluid is a separate spec from ATF; we keep both. Clutch and drivetrain work is done to factory torque spec with new hardware where the manufacturer specifies one-time-use bolts.",
  suspension:
    "Suspension work is measured: ball-joint axial and radial play to spec, control-arm bushings inspected for cracks and offset, tie-rod ends checked for looseness on a turn-plate, wheel bearings tested for noise and play before and after replacement. Wheel torque is set with a calibrated click wrench in the correct star pattern, never an impact gun on final.",
  "tires-wheels":
    "Tires are inspected for date code (anything over 6 years gets recommended for replacement regardless of tread), tread depth in three positions across the face, and sidewall damage. TPMS sensors are interrogated and re-learned to the vehicle, never reset by a workaround that hides a failed sensor.",
  "fuel-exhaust":
    "Fuel-system work starts with a pressure and volume test at the rail, not just a 'pump runs' check. Injector balance is verified with mode-six fuel-trim data. Exhaust leak diagnosis uses a smoke machine on the entire system, then a manifold leak-down check on suspect joints. Catalytic converters are condemned only after pre- and post-cat O2 waveform capture confirms catalyst inefficiency.",
  inspections:
    "Inspections follow a documented checklist — brakes, suspension, steering, drivetrain, cooling, AC, electrical, tires, glass, lights, and a scan-tool report on stored and pending codes. Pre-purchase inspections include a road-test data capture and a written report you can share with the seller.",
};

// Common-included items per service.
const SERVICE_INCLUDED: Record<string, string[]> = {
  engine: [
    "Live-data scan-tool capture",
    "Misfire and fuel-trim analysis",
    "Spark plug, coil, and ignition service",
    "Timing belt / chain replacement",
    "Valve cover gasket replacement",
    "Written diagnostic report",
  ],
  "oil-fluids": [
    "Conventional, blend, or full synthetic",
    "OE-spec oil filter",
    "Top-off of all under-hood fluids",
    "21-point visual inspection",
    "Tire pressure check",
    "Reset of oil-life monitor",
  ],
  brakes: [
    "Pad replacement (ceramic or semi-metallic)",
    "Rotor replacement or measured resurface",
    "Caliper service or replacement",
    "Brake fluid moisture test",
    "DOT 4 brake fluid flush",
    "ABS scan and bleed",
  ],
  electrical: [
    "Battery load test and replacement",
    "Alternator output and ripple test",
    "Starter draw test",
    "Parasitic-draw isolation",
    "BMS battery registration",
    "Wiring and connector repair",
  ],
  "ac-heating": [
    "Refrigerant identification (R-134a / R-1234yf)",
    "Evacuation to 29 in Hg with 30-minute hold",
    "Charge by weight to OE spec",
    "UV-dye and electronic leak detection",
    "Compressor, condenser, evaporator service",
    "Cabin air filter replacement",
  ],
  cooling: [
    "Cooling-system pressure test",
    "Radiator and water pump replacement",
    "Thermostat replacement with verification",
    "Hose and clamp replacement",
    "OE-correct coolant refill",
    "Electric-fan operation test",
  ],
  transmission: [
    "Transmission fluid service (ATF, CVT, DCT)",
    "CV axle and driveshaft work",
    "Clutch service",
    "Differential fluid service",
    "Diagnostic scan and adaptive-shift relearn",
    "Up-front, written quote",
  ],
  suspension: [
    "Shocks and struts",
    "Control arms and bushings",
    "Ball joints and tie rods",
    "Sway bar links",
    "Wheel bearings and hubs",
    "Power-steering service",
  ],
  "tires-wheels": [
    "Flat tire repair (plug-patch where safe)",
    "Tire rotation in correct pattern",
    "TPMS sensor service and relearn",
    "Wheel hub replacement",
    "Date-code and tread depth report",
    "Calibrated lug torque",
  ],
  "fuel-exhaust": [
    "Fuel pump and pressure-regulator service",
    "Fuel injector cleaning or replacement",
    "Fuel filter replacement",
    "Exhaust leak repair",
    "Oxygen sensor replacement",
    "Catalytic converter diagnosis",
  ],
  inspections: [
    "Documented multi-point checklist",
    "Pre-purchase inspection with road test",
    "Scan tool report",
    "Photos of any defects found",
    "Fleet PM scheduling",
    "Written report you can share",
  ],
};

const SITE = "https://mikesmautorepair.com";

function buildPage(categoryId: string, citySlug: string): LocalLandingPage | null {
  const cat = categories.find((c) => c.id === categoryId);
  const city = cities.find((c) => c.slug === citySlug);
  if (!cat || !city) return null;

  const serviceLabel = SERVICE_LABEL[categoryId];
  const slugBase = CATEGORY_SLUGS[categoryId];
  if (!serviceLabel || !slugBase) return null;

  const slug = `${slugBase}-${city.slug}`;
  const opener = SERVICE_OPENER[categoryId];
  const proc = SERVICE_PARAGRAPH[categoryId];
  const included = SERVICE_INCLUDED[categoryId];

  const neighborhoodList = city.neighborhoods.slice(0, 4).join(", ");
  const zipList = city.zips.join(", ");

  const intro =
    `${opener} — delivered to driveways, condos, apartment complexes, and workplaces across ${city.name}, ${city.state}. ` +
    `Our service truck arrives with bidirectional scan tools, OE-spec parts, and the documented procedure that separates a real repair from a parts swap.`;

  const paragraphs = [
    `Coverage spans every ${city.name} ZIP — ${zipList} — and every neighborhood, including ${neighborhoodList}. ${city.intro}`,
    proc,
    `${serviceLabel} pricing in ${city.name} matches or beats brick-and-mortar shops once the tow and the lost workday are factored in. We quote in writing before any work begins, and the diagnostic fee is waived when you book the repair. Same-day windows are typical for in-stock work; special-order parts may push to next day.`,
    `Every job is backed by our 12-month / 12,000-mile warranty on parts and labor. If a repair has a problem after we leave, the same technician returns at no charge — there's no dispatcher and no second-tier sub. Real ASE-grade work, real accountability.`,
    `Need ${serviceLabel.toLowerCase()} in ${city.name} today? Call or text (813) 501-7572. A real technician answers and quotes the work in writing before anything starts.`,
  ];

  const faqs = [
    {
      q: `Do you really come to my driveway in ${city.name} for ${serviceLabel.toLowerCase()}?`,
      a: `Yes — every ${city.name} ZIP (${zipList}). ${serviceLabel} is a default service from our truck. Most jobs are completed on site with no tow and no second-car shuffle.`,
    },
    {
      q: `How much does ${serviceLabel.toLowerCase()} cost in ${city.name}?`,
      a: `Pricing is at or below brick-and-mortar shop rates once tow and rental are factored out. We quote every ${serviceLabel.toLowerCase()} job in writing before work begins, and the diagnostic fee is waived if you book the repair.`,
    },
    {
      q: `Can you do same-day ${serviceLabel.toLowerCase()} in ${city.name}?`,
      a: `Almost always for in-stock work. ${city.name} is inside our standard service area, so there is no trip fee, and our truck is loaded for most ${cat.title.toLowerCase()} jobs. Special-order parts may push to next-day.`,
    },
    {
      q: `What's your warranty on ${serviceLabel.toLowerCase()}?`,
      a: `12 months / 12,000 miles on parts and labor for most repairs, in writing. Comebacks are handled by the same technician — no dispatcher, no third-party sub.`,
    },
    {
      q: `What scan-tool coverage do you bring to ${city.name}?`,
      a: `Autel MS909 and Snap-on Zeus with bidirectional control, plus manufacturer software for GM (GDS2), Ford (FDRS), Chrysler/Stellantis (wiTECH), and Toyota (Techstream). That's enough to cover ABS bleeds, BMS battery registration, throttle-body relearns, EVAP solenoid actuation, and most module programming.`,
    },
  ];

  return {
    slug,
    service: serviceLabel,
    citySlug: city.slug,
    categoryId,
    h1: `${serviceLabel} in ${city.name}, ${city.state}`,
    metaTitle: `${serviceLabel} in ${city.name}, ${city.state} | Mike's Mobile Auto Repair`,
    metaDescription: `${serviceLabel} in ${city.name}, ${city.state}. Mobile mechanic comes to you across ${zipList}. Up-front quotes, 12-mo/12k warranty. Call (813) 501-7572.`,
    canonical: `${SITE}/${slug}`,
    intro,
    paragraphs,
    included,
    faqs,
  };
}

export function buildMatrixPages(
  existingSlugs: Set<string>
): LocalLandingPage[] {
  const out: LocalLandingPage[] = [];
  for (const cat of categories) {
    if (!CATEGORY_SLUGS[cat.id]) continue;
    for (const city of cities) {
      if (!MATRIX_CITY_SLUGS.has(city.slug)) continue;
      const page = buildPage(cat.id, city.slug);
      if (!page) continue;
      // Don't overwrite hand-written pages.
      if (existingSlugs.has(page.slug)) continue;
      // Also skip if a hand-written page already covers this exact
      // (categoryId × citySlug) pair under a different slug.
      // (handled by the consumer — see localLandingPages.ts)
      out.push(page);
    }
  }
  return out;
}

export const MATRIX_CITY_SLUGS_LIST = Array.from(MATRIX_CITY_SLUGS);
