import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import Stripe from "npm:stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/twilio";
const SHOP_NAME = "MMAR Care";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await userClient.auth.getUser(token);
    const user = userData?.user;
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = user.id;

    // Admin check via has_role
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: roleRow } = await admin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Admin only" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json().catch(() => ({}));
    const invoiceId: string | undefined = body?.invoice_id;
    let phone: string | undefined = body?.phone;
    const copyOnly: boolean = body?.copy_only === true;
    if (!invoiceId) {
      return new Response(JSON.stringify({ error: "invoice_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: invoice, error: iErr } = await admin
      .from("invoices")
      .select("id, customer_id, total, amount_paid, status, invoice_number")
      .eq("id", invoiceId)
      .maybeSingle();
    if (iErr || !invoice) {
      return new Response(JSON.stringify({ error: "Invoice not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (invoice.status === "paid") {
      return new Response(JSON.stringify({ error: "Invoice already paid" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const due = Number(invoice.total) - Number(invoice.amount_paid || 0);
    if (due <= 0) {
      return new Response(JSON.stringify({ error: "Nothing due" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Look up phone if not provided (skip when copy_only)
    let threadId: string | null = null;
    if (!copyOnly) {
      if (!phone) {
        const { data: thread } = await admin
          .from("sms_threads")
          .select("id, phone")
          .eq("customer_id", invoice.customer_id)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (thread) {
          phone = thread.phone;
          threadId = thread.id;
        }
      }
      if (!phone) {
        return new Response(JSON.stringify({ error: "No phone number on file. Please provide one." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // Customer profile (for email + name)
    const { data: profile } = await admin.from("profiles").select("email, full_name").eq("id", invoice.customer_id).maybeSingle();

    // Create Stripe checkout session
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2025-08-27.basil" });
    const origin = req.headers.get("origin") || "https://shop-flow-home.lovable.app";
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: profile?.email || undefined,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: invoice.invoice_number || `Invoice ${invoice.id.slice(0, 8)}` },
            unit_amount: Math.round(due * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/portal/invoices?paid=1`,
      cancel_url: `${origin}/portal/invoices?canceled=1`,
      metadata: { invoice_id: invoice.id, customer_id: invoice.customer_id, source: "text_to_pay" },
    });

    await admin.from("invoices").update({ stripe_session_id: session.id }).eq("id", invoice.id);

    // Build message preview
    const greeting = profile?.full_name ? `Hi ${profile.full_name.split(" ")[0]}, ` : "";
    const msg = `${SHOP_NAME}: ${greeting}your invoice ${invoice.invoice_number || ""} for $${due.toFixed(2)} is ready. Pay securely: ${session.url}`;

    if (copyOnly) {
      return new Response(JSON.stringify({ ok: true, url: session.url, message: msg }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find / create thread for outbound logging
    if (!threadId) {
      const { data: existing } = await admin.from("sms_threads").select("id").eq("phone", phone!).maybeSingle();
      if (existing) {
        threadId = existing.id;
      } else {
        const { data: created } = await admin
          .from("sms_threads")
          .insert({ phone: phone!, customer_id: invoice.customer_id, last_message_preview: "Payment link sent" })
          .select("id")
          .single();
        threadId = created?.id || null;
      }
    }

    // Send SMS via Twilio gateway
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const TWILIO_API_KEY = Deno.env.get("TWILIO_API_KEY");
    const TWILIO_FROM = Deno.env.get("TWILIO_FROM_NUMBER");
    if (!LOVABLE_API_KEY || !TWILIO_API_KEY || !TWILIO_FROM) {
      return new Response(JSON.stringify({ error: "Twilio not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const tw = await fetch(`${GATEWAY_URL}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": TWILIO_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: phone!, From: TWILIO_FROM, Body: msg }),
    });
    const twData = await tw.json();
    if (!tw.ok) {
      return new Response(JSON.stringify({ error: twData?.message || "Twilio error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (threadId) {
      await admin.from("sms_messages").insert({
        thread_id: threadId,
        direction: "outbound",
        body: msg,
        twilio_sid: twData.sid,
        status: twData.status,
        invoice_id: invoice.id,
      });
      await admin.from("sms_threads").update({
        last_message_preview: msg.slice(0, 120),
        last_message_at: new Date().toISOString(),
        last_invoice_id: invoice.id,
        customer_id: invoice.customer_id,
      }).eq("id", threadId);
    }

    return new Response(JSON.stringify({ ok: true, sid: twData.sid, url: session.url, phone }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-invoice-payment-link error", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
