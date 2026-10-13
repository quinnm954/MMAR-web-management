// Admin-only: re-run the location lookup for one record, or backfill pending ones in small batches.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { z } from 'npm:zod@3.23.8'
import { corsHeaders, json } from '../_shared/staff-auth.ts'
import { geocodeRow, geocode, regionForCounty } from '../_shared/geocode-region.ts'

const Body = z.object({
  table: z.enum(['booking_requests', 'appointments', 'profiles']).optional(),
  id: z.string().uuid().optional(),
  backfill: z.boolean().optional(),
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const token = req.headers.get('Authorization')?.replace('Bearer ', '') || ''
  const { data: u } = await sb.auth.getUser(token)
  if (!u?.user) return json({ error: 'Unauthorized' }, 401)
  const { data: isAdmin } = await sb.rpc('has_role', { _user_id: u.user.id, _role: 'admin' })
  const { data: isOwner } = await sb.rpc('has_role', { _user_id: u.user.id, _role: 'owner' })
  if (!isAdmin && !isOwner) return json({ error: 'Admins only' }, 403)

  const p = Body.safeParse(await req.json().catch(() => ({})))
  if (!p.success) return json({ error: p.error.flatten().fieldErrors }, 400)

  if (p.data.id && p.data.table && p.data.table !== 'profiles') {
    return json({ result: await geocodeRow(sb, p.data.table, p.data.id) })
  }

  if (p.data.backfill) {
    let done = 0
    for (const table of ['booking_requests', 'appointments'] as const) {
      const { data } = await sb.from(table).select('id').eq('geo_status', 'pending').not('service_address', 'is', null).limit(40)
      for (const r of data || []) { await geocodeRow(sb, table, r.id); done++ }
    }
    // Customer home region from profile address (feeds estimates/invoices without an appointment).
    const { data: profs } = await sb.from('profiles').select('id,address_line1,city,state,postal_code').is('region_slug', null).not('city', 'is', null).limit(40)
    for (const pr of profs || []) {
      try {
        const g = await geocode({ address: [pr.address_line1, pr.city, pr.state, pr.postal_code].filter(Boolean).join(', ') })
        await sb.from('profiles').update({ region_slug: await regionForCounty(sb, g?.county ?? null) }).eq('id', pr.id)
        done++
      } catch (e) { console.error('profile geocode', pr.id, String(e)) }
    }
    const { count } = await sb.from('booking_requests').select('id', { count: 'exact', head: true }).eq('geo_status', 'pending').not('service_address', 'is', null)
    const { count: c2 } = await sb.from('appointments').select('id', { count: 'exact', head: true }).eq('geo_status', 'pending').not('service_address', 'is', null)
    return json({ done, remaining: (count || 0) + (c2 || 0) })
  }
  return json({ error: 'Nothing to do' }, 400)
})
