import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@17.7.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: u } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    const user = u?.user;
    if (!user?.email) throw new Error("Not authenticated");

    const { membership_id } = await req.json();
    if (!membership_id) throw new Error("membership_id required");

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: membership, error: mErr } = await admin
      .from("memberships")
      .select("id, customer_id, status, plan:membership_plans(name, stripe_price_id, deposit_amount)")
      .eq("id", membership_id)
      .single();
    if (mErr || !membership) throw new Error("Membership not found");
    if (membership.customer_id !== user.id) throw new Error("Forbidden");

    const plan: any = membership.plan;
    if (!plan?.stripe_price_id) throw new Error("Plan has no Stripe price configured");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2024-11-20.acacia",
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customerId = customers.data[0]?.id;

    const origin = req.headers.get("origin") || "https://shop-flow-home.lovable.app";
    const depositCents = Math.round(Number(plan.deposit_amount || 0) * 100);

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      { price: plan.stripe_price_id, quantity: 1 },
    ];
    if (depositCents > 0) {
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: depositCents,
          product_data: {
            name: `${plan.name} — Membership Deposit (non-refundable)`,
          },
        },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: lineItems,
      subscription_data: {
        metadata: { membership_id, customer_id: user.id },
      },
      metadata: {
        membership_id,
        customer_id: user.id,
        plan_name: plan.name,
        deposit_cents: String(depositCents),
        plan_price_id: plan.stripe_price_id,
      },
      success_url: `${origin}/portal/dashboard?membership=success`,
      cancel_url: `${origin}/portal/membership-signup?canceled=1`,
    });

    if (customerId) {
      await admin
        .from("memberships")
        .update({ stripe_customer_id: customerId })
        .eq("id", membership_id);
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("create-membership-checkout error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
