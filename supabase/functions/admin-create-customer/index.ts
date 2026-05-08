// Admin-only: create a customer profile (and auth user when email is provided)
// from imported data such as a parsed estimate PDF. Reuses an existing auth
// user/profile when the email already exists.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(url, anon, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(url, service);
    const { data: roleRows } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id);
    const roles = (roleRows ?? []).map((r: any) => r.role);
    const isStaff = roles.some((r: string) =>
      ["admin", "manager", "service_advisor", "technician", "parts"].includes(r)
    );
    if (!isStaff) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const fullName: string = (body.full_name || "").trim();
    const rawEmail: string = (body.email || "").trim().toLowerCase();
    const phone: string = (body.phone || "").trim();
    if (!fullName && !rawEmail && !phone) {
      throw new Error("At least one of full_name, email, or phone is required");
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

    if (rawEmail) {
      // Try to reuse an existing auth user with this email
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
          user_metadata: { full_name: fullName, phone, must_set_password: true, imported: true },
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
    } else {
      // No email — create a profile-only record (cannot self-login)
      userId = crypto.randomUUID();
    }

    // Ensure profile exists / is up to date
    const { error: profErr } = await admin.from("profiles").upsert({
      id: userId,
      email: rawEmail || null,
      full_name: fullName || null,
    });
    if (profErr) throw profErr;

    // Ensure customer role is assigned when we created/reused an auth user
    if (rawEmail) {
      const { error: roleErr } = await admin
        .from("user_roles")
        .insert({ user_id: userId, role: "customer" });
      if (roleErr && !String(roleErr.message).toLowerCase().includes("duplicate")) {
        throw roleErr;
      }
    }

    return new Response(
      JSON.stringify({ customer_id: userId, reused, has_login: !!rawEmail }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message ?? String(e) }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
