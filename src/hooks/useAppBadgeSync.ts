import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { setAppBadge, clearAppBadge } from "@/lib/appBadge";
import { isPhoneApp } from "@/lib/phoneApp";

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
      let q = supabase
        .from("notifications" as any)
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .is("read_at", null);
      // Each home-screen app badges only its own alerts.
      q = isPhoneApp() ? q.eq("category", "message_updates") : q.or("category.is.null,category.neq.message_updates");
      const { count, error } = await q;
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

    const onResume = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", onResume);
    window.addEventListener("focus", onResume);
    const onSwMsg = (e: MessageEvent) => { if (e.data?.type === "badge-refresh") refresh(); };
    navigator.serviceWorker?.addEventListener?.("message", onSwMsg);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onResume);
      window.removeEventListener("focus", onResume);
      navigator.serviceWorker?.removeEventListener?.("message", onSwMsg);
      supabase.removeChannel(ch);
    };
  }, [user]);
}
