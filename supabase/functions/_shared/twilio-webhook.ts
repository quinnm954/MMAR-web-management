/** Twilio signs the exact public URL plus sorted form parameters with HMAC-SHA1. */
export async function validTwilioSignature(url: string, form: FormData, signature: string, token: string): Promise<boolean> {
  if (!/^[A-Za-z0-9+/]{27}=$/.test(signature) || !token) return false;
  let payload = url;
  const names = [...new Set(form.keys())].sort();
  for (const name of names) {
    const values = form.getAll(name);
    if (values.some(value => typeof value !== 'string')) return false;
    for (const value of [...new Set(values as string[])].sort()) payload += name + value;
  }
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(token), { name: 'HMAC', hash: 'SHA-1' }, false, ['verify']);
  const bytes = Uint8Array.from(atob(signature), char => char.charCodeAt(0));
  return crypto.subtle.verify('HMAC', key, bytes, new TextEncoder().encode(payload));
}

export async function requireTwilio(req: Request, route: string): Promise<FormData | Response> {
  const denied = () => new Response('Unauthorized', { status: 401 });
  if (req.method !== 'POST') return denied();
  const token = Deno.env.get('TWILIO_AUTH_TOKEN');
  const base = Deno.env.get('SUPABASE_URL');
  const account = Deno.env.get('TWILIO_ACCOUNT_SID');
  if (!token || !base || !account) return new Response('Verification unavailable', { status: 503 });
  const signature = req.headers.get('X-Twilio-Signature') || '';
  if (!signature) return denied();
  try {
    const form = await req.formData();
    if (form.get('AccountSid') !== account) return denied();
    // Use configured origin, not spoofable Host/Forwarded headers. Preserve action query parameters.
    const url = `${base.replace(/\/$/, '')}/functions/v1/${route}${new URL(req.url).search}`;
    if (!await validTwilioSignature(url, form, signature, token)) return denied();
    return form;
  } catch {
    return denied();
  }
}