import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders, json, requireStaff } from '../_shared/staff-auth.ts'

const PT_BASE = 'https://api.partstech.com'

async function getToken(): Promise<string> {
  const user = Deno.env.get('PARTSTECH_USER')
  const key = Deno.env.get('PARTSTECH_API_KEY')
  if (!user || !key) throw new Error('PartsTech credentials not configured')
  const res = await fetch(`${PT_BASE}/oauth/access`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      accessType: Deno.env.get('PARTSTECH_PARTNER') ? 'user' : 'partner',
      credentials: Deno.env.get('PARTSTECH_PARTNER')
        ? {
            user: { id: user, key },
            partner: { id: Deno.env.get('PARTSTECH_PARTNER'), key: Deno.env.get('PARTSTECH_PARTNER_KEY') ?? key },
          }
        : { partner: { id: user, key } },
    }),
  })
  if (!res.ok) throw new Error(`PartsTech auth failed: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return data.accessToken
}

async function ptFetch(token: string, path: string, body?: unknown, method = 'POST') {
  const res = await fetch(`${PT_BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let data: unknown
  try { data = JSON.parse(text) } catch { data = text }
  return { ok: res.ok, status: res.status, data }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const url = new URL(req.url)
  const action = url.searchParams.get('action') ?? ''

  // PartsTech calls this when the user clicks "Submit Quote" in the punchout
  // session. No staff auth — PartsTech is the caller. Store the quote payload.
  if (action === 'callback') {
    let payload: unknown = null
    let sessionId = url.searchParams.get('sessionId') ?? url.searchParams.get('session_id') ?? ''
    try {
      if (req.method === 'POST') payload = await req.json()
    } catch { /* no body */ }
    if (!sessionId && payload && typeof payload === 'object') {
      sessionId = (payload as Record<string, string>).sessionId ?? (payload as Record<string, string>).session_id ?? ''
    }
    if (!sessionId) return json({ error: 'Missing sessionId' }, 400)
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { error } = await admin.from('partstech_quotes').upsert(
      { session_id: sessionId, payload, updated_at: new Date().toISOString() },
      { onConflict: 'session_id' },
    )
    if (error) return json({ error: error.message }, 500)
    return json({ ok: true })
  }

  // Everything below requires a staff user.
  const staff = await requireStaff(req)
  if (staff instanceof Response) return staff

  const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {}

  try {
    if (action === 'create-quote') {
      const { vin, year, make, model, keyword, estimateId } = body as Record<string, string>
      const searchParams: Record<string, unknown> = {}
      if (vin) searchParams.vin = vin
      else if (year && make && model) searchParams.vehicleParams = { year, make, model }
      if (keyword) searchParams.keyword = keyword
      if (!searchParams.vin && !searchParams.vehicleParams && !searchParams.keyword) {
        return json({ error: 'Provide a VIN, vehicle (year/make/model), or keyword' }, 400)
      }
      const callbackUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/partstech-gateway?action=callback`
      const token = await getToken()
      const { ok, status, data } = await ptFetch(token, '/punchout/quote/create', {
        searchParams,
        urls: {
          callbackUrl,
          returnUrl: body.returnUrl ?? null,
        },
      })
      if (!ok) return json({ error: 'PartsTech quote creation failed', status, detail: data }, 502)
      const sessionId = (data as Record<string, string>).sessionId
      const redirectUrl = (data as Record<string, string>).redirectUrl
      // Pre-create the quote row so the callback can attach and the UI can poll.
      const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
      await admin.from('partstech_quotes').upsert({
        session_id: sessionId,
        estimate_id: estimateId ?? null,
        created_by: staff.userId,
        payload: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'session_id' })
      return json({ sessionId, redirectUrl })
    }

    if (action === 'get-quote') {
      const sessionId = url.searchParams.get('sessionId') ?? (body as Record<string, string>).sessionId
      if (!sessionId) return json({ error: 'Missing sessionId' }, 400)
      const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
      const { data, error } = await admin.from('partstech_quotes').select('*').eq('session_id', sessionId).single()
      if (error) return json({ error: error.message }, 404)
      return json({ quote: data })
    }

    if (action === 'olp-labor') {
      const { year, make, model, job } = body as Record<string, string>
      if (!year || !make || !model) return json({ error: 'Vehicle year, make and model required' }, 400)
      const key = Deno.env.get('OPEN_LABOR_API_KEY')
      if (!key) return json({ error: 'Labor guide key not configured' }, 500)
      const qs = new URLSearchParams({ year: String(year), make: String(make).toLowerCase(), model: String(model).toLowerCase() })
      if (job) qs.set('job', String(job))
      const res = await fetch(`https://openlaborproject.com/api/v1/labor-times?${qs}`, { headers: { 'x-api-key': key } })
      const text = await res.text()
      let data: unknown
      try { data = JSON.parse(text) } catch { data = text }
      if (!res.ok) return json({ error: 'Labor lookup failed', status: res.status, detail: data }, 502)
      const d = (data as any)?.data ?? {}
      const results: { engine: string; job: string; hours: number }[] = []
      for (const e of d.engines ?? []) for (const t of e.laborTimes ?? []) {
        if (typeof t.hours === 'number') results.push({ engine: e.engine ?? '', job: t.job ?? '', hours: t.hours })
      }
      return json({ vehicle: `${d.year ?? year} ${d.make ?? make} ${d.model ?? model}`, results, meta: (data as any)?.meta ?? null })
    }

    if (action === 'labor-search') {
      const { vin, vehicleId, keyword } = body as Record<string, string | number>
      if (!keyword) return json({ error: 'keyword required' }, 400)
      const token = await getToken()
      const { ok, status, data } = await ptFetch(token, '/mitchell1/labor/search', {
        ...(vin ? { vin } : vehicleId ? { vehicleId } : {}),
        keyword,
      })
      if (!ok) return json({ error: 'Labor lookup failed (your PartsTech plan may not include Mitchell 1 labor)', status, detail: data }, 502)
      return json({ results: data })
    }

    return json({ error: `Unknown action: ${action}` }, 400)
  } catch (e) {
    return json({ error: (e as Error).message }, 500)
  }
})
