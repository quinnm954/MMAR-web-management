// Inbound email webhook. Accepts JSON like:
// { from: "Jane <jane@example.com>", subject: "...", text: "...", html: "...",
//   to: "support@yourdomain.com", in_reply_to: "<id>", message_id: "<id>", thread_id?: "<uuid>" }
// Requires header `x-webhook-secret: <INBOUND_EMAIL_SECRET>` (env var).
// Designed to be Cloudflare Email Routing Worker → fetch() compatible.

import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
}

function parseAddress(input: string | undefined): { email: string; name: string | null } {
  if (!input) return { email: '', name: null }
  const m = input.match(/^\s*(?:"?([^"<]*?)"?\s*)?<([^>]+)>\s*$/)
  if (m) return { email: m[2].trim().toLowerCase(), name: (m[1] || '').trim() || null }
  return { email: input.trim().toLowerCase(), name: null }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const expected = Deno.env.get('INBOUND_EMAIL_SECRET')
  if (!expected) {
    return new Response(JSON.stringify({ error: 'INBOUND_EMAIL_SECRET not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
  const got = req.headers.get('x-webhook-secret')
  if (got !== expected) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  let payload: any
  try { payload = await req.json() } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const { email: fromEmail, name: fromName } = parseAddress(payload.from)
  if (!fromEmail) {
    return new Response(JSON.stringify({ error: 'Missing from address' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Best-effort thread resolution: explicit thread_id wins; otherwise look up the
  // most recent outbound email_send_log row addressed to this sender with a matching
  // thread_id stored in metadata.
  let threadId: string | null = payload.thread_id ?? null
  if (!threadId) {
    const { data } = await supabase
      .from('email_send_log')
      .select('metadata, created_at')
      .eq('recipient_email', fromEmail)
      .order('created_at', { ascending: false })
      .limit(5)
    const found = (data ?? []).find((r: any) => r?.metadata?.thread_id)
    threadId = found?.metadata?.thread_id ?? crypto.randomUUID()
  }

  const { error } = await supabase.from('inbound_messages').insert({
    from_email: fromEmail,
    from_name: fromName,
    to_email: parseAddress(payload.to).email || null,
    subject: payload.subject ?? null,
    body_text: payload.text ?? null,
    body_html: payload.html ?? null,
    thread_id: threadId,
    in_reply_to: payload.in_reply_to ?? null,
    message_id: payload.message_id ?? null,
    raw: payload,
  })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  return new Response(JSON.stringify({ ok: true, thread_id: threadId }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
})
