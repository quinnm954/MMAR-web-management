// Jose's payment options page: reports whether he has paid, and creates a fresh Stripe Checkout
// session on click (Stripe sessions last 24h max) so the page works until the Nov 21 deadline.
import Stripe from "npm:stripe@18.5.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

const CUSTOMER = "cus_VQi5jKT2gPlxwH";
const CONTRACT = "a5739933-048b-473e-9af4-aa7d4d5ef124";
const LEGACY = ["cs_live_bcsbm35ecSqgM24OzIWcMC4fCtg7mNSO7pD9tdoViTX4UFSHJ63nofJbnF", "cs_live_acgoKq2rIVHqQmwU7VEr9TmWSJfkN1rE7apdr3WUJ55d28DeCJQAXp0lwN"];
const PRICES = { weekly: "price_1UPqdV5Q2VPXrjOxtLrMUjHz", pastDue: "price_1Ub0RM5Q2VPXrjOxUT2eJWkT", missedWeek: "price_1Ub0cS5Q2VPXrjOxRJPA3iF1", payoff: "price_1Ub0VY5Q2VPXrjOxMoalbdnT" };
const DEADLINE = Date.parse("2026-11-22T05:00:00Z"); // end of Nov 21 Eastern
const LAST_DRAFT = Date.parse("2027-01-11T13:00:00Z");
const SITE = "https://mikesmautorepair.com";

// Weekly drafts run Mondays at 9 AM Eastern starting Nov 16.
function weeklyPlan(now: number) {
  let next = Date.parse("2026-11-16T13:00:00Z");
  let missed = 0;
  while (next <= now + 3600_000) { next += 7 * 86400_000; missed++; }
  return { trialEnd: Math.floor(next / 1000), missed };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2025-08-27.basil" });
  try {
    const list = await stripe.checkout.sessions.list({ customer: CUSTOMER, limit: 100 });
    const ours = list.data.filter((s) => LEGACY.includes(s.id) || s.metadata?.page === "jose");
    const paid = ours.some((s) => s.status === "complete");
    if (paid) {
      await Promise.all(ours.filter((s) => s.status === "open").map((s) => stripe.checkout.sessions.expire(s.id).catch(() => null)));
    }
    const expired = Date.now() >= DEADLINE;
    const body = await req.json().catch(() => ({}));
    const option = body?.option;
    if (option !== "weekly" && option !== "payoff") return json({ paid, expired });
    if (paid || expired) return json({ paid, expired }, 409);

    const meta = { contract_id: CONTRACT, page: "jose", option };
    let session;
    if (option === "payoff") {
      session = await stripe.checkout.sessions.create({
        mode: "payment", customer: CUSTOMER,
        line_items: [{ price: PRICES.payoff, quantity: 1 }],
        payment_intent_data: { metadata: meta }, metadata: meta,
        success_url: `${SITE}/pay/jose`, cancel_url: `${SITE}/pay/jose`,
      });
    } else {
      const { trialEnd, missed } = weeklyPlan(Date.now());
      const items: Stripe.Checkout.SessionCreateParams.LineItem[] = [{ price: PRICES.weekly, quantity: 1 }, { price: PRICES.pastDue, quantity: 1 }];
      if (missed) items.push({ price: PRICES.missedWeek, quantity: missed });
      const fnUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/financing-link`;
      session = await stripe.checkout.sessions.create({
        mode: "subscription", customer: CUSTOMER, line_items: items,
        subscription_data: { trial_end: trialEnd, metadata: { contract_id: CONTRACT } },
        metadata: meta,
        success_url: `${fnUrl}?confirm={CHECKOUT_SESSION_ID}`, cancel_url: `${SITE}/pay/jose`,
      });
      void LAST_DRAFT;
    }
    return json({ url: session.url });
  } catch (e) {
    console.error("jose-pay-status", e);
    return json({ error: "unavailable" }, 500);
  }
});
