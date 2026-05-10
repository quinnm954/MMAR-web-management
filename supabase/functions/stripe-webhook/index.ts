import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@17.7.0?target=deno";
const SITE_URL = "https://shop-flow-home.lovable.app";

const fmtUsd = (n: number | null | undefined) =>
  n == null ? "" : `$${Number(n).toFixed(2)}`;

async function sendInvoicePaidReceipt(
  admin: ReturnType<typeof createClient>,
  invoiceId: string,
  paymentIntentId: string | null,
) {
  const { data: inv } = await admin
    .from("invoices")
    .select("id, invoice_number, customer_id, service_record_id, line_items, subtotal, shop_supplies, tax, total, amount_paid, paid_at, discount_amount, discount_reason")
    .eq("id", invoiceId)
    .maybeSingle();
  if (!inv) return;

  const { data: prof } = await admin
    .from("profiles")
    .select("email, full_name")
    .eq("id", inv.customer_id)
    .maybeSingle();
  if (!prof?.email) return;

  let vehicle: string | undefined;
  if (inv.service_record_id) {
    const { data: sr } = await admin
      .from("service_records")
      .select("vehicle:vehicles(year, make, model)")
      .eq("id", inv.service_record_id)
      .maybeSingle();
    const v = (sr as any)?.vehicle;
    if (v) vehicle = [v.year, v.make, v.model].filter(Boolean).join(" ") || undefined;
  }

  let paymentMethod: string | undefined;
  if (paymentIntentId) {
    try {
      const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-11-20.acacia" });
      const pi = await stripe.paymentIntents.retrieve(paymentIntentId, { expand: ["payment_method"] });
      const pm = pi.payment_method as any;
      if (pm?.card) paymentMethod = `${pm.card.brand?.toUpperCase()} ending ${pm.card.last4}`;
    } catch (_) { /* optional */ }
  }

  const paidAt = inv.paid_at ? new Date(inv.paid_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "";

  await admin.functions.invoke("send-transactional-email", {
    body: {
      templateName: "invoice-paid-receipt",
      recipientEmail: prof.email,
      idempotencyKey: `invoice-paid-receipt-${invoiceId}`,
      templateData: {
        customerName: prof.full_name || undefined,
        invoiceNumber: inv.invoice_number || undefined,
        paidAt,
        amountPaid: fmtUsd(Number(inv.amount_paid || inv.total)),
        subtotal: fmtUsd(Number(inv.subtotal)),
        discountAmount: Number(inv.discount_amount || 0) > 0 ? fmtUsd(Number(inv.discount_amount)) : undefined,
        discountReason: inv.discount_reason || undefined,
        shopSupplies: Number(inv.shop_supplies || 0) > 0 ? fmtUsd(Number(inv.shop_supplies)) : undefined,
        tax: Number(inv.tax || 0) > 0 ? fmtUsd(Number(inv.tax)) : undefined,
        total: fmtUsd(Number(inv.total)),
        paymentMethod,
        vehicle,
        lineItems: Array.isArray(inv.line_items) ? inv.line_items : [],
        invoiceUrl: `${SITE_URL}/portal/invoices/${invoiceId}`,
      },
    },
  });
}

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

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured");
    return new Response("Webhook secret not configured", { status: 500 });
  }
  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed", err);
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
      const membershipId = session.metadata?.membership_id;

      // One-off invoice payment
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

        // Email paid receipt to customer
        try {
          await sendInvoicePaidReceipt(admin, invoiceId, session.payment_intent as string | null);
        } catch (e) {
          console.warn("paid receipt email failed", e);
        }
      }

      // Membership subscription checkout completed
      if (membershipId && session.mode === "subscription") {
        await admin
          .from("memberships")
          .update({
            status: "active",
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            deposit_paid: true,
            deposit_paid_at: new Date().toISOString(),
          })
          .eq("id", membershipId);
        console.log("Membership activated", membershipId);

        // Send membership welcome email
        try {
          const { data: m } = await admin
            .from("memberships")
            .select("customer_id, plan:membership_plans(name)")
            .eq("id", membershipId)
            .maybeSingle();
          if (m?.customer_id) {
            const { data: prof } = await admin
              .from("profiles")
              .select("email, full_name")
              .eq("id", m.customer_id)
              .maybeSingle();
            const planName = (m as any).plan?.name as string | undefined;
            if (prof?.email) {
              await admin.functions.invoke("send-transactional-email", {
                body: {
                  templateName: "membership-welcome",
                  recipientEmail: prof.email,
                  idempotencyKey: `membership-welcome-${membershipId}`,
                  templateData: {
                    customerName: prof.full_name || undefined,
                    planName,
                    portalUrl: "https://shop-flow-home.lovable.app/portal/membership",
                  },
                },
              });
            }
          }
        } catch (e) {
          console.warn("welcome email failed", e);
        }
      }
    }

    if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;
      const status = event.type === "customer.subscription.deleted" ? "cancelled" : sub.status;
      await admin
        .from("memberships")
        .update({
          status,
          current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
          ...(status === "cancelled" && { cancelled_at: new Date().toISOString() }),
        })
        .eq("stripe_subscription_id", sub.id);
    }

    if (event.type === "invoice.payment_succeeded") {
      const inv = event.data.object as Stripe.Invoice;
      if (inv.subscription) {
        await admin
          .from("memberships")
          .update({
            next_billing_date: inv.lines.data[0]?.period?.end
              ? new Date(inv.lines.data[0].period.end * 1000).toISOString().slice(0, 10)
              : null,
          })
          .eq("stripe_subscription_id", inv.subscription as string);
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
