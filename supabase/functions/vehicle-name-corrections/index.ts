import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, json, requireStaff } from '../_shared/staff-auth.ts';
import catalog from '../_shared/vehicle-name-catalog.json' with { type: 'json' };
import { closestNames, nameKey } from '../_shared/vehicle-name-match.ts';

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const staff = await requireStaff(req, ['owner', 'admin']);
  if (staff instanceof Response) return staff;
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) return json({ error: 'Vehicle correction unavailable' }, 503);
  const sb = createClient(url, key);
  try {
    const body = await req.json();
    if (body.action === 'initialize') {
      const rows = [...new Map(catalog.map(r => [`${r.make}|${r.model}`, r])).values()];
      for (let i = 0; i < rows.length; i += 250) {
        const { error } = await sb.from('vehicle_name_catalog').upsert(rows.slice(i, i + 250));
        if (error) throw error;
      }
      const { data: vehicles, error } = await sb.from('vehicles').select('id,make,model');
      if (error) throw error;
      let corrected = 0;
      for (const v of vehicles || []) {
        const { data, error } = await sb.from('vehicles').update({ make: v.make.trim(), model: v.model.trim() }).eq('id', v.id).select('make,model').single();
        if (error) throw error;
        if (data.make !== v.make || data.model !== v.model) corrected++;
      }
      return json({ corrected, catalogCount: rows.length });
    }
    if (body.action === 'apply') {
      const make = String(body.make || '').trim(); const model = String(body.model || '').trim();
      if (!make || !model || make.length > 80 || model.length > 120) return json({ error: 'Make and model required' }, 400);
      const { error } = await sb.from('vehicles').update({ make, model }).eq('id', body.id).eq('make', body.oldMake).eq('model', body.oldModel).select('id').single();
      if (error) throw new Error('Vehicle changed or could not be saved. Refresh and retry.');
      return json({ ok: true });
    }
    const { data: vehicles, error } = await sb.from('vehicles').select('id,owner_id,year,make,model').order('make');
    if (error) throw error;
    const makes = [...new Set(catalog.map(r => r.make))];
    const reviews = (vehicles || []).flatMap(v => {
      const exactMake = makes.find(m => nameKey(m) === nameKey(v.make));
      const candidates = catalog.filter(r => r.make === exactMake).map(r => r.model);
      if (candidates.some(m => nameKey(m) === nameKey(v.model))) return [];
      // Preserve trim-bearing models; the owner can still edit them elsewhere.
      if (candidates.some(m => nameKey(m).length >= 3 && nameKey(v.model).startsWith(nameKey(m)))) return [];
      const nearestMake = closestNames(v.make, makes)[0];
      return [{ ...v, suggestedMake: exactMake || (nearestMake?.distance <= 2 ? nearestMake.name : v.make),
        suggestions: closestNames(v.model, candidates).filter(c => c.distance <= Math.max(3, nameKey(v.model).length / 2)).map(c => c.name) }];
    });
    return json({ reviews });
  } catch (e) { return json({ error: e instanceof Error ? e.message : 'Vehicle correction failed' }, 500); }
});