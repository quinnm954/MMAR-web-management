import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const b64url = (data: Uint8Array | string) => {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  let s = '';
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
};

let appConfigured = false;
async function ensureTwimlApp(appSid: string) {
  if (appConfigured) return;
  const lk = Deno.env.get('LOVABLE_API_KEY');
  const tk = Deno.env.get('TWILIO_API_KEY');
  if (!lk || !tk) return;
  const base = `${Deno.env.get('SUPABASE_URL')}/functions/v1`;
  const r = await fetch(`https://connector-gateway.lovable.dev/twilio/Applications/${appSid}.json`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${lk}`, 'X-Connection-Api-Key': tk, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      VoiceUrl: `${base}/twilio-voice-client`, VoiceMethod: 'POST',
      StatusCallback: `${base}/twilio-voice-status`, StatusCallbackMethod: 'POST',
    }),
  });
  if (r.ok) appConfigured = true;
  else console.error('TwiML app update failed', r.status, await r.text());
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const auth = req.headers.get('Authorization') || '';
    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: u, error } = await sb.auth.getUser(auth.replace('Bearer ', ''));
    if (error || !u.user) return json({ error: 'Unauthorized' }, 401);
    const [{ data: isAdmin }, { data: isOwner }] = await Promise.all([
      sb.rpc('has_role', { _user_id: u.user.id, _role: 'admin' }),
      sb.rpc('has_role', { _user_id: u.user.id, _role: 'owner' }),
    ]);
    if (!isAdmin && !isOwner) return json({ error: 'Forbidden' }, 403);

    const acct = Deno.env.get('TWILIO_ACCOUNT_SID')!;
    const keySid = Deno.env.get('TWILIO_VOICE_KEY_SID')!;
    const keySecret = Deno.env.get('TWILIO_VOICE_KEY_SECRET')!;
    const appSid = Deno.env.get('TWILIO_TWIML_APP_SID')!;
    if (!acct || !keySid || !keySecret || !appSid) return json({ error: 'Voice not configured' }, 500);
    await ensureTwimlApp(appSid);

    const identity = `staff_${u.user.id.replace(/-/g, '')}`;
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'HS256', typ: 'JWT', cty: 'twilio-fpa;v=1' };
    const payload = {
      jti: `${keySid}-${now}`, iss: keySid, sub: acct, iat: now, exp: now + 3600,
      grants: { identity, voice: { incoming: { allow: true }, outgoing: { application_sid: appSid } } },
    };
    const unsigned = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(keySecret),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(unsigned)));
    return json({ token: `${unsigned}.${b64url(sig)}`, identity });
  } catch (e) {
    console.error(e);
    return json({ error: String(e) }, 500);
  }
});
