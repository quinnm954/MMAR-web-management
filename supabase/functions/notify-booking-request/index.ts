// Public: after a website booking is submitted, sends the customer confirmation
// and the shop alert. All data comes from the saved booking row (looked up by
// its private token), never from the browser.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { z } from 'npm:zod@3.23.8'
import { sendAndLog } from '../_shared/send-and-log.ts'
import { buildLaborQuote, createDraftEstimate } from '../_shared/labor-quote.ts'
import { corsHeaders, json } from '../_shared/staff-auth.ts'

const ADMIN_EMAIL = 'quinnm954@gmail.com'
const SITE_URL = 'https://mikesmautorepair.com'
const Body = z.object({ token: z.string().min(8).max(200) })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const parsed = Body.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return json({ error: 'Invalid request' }, 400)

  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { data: b } = await sb
    .from('booking_requests')
    .select('*')
    .eq('confirmation_token', parsed.data.token)
    .maybeSingle()
  if (!b) return json({ error: 'Not found' }, 404)
  // Only notify for fresh submissions (limits abuse / replays).
  if (Date.now() - new Date(b.created_at).getTime() > 15 * 60 * 1000) return json({ ok: true, skipped: true })

  const shared = {
    customerName: b.customer_name,
    customerPhone: b.customer_phone,
    customerEmail: b.customer_email || undefined,
    serviceType: b.service_type,
    vehicle: b.vehicle_info || undefined,
    requestedDate: b.requested_date ? new Date(`${String(b.requested_date).slice(0, 10)}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : undefined,
    requestedTimeWindow: b.requested_time_window || undefined,
    serviceAddress: b.service_address || undefined,
    description: b.description || undefined,
    source: b.source,
  }
  if (b.customer_email) {
    await sendAndLog({
      templateName: 'booking-request-received',
      recipientEmail: b.customer_email,
      idempotencyKey: `booking-req-customer-${b.id}`,
      templateData: shared,
    })
  }
  await sendAndLog({
    templateName: 'admin-new-booking-request',
    recipientEmail: ADMIN_EMAIL,
    idempotencyKey: `booking-req-admin-${b.id}`,
    templateData: { ...shared, adminUrl: `${SITE_URL}/admin/bookings` },
  })
  // Read the description for job clues and leave an unsent draft estimate so nothing is booked without a price.
  if (!b.draft_estimate_id) {
    try {
      const q = await buildLaborQuote(sb, b)
      const id = q.kind === 'none' ? null : await createDraftEstimate(sb, b, q)
      if (id) await sb.from('booking_requests').update({ draft_estimate_id: id }).eq('id', b.id)
    } catch (e) { console.error('draft estimate', e) }
  }
  return json({ ok: true })
})
