import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';

export type AdminRegion = 'all' | 'swfl' | 'sfl' | 'outside';
const KEY = 'adminRegion';
const EVT = 'admin-region-change';
export const REGION_OPTIONS: { value: AdminRegion; label: string; short: string }[] = [
  { value: 'all', label: 'All regions', short: 'All' },
  { value: 'swfl', label: 'Southwest Florida', short: 'SW Florida' },
  { value: 'sfl', label: 'South Florida', short: 'S Florida' },
  { value: 'outside', label: 'Outside service area', short: 'Outside' },
];
export const regionLabel = (slug?: string | null) => REGION_OPTIONS.find((o) => o.value === slug)?.short ?? 'Unknown';

const read = (): AdminRegion => { try { return (localStorage.getItem(KEY) as AdminRegion) || 'all'; } catch { return 'all'; } };

/** Admin-wide region choice, remembered and shared across every admin screen. */
export function useAdminRegion() {
  const [region, setRegionState] = useState<AdminRegion>(read);
  useEffect(() => {
    const h = () => setRegionState(read());
    window.addEventListener(EVT, h);
    return () => window.removeEventListener(EVT, h);
  }, []);
  const setRegion = (r: AdminRegion) => { try { localStorage.setItem(KEY, r); } catch {} window.dispatchEvent(new Event(EVT)); };
  const match = (slug?: string | null) => region === 'all' || (slug || 'swfl') === region;
  return { region, setRegion, match };
}

/** Region tabs with counts. Pass the unfiltered rows so each tab shows its total. */
export function RegionSwitch({ rows }: { rows?: { region_slug?: string | null }[] }) {
  const { region, setRegion } = useAdminRegion();
  const count = (v: AdminRegion) => rows ? (v === 'all' ? rows.length : rows.filter((r) => (r.region_slug || 'swfl') === v).length) : null;
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Region">
      <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
      {REGION_OPTIONS.map((o) => {
        const c = count(o.value);
        return (
          <button key={o.value} role="tab" aria-selected={region === o.value} onClick={() => setRegion(o.value)}
            className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${region === o.value ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:text-foreground'}`}>
            {o.short}{c != null ? ` (${c})` : ''}
          </button>
        );
      })}
    </div>
  );
}

export function RegionChip({ slug, city }: { slug?: string | null; city?: string | null }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
      <MapPin className="h-3 w-3" />{city ? `${city} · ` : ''}{regionLabel(slug)}
    </span>
  );
}
