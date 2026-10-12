import { supabase } from "@/integrations/supabase/client";

const toE164 = (p?: string | null) => {
  const d = (p || "").replace(/\D/g, "");
  if (d.length === 10) return `+1${d}`;
  if (d.length === 11 && d.startsWith("1")) return `+${d}`;
  return null;
};

/** Sends the customer an appointment confirmation by email and text. Never throws. */
export async function sendAppointmentConfirmation(opts: {
  appointmentId: string;
  scheduledAt: string;
  customer?: { id?: string; full_name?: string | null; email?: string | null; phone?: string | null } | null;
  vehicle?: { year?: number | string | null; make?: string | null; model?: string | null } | null;
  serviceType?: string | null;
}) {
  const { appointmentId, scheduledAt, customer, vehicle, serviceType } = opts;
  if (!customer) return;
  const when = new Date(scheduledAt).toLocaleString("en-US", {
    timeZone: "America/New_York", weekday: "long", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
  const veh = vehicle ? `${vehicle.year ?? ""} ${vehicle.make ?? ""} ${vehicle.model ?? ""}`.trim() : "";
  const sent: string[] = [];
  try {
    if (customer.email) {
      const { error } = await supabase.functions.invoke("notify-appointment-confirmed", { body: {
        recipientEmail: customer.email,
        idempotencyKey: `appt-confirmed-${appointmentId}-${scheduledAt}`,
        templateData: { customerName: customer.full_name || undefined, appointmentDate: when, serviceType: serviceType ?? undefined, vehicle: veh || undefined },
      } });
      if (!error) sent.push("email");
    }
  } catch { /* ignore */ }
  try {
    const to = toE164(customer.phone);
    if (to) {
      let { data: thread } = await supabase.from("sms_threads").select("id").eq("phone", to).maybeSingle();
      if (!thread) {
        const ins = await supabase.from("sms_threads").insert({ phone: to, customer_id: customer.id ?? null }).select("id").single();
        thread = ins.data;
      }
      if (thread) {
        const first = (customer.full_name || "").split(" ")[0];
        const body = `Hi${first ? ` ${first}` : ""}, this is Mike's Mobile Auto Repair. Your appointment${serviceType ? ` for ${serviceType}` : ""}${veh ? ` on your ${veh}` : ""} is confirmed for ${when}. Reply here with any questions.`;
        const { error } = await supabase.functions.invoke("send-sms", { body: { thread_id: thread.id, to, body } });
        if (!error) sent.push("text");
      }
    }
  } catch { /* ignore */ }
  return sent;
}
