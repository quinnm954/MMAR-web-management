// NHTSA VIN decoder - free, no API key required
export interface DecodedVin {
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
  engine?: string;
  bodyClass?: string;
}

export async function decodeVin(vin: string): Promise<DecodedVin | null> {
  const cleaned = vin.trim().toUpperCase();
  if (cleaned.length !== 17) return null;
  try {
    const res = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${cleaned}?format=json`
    );
    const data = await res.json();
    const r = data?.Results?.[0];
    if (!r) return null;
    const yr = parseInt(r.ModelYear, 10);
    const engineParts = [r.DisplacementL ? `${r.DisplacementL}L` : null, r.EngineCylinders ? `${r.EngineCylinders}cyl` : null, r.FuelTypePrimary]
      .filter(Boolean)
      .join(" ");
    return {
      year: Number.isFinite(yr) ? yr : undefined,
      make: r.Make || undefined,
      model: r.Model || undefined,
      trim: r.Trim || undefined,
      engine: engineParts || undefined,
      bodyClass: r.BodyClass || undefined,
    };
  } catch {
    return null;
  }
}
