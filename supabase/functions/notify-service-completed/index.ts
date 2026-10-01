// Staff-only: emails the customer that a service is complete, and (when an
// invoice exists) that an invoice was issued.
import { z } from 'npm:zod@3.23.8'
import { sendAndLog } from '../_shared/send-and-log.ts'
import { corsHeaders, json, requireStaff } from '../_shared/staff-auth.ts'

const s = (n = 500) => z.string().max(n).optional().nullable()
const Body = z.object({
  kind: z.enum(['service-completed', 'invoice-issued']),
  recipientEmail: z.string().email().max(255),
  idempotencyKey: z.string().min(1).max(300),
  templateData: z.object({
    customerName: s(200), serviceType: s(200), vehicle: s(200), notes: s(2000),
    invoiceNumber: s(100), total: s(50), dueDate: s(50), invoiceUrl: s(500),
  }),
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const auth = await requireStaff(req)
  if (auth instanceof Response) return auth
  const parsed = Body.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400)
  const { kind, ...rest } = parsed.data
  const r = await sendAndLog({ templateName: kind, ...rest })
  return r.error ? json({ error: r.error.message }, 502) : json({ ok: true, sent: r.sent })
})
