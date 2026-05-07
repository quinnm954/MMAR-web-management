import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "jsr:@supabase/supabase-js@2/cors";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { membership_id } = await req.json();
    if (!membership_id || typeof membership_id !== "string") {
      return new Response(JSON.stringify({ error: "membership_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const auth = req.headers.get("Authorization");
    if (!auth) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: auth } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE);

    const { data: m, error: mErr } = await admin
      .from("memberships")
      .select(`
        id, customer_id, start_date, next_billing_date, agreement_signed_at,
        signature_image,
        plan:membership_plans ( name, monthly_price, deposit_amount, total_at_signup, features ),
        vehicle:vehicles ( year, make, model, trim, vin, license_plate ),
        ach:ach_authorizations ( account_holder_name, bank_name, account_last4, routing_last4, authorization_text )
      `)
      .eq("id", membership_id)
      .single();

    if (mErr || !m) {
      return new Response(JSON.stringify({ error: "Membership not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (m.customer_id !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single();

    // Build PDF
    const doc = new jsPDF({ unit: "pt", format: "letter" });
    const margin = 50;
    let y = margin;
    const lineH = 16;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("MMAR Care Membership Agreement", margin, y);
    y += lineH * 1.5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Mike's Mobile Auto Repair (MMAR)", margin, y); y += lineH;
    doc.text("Operated by Capital Services Management, INC.", margin, y); y += lineH;
    doc.text(`Agreement Date: ${m.agreement_signed_at?.slice(0, 10) || ""}`, margin, y);
    y += lineH * 1.5;

    const plan = m.plan as any;
    const vehicle = m.vehicle as any;
    const ach = m.ach as any;

    doc.setFont("helvetica", "bold");
    doc.text("Member Information", margin, y); y += lineH;
    doc.setFont("helvetica", "normal");
    doc.text(`Name: ${profile?.full_name || "—"}`, margin, y); y += lineH;
    doc.text(`Email: ${profile?.email || user.email || ""}`, margin, y); y += lineH * 1.5;

    doc.setFont("helvetica", "bold");
    doc.text("Vehicle", margin, y); y += lineH;
    doc.setFont("helvetica", "normal");
    const vStr = `${vehicle?.year || ""} ${vehicle?.make || ""} ${vehicle?.model || ""} ${vehicle?.trim || ""}`.trim();
    doc.text(`Vehicle: ${vStr}`, margin, y); y += lineH;
    doc.text(`VIN: ${vehicle?.vin || "—"}    License: ${vehicle?.license_plate || "—"}`, margin, y); y += lineH * 1.5;

    doc.setFont("helvetica", "bold");
    doc.text("Plan", margin, y); y += lineH;
    doc.setFont("helvetica", "normal");
    doc.text(`Plan: ${plan?.name || ""}`, margin, y); y += lineH;
    doc.text(`Monthly: $${Number(plan?.monthly_price || 0).toFixed(2)}    Deposit: $${Number(plan?.deposit_amount || 0).toFixed(2)}    Due Today: $${Number(plan?.total_at_signup || 0).toFixed(2)}`, margin, y); y += lineH;
    doc.text(`Start: ${m.start_date || ""}    Next Billing: ${m.next_billing_date || ""}`, margin, y); y += lineH * 1.5;

    doc.setFont("helvetica", "bold");
    doc.text("Payment Authorization (ACH)", margin, y); y += lineH;
    doc.setFont("helvetica", "normal");
    doc.text(`Account Holder: ${ach?.account_holder_name || "—"}`, margin, y); y += lineH;
    doc.text(`Bank: ${ach?.bank_name || "—"}    Routing ****${ach?.routing_last4 || ""}    Account ****${ach?.account_last4 || ""}`, margin, y); y += lineH * 1.5;

    doc.setFont("helvetica", "bold");
    doc.text("Terms", margin, y); y += lineH;
    doc.setFont("helvetica", "normal");
    const terms = [
      "1. Membership is tied to one VIN and is non-transferable.",
      "2. Recurring monthly billing begins on the start date via signed ACH authorization.",
      "3. Services are by appointment, subject to technician availability.",
      "4. Oil exceeding included quantity, specialty oils/filters, oversized or diesel vehicles may incur additional charges.",
      "5. Membership may be cancelled in writing after 3 months. Outstanding balances remain payable.",
      "6. Deposit is non-refundable.",
      "7. Governed by the laws of the State of Florida.",
    ];
    for (const t of terms) {
      const lines = doc.splitTextToSize(t, 500);
      doc.text(lines, margin, y);
      y += lineH * lines.length;
    }
    y += lineH;

    doc.setFont("helvetica", "bold");
    doc.text("Member Signature", margin, y); y += lineH * 0.5;
    if (m.signature_image && typeof m.signature_image === "string" && m.signature_image.startsWith("data:image")) {
      try {
        doc.addImage(m.signature_image, "PNG", margin, y, 180, 60);
      } catch (e) {
        console.error("sig embed failed", e);
      }
      y += 70;
    } else {
      y += lineH * 2;
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Signed: ${m.agreement_signed_at || ""}`, margin, y);

    const pdfBytes = doc.output("arraybuffer");
    const fileName = `agreements/${m.customer_id}/${membership_id}.pdf`;

    const { error: upErr } = await admin.storage
      .from("signatures")
      .upload(fileName, new Uint8Array(pdfBytes), {
        contentType: "application/pdf",
        upsert: true,
      });

    if (upErr) throw upErr;

    await admin
      .from("memberships")
      .update({ agreement_pdf_url: fileName })
      .eq("id", membership_id);

    return new Response(JSON.stringify({ success: true, path: fileName }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("generate-membership-agreement error", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
