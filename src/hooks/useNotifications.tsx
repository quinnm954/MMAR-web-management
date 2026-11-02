import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { clearCommunicationUnread, NOTIFICATIONS_CLEARED_EVENT } from '@/lib/clearCommunicationUnread';

export type AppNotification = {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  category: string | null;
  link: string | null;
  data: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
};

export function useNotifications(limit = 50) {
  const { user, isAdmin } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("notifications" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (!error && data) {
      const list = data as unknown as AppNotification[];
      setItems(list);
    }
    setLoading(false);
  }, [user, limit]);

  useEffect(() => {
    refresh();
    if (!user) return;
    const ch = supabase
      .channel(`notif-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const row = payload.new as unknown as AppNotification;
          setItems((prev) => [row, ...prev].slice(0, limit));
          try {
            toast(row.title, { description: row.body ?? undefined });
          } catch {}
          // Let the auto-refresh hook reload the app (it waits until safe).
          setTimeout(() => window.dispatchEvent(new Event("ga-auto-refresh")), 1500);
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const row = payload.new as unknown as AppNotification;
          setItems((prev) => prev.map((n) => (n.id === row.id ? row : n)));
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const row = payload.old as unknown as AppNotification;
          setItems((prev) => prev.filter((n) => n.id !== row.id));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, limit, refresh]);

  useEffect(() => {
    window.addEventListener(NOTIFICATIONS_CLEARED_EVENT, refresh);
    return () => window.removeEventListener(NOTIFICATIONS_CLEARED_EVENT, refresh);
  }, [refresh]);

  const markRead = useCallback(async (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)));
    await supabase
      .from("notifications" as any)
      .update({ read_at: new Date().toISOString() })
      .eq("id", id);
  }, []);

  const markAllRead = useCallback(async () => {
    if (!user) return;
    const now = new Date().toISOString();
    try {
      if (isAdmin) await clearCommunicationUnread(supabase, now);
      const { error } = await supabase
      .from("notifications" as any)
      .update({ read_at: now })
      .eq("user_id", user.id)
      .is("read_at", null)
      .lte('created_at', now);
      if (error) throw error;
      setItems((prev) => prev.map((n) => (n.read_at || n.created_at > now ? n : { ...n, read_at: now })));
      window.dispatchEvent(new Event(NOTIFICATIONS_CLEARED_EVENT));
    } catch {
      toast.error('Could not clear all notifications. Please try again.');
    }
  }, [user, isAdmin]);

  const remove = useCallback(async (id: string) => {
    setItems((prev) => prev.filter((n) => n.id !== id));
    await supabase.from("notifications" as any).delete().eq("id", id);
  }, []);

  const markManyRead = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    const now = new Date().toISOString();
    const set = new Set(ids);
    setItems((prev) => prev.map((n) => (set.has(n.id) && !n.read_at ? { ...n, read_at: now } : n)));
    await supabase.from("notifications" as any).update({ read_at: now }).in("id", ids);
  }, []);

  const unreadCount = items.filter((n) => !n.read_at).length;

  return { items, loading, unreadCount, refresh, markRead, markAllRead, markManyRead, remove };
}
