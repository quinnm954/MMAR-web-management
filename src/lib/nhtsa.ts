// Free NHTSA vCAN/vPIC API helpers — no API key required.

export interface VinDecodeResult {
  vin: string;
  year: number | null;
  make: string | null;
  model: string | null;
  trim: string | null;
  engine: string | null;
}

const get = (rows: Array<{ Variable: string; Value: string | null }>, key: string) =>
  rows.find((r) => r.Variable === key)?.Value || null;

export async function decodeVin(vin: string): Promise<VinDecodeResult | null> {
  const clean = vin.trim().toUpperCase();
  if (clean.length !== 17) return null;
  try {
    const res = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${clean}?format=json`,
    );
    if (!res.ok) return null;
    const json = await res.json();
    const rows = json.Results as Array<{ Variable: string; Value: string | null }>;
    const yearStr = get(rows, "Model Year");
    const engineCfg = get(rows, "Engine Configuration");
    const displ = get(rows, "Displacement (L)");
    const cyl = get(rows, "Engine Number of Cylinders");
    const engineParts = [displ ? `${parseFloat(displ).toFixed(1)}L` : null, cyl ? `${cyl}cyl` : null, engineCfg]
      .filter(Boolean)
      .join(" ");
    return {
      vin: clean,
      year: yearStr ? parseInt(yearStr) : null,
      make: get(rows, "Make"),
      model: get(rows, "Model"),
      trim: get(rows, "Trim") || get(rows, "Series"),
      engine: engineParts || null,
    };
  } catch {
    return null;
  }
}

export async function getMakes(): Promise<string[]> {
  try {
    const res = await fetch(
      "https://vpic.nhtsa.dot.gov/api/vehicles/GetMakesForVehicleType/car?format=json",
    );
    const json = await res.json();
    return (json.Results as Array<{ MakeName: string }>).map((r) => r.MakeName).sort();
  } catch {
    return [];
  }
}

export async function getModels(make: string, year: number): Promise<string[]> {
  try {
    const res = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/${encodeURIComponent(
        make,
      )}/modelyear/${year}?format=json`,
    );
    const json = await res.json();
    return (json.Results as Array<{ Model_Name: string }>).map((r) => r.Model_Name).sort();
  } catch {
    return [];
  }
}
