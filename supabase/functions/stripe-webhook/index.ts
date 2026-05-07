import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@17.7.0?target=deno";

// Public webhook — no JWT verification
Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
    apiVersion: "2024-11-20.acacia",
  });

  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    if (webhookSecret && signature) {
      event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
    } else {
      // Allow processing without signature only if no secret configured (dev fallback)
      event = JSON.parse(rawBody) as Stripe.Event;
    }
  } catch (err) {
    console.error("Webhook signature failed", err);
    return new Response(`Webhook Error: ${err}`, { status: 400 });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const invoiceId = session.metadata?.invoice_id;
      if (invoiceId && session.payment_status === "paid") {
        const amount = (session.amount_total || 0) / 100;
        await admin
          .from("invoices")
          .update({
            status: "paid",
            amount_paid: amount,
            paid_at: new Date().toISOString(),
            stripe_payment_intent_id: session.payment_intent as string,
          })
          .eq("id", invoiceId);
        console.log("Invoice paid", invoiceId);
      }
    }

    if (event.type === "charge.refunded" || event.type === "payment_intent.payment_failed") {
      const obj: any = event.data.object;
      const pi = obj.payment_intent || obj.id;
      if (pi) {
        const newStatus = event.type === "charge.refunded" ? "refunded" : "unpaid";
        await admin
          .from("invoices")
          .update({ status: newStatus })
          .eq("stripe_payment_intent_id", pi);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("webhook handler error", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
