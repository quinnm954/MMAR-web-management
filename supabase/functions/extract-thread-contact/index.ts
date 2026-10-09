// Admin-only: read an SMS thread and extract customer contact + vehicle details
// with Lovable AI so staff can add a texter as a customer in one tap.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const Body = z.object({ thread_id: z.string().uuid() });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const userClient = createClient(url, anon, { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } });
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) return json({ error: "Unauthorized" }, 401);
    const admin = createClient(url, service);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
    if (!isAdmin) return json({ error: "Forbidden" }, 403);

    const parsed = Body.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);

    const { data: thread } = await admin.from("sms_threads").select("id, phone").eq("id", parsed.data.thread_id).maybeSingle();
    if (!thread) return json({ error: "Thread not found" }, 404);
    const { data: msgs } = await admin.from("sms_messages").select("direction, body, created_at")
      .eq("thread_id", thread.id).order("created_at", { ascending: true }).limit(200);
    const transcript = (msgs ?? []).filter((m) => m.body)
      .map((m) => `${m.direction === "inbound" ? "Customer" : "Shop"}: ${m.body}`).join("\n").slice(-12000);

    const empty = { full_name: null, email: null, address_line1: null, city: null, state: null, postal_code: null, vehicle: null };
    if (!transcript) return json({ phone: thread.phone, ...empty });

    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) return json({ phone: thread.phone, ...empty });
    const str = { type: ["string", "null"] };
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Extract the CUSTOMER's details from this auto-repair text conversation. Only use facts the customer (or shop confirming them) clearly stated. Use null when unsure. State as 2-letter code. Engine like '3.6L' or 'V6'." },
          { role: "user", content: transcript },
        ],
        tools: [{ type: "function", function: { name: "contact", parameters: { type: "object", properties: {
          full_name: str, email: str, address_line1: str, city: str, state: str, postal_code: str,
          vehicle_year: { type: ["integer", "null"] }, vehicle_make: str, vehicle_model: str, vehicle_engine: str,
        }, required: ["full_name"] } } }],
        tool_choice: { type: "function", function: { name: "contact" } },
      }),
    });
    if (res.status === 429) return json({ error: "AI is busy, try again in a moment." }, 429);
    if (res.status === 402) return json({ error: "AI credits are used up." }, 402);
    const data = await res.json();
    let out: Record<string, any> = {};
    try { out = JSON.parse(data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments || "{}"); } catch { /* ignore */ }
    const vehicle = out.vehicle_make || out.vehicle_model
      ? { year: out.vehicle_year ?? null, make: out.vehicle_make ?? null, model: out.vehicle_model ?? null, engine: out.vehicle_engine ?? null }
      : null;
    return json({
      phone: thread.phone, full_name: out.full_name ?? null, email: out.email ?? null,
      address_line1: out.address_line1 ?? null, city: out.city ?? null, state: out.state ?? null,
      postal_code: out.postal_code ?? null, vehicle,
    });
  } catch (e) {
    return json({ error: String((e as Error)?.message || e) }, 500);
  }
});
