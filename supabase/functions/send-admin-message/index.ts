// Staff-only: sends a composed message from Admin -> Emails.
import { z } from 'npm:zod@3.23.8'
import { sendAndLog } from '../_shared/send-and-log.ts'
import { corsHeaders, json, requireStaff } from '../_shared/staff-auth.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const Body = z.object({
  to: z.string().email().max(255),
  subject: z.string().min(1).max(300),
  body: z.string().min(1).max(20000),
  threadId: z.string().max(100),
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const auth = await requireStaff(req, ['owner', 'admin'])
  if (auth instanceof Response) return auth
  const parsed = Body.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400)
  const { to, subject, body, threadId } = parsed.data
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) return json({ error: 'Service unavailable' }, 503)
  const admin = createClient(url, key)
  const email = to.trim().toLowerCase()
  const { data: profile, error: profileError } = await admin.from('profiles').select('email').eq('email', email).limit(1).maybeSingle()
  if (profileError) return json({ error: 'Could not verify saved recipient' }, 503)
  // Replying to a genuine saved inbox sender remains possible without a customer profile.
  const { data: inbound, error: inboundError } = profile ? { data: null, error: null } : await admin.from('inbound_messages').select('from_email').eq('from_email', email).limit(1).maybeSingle()
  if (inboundError) return json({ error: 'Could not verify saved recipient' }, 503)
  const recipient = profile?.email || inbound?.from_email
  if (!recipient) return json({ error: 'Choose a saved customer email or an existing inbox sender' }, 400)
  const r = await sendAndLog({
    templateName: 'admin-message',
    manual: true,
    recipientEmail: recipient,
    idempotencyKey: `admin-msg-${crypto.randomUUID()}`,
    templateData: { subject, body },
    metadata: { subject, body_text: body, preview: body.slice(0, 140), thread_id: threadId },
  })
  if (r.error) return json({ error: r.error.message }, 502)
  if (!r.sent) return json({ error: 'This address has unsubscribed or bounced, so it can no longer receive email.' }, 422)
  return json({ ok: true })
})
