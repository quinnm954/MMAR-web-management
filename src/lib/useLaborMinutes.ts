import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Sum of labor hours on each appointment's best estimate, as calendar minutes (rounded up to 15, min 30). */
export function useLaborMinutes(appointmentIds: string[]) {
  const [map, setMap] = useState<Record<string, number>>({});
  const key = [...appointmentIds].sort().join(",");
  useEffect(() => {
    if (!appointmentIds.length) { setMap({}); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("estimates")
        .select("appointment_id,status,line_items,updated_at")
        .in("appointment_id", appointmentIds)
        .order("updated_at", { ascending: false });
      const rank = (s: string) => (s === "approved" || s === "converted" ? 0 : s === "declined" ? 9 : 1);
      const best: Record<string, any> = {};
      for (const e of data ?? []) {
        const id = e.appointment_id as string;
        if (!best[id] || rank(e.status) < rank(best[id].status)) best[id] = e;
      }
      const out: Record<string, number> = {};
      for (const [id, e] of Object.entries(best)) {
        if (rank(e.status) === 9) continue;
        const hrs = (Array.isArray(e.line_items) ? e.line_items : []).reduce(
          (s: number, l: any) => s + (Number(l?.labor_hours) || 0), 0);
        if (hrs > 0) out[id] = Math.max(30, Math.ceil((hrs * 60) / 15) * 15);
      }
      if (!cancelled) setMap(out);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return map;
}

export const endFromLabor = (start: Date, mins?: number) =>
  mins ? new Date(start.getTime() + mins * 60000) : undefined;
