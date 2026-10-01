import { createClient } from 'npm:@supabase/supabase-js@2'
import { EmailAPIError } from 'npm:@lovable.dev/email-js@0.1.0'
import { sendTemplateEmail } from './transactional-email-templates/send-email.ts'
import { TEMPLATES } from './transactional-email-templates/registry.ts'

// Server-only. Sends a registered app email through Lovable's managed email
// API and records the outcome in email_send_log (the admin Emails screen
// reads it, including `metadata` for composed admin messages).
// Never throws: returns { error } so callers keep their existing flow.

export interface SendAndLogParams {
  templateName: string
  recipientEmail: string
  idempotencyKey: string
  templateData?: Record<string, unknown>
  metadata?: Record<string, unknown> | null
}

export interface SendAndLogResult {
  sent: boolean
  suppressed?: boolean
  status?: number
  error?: { message: string; code?: string; status?: number }
}

let client: ReturnType<typeof createClient> | null = null
function db() {
  if (!client) {
    client = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
  }
  return client
}

async function log(row: Record<string, unknown>) {
  try {
    const { error } = await db().from('email_send_log').insert(row)
    if (error) console.error('email_send_log insert failed', { code: error.code, message: error.message })
  } catch (e) {
    console.error('email_send_log insert threw', e)
  }
}

export async function sendAndLog(p: SendAndLogParams): Promise<SendAndLogResult> {
  const recipient = TEMPLATES[p.templateName]?.to || p.recipientEmail
  const base = {
    message_id: crypto.randomUUID(),
    template_name: p.templateName,
    recipient_email: recipient,
    metadata: p.metadata ?? null,
  }
  try {
    const r = await sendTemplateEmail(p.templateName, p.recipientEmail, {
      templateData: p.templateData as Record<string, any>,
      idempotencyKey: p.idempotencyKey,
    })
    if (r.sent) {
      await log({ ...base, status: 'sent' })
      return { sent: true }
    }
    await log({ ...base, status: 'suppressed' })
    return { sent: false, suppressed: true }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    const status = e instanceof EmailAPIError ? e.status : undefined
    const code = e instanceof EmailAPIError ? e.code : undefined
    await log({ ...base, status: 'failed', error_message: message.slice(0, 1000) })
    return { sent: false, status, error: { message, code, status } }
  }
}
