import { describe, expect, test } from 'bun:test';
import { boundedMedia, MAX_MEDIA_BYTES, mediaExtension, twilioMediaPath } from '../supabase/functions/_shared/inbound-media';

describe('bounded message media', () => {
  const account = `AC${'a'.repeat(32)}`, message = `MM${'b'.repeat(32)}`, media = `ME${'c'.repeat(32)}`;
  const url = `https://api.twilio.com/2010-04-01/Accounts/${account}/Messages/${message}/Media/${media}`;
  test('only allows media from the configured account and message', () => {
    expect(twilioMediaPath(url, account, message)).toBe(`/Messages/${message}/Media/${media}`);
    for (const bad of [url.replace('api.twilio.com', 'evil.example'), url.replace('https:', 'http:'), url.replace(message, `MM${'d'.repeat(32)}`), 'http://127.0.0.1/secret']) {
      expect(twilioMediaPath(bad, account, message)).toBeNull();
    }
  });
  test('rejects active documents and arbitrary binary data', () => {
    expect(mediaExtension('text/html')).toBeNull();
    expect(mediaExtension('image/svg+xml')).toBeNull();
    expect(mediaExtension('application/octet-stream')).toBeNull();
    expect(mediaExtension('image/jpeg')).toBe('jpg');
  });
  test('limits actual bytes even without Content-Length', async () => {
    expect((await boundedMedia(new Response('photo'))).byteLength).toBe(5);
    await expect(boundedMedia(new Response(new Uint8Array(MAX_MEDIA_BYTES + 1)))).rejects.toThrow('Media too large');
  });
});