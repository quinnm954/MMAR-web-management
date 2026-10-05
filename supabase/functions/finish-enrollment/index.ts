// Public: a phone-only customer (auto-created from a booking) adds email + password using the token texted to them.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const j = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const b = await req.json().catch(() => ({}))
  const token = String(b.token || '').trim()
  const email = String(b.email || '').trim().toLowerCase()
  const password = String(b.password || '')
  const name = String(b.name || '').trim().slice(0, 120)
  if (!/^[a-f0-9]{16,64}$/i.test(token)) return j({ error: 'Invalid link' }, 400)
  if (b.check !== true) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 255) return j({ error: 'Enter a valid email' }, 400)
    if (password.length < 8 || password.length > 72) return j({ error: 'Password must be at least 8 characters' }, 400)
  }
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { data: est } = await sb.from('estimates').select('customer_id').eq('approval_token', token).maybeSingle()
  const customerId = est?.customer_id || (await sb.from('enrollment_tokens').select('user_id').eq('token', token).maybeSingle()).data?.user_id
  if (!customerId) return j({ error: 'This link is no longer valid' }, 404)
  const { data: u } = await sb.auth.admin.getUserById(customerId)
  const user = u?.user
  if (!user || user.email) return j({ error: 'This account is already set up — please sign in.', done: true }, 409)
  if (b.check === true) return j({ ok: true, name: user.user_metadata?.full_name || '' })
  const { error } = await sb.auth.admin.updateUserById(user.id, {
    email, password, email_confirm: true,
    user_metadata: { ...user.user_metadata, needs_enrollment: false, full_name: name || user.user_metadata?.full_name || '' },
  })
  if (error) return j({ error: /already|registered|exists/i.test(error.message) ? 'That email already has an account — please sign in instead.' : 'Could not finish setup' }, 400)
  await sb.from('profiles').update({ email, ...(name ? { full_name: name } : {}) }).eq('id', user.id)
  return j({ ok: true })
})
