// Admin-only: create an auth user for a new employee/admin, assign role,
// and flag must_set_password=true so they're prompted on first login.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ROLE_MAP: Record<string, string> = {
  admin: "admin",
  manager: "manager",
  technician: "technician",
  service_advisor: "service_advisor",
  parts: "parts",
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

    // Verify caller is admin
    const admin = createClient(url, service);
    const { data: roleRows } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id);
    const isAdmin = (roleRows ?? []).some((r: any) => r.role === "admin");
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const email: string = (body.email || "").trim().toLowerCase();
    const fullName: string = body.full_name || "";
    const employeeType: string = body.employee_type || "technician";
    const role = ROLE_MAP[employeeType];
    if (!email) throw new Error("Email required");
    if (!role) throw new Error(`No role mapping for type "${employeeType}"`);

    // Helper: find an auth user by email (paginated, case-insensitive)
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

    // If a user with that email already exists, reuse them. Otherwise create.
    let userId: string | null = null;
    let reused = false;
    let existing = await findUserByEmail(email);

    if (!existing) {
      const tempPassword = crypto.randomUUID() + "Aa1!";
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { full_name: fullName, must_set_password: true },
      });
      if (createErr) {
        // Race: another request created the user between lookup and create
        const msg = (createErr.message || "").toLowerCase();
        if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
          existing = await findUserByEmail(email);
          if (!existing) throw createErr;
        } else {
          throw createErr;
        }
      } else {
        userId = created.user!.id;
      }
    }

    if (existing && !userId) {
      reused = true;
      userId = existing.id;
      // Re-flag must_set_password and merge metadata without clobbering other fields
      const meta = (existing.user_metadata ?? {}) as Record<string, unknown>;
      await admin.auth.admin.updateUserById(existing.id, {
        email_confirm: true,
        user_metadata: {
          ...meta,
          must_set_password: true,
          full_name: fullName || (meta.full_name as string | undefined),
        },
      });
    }

    // Assign role (ignore conflict)
    const { error: roleErr } = await admin
      .from("user_roles")
      .insert({ user_id: userId, role });
    if (roleErr && !String(roleErr.message).toLowerCase().includes("duplicate")) {
      throw roleErr;
    }

    // Ensure profile exists
    await admin.from("profiles").upsert({ id: userId, email, full_name: fullName });

    return new Response(JSON.stringify({ user_id: userId, role, reused }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message ?? String(e) }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
