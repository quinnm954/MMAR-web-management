import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "jsr:@supabase/supabase-js@2/cors";

const MAX_TEXT = 500;
const MAX_LONG = 5000;
const MAX_SIG_BYTES = 200_000; // ~200KB per signature data URL

const isStr = (v: unknown, max = MAX_TEXT) =>
  typeof v === "string" && v.length > 0 && v.length <= max;
const optStr = (v: unknown, max = MAX_TEXT) =>
  v === null || v === undefined || (typeof v === "string" && v.length <= max);
const isNum = (v: unknown) => typeof v === "number" && Number.isFinite(v) && v >= 0 && v < 1e9;
const isDate = (v: unknown) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
const isPngDataUrl = (v: unknown) =>
  typeof v === "string" &&
  v.startsWith("data:image/png;base64,") &&
  v.length <= MAX_SIG_BYTES;
const optPng = (v: unknown) => v === null || v === undefined || isPngDataUrl(v);
const optIso = (v: unknown) =>
  v === null || v === undefined || (typeof v === "string" && !Number.isNaN(Date.parse(v)));

function bad(msg: string, status = 400) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function uploadSignature(
  admin: ReturnType<typeof createClient>,
  dataUrl: string,
  type: "client" | "provider",
): Promise<string | null> {
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const fileName = `${type}-${Date.now()}-${crypto.randomUUID()}.png`;
  const { data, error } = await admin.storage
    .from("signatures")
    .upload(fileName, bytes, { contentType: "image/png" });
  if (error) throw error;
  return data.path;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return bad("Method not allowed", 405);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return bad("Invalid JSON");
  }

  // Validate required fields
  if (!isStr(body.client_name)) return bad("Invalid client_name");
  if (!isStr(body.client_address)) return bad("Invalid client_address");
  if (!isStr(body.client_contact)) return bad("Invalid client_contact");
  if (!isDate(body.agreement_date)) return bad("Invalid agreement_date");
  if (!isDate(body.first_payment_date)) return bad("Invalid first_payment_date");
  if (!isNum(body.total_service_price)) return bad("Invalid total_service_price");
  if (!isNum(body.down_payment)) return bad("Invalid down_payment");
  if (!isNum(body.principal)) return bad("Invalid principal");
  if (!isNum(body.interest)) return bad("Invalid interest");
  if (!isNum(body.total_financed)) return bad("Invalid total_financed");
  if (!isNum(body.monthly_payment)) return bad("Invalid monthly_payment");

  // Optional fields
  if (!optStr(body.vehicle_info)) return bad("Invalid vehicle_info");
  if (!optStr(body.service_description, MAX_LONG)) return bad("Invalid service_description");
  if (!optStr(body.status)) return bad("Invalid status");
  const allowedStatus = ["draft", "pending", "signed"];
  const status = (body.status as string) ?? "draft";
  if (!allowedStatus.includes(status)) return bad("Invalid status value");

  // Initials (short text)
  for (const k of [
    "initial_terms",
    "initial_security_interest",
    "initial_default_consequences",
    "initial_info_accuracy",
    "initial_received_copy",
  ]) {
    if (!optStr((body as Record<string, unknown>)[k], 200)) return bad(`Invalid ${k}`);
  }

  // Signatures: PNG data URLs only
  if (!optPng(body.client_signature)) return bad("Invalid client_signature");
  if (!optPng(body.provider_signature)) return bad("Invalid provider_signature");
  if (!optIso(body.client_signed_at)) return bad("Invalid client_signed_at");
  if (!optIso(body.provider_signed_at)) return bad("Invalid provider_signed_at");

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  let clientSigPath: string | null = null;
  let providerSigPath: string | null = null;
  try {
    if (body.client_signature) {
      clientSigPath = await uploadSignature(admin, body.client_signature as string, "client");
    }
    if (body.provider_signature) {
      providerSigPath = await uploadSignature(admin, body.provider_signature as string, "provider");
    }
  } catch (e) {
    console.error("Signature upload failed", e);
    return bad("Failed to store signatures", 500);
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("cf-connecting-ip") ??
    null;
  const userAgent = req.headers.get("user-agent") ?? null;

  const customerId = typeof body.customer_id === "string" && /^[0-9a-f-]{36}$/i.test(body.customer_id) ? body.customer_id : null;
  const estimateId = typeof body.estimate_id === "string" && /^[0-9a-f-]{36}$/i.test(body.estimate_id) ? body.estimate_id : null;

  const { error } = await admin.from("financing_contracts").insert({
    customer_id: customerId,
    estimate_id: estimateId,
    client_name: body.client_name,
    client_address: body.client_address,
    client_contact: body.client_contact,
    agreement_date: body.agreement_date,
    vehicle_info: body.vehicle_info ?? null,
    service_description: body.service_description ?? null,
    total_service_price: body.total_service_price,
    first_payment_date: body.first_payment_date,
    down_payment: body.down_payment,
    principal: body.principal,
    interest: body.interest,
    total_financed: body.total_financed,
    monthly_payment: body.monthly_payment,
    client_signature_url: clientSigPath,
    client_signed_at: body.client_signed_at ?? null,
    provider_signature_url: providerSigPath,
    provider_signed_at: body.provider_signed_at ?? null,
    initial_terms: body.initial_terms ?? null,
    initial_security_interest: body.initial_security_interest ?? null,
    initial_default_consequences: body.initial_default_consequences ?? null,
    initial_info_accuracy: body.initial_info_accuracy ?? null,
    initial_received_copy: body.initial_received_copy ?? null,
    status,
    ip_address: ip,
    user_agent: userAgent,
  });

  if (error) {
    console.error("Insert failed", error);
    return bad("Failed to save contract", 500);
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
});
