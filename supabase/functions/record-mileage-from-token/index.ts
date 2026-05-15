import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.95.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  let body: { token?: string; miles?: number } = {};
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const token = (body.token || '').trim();
  const miles = Number(body.miles);

  if (!token || token.length < 16 || token.length > 64) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  if (!Number.isFinite(miles) || miles <= 0 || miles >= 2_000_000) {
    return new Response(JSON.stringify({ error: 'Enter a valid mileage' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data, error } = await sb.rpc('redeem_mileage_token', {
    _token: token,
    _miles: Math.floor(miles),
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true, result: data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
