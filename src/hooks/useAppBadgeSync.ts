import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { setAppBadge, clearAppBadge } from "@/lib/appBadge";

/**
 * Global hook: keeps the installed PWA app-icon badge in sync with the
 * signed-in user's unread notification count. Safe on unsupported browsers.
 */
export function useAppBadgeSync() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      clearAppBadge();
      return;
    }

    let cancelled = false;

    const refresh = async () => {
      const { count, error } = await supabase
        .from("notifications" as any)
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .is("read_at", null);
      if (cancelled) return;
      if (error) {
        console.debug("[appBadge] unread count query failed", error);
        return;
      }
      console.debug("[appBadge] unread count", count);
      setAppBadge(count ?? 0);
    };

    refresh();

    const ch = supabase
      .channel(`badge-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => {
          refresh();
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [user]);
}
