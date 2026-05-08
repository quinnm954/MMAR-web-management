import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Clock, Square } from "lucide-react";
import { toast } from "sonner";

interface Shift {
  id: string;
  user_id: string;
  clock_in: string;
  clock_out: string | null;
  duration_minutes: number | null;
  notes: string | null;
}

const fmtDur = (mins: number | null) => {
  if (mins == null) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
};

export default function AdminShifts() {
  const [loading, setLoading] = useState(true);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [profilesById, setProfilesById] = useState<Record<string, { full_name: string | null; email: string | null }>>({});

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("employee_shifts").select("*").order("clock_in", { ascending: false }).limit(100);
    const list = (data ?? []) as Shift[];
    setShifts(list);
    const ids = Array.from(new Set(list.map((s) => s.user_id)));
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name, email").in("id", ids);
      const map: Record<string, any> = {};
      (profs ?? []).forEach((p: any) => { map[p.id] = p; });
      setProfilesById(map);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const forceClockOut = async (s: Shift) => {
    const out = new Date();
    const minutes = Math.max(0, Math.round((out.getTime() - new Date(s.clock_in).getTime()) / 60000));
    const { error } = await supabase.from("employee_shifts")
      .update({ clock_out: out.toISOString(), duration_minutes: minutes })
      .eq("id", s.id);
    if (error) return toast.error(error.message);
    toast.success("Clocked out");
    load();
  };

  const totalMin = shifts.reduce((s, x) => s + (x.duration_minutes || 0), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" /> Employee Shifts</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : shifts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No shifts recorded yet.</p>
        ) : (
          <>
            <div className="text-xs text-muted-foreground mb-3">
              Showing last {shifts.length} shifts · Total clocked: <strong>{fmtDur(totalMin)}</strong>
            </div>
            <div className="space-y-2">
              {shifts.map((s) => {
                const p = profilesById[s.user_id];
                return (
                  <div key={s.id} className="flex items-center justify-between border rounded p-2 text-sm gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{p?.full_name || p?.email || s.user_id.slice(0, 8)}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(s.clock_in).toLocaleString()}
                        {s.clock_out && ` → ${new Date(s.clock_out).toLocaleTimeString()}`}
                      </div>
                      {s.notes && <div className="text-xs text-muted-foreground mt-0.5 italic">{s.notes}</div>}
                    </div>
                    <div className="text-right">
                      {s.clock_out
                        ? <Badge variant="secondary">{fmtDur(s.duration_minutes)}</Badge>
                        : <Button size="sm" variant="outline" onClick={() => forceClockOut(s)}><Square className="h-3 w-3 mr-1" /> Clock out</Button>}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
