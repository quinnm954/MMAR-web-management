import { useEffect, useMemo, useState } from "react";
import { useLaborMinutes, endFromLabor } from "@/lib/useLaborMinutes";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { startOfDay } from "date-fns";
import { toast } from "sonner";
import RepairOrderDetail from "./RepairOrderDetail";
import GCalView, { CalEvent, CalView, calColor, calRange } from "@/components/calendar/GCalView";
import { cn } from "@/lib/utils";

interface Tech { id: string; full_name: string | null }
interface Appt {
  id: string; service_type: string; status: string; scheduled_at: string | null;
  assigned_technician_id: string | null; profiles?: { full_name: string | null } | null;
}

const HIDDEN = ["cancelled", "canceled", "declined"];

export default function AdminCalendar() {
  const [loading, setLoading] = useState(true);
  const [techs, setTechs] = useState<Tech[]>([]);
  const [appts, setAppts] = useState<Appt[]>([]);
  const [view, setView] = useState<CalView>("week");
  const [date, setDate] = useState(startOfDay(new Date()));
  const [openId, setOpenId] = useState<string | null>(null);
  const [hiddenTechs, setHiddenTechs] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "technician");
      const ids = (roles || []).map((r: any) => r.user_id);
      const { data } = ids.length ? await supabase.from("profiles").select("id,full_name").in("id", ids) : { data: [] as any[] };
      setTechs((data || []) as Tech[]);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { from, to } = calRange(view, date);
      const { data } = await supabase
        .from("appointments")
        .select("id,service_type,status,scheduled_at,assigned_technician_id,profiles:customer_id(full_name)")
        .not("scheduled_at", "is", null)
        .gte("scheduled_at", from.toISOString())
        .lt("scheduled_at", to.toISOString());
      setAppts((data || []) as any);
      setLoading(false);
    })();
  }, [date, view]);

  const colorOf = (techId: string | null) => (techId ? techs.findIndex((t) => t.id === techId) + 1 : 4);

  const events: CalEvent[] = useMemo(() => appts
    .filter((a) => !HIDDEN.includes(a.status) && !hiddenTechs.has(a.assigned_technician_id ?? "none"))
    .map((a) => ({
      id: a.id,
      title: a.profiles?.full_name ? `${a.service_type} · ${a.profiles.full_name}` : a.service_type,
      subtitle: techs.find((t) => t.id === a.assigned_technician_id)?.full_name ?? "Unassigned",
      start: new Date(a.scheduled_at!),
      end: endFromLabor(new Date(a.scheduled_at!), laborMins[a.id]),
      color: colorOf(a.assigned_technician_id),
      muted: a.status === "completed",
    })), [appts, techs, hiddenTechs]);

  const reschedule = async (id: string, start: Date) => {
    const prev = appts;
    setAppts((cur) => cur.map((a) => (a.id === id ? { ...a, scheduled_at: start.toISOString() } : a)));
    const { error } = await supabase.from("appointments").update({ scheduled_at: start.toISOString() }).eq("id", id);
    if (error) { setAppts(prev); toast.error("Reschedule failed"); } else toast.success("Rescheduled");
  };

  const toggle = (k: string) => setHiddenTechs((s) => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; });
  const legend = [{ id: "none", full_name: "Unassigned" }, ...techs];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 text-xs">
        {legend.map((t) => (
          <button key={t.id} onClick={() => toggle(t.id)}
            className={cn("flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1", hiddenTechs.has(t.id) && "opacity-40")}>
            <span className={cn("h-2.5 w-2.5 rounded-full border-2", calColor(t.id === "none" ? 4 : colorOf(t.id)))} />
            {t.full_name || "Unnamed"}
          </button>
        ))}
        {loading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
      </div>
      <GCalView events={events} view={view} onViewChange={setView} date={date} onDateChange={setDate}
        onEventClick={setOpenId} onEventDrop={reschedule} />
      <p className="text-xs text-muted-foreground">Drag a job to a new time to reschedule. Click it to open the repair order. Tap a name above to hide or show that tech.</p>
      <RepairOrderDetail appointmentId={openId} open={!!openId} onClose={() => setOpenId(null)} />
    </div>
  );
}
