// Staff-only: emails the customer that their appointment is confirmed.
import { z } from 'npm:zod@3.23.8'
import { sendAndLog } from '../_shared/send-and-log.ts'
import { corsHeaders, json, requireStaff } from '../_shared/staff-auth.ts'

const Body = z.object({
  recipientEmail: z.string().email().max(255),
  idempotencyKey: z.string().min(1).max(300),
  templateData: z.object({
    customerName: z.string().max(200).optional(),
    appointmentDate: z.string().max(200).optional(),
    serviceType: z.string().max(200).optional().nullable(),
    vehicle: z.string().max(200).optional(),
  }),
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const auth = await requireStaff(req)
  if (auth instanceof Response) return auth
  const parsed = Body.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400)
  const r = await sendAndLog({ templateName: 'appointment-confirmed', ...parsed.data })
  return r.error ? json({ error: r.error.message }, 502) : json({ ok: true, sent: r.sent })
})
