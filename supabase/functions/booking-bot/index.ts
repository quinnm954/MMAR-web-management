// Starts the SMS follow-up for a new website booking request (called by a database trigger).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.95.0';
import { startBot } from '../_shared/booking-bot.ts';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const { id } = await req.json().catch(() => ({}));
    if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id)) return new Response('bad id', { status: 400, headers: cors });
    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const res = await startBot(sb, id);
    return new Response(JSON.stringify(res), { headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error(e);
    return new Response('error', { status: 500, headers: cors });
  }
});
