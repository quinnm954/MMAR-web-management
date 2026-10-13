import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { MapPin } from 'lucide-react';
import { toast } from 'sonner';

type Region = { slug: string; name: string; active: boolean; cities: string[] };
type Tech = { id: string; name: string };

/** Service regions: launch switch per region and which techs work each one. */
export default function AdminRegionsCard() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [techs, setTechs] = useState<Tech[]>([]);
  const [links, setLinks] = useState<Set<string>>(new Set());

  const load = async () => {
    const [{ data: r }, { data: roles }, { data: l }] = await Promise.all([
      supabase.from('service_regions').select('slug,name,active,cities').order('created_at'),
      supabase.from('user_roles').select('user_id').eq('role', 'technician'),
      supabase.from('user_service_regions').select('user_id,region_slug'),
    ]);
    setRegions((r as Region[]) || []);
    const ids = [...new Set((roles || []).map((x: any) => x.user_id))];
    if (ids.length) {
      const { data: p } = await supabase.from('profiles').select('id,full_name,email').in('id', ids);
      setTechs((p || []).map((x: any) => ({ id: x.id, name: x.full_name || x.email || 'Technician' })));
    } else setTechs([]);
    setLinks(new Set((l || []).map((x: any) => `${x.user_id}:${x.region_slug}`)));
  };
  useEffect(() => { load(); }, []);

  const toggleRegion = async (r: Region, on: boolean) => {
    if (on && !confirm(`Launch ${r.name}? The receptionist and booking will start accepting customers there.`)) return;
    const { error } = await supabase.from('service_regions').update({ active: on }).eq('slug', r.slug);
    if (error) return toast.error(error.message);
    toast.success(on ? `${r.name} is live. Tap "Update AI receptionist" in Phone settings.` : `${r.name} switched off`);
    load();
  };

  const toggleTech = async (uid: string, slug: string, on: boolean) => {
    const q = on
      ? supabase.from('user_service_regions').insert({ user_id: uid, region_slug: slug })
      : supabase.from('user_service_regions').delete().eq('user_id', uid).eq('region_slug', slug);
    const { error } = await q;
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" />Service regions</CardTitle>
        <CardDescription>Switch a region on to launch it, and pick which techs work there.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {regions.map((r) => (
          <div key={r.slug} className="rounded-lg border p-3 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold">{r.name}</p>
                <p className="text-xs text-muted-foreground">{r.cities.join(', ')}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground">{r.active ? 'Live' : 'Off'}</span>
                <Switch checked={r.active} onCheckedChange={(v) => toggleRegion(r, v)} aria-label={`Launch ${r.name}`} />
              </div>
            </div>
            {techs.length > 0 && (
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {techs.map((t) => {
                  const on = links.has(`${t.id}:${r.slug}`);
                  return (
                    <label key={t.id} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={on} onCheckedChange={(v) => toggleTech(t.id, r.slug, !!v)} />{t.name}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
