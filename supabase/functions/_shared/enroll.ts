// Phone-only customers (no email on their account) get a "finish your account" link appended to texts.
const SITE = 'https://mikesmautorepair.com';

export async function enrollLink(sb: any, customerId?: string | null): Promise<string | null> {
  if (!customerId) return null;
  const { data: p } = await sb.from('profiles').select('email').eq('id', customerId).maybeSingle();
  if (!p || (p.email || '').trim()) return null;
  let { data: t } = await sb.from('enrollment_tokens').select('token').eq('user_id', customerId).maybeSingle();
  if (!t) t = (await sb.from('enrollment_tokens').upsert({ user_id: customerId }, { onConflict: 'user_id' }).select('token').single()).data;
  return t?.token ? `${SITE}/enroll/${t.token}` : null;
}

/** Text suffix, or '' when the customer already has a full account. */
export async function enrollSuffix(sb: any, customerId?: string | null): Promise<string> {
  const url = await enrollLink(sb, customerId).catch(() => null);
  return url ? `\nFinish your account to see estimates, approve work, pay invoices & view your maintenance history: ${url}` : '';
}
