import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, CalendarDays, Loader2 } from "lucide-react";
import { addDays, format, startOfWeek, isSameDay, setHours, setMinutes, startOfDay } from "date-fns";
import RepairOrderDetail from "./RepairOrderDetail";
import { toast } from "sonner";

const HOUR_START = 7;
const HOUR_END = 19;
const HOURS = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);
const SLOT_HEIGHT = 56; // px per hour

interface Tech { id: string; full_name: string | null; email: string | null; }
interface Appt {
  id: string; service_type: string; status: string; scheduled_at: string | null;
  assigned_technician_id: string | null; customer_id: string; vehicle_id: string | null;
  priority: string; description: string | null;
}

export default function AdminCalendar() {
  const [loading, setLoading] = useState(true);
  const [techs, setTechs] = useState<Tech[]>([]);
  const [appts, setAppts] = useState<Appt[]>([]);
  const [view, setView] = useState<"day" | "week">("day");
  const [date, setDate] = useState<Date>(startOfDay(new Date()));
  const [openId, setOpenId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const days = useMemo(() => {
    if (view === "day") return [date];
    const start = startOfWeek(date, { weekStartsOn: 1 });
    return Array.from({ length: 6 }, (_, i) => addDays(start, i));
  }, [view, date]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      // Load technicians via user_roles + profiles
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "technician");
      const techIds = (roles || []).map((r: any) => r.user_id);
      const { data: profs } = techIds.length
        ? await supabase.from("profiles").select("id,full_name,email").in("id", techIds)
        : { data: [] as any[] };
      setTechs((profs || []).map((p: any) => ({ id: p.id, full_name: p.full_name, email: p.email })));

      const rangeStart = days[0];
      const rangeEnd = addDays(days[days.length - 1], 1);
      const { data: a } = await supabase
        .from("appointments")
        .select("id,service_type,status,scheduled_at,assigned_technician_id,customer_id,vehicle_id,priority,description")
        .not("scheduled_at", "is", null)
        .gte("scheduled_at", rangeStart.toISOString())
        .lt("scheduled_at", rangeEnd.toISOString());
      setAppts((a || []) as any);
      setLoading(false);
    })();
  }, [date, view]);

  const apptsFor = (techId: string | null, day: Date) =>
    appts.filter((a) => {
      if (!a.scheduled_at) return false;
      if ((a.assigned_technician_id || null) !== techId) return false;
      return isSameDay(new Date(a.scheduled_at), day);
    });

  const handleDrop = async (e: React.DragEvent, techId: string | null, day: Date) => {
    e.preventDefault();
    if (!draggingId) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const hourFloat = HOUR_START + offsetY / SLOT_HEIGHT;
    const hour = Math.max(HOUR_START, Math.min(HOUR_END - 1, Math.floor(hourFloat)));
    const minutes = Math.round(((hourFloat - hour) * 60) / 15) * 15;
    const newDate = setMinutes(setHours(day, hour), Math.min(45, minutes));
    const id = draggingId;
    setDraggingId(null);
    const prev = appts;
    setAppts((cur) =>
      cur.map((a) => (a.id === id ? { ...a, scheduled_at: newDate.toISOString(), assigned_technician_id: techId } : a))
    );
    const { error } = await supabase
      .from("appointments")
      .update({ scheduled_at: newDate.toISOString(), assigned_technician_id: techId })
      .eq("id", id);
    if (error) {
      setAppts(prev);
      toast.error("Reschedule failed");
    } else {
      toast.success("Rescheduled");
    }
  };

  const lanes: (Tech | { id: null; full_name: string; email: null })[] = [
    { id: null, full_name: "Unassigned", email: null },
    ...techs,
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5" /> Schedule</CardTitle>
          <div className="flex items-center gap-2">
            <Button size="sm" variant={view === "day" ? "default" : "outline"} onClick={() => setView("day")}>Day</Button>
            <Button size="sm" variant={view === "week" ? "default" : "outline"} onClick={() => setView("week")}>Week</Button>
            <div className="flex items-center gap-1 ml-2">
              <Button size="icon" variant="outline" onClick={() => setDate(addDays(date, view === "day" ? -1 : -7))}><ChevronLeft className="h-4 w-4" /></Button>
              <Button size="sm" variant="outline" onClick={() => setDate(startOfDay(new Date()))}>Today</Button>
              <Button size="icon" variant="outline" onClick={() => setDate(addDays(date, view === "day" ? 1 : 7))}><ChevronRight className="h-4 w-4" /></Button>
            </div>
            <div className="text-sm font-medium ml-2">
              {view === "day" ? format(date, "EEE, MMM d") : `${format(days[0], "MMM d")} – ${format(days[days.length - 1], "MMM d")}`}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              {days.map((day) => (
                <div key={day.toISOString()} className="mb-4">
                  {view === "week" && <div className="text-sm font-semibold mb-2">{format(day, "EEE, MMM d")}</div>}
                  <div className="grid" style={{ gridTemplateColumns: `60px repeat(${lanes.length}, minmax(160px, 1fr))` }}>
                    {/* Header row */}
                    <div />
                    {lanes.map((t) => (
                      <div key={String(t.id)} className="text-xs font-medium text-center px-2 py-1 border-b border-border/50 truncate">
                        {t.full_name || "Unnamed"}
                      </div>
                    ))}

                    {/* Time column */}
                    <div className="relative" style={{ height: HOURS.length * SLOT_HEIGHT }}>
                      {HOURS.map((h) => (
                        <div key={h} className="absolute right-1 text-[10px] text-muted-foreground" style={{ top: (h - HOUR_START) * SLOT_HEIGHT - 6 }}>
                          {h % 12 === 0 ? 12 : h % 12}{h < 12 ? "a" : "p"}
                        </div>
                      ))}
                    </div>

                    {/* Lane columns */}
                    {lanes.map((t) => (
                      <div
                        key={String(t.id)}
                        className="relative border-l border-border/40"
                        style={{ height: HOURS.length * SLOT_HEIGHT }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDrop(e, t.id, day)}
                      >
                        {HOURS.map((h) => (
                          <div key={h} className="absolute left-0 right-0 border-t border-border/20" style={{ top: (h - HOUR_START) * SLOT_HEIGHT, height: SLOT_HEIGHT }} />
                        ))}
                        {apptsFor(t.id, day).map((a) => {
                          const dt = new Date(a.scheduled_at!);
                          const top = ((dt.getHours() + dt.getMinutes() / 60) - HOUR_START) * SLOT_HEIGHT;
                          return (
                            <button
                              key={a.id}
                              draggable
                              onDragStart={() => setDraggingId(a.id)}
                              onClick={() => setOpenId(a.id)}
                              className="absolute left-1 right-1 rounded-md p-1.5 text-left text-xs bg-primary/15 border border-primary/40 hover:bg-primary/25 transition-colors cursor-grab active:cursor-grabbing overflow-hidden"
                              style={{ top: Math.max(0, top), height: SLOT_HEIGHT - 4 }}
                            >
                              <div className="font-semibold truncate">{format(dt, "p")} · {a.service_type}</div>
                              <div className="flex items-center gap-1 mt-0.5">
                                <Badge variant="outline" className="text-[9px] py-0 h-4">{a.status}</Badge>
                                {a.priority !== "normal" && <Badge variant="destructive" className="text-[9px] py-0 h-4">{a.priority}</Badge>}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <RepairOrderDetail appointmentId={openId} open={!!openId} onClose={() => setOpenId(null)} />
        <p className="text-xs text-muted-foreground mt-3">Drag any appointment between technician lanes or time slots to reschedule. Click to open the repair order.</p>
      </CardContent>
    </Card>
  );
}
