import { createClient } from "npm:@supabase/supabase-js@2.99.2";
import Stripe from "npm:stripe@18.5.0";
import { syncFinancingInvoice } from '../_shared/financing-invoice.ts';
import { corsHeaders } from 'npm:@supabase/supabase-js@2.99.2/cors';

const cors = corsHeaders;
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: u } = await admin.auth.getUser(auth.replace("Bearer ", ""));
    const user = u?.user;
    if (!user) return json({ error: "Unauthorized" }, 401);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "");
    if (!['setup_bank', 'confirm_bank', 'run', 'refresh'].includes(action)) return json({ error: 'Unknown action' }, 400);
    const id = action === 'run' ? body.payment_id : body.contract_id;
    if (action !== 'confirm_bank' && (typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))) return json({ error: 'Invalid payment or contract ID' }, 400);
    if (action === 'confirm_bank' && (typeof body.session_id !== 'string' || !/^cs_[A-Za-z0-9_]{1,250}$/.test(body.session_id))) return json({ error: 'Invalid checkout session' }, 400);
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2025-08-27.basil" });
    const origin = req.headers.get("origin") || "https://mikesmautorepair.com";

    const loadContract = async (id: string) => {
      const { data } = await admin.from("financing_contracts").select("*").eq("id", id).maybeSingle();
      if (!data) throw new Error("Contract not found");
      if (!isAdmin && data.customer_id !== user.id) throw new Error("Forbidden");
      return data;
    };

    if (action === "setup_bank") {
      const c = await loadContract(body.contract_id);
      let customerId = c.stripe_customer_id as string | null;
      if (!customerId) {
        const { data: p } = await admin.from("profiles").select("full_name,email,phone").eq("id", c.customer_id).maybeSingle();
        const cust = await stripe.customers.create({
          name: p?.full_name || c.client_name,
          email: p?.email || undefined,
          phone: p?.phone || undefined,
          metadata: { customer_id: c.customer_id, contract_id: c.id },
        });
        customerId = cust.id;
        await admin.from("financing_contracts").update({ stripe_customer_id: customerId }).eq("id", c.id);
      }
      const back = isAdmin && c.customer_id !== user.id ? "/admin/financing" : "/portal/financing";
      const session = await stripe.checkout.sessions.create({
        mode: "setup",
        customer: customerId,
        currency: "usd",
        payment_method_types: ["card"],
        success_url: `${origin}${back}?bank_session={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}${back}?bank_canceled=1`,
        metadata: { contract_id: c.id },
      });
      return json({ url: session.url });
    }

    if (action === "confirm_bank") {
      const s = await stripe.checkout.sessions.retrieve(String(body.session_id), { expand: ["setup_intent.payment_method"] });
      const contractId = s.metadata?.contract_id;
      if (!contractId) throw new Error("Unknown session");
      await loadContract(contractId);
      const si = s.setup_intent as Stripe.SetupIntent | null;
      const pm = si?.payment_method as Stripe.PaymentMethod | null;
      if (!pm) return json({ ok: false, message: "Card not saved yet" });
      const last4 = pm.card?.last4 ?? pm.us_bank_account?.last4 ?? null;
      const brand = pm.card?.brand ? pm.card.brand.charAt(0).toUpperCase() + pm.card.brand.slice(1) : "Card";
      await admin.from("financing_contracts").update({
        stripe_payment_method_id: pm.id,
        bank_last4: last4,
      }).eq("id", contractId);
      return json({ ok: true, last4, brand });
    }

    if (action === "run") {
      const { data: pay } = await admin.from("financing_payments").select("*").eq("id", body.payment_id).maybeSingle();
      if (!pay) throw new Error("Payment not found");
      const c = await loadContract(pay.contract_id);
      if (["paid", "processing"].includes(pay.status)) return json({ error: "This payment is already " + pay.status }, 400);
      if (!c.stripe_customer_id || !c.stripe_payment_method_id) return json({ error: "Save a card first" }, 400);
      try {
        const pi = await stripe.paymentIntents.create({
          amount: Math.round(Number(pay.amount) * 100),
          currency: "usd",
          customer: c.stripe_customer_id,
          payment_method: c.stripe_payment_method_id,
          payment_method_types: ["card"],
          confirm: true,
          off_session: true,
          description: `${c.client_name} — ${pay.label}`,
          metadata: { financing_payment_id: pay.id, contract_id: c.id },
        }, { idempotencyKey: `fin-${pay.id}-${pay.status === "failed" ? Date.now() : "1"}` });
        const status = pi.status === "succeeded" ? "paid" : pi.status === "processing" ? "processing" : "failed";
        await admin.from("financing_payments").update({
          status, stripe_payment_intent_id: pi.id, failure_reason: null,
          paid_at: status === "paid" ? new Date().toISOString() : null,
        }).eq("id", pay.id);
        return json({ ok: true, status });
      } catch (e) {
        await admin.from("financing_payments").update({ status: "failed", failure_reason: String((e as Error).message).slice(0, 300) }).eq("id", pay.id);
        return json({ error: (e as Error).message }, 400);
      }
    }

    if (action === "refresh") {
      const c = await loadContract(body.contract_id);
      // Reconcile completed subscription invoices without charging the card.
      if (c.stripe_customer_id) {
        for await (const invoice of stripe.invoices.list({ customer: c.stripe_customer_id, status: 'paid', limit: 100 })) {
          await syncFinancingInvoice(admin, stripe, invoice, c.id);
        }
      }
      const { data: pending } = await admin.from("financing_payments").select("id,stripe_payment_intent_id")
        .eq("contract_id", c.id).eq("status", "processing").not("stripe_payment_intent_id", "is", null);
      for (const p of pending || []) {
        if (!p.stripe_payment_intent_id) continue;
        const pi = await stripe.paymentIntents.retrieve(p.stripe_payment_intent_id);
        if (pi.status === "succeeded") {
          await admin.from("financing_payments").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", p.id);
        } else if (pi.status === "requires_payment_method" || pi.status === "canceled") {
          await admin.from("financing_payments").update({
            status: "failed", failure_reason: pi.last_payment_error?.message || "Bank draft was returned",
          }).eq("id", p.id);
        }
      }
      return json({ ok: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("financing-ach", e);
    return json({ error: (e as Error).message }, 500);
  }
});
