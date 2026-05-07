import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Activity, Clock, DollarSign, Target } from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";

const ranges = { "7": "Last 7 days", "30": "Last 30 days", "90": "Last 90 days" } as const;

export default function AdminTechProductivity() {
  const [days, setDays] = useState<keyof typeof ranges>("30");
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const since = startOfDay(subDays(new Date(), parseInt(days))).toISOString();

      // Get techs
      const { data: techRoles } = await supabase.from("user_roles").select("user_id").eq("role", "technician");
      const techIds = (techRoles || []).map((r: any) => r.user_id);
      if (!techIds.length) { setRows([]); setLoading(false); return; }

      const { data: profs } = await supabase.from("profiles").select("id,full_name,email").in("id", techIds);

      // Time entries (clocked hours)
      const { data: entries } = await supabase
        .from("time_entries")
        .select("technician_id,duration_minutes,clock_in,clock_out,appointment_id")
        .in("technician_id", techIds)
        .gte("clock_in", since);

      // Service records done by techs (via assigned appointments)
      const { data: appts } = await supabase
        .from("appointments")
        .select("id,assigned_technician_id,status")
        .in("assigned_technician_id", techIds)
        .gte("created_at", since);

      const apptByTech = new Map<string, any[]>();
      (appts || []).forEach((a: any) => {
        if (!a.assigned_technician_id) return;
        const arr = apptByTech.get(a.assigned_technician_id) || [];
        arr.push(a);
        apptByTech.set(a.assigned_technician_id, arr);
      });

      const apptIds = (appts || []).map((a: any) => a.id);
      const { data: srs } = apptIds.length
        ? await supabase.from("service_records").select("appointment_id,invoice_total,labor_performed").in("appointment_id", apptIds)
        : { data: [] as any[] };
      const srByAppt = new Map<string, any[]>();
      (srs || []).forEach((r: any) => {
        const arr = srByAppt.get(r.appointment_id) || [];
        arr.push(r);
        srByAppt.set(r.appointment_id, arr);
      });

      const stats = (profs || []).map((p: any) => {
        const techEntries = (entries || []).filter((e: any) => e.technician_id === p.id);
        const clockedMin = techEntries.reduce((s: number, e: any) => s + (e.duration_minutes || 0), 0);
        const clockedHours = clockedMin / 60;
        const techAppts = apptByTech.get(p.id) || [];
        const completed = techAppts.filter((a: any) => a.status === "completed").length;
        const revenue = techAppts.reduce((sum: number, a: any) => {
          const recs = srByAppt.get(a.id) || [];
          return sum + recs.reduce((s: number, r: any) => s + Number(r.invoice_total || 0), 0);
        }, 0);
        // Simple billed-hours estimate: completed jobs * average 1.5h, replace if you track per-job hours later
        const estimatedBilledHours = completed * 1.5;
        const efficiency = clockedHours > 0 ? (estimatedBilledHours / clockedHours) * 100 : 0;
        const avgRevenuePerHour = clockedHours > 0 ? revenue / clockedHours : 0;
        return {
          id: p.id,
          name: p.full_name || p.email,
          clockedHours,
          completed,
          totalAppts: techAppts.length,
          revenue,
          estimatedBilledHours,
          efficiency,
          avgRevenuePerHour,
        };
      }).sort((a: any, b: any) => b.revenue - a.revenue);

      setRows(stats);
      setLoading(false);
    })();
  }, [days]);

  const totals = rows.reduce(
    (acc, r) => ({
      clocked: acc.clocked + r.clockedHours,
      revenue: acc.revenue + r.revenue,
      completed: acc.completed + r.completed,
    }),
    { clocked: 0, revenue: 0, completed: 0 }
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" /> Technician Productivity</CardTitle>
          <Select value={days} onValueChange={(v) => setDays(v as any)}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(ranges).map(([v, label]) => <SelectItem key={v} value={v}>{label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : rows.length === 0 ? (
          <div className="text-center text-muted-foreground py-8 text-sm">No technician data for this range.</div>
        ) : (
          <>
            {/* Totals */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <Stat icon={Clock} label="Clocked Hrs" value={totals.clocked.toFixed(1)} />
              <Stat icon={Target} label="Jobs Done" value={totals.completed} />
              <Stat icon={DollarSign} label="Revenue" value={`$${totals.revenue.toFixed(0)}`} />
            </div>

            {/* Per-tech */}
            <div className="space-y-3">
              {rows.map((r) => (
                <div key={r.id} className="p-3 rounded-lg border border-border/50">
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-medium">{r.name}</div>
                    <div className="text-sm text-muted-foreground">${r.revenue.toFixed(0)}</div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <Cell label="Clocked" value={`${r.clockedHours.toFixed(1)} hrs`} />
                    <Cell label="Jobs" value={`${r.completed} / ${r.totalAppts}`} />
                    <Cell label="Efficiency" value={`${r.efficiency.toFixed(0)}%`} accent={r.efficiency >= 80} />
                    <Cell label="$ / hr" value={`$${r.avgRevenuePerHour.toFixed(0)}`} />
                  </div>
                  {/* Efficiency bar */}
                  <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={r.efficiency >= 80 ? "h-full bg-primary" : r.efficiency >= 50 ? "h-full bg-accent" : "h-full bg-destructive"}
                      style={{ width: `${Math.min(100, r.efficiency)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Efficiency = estimated billed hrs (completed jobs × 1.5h avg) ÷ clocked hrs. Add per-job labor hours to refine this calculation.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

const Stat = ({ icon: Icon, label, value }: any) => (
  <div className="rounded-lg border border-border/50 p-3 flex items-center gap-2">
    <Icon className="h-4 w-4 text-primary" />
    <div>
      <div className="text-lg font-bold leading-none">{value}</div>
      <div className="text-[10px] uppercase text-muted-foreground tracking-wide">{label}</div>
    </div>
  </div>
);
const Cell = ({ label, value, accent }: any) => (
  <div>
    <div className="text-muted-foreground">{label}</div>
    <div className={`font-medium ${accent ? 'text-primary' : ''}`}>{value}</div>
  </div>
);
