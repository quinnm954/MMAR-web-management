import { supabase } from "@/integrations/supabase/client";

export type NotificationCategory =
  | "appointment_reminders"
  | "estimate_updates"
  | "invoice_updates"
  | "inspection_updates"
  | "repair_order_updates"
  | "membership_updates"
  | "marketing_updates"
  | "message_updates";

export interface CreateNotificationArgs {
  user_id: string;
  title: string;
  body?: string;
  category?: NotificationCategory;
  link?: string;
  data?: Record<string, unknown>;
}

/**
 * Create an in-app notification for a user. Respects that user's
 * notification_preferences via the create_notification SECURITY DEFINER
 * function on the backend.
 */
export async function createNotification(args: CreateNotificationArgs) {
  const { data, error } = await (supabase as any).rpc("create_notification", {
    _user_id: args.user_id,
    _title: args.title,
    _body: args.body ?? null,
    _category: args.category ?? null,
    _link: args.link ?? null,
    _data: args.data ?? {},
  });
  if (error) throw error;
  return data as string | null;
}
