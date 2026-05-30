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
        const paymentIntentId = session.payment_intent as string | null;

        // Record the payment (trigger updates invoices.amount_paid/status/paid_at)
        if (amount > 0 && paymentIntentId) {
          // Avoid double-recording if Stripe retries the webhook
          const { data: existing } = await admin
            .from("invoice_payments")
            .select("id")
            .eq("invoice_id", invoiceId)
            .eq("stripe_payment_intent_id", paymentIntentId)
            .maybeSingle();
          if (!existing) {
            await admin.from("invoice_payments").insert({
              invoice_id: invoiceId,
              amount,
              method: "stripe",
              reference: paymentIntentId,
              stripe_payment_intent_id: paymentIntentId,
              paid_at: new Date().toISOString(),
            });
          }
        }

        // Keep pointer to the latest intent on the invoice for refund webhook lookups
        await admin
          .from("invoices")
          .update({ stripe_payment_intent_id: paymentIntentId })
          .eq("id", invoiceId);
        console.log("Invoice payment recorded", invoiceId, amount);

        // Email paid receipt to customer (only if fully paid now)
        try {
          const { data: inv } = await admin
            .from("invoices")
            .select("status")
            .eq("id", invoiceId)
            .maybeSingle();
          if (inv?.status === "paid") {
            await sendInvoicePaidReceipt(admin, invoiceId, paymentIntentId);
          }
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
        // Look up membership by stripe_subscription_id
        const { data: m } = await admin
          .from("memberships")
          .select("id, customer_id, plan:membership_plans(stripe_price_id)")
          .eq("stripe_subscription_id", inv.subscription as string)
          .maybeSingle();

        if (m) {
          // Get Stripe fee from the charge's balance transaction
          let stripeFee: number | null = null;
          let chargeId: string | null = (inv.charge as string) || null;
          let piId: string | null = (inv.payment_intent as string) || null;
          try {
            if (chargeId) {
              const ch = await stripe.charges.retrieve(chargeId, {
                expand: ["balance_transaction"],
              });
              const bt = ch.balance_transaction as Stripe.BalanceTransaction | null;
              if (bt && typeof bt.fee === "number") stripeFee = bt.fee / 100;
              if (!piId && ch.payment_intent) piId = ch.payment_intent as string;
            }
          } catch (e) {
            console.warn("fee lookup failed", e);
          }

          const planPriceId = (m as any).plan?.stripe_price_id as string | undefined;
          const lines = inv.lines?.data ?? [];

          // Allocate the single charge's fee proportionally across lines
          const totalAmount = lines.reduce((s, l) => s + (l.amount || 0), 0) || 1;

          for (const line of lines) {
            const linePriceId = (line.price?.id ?? null) as string | null;
            const isRecurring = !!line.price?.recurring || linePriceId === planPriceId;
            const kind = isRecurring ? "subscription" : "deposit";
            const amount = (line.amount || 0) / 100;
            const lineFee = stripeFee != null
              ? Math.round((stripeFee * (line.amount || 0) / totalAmount) * 100) / 100
              : null;

            // Make stripe_invoice_id unique per line (deposit + subscription on same invoice)
            const stripeInvoiceId = `${inv.id}:${line.id}`;
            await admin
              .from("membership_payments")
              .upsert({
                membership_id: m.id,
                customer_id: m.customer_id,
                kind,
                amount,
                currency: inv.currency || "usd",
                status: "paid",
                stripe_invoice_id: stripeInvoiceId,
                stripe_payment_intent_id: piId,
                stripe_charge_id: chargeId,
                stripe_fee: lineFee,
                stripe_fee_synced_at: lineFee != null ? new Date().toISOString() : null,
                period_start: line.period?.start
                  ? new Date(line.period.start * 1000).toISOString()
                  : null,
                period_end: line.period?.end
                  ? new Date(line.period.end * 1000).toISOString()
                  : null,
                paid_at: new Date((inv.status_transitions?.paid_at ?? inv.created) * 1000).toISOString(),
                description: line.description ?? null,
              }, { onConflict: "stripe_invoice_id" });
          }

          await admin
            .from("memberships")
            .update({
              next_billing_date: lines[0]?.period?.end
                ? new Date(lines[0].period.end * 1000).toISOString().slice(0, 10)
                : null,
              current_period_end: lines[0]?.period?.end
                ? new Date(lines[0].period.end * 1000).toISOString()
                : null,
            })
            .eq("id", m.id);
        }
      }
    }

    if (event.type === "invoice.payment_failed") {
      const inv = event.data.object as Stripe.Invoice;
      if (inv.subscription) {
        await admin
          .from("memberships")
          .update({ status: "past_due" })
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
        if (event.type === "charge.refunded") {
          await admin
            .from("membership_payments")
            .update({ status: "refunded" })
            .eq("stripe_payment_intent_id", pi);
        }
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
