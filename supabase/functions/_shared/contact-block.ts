import { createClient } from 'npm:@supabase/supabase-js@2';

// Customers whose newest feedback was unhappy get no automated texts, emails,
// receptionist replies or follow-ups. Jobs open at block time may finish.
// Fails open on lookup errors so a database hiccup never blocks job messages.
let client: ReturnType<typeof createClient> | null = null;
const db = () => client ??= createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

export async function contactBlocked(p: { phone?: string | null; email?: string | null; customerId?: string | null; jobIds?: (string | null | undefined)[] }): Promise<boolean> {
  if (!p.phone && !p.email && !p.customerId) return false;
  try {
    const { data, error } = await db().rpc('contact_blocked', {
      _phone: p.phone ?? null, _email: p.email ?? null, _customer_id: p.customerId ?? null,
      _job_ids: (p.jobIds ?? []).filter(Boolean) as string[],
    });
    if (error) { console.error('contact_blocked', error.message); return false; }
    if (data) console.log('suppressed: unhappy customer', { customer: p.customerId ?? null });
    return !!data;
  } catch (e) { console.error('contact_blocked threw', e); return false; }
}
