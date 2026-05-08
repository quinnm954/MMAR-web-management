// Admin-only: generate a Stripe payment link/checkout session for any of:
//   - invoice (uses outstanding balance)
//   - financing_down_payment (uses contract.down_payment)
//   - financing_monthly (uses contract.monthly_payment)
//   - membership_deposit (uses plan.deposit_amount or plan.total_at_signup)
//   - membership_subscription (recurring subscription via plan.stripe_price_id)
//   - custom (caller supplies amount + description)
// Optionally SMS the link to the customer's phone.

import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import Stripe from "npm:stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/twilio";
const SHOP_NAME = "MMAR Care";

type Kind =
  | "invoice"
  | "financing_down_payment"
  | "financing_monthly"
  | "membership_deposit"
  | "membership_subscription"
  | "custom";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json(401, { error: "Unauthorized" });

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await userClient.auth.getUser(token);
    const user = userData?.user;
    if (userErr || !user) return json(401, { error: "Unauthorized" });
    const userId = user.id;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) return json(403, { error: "Admin only" });

    const body = await req.json().catch(() => ({}));
    const kind = body?.kind as Kind | undefined;
    const referenceId = body?.reference_id as string | undefined;
    const amountInput = body?.amount as number | undefined;
    const descriptionInput = body?.description as string | undefined;
    const sendSms = body?.send_sms === true;
    let phone: string | undefined = body?.phone;
    let customerId: string | undefined = body?.customer_id;
    let customerEmail: string | undefined;
    let customerName: string | undefined;
    let amountCents = 0;
    let description = descriptionInput || "";
    let mode: "payment" | "subscription" = "payment";
    let stripePriceId: string | undefined;
    const metadata: Record<string, string> = { kind: kind || "" };

    if (!kind) return json(400, { error: "kind required" });

    if (kind === "invoice") {
      if (!referenceId) return json(400, { error: "reference_id (invoice id) required" });
      const { data: inv } = await admin
        .from("invoices")
        .select("id, customer_id, total, amount_paid, status, invoice_number")
        .eq("id", referenceId)
        .maybeSingle();
      if (!inv) return json(404, { error: "Invoice not found" });
      if (inv.status === "paid") return json(400, { error: "Invoice already paid" });
      const due = Number(inv.total) - Number(inv.amount_paid || 0);
      if (due <= 0) return json(400, { error: "Nothing due" });
      amountCents = Math.round(due * 100);
      description = inv.invoice_number || `Invoice ${inv.id.slice(0, 8)}`;
      customerId = inv.customer_id;
      metadata.invoice_id = inv.id;
    } else if (kind === "financing_down_payment" || kind === "financing_monthly") {
      if (!referenceId) return json(400, { error: "reference_id (contract id) required" });
      const { data: c } = await admin
        .from("financing_contracts")
        .select("id, customer_id, client_name, client_contact, down_payment, monthly_payment, total_service_price")
        .eq("id", referenceId)
        .maybeSingle();
      if (!c) return json(404, { error: "Contract not found" });
      const amt = kind === "financing_down_payment" ? Number(c.down_payment) : Number(c.monthly_payment);
      if (!amt || amt <= 0) return json(400, { error: "No amount on contract" });
      amountCents = Math.round((amountInput ?? amt) * 100);
      description = kind === "financing_down_payment"
        ? `Financing down payment — ${c.client_name}`
        : `Financing monthly payment — ${c.client_name}`;
      customerId = c.customer_id || undefined;
      customerName = c.client_name;
      // Phone may live on contract.client_contact (could be email or phone)
      if (!phone && c.client_contact && /^[+\d().\-\s]+$/.test(c.client_contact)) phone = c.client_contact;
      metadata.financing_contract_id = c.id;
    } else if (kind === "membership_deposit") {
      if (!referenceId) return json(400, { error: "reference_id (membership id) required" });
      const { data: m } = await admin
        .from("memberships")
        .select("id, customer_id, deposit_paid, plan:membership_plans(deposit_amount, total_at_signup, name, stripe_price_id)")
        .eq("id", referenceId)
        .maybeSingle();
      if (!m) return json(404, { error: "Membership not found" });
      if (m.deposit_paid) return json(400, { error: "Deposit already paid" });
      const plan: any = m.plan;
      const amt = Number(plan?.total_at_signup ?? plan?.deposit_amount ?? 0);
      if (!amt || amt <= 0) return json(400, { error: "Plan has no deposit" });
      amountCents = Math.round((amountInput ?? amt) * 100);
      description = `${plan?.name || "Membership"} — signup`;
      customerId = m.customer_id;
      metadata.membership_id = m.id;
    } else if (kind === "membership_subscription") {
      if (!referenceId) return json(400, { error: "reference_id (membership id) required" });
      const { data: m } = await admin
        .from("memberships")
        .select("id, customer_id, plan:membership_plans(name, stripe_price_id, monthly_price)")
        .eq("id", referenceId)
        .maybeSingle();
      if (!m) return json(404, { error: "Membership not found" });
      const plan: any = m.plan;
      if (!plan?.stripe_price_id) return json(400, { error: "Plan missing stripe_price_id" });
      stripePriceId = plan.stripe_price_id;
      mode = "subscription";
      description = `${plan?.name || "Membership"} — monthly`;
      customerId = m.customer_id;
      metadata.membership_id = m.id;
    } else if (kind === "custom") {
      if (!amountInput || amountInput <= 0) return json(400, { error: "amount required for custom" });
      amountCents = Math.round(amountInput * 100);
      description = descriptionInput || "Payment";
      customerId = body?.customer_id;
    } else {
      return json(400, { error: "Invalid kind" });
    }

    // Look up customer profile (email, phone via SMS thread if available)
    if (customerId) {
      const { data: profile } = await admin
        .from("profiles")
        .select("email, full_name")
        .eq("id", customerId)
        .maybeSingle();
      customerEmail = profile?.email || customerEmail;
      customerName = customerName || profile?.full_name || undefined;
      if (sendSms && !phone) {
        const { data: thread } = await admin
          .from("sms_threads")
          .select("phone")
          .eq("customer_id", customerId)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (thread) phone = thread.phone;
      }
      metadata.customer_id = customerId;
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2025-08-27.basil",
    });
    const origin = req.headers.get("origin") || "https://shop-flow-home.lovable.app";

    const session = await stripe.checkout.sessions.create({
      mode,
      payment_method_types: ["card"],
      customer_email: customerEmail,
      line_items: mode === "subscription"
        ? [{ price: stripePriceId!, quantity: 1 }]
        : [{
            price_data: {
              currency: "usd",
              product_data: { name: description },
              unit_amount: amountCents,
            },
            quantity: 1,
          }],
      success_url: `${origin}/portal?paid=1`,
      cancel_url: `${origin}/portal?canceled=1`,
      metadata,
    });

    // Persist link reference where applicable
    if (kind === "invoice" && metadata.invoice_id) {
      await admin.from("invoices").update({ stripe_session_id: session.id }).eq("id", metadata.invoice_id);
    }

    const greeting = customerName ? `Hi ${customerName.split(" ")[0]}, ` : "";
    const amtStr = mode === "subscription" ? "" : ` for $${(amountCents / 100).toFixed(2)}`;
    const message = `${SHOP_NAME}: ${greeting}${description}${amtStr}. Pay securely: ${session.url}`;

    if (!sendSms) {
      return json(200, { ok: true, url: session.url, message });
    }

    if (!phone) return json(400, { error: "No phone number available. Provide one." });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const TWILIO_API_KEY = Deno.env.get("TWILIO_API_KEY");
    const TWILIO_FROM = Deno.env.get("TWILIO_FROM_NUMBER");
    if (!LOVABLE_API_KEY || !TWILIO_API_KEY || !TWILIO_FROM) {
      return json(500, { error: "Twilio not configured" });
    }

    const tw = await fetch(`${GATEWAY_URL}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": TWILIO_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: phone, From: TWILIO_FROM, Body: message }),
    });
    const twData = await tw.json();
    if (!tw.ok) return json(500, { error: twData?.message || "Twilio error" });

    // Log SMS in thread
    let threadId: string | null = null;
    const { data: existing } = await admin.from("sms_threads").select("id").eq("phone", phone).maybeSingle();
    if (existing) threadId = existing.id;
    else {
      const { data: created } = await admin
        .from("sms_threads")
        .insert({ phone, customer_id: customerId, last_message_preview: "Payment link sent" })
        .select("id")
        .single();
      threadId = created?.id || null;
    }
    if (threadId) {
      await admin.from("sms_messages").insert({
        thread_id: threadId,
        direction: "outbound",
        body: message,
        twilio_sid: twData.sid,
        status: twData.status,
        invoice_id: metadata.invoice_id || null,
      });
      await admin.from("sms_threads").update({
        last_message_preview: message.slice(0, 120),
        last_message_at: new Date().toISOString(),
        customer_id: customerId,
      }).eq("id", threadId);
    }

    return json(200, { ok: true, url: session.url, message, sid: twData.sid, phone });
  } catch (e) {
    console.error("create-payment-link error", e);
    return json(500, { error: String(e) });
  }
});
