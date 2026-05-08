// Send a push notification to one user's registered devices via Firebase Cloud Messaging.
// FCM HTTP v1 is used for both Android and iOS (APNs is bridged inside Firebase).
//
// Required secrets (set via the Lovable Cloud secrets UI):
//   FCM_PROJECT_ID         — your Firebase project ID
//   FCM_SERVICE_ACCOUNT    — the entire JSON of an FCM service-account key
//
// Body: { user_id: string, title: string, body: string, data?: Record<string,string> }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const FCM_SCOPE = "https://www.googleapis.com/auth/firebase.messaging";

// --- minimal JWT signer for the FCM service account ---
function base64url(input: ArrayBuffer | Uint8Array | string): string {
  let bytes: Uint8Array;
  if (typeof input === "string") {
    bytes = new TextEncoder().encode(input);
  } else if (input instanceof Uint8Array) {
    bytes = input;
  } else {
    bytes = new Uint8Array(input);
  }
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

async function getFcmAccessToken(serviceAccountJson: string): Promise<string> {
  const sa = JSON.parse(serviceAccountJson);
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: sa.client_email,
    scope: FCM_SCOPE,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(
    JSON.stringify(claims),
  )}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(sa.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsigned),
  );
  const jwt = `${unsigned}.${base64url(sig)}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!tokenRes.ok) {
    throw new Error(`FCM token error: ${tokenRes.status} ${await tokenRes.text()}`);
  }
  const j = await tokenRes.json();
  return j.access_token as string;
}

interface PushRequest {
  user_id: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const projectId = Deno.env.get("FCM_PROJECT_ID");
    const serviceAccount = Deno.env.get("FCM_SERVICE_ACCOUNT");

    if (!supabaseUrl || !serviceKey) {
      return new Response(
        JSON.stringify({ error: "Server not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!projectId || !serviceAccount) {
      return new Response(
        JSON.stringify({
          error: "Push not configured (missing FCM_PROJECT_ID / FCM_SERVICE_ACCOUNT)",
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = (await req.json()) as PushRequest;
    if (!body?.user_id || !body?.title || !body?.body) {
      return new Response(
        JSON.stringify({ error: "user_id, title, body are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Respect notification preferences
    const { data: pref } = await supabase
      .from("notification_preferences")
      .select("push_enabled")
      .eq("user_id", body.user_id)
      .maybeSingle();
    if (pref && pref.push_enabled === false) {
      return new Response(
        JSON.stringify({ skipped: "push_disabled" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: tokens, error: tokErr } = await supabase
      .from("device_tokens")
      .select("token, platform")
      .eq("user_id", body.user_id);
    if (tokErr) throw tokErr;
    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ skipped: "no_tokens" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const accessToken = await getFcmAccessToken(serviceAccount);
    const sendUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

    const results: { token: string; ok: boolean; status?: number; error?: string }[] = [];

    for (const t of tokens) {
      const message = {
        message: {
          token: t.token,
          notification: { title: body.title, body: body.body },
          data: body.data ?? {},
        },
      };
      const r = await fetch(sendUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
      });
      if (r.ok) {
        results.push({ token: t.token, ok: true });
        await supabase
          .from("device_tokens")
          .update({ last_seen_at: new Date().toISOString() })
          .eq("user_id", body.user_id)
          .eq("token", t.token);
      } else {
        const errText = await r.text();
        results.push({ token: t.token, ok: false, status: r.status, error: errText });
        // Drop dead tokens
        if (r.status === 404 || r.status === 410) {
          await supabase
            .from("device_tokens")
            .delete()
            .eq("user_id", body.user_id)
            .eq("token", t.token);
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-push error", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
