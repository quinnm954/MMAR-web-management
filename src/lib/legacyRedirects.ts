// Old website addresses Google still lists (Search Console) that no longer
// exist. Each is sent to the closest live page so its ranking value carries
// over instead of landing on "Page not found".

/** Cities we no longer serve in Southwest Florida; their pages fold into Fort Myers. */
export const REMOVED_CITY_SLUGS = [
  "cape-coral",
  "estero",
  "bonita-springs",
  "naples",
  "north-fort-myers",
  "fort-myers-beach",
  "sanibel",
  "san-carlos-park",
];

/** Exact old paths → new paths (checked first). */
const EXACT: Record<string, string> = {
  "/services/tires-wheels": "/services",
  "/services/oil-fluids": "/mmar-care",
  "/engine-diagnostics-lehigh-acres-fl": "/diagnostics-lehigh-acres",
  "/mobile-brake-repair-lehigh-acres": "/brake-repair-lehigh-acres",
  "/mobile-alternator-repair-fort-myers": "/alternator-repair-fort-myers",
};

/** Old addresses seen in Search Console, used to pre-build redirect pages. */
export const KNOWN_LEGACY_PATHS = [
  "/mobile-electrical-repair-estero",
  "/mobile-tire-service-lehigh-acres",
  "/mobile-tire-service-fort-myers",
  "/areas/cape-coral",
  "/areas/estero",
  "/areas/bonita-springs",
  "/mobile-ac-repair-cape-coral",
  "/mobile-ac-repair-estero",
  "/mobile-cooling-system-repair-cape-coral",
  "/mobile-cooling-system-repair-estero",
  "/mobile-brake-repair-cape-coral",
  "/mobile-electrical-repair-cape-coral",
  "/mobile-engine-repair-bonita-springs",
  "/mobile-engine-repair-cape-coral",
  "/mobile-engine-repair-estero",
  "/mobile-fuel-exhaust-repair-estero",
  "/mobile-vehicle-inspection-bonita-springs",
  "/mobile-vehicle-inspection-cape-coral",
  "/mobile-vehicle-inspection-estero",
  "/mobile-mechanic-lehigh-acres-fl",
  "/mobile-mechanic-fort-myers-fl",
  "/battery-replacement-lehigh-acres-fl",
  "/brake-repair-lehigh-acres-fl",
  "/engine-diagnostics-lehigh-acres-fl",
  "/oil-change-lehigh-acres-fl",
  "/services/tires-wheels",
  "/services/oil-fluids",
];

/**
 * Returns the live path an old address should go to, or null when the path
 * is not a known old address. `exists` says whether a path is a live page.
 */
export function legacyRedirect(path: string, exists: (p: string) => boolean): string | null {
  const clean = path.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  if (exists(clean)) return null;
  if (EXACT[clean]) return EXACT[clean];

  // Tire service was discontinued.
  if (clean.includes("tire-service")) return "/services";

  // /areas/<removed city>
  const area = clean.match(/^\/areas\/([a-z-]+)$/);
  if (area && REMOVED_CITY_SLUGS.includes(area[1])) return "/areas/fort-myers";

  // Old "-fl" suffix versions.
  if (clean.endsWith("-fl")) {
    const base = clean.slice(0, -3);
    if (exists(base)) return base;
  }

  // <service>-<removed city> → same service in Fort Myers.
  for (const city of REMOVED_CITY_SLUGS) {
    if (clean.endsWith(`-${city}`)) {
      const swapped = `${clean.slice(0, -city.length - 1)}-fort-myers`;
      return exists(swapped) ? swapped : "/services";
    }
  }
  return null;
}
