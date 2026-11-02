import { expect, test } from 'bun:test';
import { requireTwilio, validTwilioSignature } from '../supabase/functions/_shared/twilio-webhook.ts';

const dummyToken = 'unit-test-not-a-provider-credential';
async function signed(url: string, values: Record<string, string>) {
  const payload = url + Object.keys(values).sort().map(key => key + values[key]).join('');
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(dummyToken), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const bytes = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload)));
  return btoa(String.fromCharCode(...bytes));
}
test('signature covers the exact callback URL, query and every form value', async () => {
  const url = 'https://example.test/functions/v1/twilio-voice-incoming?after=dial';
  const values = { AccountSid: 'account-test', From: '+15555550100', Body: 'hello' };
  const form = new FormData();
  for (const [key, value] of Object.entries(values)) form.set(key, value);
  const signature = await signed(url, values);
  expect(await validTwilioSignature(url, form, signature, dummyToken)).toBe(true);
  expect(await validTwilioSignature(url.split('?')[0], form, signature, dummyToken)).toBe(false);
  form.set('Body', 'forged');
  expect(await validTwilioSignature(url, form, signature, dummyToken)).toBe(false);
  expect(await validTwilioSignature(url, form, 'bad', dummyToken)).toBe(false);
});
test('all six routes reject unsigned, wrong-account and replayed route signatures', async () => {
  const original = (globalThis as any).Deno;
  (globalThis as any).Deno = { env: { get: (name: string) => ({ TWILIO_AUTH_TOKEN: dummyToken, TWILIO_ACCOUNT_SID: 'account-test', SUPABASE_URL: 'https://example.test' }[name]) } };
  try {
    for (const route of ['twilio-voice-incoming', 'twilio-voice-client', 'twilio-voice-status', 'twilio-voice-recording', 'twilio-voice-transcription', 'twilio-inbound-sms']) {
      const url = `https://example.test/functions/v1/${route}`;
      const values = { AccountSid: 'account-test', From: '+15555550100' };
      const make = (signature?: string, fields = values) => new Request(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...(signature ? { 'X-Twilio-Signature': signature } : {}) }, body: new URLSearchParams(fields) });
      expect((await requireTwilio(make(), route) as Response).status).toBe(401);
      expect(await requireTwilio(make(await signed(url, values)), route)).toBeInstanceOf(FormData);
      const wrong = { ...values, AccountSid: 'wrong-account' };
      expect((await requireTwilio(make(await signed(url, wrong), wrong), route) as Response).status).toBe(401);
      expect((await requireTwilio(make(await signed('https://example.test/other', values)), route) as Response).status).toBe(401);
    }
  } finally { (globalThis as any).Deno = original; }
});
test('missing verification secret fails closed', async () => {
  const original = (globalThis as any).Deno;
  (globalThis as any).Deno = { env: { get: () => undefined } };
  try { expect((await requireTwilio(new Request('https://example.test', { method: 'POST' }), 'twilio-inbound-sms') as Response).status).toBe(503); }
  finally { (globalThis as any).Deno = original; }
});