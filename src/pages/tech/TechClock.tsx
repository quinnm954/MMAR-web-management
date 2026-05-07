import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import TechLayout from "@/components/tech/TechLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Play, Square } from "lucide-react";
import { toast } from "sonner";

interface TimeEntry {
  id: string;
  appointment_id: string;
  clock_in: string;
  clock_out: string | null;
  duration_minutes: number | null;
  notes: string | null;
}
interface Appt { id: string; service_type: string; scheduled_at: string | null; requested_date: string | null; }

const fmtDuration = (mins: number | null) => {
  if (mins == null) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
};

const TechClock = () => {
  const { user } = useAuth();
  const [appts, setAppts] = useState<Appt[]>([]);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [active, setActive] = useState<TimeEntry | null>(null);
  const [apptId, setApptId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [a, e] = await Promise.all([
      supabase.from("appointments").select("id, service_type, scheduled_at, requested_date")
        .eq("assigned_technician_id", user.id)
        .in("status", ["scheduled", "in_progress"])
        .order("scheduled_at", { ascending: true, nullsFirst: false }),
      supabase.from("time_entries").select("*")
        .eq("technician_id", user.id)
        .order("clock_in", { ascending: false })
        .limit(20),
    ]);
    const list = (e.data ?? []) as TimeEntry[];
    setAppts((a.data ?? []) as Appt[]);
    setEntries(list);
    setActive(list.find((x) => !x.clock_out) ?? null);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const clockIn = async () => {
    if (!user || !apptId) return toast.error("Select a job first");
    setBusy(true);
    const { error } = await supabase.from("time_entries").insert({
      technician_id: user.id,
      appointment_id: apptId,
      clock_in: new Date().toISOString(),
      notes: notes || null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Clocked in");
    setNotes("");
    load();
  };

  const clockOut = async () => {
    if (!active) return;
    setBusy(true);
    const out = new Date();
    const inDate = new Date(active.clock_in);
    const minutes = Math.max(0, Math.round((out.getTime() - inDate.getTime()) / 60000));
    const { error } = await supabase.from("time_entries").update({
      clock_out: out.toISOString(),
      duration_minutes: minutes,
      notes: notes || active.notes,
    }).eq("id", active.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Clocked out");
    setNotes("");
    load();
  };

  return (
    <TechLayout>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-4 max-w-2xl">
          <Card>
            <CardHeader><CardTitle>{active ? "Currently Working" : "Clock In"}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {active ? (
                <>
                  <div className="text-sm">
                    Started <strong>{new Date(active.clock_in).toLocaleTimeString()}</strong>
                    {" — "}{appts.find((a) => a.id === active.appointment_id)?.service_type ?? "Job"}
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What did you work on?" />
                  </div>
                  <Button variant="hero" onClick={clockOut} disabled={busy} className="w-full">
                    <Square className="h-4 w-4 mr-1" /> Clock Out
                  </Button>
                </>
              ) : (
                <>
                  <div>
                    <Label>Job</Label>
                    <Select value={apptId} onValueChange={setApptId}>
                      <SelectTrigger><SelectValue placeholder="Select an assigned job" /></SelectTrigger>
                      <SelectContent>
                        {appts.length === 0 && <SelectItem value="none" disabled>No active jobs</SelectItem>}
                        {appts.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.service_type} — {a.scheduled_at ? new Date(a.scheduled_at).toLocaleString() : a.requested_date}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Notes (optional)</Label>
                    <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
                  </div>
                  <Button variant="hero" onClick={clockIn} disabled={busy || !apptId} className="w-full">
                    <Play className="h-4 w-4 mr-1" /> Clock In
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Recent Time Entries</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {entries.length === 0 && <p className="text-sm text-muted-foreground">No entries yet.</p>}
              {entries.map((e) => (
                <div key={e.id} className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0">
                  <div>
                    <div className="text-sm font-medium">{appts.find((a) => a.id === e.appointment_id)?.service_type ?? "Job"}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(e.clock_in).toLocaleString()} {e.clock_out && ` → ${new Date(e.clock_out).toLocaleTimeString()}`}
                    </div>
                  </div>
                  {e.clock_out
                    ? <Badge variant="secondary">{fmtDuration(e.duration_minutes)}</Badge>
                    : <Badge className="bg-primary/15 text-primary">Active</Badge>}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </TechLayout>
  );
};

export default TechClock;
