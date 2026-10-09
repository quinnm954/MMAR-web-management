// Sends a Web Push notification (VAPID / aes128gcm) to every browser
// subscription belonging to a user. Independent of the FCM `send-push`
// function which handles native (Capacitor) devices.
//
// Body: { user_id: string, title: string, body: string, url?: string, badge_count?: number, category?: string }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Body = {
  user_id?: string;
  title?: string;
  body?: string;
  url?: string;
  badge_count?: number;
  category?: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY");
    const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@example.com";

    if (!supabaseUrl || !serviceKey) {
      return json({ error: "Server not configured" }, 500);
    }
    if (!vapidPublic || !vapidPrivate) {
      return json({ error: "Web push not configured (missing VAPID keys)" }, 503);
    }

    const payload = (await req.json().catch(() => ({}))) as Body;
    if (!payload.user_id || !payload.title || !payload.body) {
      return json({ error: "user_id, title, body required" }, 400);
    }

    webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

    const admin = createClient(supabaseUrl, serviceKey);

    // Respect notification preferences (channel + category).
    const { data: pref } = await admin
      .from("notification_preferences")
      .select(
        "push_enabled, appointment_reminders, estimate_updates, invoice_updates, inspection_updates, repair_order_updates, membership_updates, marketing_updates, message_updates",
      )
      .eq("user_id", payload.user_id)
      .maybeSingle();
    if (pref && (pref as { push_enabled?: boolean }).push_enabled === false) {
      return json({ skipped: "push_disabled" });
    }
    if (payload.category && pref && (pref as Record<string, boolean>)[payload.category] === false) {
      return json({ skipped: `category_disabled:${payload.category}` });
    }

    const { data: allSubs, error: subErr } = await admin
      .from("web_push_subscriptions")
      .select("id, endpoint, p256dh, auth, app")
      .eq("user_id", payload.user_id);
    if (subErr) throw subErr;
    if (!allSubs || allSubs.length === 0) return json({ skipped: "no_subs" });

    // Communication alerts go to the MMAR Phone app when installed; everything
    // else stays in the main Garage Ace app. Fall back so nothing is missed.
    const phoneSubs = allSubs.filter((s) => s.app === "phone");
    const mainSubs = allSubs.filter((s) => s.app !== "phone");
    let subs = mainSubs.length ? mainSubs : allSubs;
    if (payload.category === "message_updates" && phoneSubs.length) {
      subs = phoneSubs;
      payload.url = "/admin/phone";
    }

    const messageBody = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || "/",
      badge_count: payload.badge_count,
      category: payload.category,
      tag: payload.category || "garage-ace",
    });

    const results: { id: string; ok: boolean; status?: number; error?: string }[] = [];

    for (const s of subs) {
      const subscription = {
        endpoint: s.endpoint,
        keys: { p256dh: s.p256dh, auth: s.auth },
      };
      try {
        // High urgency wakes the device immediately (banner + sound/vibration
        // like a native app); 1h TTL so alerts still arrive if the device was
        // briefly offline instead of being dropped after 60s.
        const res = await webpush.sendNotification(subscription, messageBody, {
          TTL: 3600,
          urgency: "high",
        });
        results.push({ id: s.id, ok: true, status: res.statusCode });
        await admin
          .from("web_push_subscriptions")
          .update({ last_seen_at: new Date().toISOString() })
          .eq("id", s.id);
      } catch (err: any) {
        const status = err?.statusCode as number | undefined;
        results.push({ id: s.id, ok: false, status, error: String(err?.body || err?.message || err) });
        if (status === 404 || status === 410) {
          await admin.from("web_push_subscriptions").delete().eq("id", s.id);
        }
      }
    }

    return json({ ok: true, results });
  } catch (err) {
    console.error("send-web-push error", err);
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
