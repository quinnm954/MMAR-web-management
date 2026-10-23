import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  try {
    const url = Deno.env.get('SUPABASE_URL');
    const anon = Deno.env.get('SUPABASE_ANON_KEY');
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !anon || !service) return json({ error: 'Service configuration unavailable' }, 503);
    const authorization = req.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);
    const client = createClient(url, anon, { global: { headers: { Authorization: authorization } } });
    const { data, error } = await client.auth.getClaims(authorization.slice(7));
    if (error || !data?.claims?.sub) return json({ error: 'Unauthorized' }, 401);
    const admin = createClient(url, service);
    const { data: roles, error: roleError } = await admin.from('user_roles').select('role').eq('user_id', data.claims.sub);
    if (roleError || !roles?.some(r => ['admin', 'owner'].includes(r.role))) return json({ error: 'Forbidden' }, 403);

    const gatewayKey = Deno.env.get('LOVABLE_API_KEY');
    const twilioKey = Deno.env.get('TWILIO_API_KEY');
    const elevenKey = Deno.env.get('ELEVENLABS_API_KEY');
    const read = async (endpoint: string, headers: Record<string, string>) => {
      const response = await fetch(endpoint, { headers, signal: AbortSignal.timeout(15000) });
      if (!response.ok) {
        let details = await response.text();
        for (const key of [gatewayKey, twilioKey, elevenKey]) if (key) details = details.split(key).join('[redacted]');
        console.error(`Provider usage request failed [${response.status}]: ${details}`);
        throw new Error(`[${response.status}]: ${details}`);
      }
      return response.json();
    };
    const twilio = async () => {
      if (!gatewayKey || !twilioKey) throw new Error('Twilio connection is not configured');
      const value = await read('https://connector-gateway.lovable.dev/twilio/Balance.json', {
        Authorization: `Bearer ${gatewayKey}`, 'X-Connection-Api-Key': twilioKey,
      });
      const balance = Number(value.balance);
      if (value.balance == null || !Number.isFinite(balance) || typeof value.currency !== 'string') throw new Error('Twilio returned no valid balance');
      return { balance, currency: value.currency.toUpperCase() };
    };
    const elevenlabs = async () => {
      if (!elevenKey) throw new Error('ElevenLabs connection is not configured');
      const value = await read('https://api.elevenlabs.io/v1/user/subscription', { 'xi-api-key': elevenKey });
      if (typeof value.character_count !== 'number' || typeof value.character_limit !== 'number') throw new Error('ElevenLabs returned no valid usage');
      return {
        used: value.character_count, limit: value.character_limit, tier: value.tier ?? 'Subscription',
        resetAt: typeof value.next_character_count_reset_unix === 'number' ? new Date(value.next_character_count_reset_unix * 1000).toISOString() : null,
      };
    };
    const result = await Promise.allSettled([twilio(), elevenlabs()]);
    const unwrap = (r: PromiseSettledResult<unknown>) => r.status === 'fulfilled' ? { data: r.value } : { error: r.reason instanceof Error ? r.reason.message : 'Usage unavailable' };
    return json({ twilio: unwrap(result[0]), elevenlabs: unwrap(result[1]), checkedAt: new Date().toISOString() });
  } catch {
    return json({ error: 'Unable to load service usage' }, 500);
  }
});