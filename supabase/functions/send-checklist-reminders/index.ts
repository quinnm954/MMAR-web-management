import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.95.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const REMINDER_TYPE = 'checklist_email_reminder';
const REMINDER_COOLDOWN_DAYS = 14;
const SITE_URL = Deno.env.get('SITE_URL') || 'https://mikesmautorepair.com';
const SB_URL = Deno.env.get('SUPABASE_URL')!;
const SB_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SB_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93Z3B4dWpmeXRza2RmbXJoamdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MTQ5NDMsImV4cCI6MjA4MTM5MDk0M30.6zEygmSkP74HP3J8jrzIUmnZ82pMQc0FgbG6qeo_bFc';

async function sendTxEmail(body: Record<string, unknown>): Promise<{ error?: string }> {
  try {
    const r = await fetch(`${SB_URL}/functions/v1/send-transactional-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SB_ANON_KEY}`,
        apikey: SB_ANON_KEY,
      },
      body: JSON.stringify(body),
    });
    if (!r.ok) return { error: `send-transactional-email ${r.status}: ${(await r.text()).slice(0, 200)}` };
    return {};
  } catch (e: any) {
    return { error: e?.message || String(e) };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const sb = createClient(SB_URL, SB_SERVICE_KEY);
  const sent: any[] = [];
  const skipped: any[] = [];
  const errors: any[] = [];

  // Pull active vehicles + owner
  const { data: vehicles, error: vErr } = await sb
    .from('vehicles')
    .select('id, owner_id, year, make, model')
    .eq('is_active', true);

  if (vErr) {
    return new Response(JSON.stringify({ error: vErr.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const cooldownIso = new Date(Date.now() - REMINDER_COOLDOWN_DAYS * 86400000).toISOString();

  // Cache owners (one customer may have multiple vehicles)
  const ownerCache = new Map<string, { full_name: string | null; email: string | null } | null>();
  async function getOwner(ownerId: string) {
    if (ownerCache.has(ownerId)) return ownerCache.get(ownerId)!;
    const { data } = await sb
      .from('profiles')
      .select('full_name, email')
      .eq('id', ownerId)
      .maybeSingle();
    ownerCache.set(ownerId, data ?? null);
    return data ?? null;
  }

  // Group vehicles by owner so we send one checklist reminder per customer per run
  const byOwner = new Map<string, typeof vehicles>();
  for (const v of vehicles || []) {
    if (!v.owner_id) continue;
    const arr = byOwner.get(v.owner_id) || [];
    arr.push(v);
    byOwner.set(v.owner_id, arr);
  }

  for (const [ownerId, ownerVehicles] of byOwner) {
    try {
      // Has this customer logged ANY service record on ANY of their vehicles?
      const vehicleIds = ownerVehicles.map((v) => v.id);
      const { count } = await sb
        .from('service_records')
        .select('id', { count: 'exact', head: true })
        .in('vehicle_id', vehicleIds);

      if ((count ?? 0) > 0) {
        skipped.push({ owner_id: ownerId, reason: 'checklist_already_started' });
        continue;
      }

      // Cooldown — don't pester customers more than once every 14 days
      const { data: recent } = await sb
        .from('service_reminders_sent')
        .select('id')
        .eq('reminder_type', REMINDER_TYPE)
        .eq('customer_id', ownerId)
        .gte('sent_at', cooldownIso)
        .maybeSingle();
      if (recent) { skipped.push({ owner_id: ownerId, reason: 'cooldown' }); continue; }

      const profile = await getOwner(ownerId);
      if (!profile?.email) { skipped.push({ owner_id: ownerId, reason: 'no_email' }); continue; }

      const primary = ownerVehicles[0];
      const vehicleLabel = [primary.year, primary.make, primary.model].filter(Boolean).join(' ') || 'your vehicle';

      const { error: invErr } = await sendTxEmail({
        templateName: 'maintenance-checklist-reminder',
        recipientEmail: profile.email,
        idempotencyKey: `checklist-reminder-${ownerId}-${new Date().toISOString().slice(0, 10)}`,
        templateData: {
          customerName: profile.full_name?.split(' ')[0] || undefined,
          vehicle: vehicleLabel,
          checklistUrl: `${SITE_URL}/portal/maintenance`,
        },
      });

      await sb.from('service_reminders_sent').insert({
        customer_id: ownerId,
        reminder_type: REMINDER_TYPE,
        reference_id: primary.id,
        message: 'Maintenance checklist reminder (no service history on file)',
        status: invErr ? 'failed' : 'sent',
        error: invErr,
      });

      if (invErr) errors.push({ owner_id: ownerId, error: invErr });
      else sent.push({ owner_id: ownerId, vehicle_count: ownerVehicles.length });
    } catch (e: any) {
      errors.push({ owner_id: ownerId, error: e?.message || String(e) });
    }
  }

  return new Response(
    JSON.stringify({
      scanned_owners: byOwner.size,
      sent: sent.length,
      skipped: skipped.length,
      errors: errors.length,
      details: { sent, skipped, errors },
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
