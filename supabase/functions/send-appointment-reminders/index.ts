// Sends MMAR Care appointment reminders 24h and 2h before each scheduled appointment.
// Triggered hourly by pg_cron — see the migration that schedules it.
//
// For each due appointment:
//   - Sends a push (via send-push function) if the customer has device tokens and push is enabled
//   - Sends an SMS via Twilio if the customer has a phone number and SMS reminders are enabled
//   - Marks the corresponding reminder_sent_24h / reminder_sent_2h flag

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TWILIO_GATEWAY = "https://connector-gateway.lovable.dev/twilio";

type Window = "24h" | "2h";

function fmtWindow(scheduledAt: string): string {
  const d = new Date(scheduledAt);
  return d.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
    timeZoneName: "short",
  });
}

async function sendSmsRaw(to: string, body: string) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const TWILIO_API_KEY = Deno.env.get("TWILIO_API_KEY");
  const TWILIO_FROM = Deno.env.get("TWILIO_FROM_NUMBER");
  if (!LOVABLE_API_KEY || !TWILIO_API_KEY || !TWILIO_FROM) return null;

  const r = await fetch(`${TWILIO_GATEWAY}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": TWILIO_API_KEY,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: to, From: TWILIO_FROM, Body: body }),
  });
  return r.ok;
}

async function sendPushFor(
  supabaseUrl: string,
  serviceKey: string,
  userId: string,
  title: string,
  body: string,
) {
  try {
    const r = await fetch(`${supabaseUrl}/functions/v1/send-push`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
        title,
        body,
        data: { url: "/portal/appointments" },
      }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const now = new Date();
    const in23h = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000);
    const in1h = new Date(now.getTime() + 1 * 60 * 60 * 1000);
    const in3h = new Date(now.getTime() + 3 * 60 * 60 * 1000);

    type Row = {
      id: string;
      customer_id: string;
      scheduled_at: string;
      service_type: string;
      service_address: string | null;
    };

    const summary: Record<string, number> = { sent_24h: 0, sent_2h: 0, skipped: 0 };

    for (const win of ["24h", "2h"] as Window[]) {
      const lower = win === "24h" ? in23h : in1h;
      const upper = win === "24h" ? in25h : in3h;
      const flagCol = win === "24h" ? "reminder_sent_24h" : "reminder_sent_2h";

      const { data: appts, error } = await supabase
        .from("appointments")
        .select("id, customer_id, scheduled_at, service_type, service_address")
        .gte("scheduled_at", lower.toISOString())
        .lte("scheduled_at", upper.toISOString())
        .eq(flagCol, false)
        .in("status", ["scheduled", "confirmed", "in_progress"]);

      if (error) {
        console.error("Reminder query failed", win, error);
        continue;
      }

      for (const a of (appts ?? []) as Row[]) {
        // Look up customer phone + preferences
        const [{ data: profile }, { data: pref }] = await Promise.all([
          supabase
            .from("profiles")
            .select("full_name, phone")
            .eq("id", a.customer_id)
            .maybeSingle(),
          supabase
            .from("notification_preferences")
            .select("push_enabled, sms_enabled, appointment_reminders")
            .eq("user_id", a.customer_id)
            .maybeSingle(),
        ]);

        if (pref && pref.appointment_reminders === false) {
          summary.skipped++;
          await supabase
            .from("appointments")
            .update({ [flagCol]: true })
            .eq("id", a.id);
          continue;
        }

        const when = fmtWindow(a.scheduled_at);
        const lead = win === "24h" ? "tomorrow" : "in about 2 hours";
        const title = `MMAR Care reminder`;
        const body = `Your ${a.service_type} appointment is ${lead} (${when}).${
          a.service_address ? ` We'll meet you at ${a.service_address}.` : ""
        } Reply or call (813) 501-7572 if anything changes.`;

        // Push (best effort)
        if (!pref || pref.push_enabled !== false) {
          await sendPushFor(supabaseUrl, serviceKey, a.customer_id, title, body);
        }

        // SMS (best effort)
        const phone = (profile?.phone ?? "").trim();
        if (phone && (!pref || pref.sms_enabled !== false)) {
          await sendSmsRaw(phone, body);
        }

        await supabase
          .from("appointments")
          .update({ [flagCol]: true })
          .eq("id", a.id);

        if (win === "24h") summary.sent_24h++;
        else summary.sent_2h++;
      }
    }

    return new Response(JSON.stringify({ ok: true, ...summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-appointment-reminders error", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
