// Public endpoint: when a booking request is submitted from the website,
// auto-create a customer (profile + auth user when an email is provided) so
// they can later set a password and access the portal. Idempotent — reuses
// any existing auth user / profile with the same email.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, service);

    const body = await req.json().catch(() => ({}));
    const token: string = (body.token || "").trim();
    if (!token || token.length < 8 || token.length > 64) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Look up booking request by its confirmation token
    const { data: booking, error: bErr } = await admin
      .from("booking_requests")
      .select("id, customer_name, customer_email, customer_phone")
      .eq("confirmation_token", token)
      .maybeSingle();
    if (bErr) throw bErr;
    if (!booking) {
      return new Response(JSON.stringify({ error: "Booking not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fullName = (booking.customer_name || "").trim();
    const phone = (booking.customer_phone || "").trim();
    const rawEmail = (booking.customer_email || "").trim().toLowerCase();

    // No email -> create a profile-only customer record (no auth login) so the
    // customer still appears in the admin Customers list. They can be linked to
    // an auth account later if/when they provide an email.
    if (!rawEmail) {
      const profileOnlyId = crypto.randomUUID();
      await admin.from("profiles").upsert({
        id: profileOnlyId,
        email: null,
        full_name: fullName || null,
        phone: phone || null,
      });
      return new Response(
        JSON.stringify({ created: true, has_login: false, customer_id: profileOnlyId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const findUserByEmail = async (target: string) => {
      const perPage = 1000;
      for (let page = 1; page <= 20; page++) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
        if (error) throw error;
        const hit = data.users.find((u) => (u.email ?? "").toLowerCase() === target);
        if (hit) return hit;
        if (data.users.length < perPage) return null;
      }
      return null;
    };

    let userId: string | null = null;
    let reused = false;

    const existing = await findUserByEmail(rawEmail);
    if (existing) {
      userId = existing.id;
      reused = true;
    } else {
      const tempPassword = crypto.randomUUID() + "Aa1!";
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: rawEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          phone,
          must_set_password: true,
          source: "website_booking",
        },
      });
      if (createErr) {
        const msg = (createErr.message || "").toLowerCase();
        if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
          const retry = await findUserByEmail(rawEmail);
          if (!retry) throw createErr;
          userId = retry.id;
          reused = true;
        } else {
          throw createErr;
        }
      } else {
        userId = created.user!.id;
      }
    }

    // Upsert profile (don't overwrite existing values with blanks)
    const { data: existingProfile } = await admin
      .from("profiles")
      .select("id, full_name, phone, email")
      .eq("id", userId!)
      .maybeSingle();

    await admin.from("profiles").upsert({
      id: userId,
      email: rawEmail,
      full_name: existingProfile?.full_name || fullName || null,
      phone: existingProfile?.phone || phone || null,
    });

    // Ensure customer role
    const { error: roleErr } = await admin
      .from("user_roles")
      .insert({ user_id: userId, role: "customer" });
    if (roleErr && !String(roleErr.message).toLowerCase().includes("duplicate")) {
      // ignore conflicts (already a customer / owner)
    }

    return new Response(
      JSON.stringify({ created: !reused, reused, customer_id: userId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message ?? String(e) }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
