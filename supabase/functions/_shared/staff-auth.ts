import { createClient } from 'npm:@supabase/supabase-js@2'

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

const STAFF = ['owner', 'admin', 'manager', 'service_advisor', 'technician', 'parts']

/** Returns the staff user's id, or a Response to return when not staff. */
export async function requireStaff(req: Request): Promise<{ userId: string } | Response> {
  const url = Deno.env.get('SUPABASE_URL')!
  const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  })
  const { data, error } = await userClient.auth.getUser()
  if (error || !data.user) return json({ error: 'Unauthorized' }, 401)
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { data: rows } = await admin.from('user_roles').select('role').eq('user_id', data.user.id)
  const ok = (rows ?? []).some((r: { role: string }) => STAFF.includes(r.role))
  if (!ok) return json({ error: 'Forbidden' }, 403)
  return { userId: data.user.id }
}
