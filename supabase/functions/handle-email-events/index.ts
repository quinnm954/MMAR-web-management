import { createEmailWebhookHandler } from 'npm:@lovable.dev/email-js@0.1.0'
import { createClient } from 'npm:@supabase/supabase-js@2'

const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

type Reason = 'bounce' | 'complaint' | 'unsubscribe'
const STATUS: Record<Reason, string> = { bounce: 'bounced', complaint: 'complained', unsubscribe: 'suppressed' }
const MESSAGE: Record<Reason, string> = {
  bounce: 'Permanent bounce — email address is invalid or rejected',
  complaint: 'Spam complaint — recipient marked email as spam',
  unsubscribe: 'Recipient unsubscribed',
}

// Records the outcome in the app's own history (notification only — Lovable
// already blocks future sends to this address).
async function record(reason: Reason, eventId: string, recipient: string) {
  const email = recipient.toLowerCase()
  const { error: upErr } = await sb
    .from('suppressed_emails')
    .upsert({ email, reason, metadata: null }, { onConflict: 'email' })
  if (upErr) {
    console.error('suppressed_emails upsert failed', { code: upErr.code, message: upErr.message, event_id: eventId })
    throw new Error('suppressed_emails upsert failed')
  }
  const { error: logErr } = await sb.from('email_send_log').insert({
    message_id: null,
    template_name: 'system',
    recipient_email: email,
    status: STATUS[reason],
    error_message: MESSAGE[reason],
    metadata: null,
  })
  if (logErr) {
    console.error('email_send_log insert failed', { code: logErr.code, message: logErr.message, event_id: eventId })
    throw new Error('email_send_log insert failed')
  }
}

const handler = createEmailWebhookHandler({
  apiKey: Deno.env.get('LOVABLE_API_KEY')!,
  on: {
    'email.bounced': async (event) => {
      await record('bounce', event.event_id, event.data.recipient)
    },
    'email.complaint': async (event) => {
      await record('complaint', event.event_id, event.data.recipient)
    },
    'email.unsubscribed': async (event) => {
      await record('unsubscribe', event.event_id, event.data.recipient)
    },
  },
})

Deno.serve((req) => handler(req))
