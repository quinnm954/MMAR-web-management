const TYPES: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif',
  'image/webp': 'webp', 'image/heic': 'heic', 'image/heif': 'heif',
  'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/3gpp': '3gp',
};
export const MAX_MEDIA_BYTES = 5 * 1024 * 1024;

/** Only download message media belonging to this Twilio account and this message. */
export function twilioMediaPath(url: string, account: string, message: string): string | null {
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:' || u.hostname !== 'api.twilio.com' || u.port || u.username || u.password) return null;
    const match = u.pathname.match(/^\/2010-04-01\/Accounts\/(AC[0-9a-f]{32})\/Messages\/(MM[0-9a-f]{32}|SM[0-9a-f]{32})\/Media\/(ME[0-9a-f]{32})$/i);
    if (!match || match[1] !== account || match[2] !== message) return null;
    return `/Messages/${match[2]}/Media/${match[3]}`;
  } catch { return null; }
}

export function mediaExtension(type: string): string | null {
  return TYPES[type.toLowerCase().split(';')[0].trim()] ?? null;
}

/** Bound the actual streamed body, not only a forgeable Content-Length. */
export async function boundedMedia(response: Response): Promise<Uint8Array> {
  if (Number(response.headers.get('Content-Length')) > MAX_MEDIA_BYTES) throw new Error('Media too large');
  if (!response.body) throw new Error('Missing media');
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_MEDIA_BYTES) throw new Error('Media too large');
      chunks.push(value);
    }
  } finally { await reader.cancel(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes;
}