import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@17.7.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://shop-flow-home.lovable.app";
const fmtUsd = (n: number | null | undefined) =>
  n == null ? "" : `$${Number(n).toFixed(2)}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Verify caller is admin
    const { data: roleRows } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    const isAdmin = (roleRows ?? []).some((r: any) => r.role === "admin");
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { invoice_id } = await req.json();
    if (!invoice_id || typeof invoice_id !== "string") {
      return new Response(JSON.stringify({ error: "invoice_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: inv } = await admin
      .from("invoices")
      .select("id, invoice_number, customer_id, service_record_id, line_items, subtotal, shop_supplies, tax, total, amount_paid, paid_at, discount_amount, discount_reason, stripe_payment_intent_id")
      .eq("id", invoice_id)
      .maybeSingle();
    if (!inv) {
      return new Response(JSON.stringify({ error: "Invoice not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: prof } = await admin
      .from("profiles")
      .select("email, full_name")
      .eq("id", inv.customer_id)
      .maybeSingle();
    if (!prof?.email) {
      return new Response(JSON.stringify({ error: "Customer has no email on file" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
    if (inv.stripe_payment_intent_id) {
      try {
        const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-11-20.acacia" });
        const pi = await stripe.paymentIntents.retrieve(inv.stripe_payment_intent_id, { expand: ["payment_method"] });
        const pm = pi.payment_method as any;
        if (pm?.card) paymentMethod = `${pm.card.brand?.toUpperCase()} ending ${pm.card.last4}`;
      } catch (_) { /* optional */ }
    }

    const paidAt = inv.paid_at
      ? new Date(inv.paid_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
      : new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    const { error: mailErr } = await admin.functions.invoke("send-transactional-email", {
      body: {
        templateName: "invoice-paid-receipt",
        recipientEmail: prof.email,
        idempotencyKey: `invoice-paid-receipt-${invoice_id}`,
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
          paymentMethod: paymentMethod || "Recorded by shop",
          vehicle,
          lineItems: Array.isArray(inv.line_items) ? inv.line_items : [],
          invoiceUrl: `${SITE_URL}/portal/invoices/${invoice_id}`,
        },
      },
    });

    if (mailErr) {
      return new Response(JSON.stringify({ error: mailErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-invoice-paid-receipt error", e);
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
