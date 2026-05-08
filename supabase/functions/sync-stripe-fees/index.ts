import Stripe from "npm:stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing auth");

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData } = await userClient.auth.getUser();
    const user = userData.user;
    if (!user) throw new Error("Unauthorized");

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: roles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    if (!roles?.some((r) => r.role === "admin")) throw new Error("Admin only");

    const body = await req.json().catch(() => ({}));
    const sinceDays = Math.max(1, Math.min(365, Number(body.days) || 90));
    const sinceISO = new Date(Date.now() - sinceDays * 86400_000).toISOString();
    const force = Boolean(body.force);

    let q = admin
      .from("invoices")
      .select("id, stripe_payment_intent_id, stripe_session_id, stripe_fee, stripe_fee_synced_at, paid_at, created_at")
      .eq("status", "paid")
      .gte("created_at", sinceISO);
    const { data: invoices, error } = await q;
    if (error) throw error;

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2025-08-27.basil",
    });

    let synced = 0;
    let skipped = 0;
    const errors: { id: string; error: string }[] = [];

    for (const inv of invoices ?? []) {
      try {
        if (!force && inv.stripe_fee != null) {
          skipped++;
          continue;
        }
        let piId = inv.stripe_payment_intent_id as string | null;
        if (!piId && inv.stripe_session_id) {
          const session = await stripe.checkout.sessions.retrieve(inv.stripe_session_id);
          piId = (session.payment_intent as string) || null;
        }
        if (!piId) {
          skipped++;
          continue;
        }
        const pi = await stripe.paymentIntents.retrieve(piId, {
          expand: ["latest_charge.balance_transaction"],
        });
        const charge = pi.latest_charge as Stripe.Charge | null;
        const bt = charge?.balance_transaction as Stripe.BalanceTransaction | null;
        if (!bt || typeof bt.fee !== "number") {
          skipped++;
          continue;
        }
        const feeDollars = bt.fee / 100;
        await admin
          .from("invoices")
          .update({
            stripe_fee: feeDollars,
            stripe_payment_intent_id: piId,
            stripe_fee_synced_at: new Date().toISOString(),
          })
          .eq("id", inv.id);
        synced++;
      } catch (e) {
        errors.push({ id: inv.id, error: (e as Error).message });
      }
    }

    return new Response(
      JSON.stringify({ synced, skipped, scanned: invoices?.length ?? 0, errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
