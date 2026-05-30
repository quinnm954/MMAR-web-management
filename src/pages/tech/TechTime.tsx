import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import TechLayout from "@/components/tech/TechLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Clock, Loader2, Play, Square } from "lucide-react";
import { toast } from "sonner";

interface Entry {
  id: string;
  appointment_id: string;
  clock_in: string;
  clock_out: string | null;
  duration_minutes: number | null;
  notes: string | null;
  appointment?: { service_type: string | null } | null;
}

interface Appt {
  id: string;
  service_type: string;
  scheduled_at: string | null;
  status: string;
}

const startOfWeekISO = () => {
  const d = new Date();
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};
const startOfTodayISO = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};

const fmtDuration = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
};

const TechTime = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [appts, setAppts] = useState<Appt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppt, setSelectedAppt] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [eRes, aRes] = await Promise.all([
      supabase
        .from("time_entries")
        .select("id, appointment_id, clock_in, clock_out, duration_minutes, notes")
        .eq("technician_id", user.id)
        .gte("clock_in", startOfWeekISO())
        .order("clock_in", { ascending: false }),
      supabase
        .from("appointments")
        .select("id, service_type, scheduled_at, status")
        .eq("assigned_technician_id", user.id)
        .in("status", ["scheduled", "in_progress"])
        .order("scheduled_at", { ascending: true, nullsFirst: false }),
    ]);
    const list = (eRes.data as Entry[]) ?? [];
    const apptIds = Array.from(new Set(list.map((r) => r.appointment_id).filter(Boolean)));
    if (apptIds.length) {
      const { data: apptData } = await supabase
        .from("appointments")
        .select("id, service_type")
        .in("id", apptIds);
      const map: Record<string, { service_type: string | null }> = {};
      (apptData ?? []).forEach((a: any) => { map[a.id] = { service_type: a.service_type }; });
      list.forEach((r) => { r.appointment = map[r.appointment_id] ?? null; });
    }
    setEntries(list);
    setAppts((aRes.data as Appt[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user]);

  const openEntry = useMemo(() => entries.find((e) => !e.clock_out), [entries]);

  const totals = useMemo(() => {
    let week = 0;
    let today = 0;
    const todayStart = new Date(startOfTodayISO()).getTime();
    entries.forEach((e) => {
      const mins = e.duration_minutes
        ?? (e.clock_in && e.clock_out
          ? Math.round((new Date(e.clock_out).getTime() - new Date(e.clock_in).getTime()) / 60000)
          : (!e.clock_out ? Math.round((now - new Date(e.clock_in).getTime()) / 60000) : 0));
      week += mins;
      if (new Date(e.clock_in).getTime() >= todayStart) today += mins;
    });
    return { week, today };
  }, [entries, now]);

  const clockIn = async () => {
    if (!user) return;
    if (!selectedAppt) return toast.error("Pick a job to clock into");
    setSaving(true);
    const { error } = await supabase.from("time_entries").insert({
      technician_id: user.id,
      appointment_id: selectedAppt,
      notes: notes || null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Clocked in");
    setNotes("");
    setSelectedAppt("");
    load();
  };

  const clockOut = async () => {
    if (!openEntry) return;
    setSaving(true);
    const clockOutAt = new Date();
    const mins = Math.round((clockOutAt.getTime() - new Date(openEntry.clock_in).getTime()) / 60000);
    const { error } = await supabase
      .from("time_entries")
      .update({ clock_out: clockOutAt.toISOString(), duration_minutes: mins })
      .eq("id", openEntry.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Clocked out");
    load();
  };

  return (
    <TechLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Clock className="h-5 w-5 text-primary" /> Labor Hours</h1>
          <p className="text-xs text-muted-foreground">Clock in/out per job. Totals reset weekly (Mon).</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-3">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Today</div>
              <div className="text-2xl font-bold">{fmtDuration(totals.today)}</div>
            </CardContent>
          </Card>
          <Card className="border-primary/30">
            <CardContent className="p-3">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">This week</div>
              <div className="text-2xl font-bold text-primary">{fmtDuration(totals.week)}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-4 space-y-3">
            {openEntry ? (
              <>
                <div>
                  <Badge className="bg-primary/15 text-primary">On the clock</Badge>
                  <div className="mt-2 font-medium text-sm">
                    {openEntry.appointment?.service_type || "Job"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Started {new Date(openEntry.clock_in).toLocaleTimeString()} ·{" "}
                    {fmtDuration(Math.max(0, Math.round((now - new Date(openEntry.clock_in).getTime()) / 60000)))} so far
                  </div>
                </div>
                <Button variant="hero" className="w-full" onClick={clockOut} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Square className="h-4 w-4 mr-1" /> Clock Out</>}
                </Button>
              </>
            ) : (
              <>
                <div>
                  <Label className="text-xs">Job</Label>
                  <Select value={selectedAppt} onValueChange={setSelectedAppt}>
                    <SelectTrigger><SelectValue placeholder="Pick a job" /></SelectTrigger>
                    <SelectContent>
                      {appts.length === 0 && <SelectItem value="none" disabled>No active jobs</SelectItem>}
                      {appts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.service_type}{a.scheduled_at ? ` · ${new Date(a.scheduled_at).toLocaleDateString()}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Notes (optional)</Label>
                  <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What are you working on?" />
                </div>
                <Button variant="hero" className="w-full" onClick={clockIn} disabled={saving || !selectedAppt}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Play className="h-4 w-4 mr-1" /> Clock In</>}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">This week</h2>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : entries.length === 0 ? (
            <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">No time entries yet this week.</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {entries.map((e) => {
                const live = !e.clock_out;
                const mins = e.duration_minutes
                  ?? (e.clock_out
                    ? Math.round((new Date(e.clock_out).getTime() - new Date(e.clock_in).getTime()) / 60000)
                    : Math.round((now - new Date(e.clock_in).getTime()) / 60000));
                return (
                  <Card key={e.id}>
                    <CardContent className="p-3 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{e.appointment?.service_type || "Job"}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(e.clock_in).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                          {" → "}
                          {e.clock_out ? new Date(e.clock_out).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) : "now"}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={`text-sm font-bold ${live ? "text-primary" : ""}`}>{fmtDuration(Math.max(0, mins))}</div>
                        {live && <Badge variant="outline" className="text-[10px]">live</Badge>}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </TechLayout>
  );
};

export default TechTime;
