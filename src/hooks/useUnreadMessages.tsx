import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

function setAppBadge(count: number) {
  try {
    const nav: any = navigator;
    if (count > 0 && typeof nav.setAppBadge === "function") {
      nav.setAppBadge(count).catch(() => {});
    } else if (typeof nav.clearAppBadge === "function") {
      nav.clearAppBadge().catch(() => {});
    }
  } catch {}
}

export function useUnreadMessages() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) {
      setCount(0);
      setAppBadge(0);
      return;
    }
    const { data, error } = await supabase.rpc("unread_message_count", { _user_id: user.id });
    if (!error) {
      const n = Number(data ?? 0);
      setCount(n);
      setAppBadge(n);
    }
  }, [user]);

  useEffect(() => {
    refresh();
    if (!user) return;
    const ch = supabase
      .channel(`msg-unread-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
        refresh();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "message_reads", filter: `user_id=eq.${user.id}` }, () => {
        refresh();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, refresh]);

  return { count, refresh };
}
