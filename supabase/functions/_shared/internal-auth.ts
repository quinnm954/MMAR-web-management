import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, json } from './staff-auth.ts';

/** Trusted edge callers use the service credential; DB dispatchers use a private random token. */
export async function requireInternal(req: Request): Promise<Response | null> {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const authorization = req.headers.get('Authorization');
  if (serviceKey && authorization === `Bearer ${serviceKey}`) return null;
  const token = req.headers.get('x-internal-token');
  if (!token || !serviceKey) return json({ error: 'Unauthorized' }, 401);
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, serviceKey);
  const { data, error } = await sb.from('internal_dispatch_credentials').select('token').eq('id', 1).maybeSingle();
  if (error || !data?.token || token !== data.token) return json({ error: 'Unauthorized' }, 401);
  return null;
}