// Google Maps (via connector gateway) → county → service region.
const GW = 'https://connector-gateway.lovable.dev/google_maps';

type Geo = { city: string | null; county: string | null; lat: number | null; lng: number | null };

async function lookup(params: string): Promise<Geo | null> {
  const lov = Deno.env.get('LOVABLE_API_KEY'), key = Deno.env.get('GOOGLE_MAPS_API_KEY');
  if (!lov || !key) throw new Error('Google Maps is not connected');
  const r = await fetch(`${GW}/maps/api/geocode/json?${params}&region=us`, {
    headers: { Authorization: `Bearer ${lov}`, 'X-Connection-Api-Key': key },
  });
  if (!r.ok) throw new Error(`Geocode failed [${r.status}]: ${await r.text()}`);
  const j = await r.json();
  const res = j.results?.[0];
  if (!res) return null;
  const comp = (t: string) => res.address_components?.find((c: any) => c.types.includes(t))?.long_name ?? null;
  return { city: comp('locality') || comp('sublocality') || comp('postal_town'), county: comp('administrative_area_level_2'),
    lat: res.geometry?.location?.lat ?? null, lng: res.geometry?.location?.lng ?? null };
}

export async function geocode(input: { lat?: number | null; lng?: number | null; address?: string | null }): Promise<Geo | null> {
  if (input.lat != null && input.lng != null) {
    const g = await lookup(`latlng=${input.lat},${input.lng}`);
    if (g) return { ...g, lat: input.lat, lng: input.lng };
  }
  const a = (input.address || '').trim();
  if (a.length < 3) return null;
  return lookup(`address=${encodeURIComponent(/\bFL\b|florida/i.test(a) ? a : `${a}, FL`)}`);
}

export async function regionForCounty(sb: any, county: string | null): Promise<string> {
  if (!county) return 'outside';
  const { data } = await sb.from('service_regions').select('slug,counties');
  const hit = (data || []).find((r: any) => (r.counties || []).some((c: string) => c.toLowerCase() === county.toLowerCase()));
  return hit?.slug || 'outside';
}

/** Geocode one booking_requests / appointments row and store city, county and region. Skips manual rows. */
export async function geocodeRow(sb: any, table: 'booking_requests' | 'appointments', id: string) {
  const { data: row } = await sb.from(table).select('*').eq('id', id).maybeSingle();
  if (!row || row.geo_status === 'manual') return null;
  try {
    const g = await geocode({ lat: row.geo_lat, lng: row.geo_lng, address: row.service_address });
    if (!g) { await sb.from(table).update({ geo_status: 'not_found' }).eq('id', id); return null; }
    const region = await regionForCounty(sb, g.county);
    await sb.from(table).update({ geo_city: g.city, geo_county: g.county, geo_lat: g.lat, geo_lng: g.lng, geo_status: 'ok', region_slug: region }).eq('id', id);
    return { ...g, region };
  } catch (e) {
    console.error('geocodeRow', table, id, String(e));
    return null;
  }
}
