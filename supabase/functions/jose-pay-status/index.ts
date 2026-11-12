// Public status check for Jose's one-off payment options page. Returns only whether either
// option has been paid; when one is paid, expires the other Stripe session so it cannot be used.
import Stripe from "npm:stripe@18.5.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const SESSIONS = [
  "cs_live_bcsbm35ecSqgM24OzIWcMC4fCtg7mNSO7pD9tdoViTX4UFSHJ63nofJbnF",
  "cs_live_acgoKq2rIVHqQmwU7VEr9TmWSJfkN1rE7apdr3WUJ55d28DeCJQAXp0lwN",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2025-08-27.basil" });
  try {
    const all = await Promise.all(SESSIONS.map((id) => stripe.checkout.sessions.retrieve(id)));
    const paid = all.some((s) => s.status === "complete");
    if (paid) {
      await Promise.all(all.filter((s) => s.status === "open").map((s) => stripe.checkout.sessions.expire(s.id).catch(() => null)));
    }
    return new Response(JSON.stringify({ paid }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("jose-pay-status", e);
    return new Response(JSON.stringify({ paid: false, error: "unavailable" }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
