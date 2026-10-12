// Financing pay link: admin texts the customer a Stripe Checkout link that charges the
// down payment now and starts weekly card payments that stop after the last scheduled week.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import Stripe from "npm:stripe@18.5.0";
import { sendSms } from "../_shared/booking-bot.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

const SITE = "https://mikesmautorepair.com";
// Per-contract Stripe prices (one-time down payment + weekly recurring)
const PLANS: Record<string, { down: string; weekly: string }> = {
  "a5739933-048b-473e-9af4-aa7d4d5ef124": { down: "price_1UPqdV5Q2VPXrjOxkstD6Cgb", weekly: "price_1UPqdV5Q2VPXrjOxtLrMUjHz" },
};
const ts = (d: string) => Math.floor(new Date(`${d}T13:00:00Z`).getTime() / 1000); // 9 AM Eastern

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2025-08-27.basil" });
  const url = new URL(req.url);

  try {
    // Return from Stripe Checkout: finalize schedule, then redirect to the site
    const sid = url.searchParams.get("confirm");
    if (req.method === "GET" && sid) {
      const s = await stripe.checkout.sessions.retrieve(sid, { expand: ["subscription"] });
      const contractId = s.metadata?.contract_id;
      const sub = s.subscription as Stripe.Subscription | null;
      if (contractId && PLANS[contractId] && sub && s.status === "complete") {
        const { data: ps } = await admin.from("financing_payments").select("id,seq,due_date").eq("contract_id", contractId).order("seq");
        const last = ps?.[ps.length - 1];
        if (last && !sub.cancel_at) {
          await stripe.subscriptions.update(sub.id, {
            cancel_at: ts(last.due_date) + 3600, proration_behavior: "none",
            metadata: { contract_id: contractId },
          });
        }
        const pm = typeof sub.default_payment_method === "string" ? await stripe.paymentMethods.retrieve(sub.default_payment_method) : sub.default_payment_method;
        await admin.from("financing_contracts").update({
          stripe_customer_id: typeof s.customer === "string" ? s.customer : s.customer?.id,
          stripe_payment_method_id: pm?.id ?? null, bank_last4: pm?.card?.last4 ?? null,
        }).eq("id", contractId);
        const down = ps?.find((p) => p.seq === 0);
        if (down && s.payment_status === "paid") {
          await admin.from("financing_payments").update({ status: "paid", paid_at: new Date().toISOString(), stripe_payment_intent_id: sub.id }).eq("id", down.id);
        }
      }
      return Response.redirect(`${SITE}/?payment=thanks`, 303);
    }

    // Admin: create and text the link
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const { data: u } = await admin.auth.getUser(auth.replace("Bearer ", ""));
    if (!u?.user) return json({ error: "Unauthorized" }, 401);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
    if (!isAdmin) return json({ error: "Forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const contractId = String(body.contract_id || "");
    const plan = PLANS[contractId];
    if (!plan) return json({ error: "No pay link set up for this contract" }, 400);
    const { data: c } = await admin.from("financing_contracts").select("*").eq("id", contractId).maybeSingle();
    if (!c) return json({ error: "Contract not found" }, 404);
    const { data: p } = await admin.from("profiles").select("full_name,email,phone").eq("id", c.customer_id).maybeSingle();
    const { data: first } = await admin.from("financing_payments").select("due_date").eq("contract_id", contractId).eq("seq", 1).maybeSingle();
    if (!first) return json({ error: "Payment schedule missing" }, 400);

    let customerId = c.stripe_customer_id as string | null;
    if (!customerId) {
      const cust = await stripe.customers.create({ name: p?.full_name || c.client_name, email: p?.email || undefined, phone: p?.phone || undefined, metadata: { contract_id: c.id } });
      customerId = cust.id;
      await admin.from("financing_contracts").update({ stripe_customer_id: customerId }).eq("id", c.id);
    }
    const fnUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/financing-link`;
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: plan.weekly, quantity: 1 }, { price: plan.down, quantity: 1 }],
      subscription_data: { trial_end: ts(first.due_date), metadata: { contract_id: c.id } },
      success_url: `${fnUrl}?confirm={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE}/`,
      metadata: { contract_id: c.id },
    });

    const phone = p?.phone || body.phone;
    const name = (p?.full_name || c.client_name || "").split(" ")[0];
    const text = `Hi ${name}, it's Mike's Mobile Auto Repair. Here's your secure payment link for your ${c.vehicle_info || "vehicle"} repair: $${Number(c.down_payment).toFixed(2)} today, then weekly card payments every Monday as listed in your agreement. ${session.url}\nCash is not accepted. Please pay the invoice, not the technician.`;
    const sent = phone ? await sendSms(admin, phone, text) : false;
    return json({ ok: true, url: session.url, sent });
  } catch (e) {
    console.error("financing-link", e);
    return json({ error: (e as Error).message }, 500);
  }
});
