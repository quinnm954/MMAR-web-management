import { supabase } from "@/integrations/supabase/client";

/**
 * Fire-and-forget transactional email helper.
 * Failures are logged but never thrown — emails should never block the UI flow.
 */
export async function sendNotification(params: {
  templateName: string;
  recipientEmail: string;
  idempotencyKey: string;
  templateData?: Record<string, unknown>;
}) {
  try {
    const { error } = await supabase.functions.invoke("send-transactional-email", {
      body: params,
    });
    if (error) console.warn("Email send failed", params.templateName, error);
  } catch (e) {
    console.warn("Email send error", params.templateName, e);
  }
}
