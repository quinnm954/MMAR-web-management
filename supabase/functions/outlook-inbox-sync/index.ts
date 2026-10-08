// Pulls new Outlook inbox mail into inbound_messages (dedup by Graph message id). Runs every 5 min via cron.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/microsoft_outlook'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    const OUTLOOK_KEY = Deno.env.get('MICROSOFT_OUTLOOK_API_KEY')
    if (!LOVABLE_API_KEY || !OUTLOOK_KEY) return json({ error: 'Outlook not connected' }, 500)
    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const since = new Date(Date.now() - 3 * 864e5).toISOString()
    const url = `${GATEWAY_URL}/me/mailFolders/inbox/messages?$top=50&$orderby=receivedDateTime desc` +
      `&$filter=receivedDateTime ge ${since}` +
      `&$select=id,internetMessageId,subject,from,toRecipients,receivedDateTime,body,conversationId`
    const r = await fetch(url, { headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'X-Connection-Api-Key': OUTLOOK_KEY, Prefer: 'outlook.body-content-type="html"' } })
    if (!r.ok) { const t = await r.text(); console.error(r.status, t); return json({ error: 'Outlook request failed', status: r.status, details: t }, r.status) }
    const { value = [] } = await r.json()

    const ids = value.map((m: any) => m.id)
    const { data: existing } = ids.length
      ? await sb.from('inbound_messages').select('message_id').in('message_id', ids)
      : { data: [] as any[] }
    const seen = new Set((existing || []).map((e: any) => e.message_id))
    const rows = value.filter((m: any) => !seen.has(m.id) && m.from?.emailAddress?.address).map((m: any) => {
      const html = m.body?.content ?? ''
      return {
        message_id: m.id,
        in_reply_to: m.internetMessageId ?? null,
        from_email: String(m.from.emailAddress.address).toLowerCase(),
        from_name: m.from.emailAddress.name ?? null,
        to_email: m.toRecipients?.[0]?.emailAddress?.address ?? null,
        subject: m.subject ?? null,
        body_html: html,
        body_text: html.replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 20000),
        received_at: m.receivedDateTime,
        raw: { source: 'outlook', conversationId: m.conversationId },
      }
    })
    if (rows.length) {
      const { error } = await sb.from('inbound_messages').insert(rows)
      if (error) throw error
    }
    return json({ fetched: value.length, inserted: rows.length })
  } catch (e) {
    console.error(e)
    return json({ error: String(e) }, 500)
  }
})
