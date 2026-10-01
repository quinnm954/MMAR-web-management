// Called by the database when a technician is assigned to an appointment.
// Everything is looked up server-side from the appointment id.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { z } from 'npm:zod@3.23.8'
import { sendAndLog } from '../_shared/send-and-log.ts'
import { corsHeaders, json } from '../_shared/staff-auth.ts'

const Body = z.object({ appointmentId: z.string().uuid() })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const parsed = Body.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return json({ error: 'Invalid request' }, 400)

  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { data: a } = await sb
    .from('appointments')
    .select('id, service_type, description, service_address, scheduled_at, customer_id, vehicle_id, assigned_technician_id')
    .eq('id', parsed.data.appointmentId)
    .maybeSingle()
  if (!a?.assigned_technician_id) return json({ ok: true, skipped: true })

  const [{ data: tech }, { data: cust }, { data: veh }] = await Promise.all([
    sb.from('profiles').select('email, full_name').eq('id', a.assigned_technician_id).maybeSingle(),
    sb.from('profiles').select('full_name, phone').eq('id', a.customer_id).maybeSingle(),
    a.vehicle_id
      ? sb.from('vehicles').select('year, make, model').eq('id', a.vehicle_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])
  if (!tech?.email?.trim()) return json({ ok: true, skipped: true })

  const vehicle = veh ? [veh.year, veh.make, veh.model].filter(Boolean).join(' ') || undefined : undefined
  const scheduledAt = a.scheduled_at
    ? new Date(a.scheduled_at).toLocaleString('en-US', {
        timeZone: 'America/New_York', month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : undefined

  await sendAndLog({
    templateName: 'tech-job-assigned',
    recipientEmail: tech.email,
    idempotencyKey: `tech-job-assigned-${a.id}-${a.assigned_technician_id}`,
    templateData: {
      technicianName: tech.full_name, customerName: cust?.full_name, customerPhone: cust?.phone,
      serviceType: a.service_type, vehicle, scheduledAt, serviceAddress: a.service_address,
      description: a.description, jobsUrl: 'https://shop-flow-home.lovable.app/tech/jobs',
    },
  })
  return json({ ok: true })
})
