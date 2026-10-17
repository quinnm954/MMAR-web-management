import { useEffect, useMemo, useState } from "react";
import { formatAddress } from "@/components/admin/CustomerAddress";
import { useAdminRegion, RegionSwitch, RegionChip } from '@/hooks/useAdminRegion';
import { useLaborMinutes, endFromLabor } from "@/lib/useLaborMinutes";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CalendarOff } from "lucide-react";
import { Button } from '@/components/ui/button';
import CalendarBlockDialog, { CalendarBlock } from './CalendarBlockDialog';
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
  const { region, match } = useAdminRegion();
  const [loading, setLoading] = useState(true);
  const [techs, setTechs] = useState<Tech[]>([]);
  const [appts, setAppts] = useState<Appt[]>([]);
  const laborMins = useLaborMinutes(appts.map((x) => x.id));
  const [view, setView] = useState<CalView>("week");
  const [date, setDate] = useState(startOfDay(new Date()));
  const [openId, setOpenId] = useState<string | null>(null);
  const [hiddenTechs, setHiddenTechs] = useState<Set<string>>(new Set());
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<CalendarBlock | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [blocks, setBlocks] = useState<{ id: string; starts_at: string; ends_at: string; reason: string | null }[]>([]);

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
        .select("id,service_type,status,scheduled_at,assigned_technician_id,region_slug,profiles:customer_id(full_name,address_line1,address_line2,city,state,postal_code)")
        .not("scheduled_at", "is", null)
        .gte("scheduled_at", from.toISOString())
        .lt("scheduled_at", to.toISOString());
      setAppts(((data || []) as any[]).filter((a) => match(a.region_slug)) as any);
      const { data: b } = await supabase.from("calendar_blocks").select("id,starts_at,ends_at,reason,region_slug")
        .lt("starts_at", to.toISOString()).gt("ends_at", from.toISOString());
      setBlocks(((b || []) as any[]).filter((x) => !x.region_slug || match(x.region_slug)));
      setLoading(false);
    })();
  }, [date, view, region, refreshKey]);

  const colorOf = (techId: string | null) => (techId ? techs.findIndex((t) => t.id === techId) + 1 : 4);

  const events: CalEvent[] = useMemo(() => [
    ...blocks.map((b) => ({
      id: `block-${b.id}`, title: "Blocked", subtitle: b.reason && b.reason !== "Blocked off" ? b.reason : "No bookings",
      start: new Date(b.starts_at), end: new Date(b.ends_at), color: 4,
    })),
    ...appts
    .filter((a) => a.scheduled_at && !HIDDEN.includes(a.status) && !hiddenTechs.has(a.assigned_technician_id ?? "none"))
    .map((a) => ({
      id: a.id,
      title: a.profiles?.full_name ? `${a.service_type} · ${a.profiles.full_name}` : a.service_type,
      subtitle: [techs.find((t) => t.id === a.assigned_technician_id)?.full_name ?? "Unassigned", formatAddress(a.profiles as any)].filter(Boolean).join(" · "),
       start: new Date(a.scheduled_at ?? ''),
       end: endFromLabor(new Date(a.scheduled_at ?? ''), laborMins[a.id]),
      color: colorOf(a.assigned_technician_id),
      muted: a.status === "completed",
    }))], [appts, techs, hiddenTechs, laborMins, blocks]);

  const reschedule = async (id: string, start: Date) => {
    if (id.startsWith("block-")) return;
    const prev = appts;
    setAppts((cur) => cur.map((a) => (a.id === id ? { ...a, scheduled_at: start.toISOString() } : a)));
    const { error } = await supabase.from("appointments").update({ scheduled_at: start.toISOString() }).eq("id", id);
    if (error) { setAppts(prev); toast.error("Reschedule failed"); } else toast.success("Rescheduled");
  };

  const onClick = async (id: string) => {
    if (!id.startsWith("block-")) return setOpenId(id);
    const block = blocks.find((b) => b.id === id.slice(6));
    if (!block) return;
    setEditingBlock(block);
    setBlockDialogOpen(true);
  };

  const toggle = (k: string) => setHiddenTechs((s) => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; });
  const legend = [{ id: "none", full_name: "Unassigned" }, ...techs];

  return (
    <div className="space-y-3">
      <RegionSwitch />
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
        onEventClick={onClick} onEventDrop={reschedule}
        toolbarExtra={<Button size="sm" onClick={() => { setEditingBlock(null); setBlockDialogOpen(true); }}><CalendarOff className="mr-2 h-4 w-4" />Block off time</Button>} />
      <p className="text-xs text-muted-foreground">Drag a job to a new time to reschedule. Click it to open the repair order. Tap a name above to hide or show that tech.</p>
      <RepairOrderDetail appointmentId={openId} open={!!openId} onClose={() => setOpenId(null)} />
      <CalendarBlockDialog open={blockDialogOpen} block={editingBlock} date={date} onClose={() => setBlockDialogOpen(false)} onSaved={() => setRefreshKey((key) => key + 1)} />
    </div>
  );
}
