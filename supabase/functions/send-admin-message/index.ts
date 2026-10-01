// Staff-only: sends a composed message from Admin -> Emails.
import { z } from 'npm:zod@3.23.8'
import { sendAndLog } from '../_shared/send-and-log.ts'
import { corsHeaders, json, requireStaff } from '../_shared/staff-auth.ts'

const Body = z.object({
  to: z.string().email().max(255),
  subject: z.string().min(1).max(300),
  body: z.string().min(1).max(20000),
  threadId: z.string().max(100),
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const auth = await requireStaff(req)
  if (auth instanceof Response) return auth
  const parsed = Body.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400)
  const { to, subject, body, threadId } = parsed.data
  const r = await sendAndLog({
    templateName: 'admin-message',
    recipientEmail: to,
    idempotencyKey: `admin-msg-${crypto.randomUUID()}`,
    templateData: { subject, body },
    metadata: { subject, body_text: body, preview: body.slice(0, 140), thread_id: threadId },
  })
  if (r.error) return json({ error: r.error.message }, 502)
  if (!r.sent) return json({ error: 'This address has unsubscribed or bounced, so it can no longer receive email.' }, 422)
  return json({ ok: true })
})
