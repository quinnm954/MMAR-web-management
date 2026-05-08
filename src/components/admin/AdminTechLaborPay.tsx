import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, DollarSign } from "lucide-react";
import { subDays, startOfDay } from "date-fns";

const ranges = { "7": "Last 7 days", "30": "Last 30 days", "90": "Last 90 days", "365": "Last year" } as const;

interface TechRow {
  id: string;
  name: string;
  hourlyRate: number;
  invoices: number;
  subtotal: number;
  hours: number;
  pay: number;
}

export default function AdminTechLaborPay() {
  const [days, setDays] = useState<keyof typeof ranges>("30");
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<TechRow[]>([]);
  const [laborRate, setLaborRate] = useState(35);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const since = startOfDay(subDays(new Date(), parseInt(days))).toISOString();

      const [{ data: settings }, { data: techRoles }] = await Promise.all([
        supabase.from("shop_settings").select("labor_cost_per_hour").eq("id", 1).maybeSingle(),
        supabase.from("user_roles").select("user_id").eq("role", "technician"),
      ]);
      const rate = Number(settings?.labor_cost_per_hour ?? 35);
      setLaborRate(rate);

      const techIds = (techRoles ?? []).map((r: any) => r.user_id);
      if (!techIds.length) { setRows([]); setLoading(false); return; }

      const [{ data: profs }, { data: emps }, { data: appts }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email").in("id", techIds),
        supabase.from("employees").select("user_id, hourly_rate").in("user_id", techIds),
        supabase.from("appointments").select("id, assigned_technician_id").in("assigned_technician_id", techIds),
      ]);
      const empByUser: Record<string, number> = {};
      (emps ?? []).forEach((e: any) => { if (e.user_id) empByUser[e.user_id] = Number(e.hourly_rate || 0); });

      const apptToTech: Record<string, string> = {};
      const apptIds = (appts ?? []).map((a: any) => { apptToTech[a.id] = a.assigned_technician_id; return a.id; });

      let srs: any[] = [];
      if (apptIds.length) {
        const { data } = await supabase.from("service_records").select("id, appointment_id").in("appointment_id", apptIds);
        srs = data ?? [];
      }
      const srToTech: Record<string, string> = {};
      const srIds = srs.map((s) => { srToTech[s.id] = apptToTech[s.appointment_id]; return s.id; });

      let invs: any[] = [];
      if (srIds.length) {
        const { data } = await supabase.from("invoices")
          .select("id, subtotal, status, paid_at, service_record_id")
          .in("service_record_id", srIds)
          .eq("status", "paid")
          .gte("paid_at", since);
        invs = data ?? [];
      }

      const agg: Record<string, { invoices: number; subtotal: number }> = {};
      invs.forEach((inv: any) => {
        const techId = srToTech[inv.service_record_id];
        if (!techId) return;
        if (!agg[techId]) agg[techId] = { invoices: 0, subtotal: 0 };
        agg[techId].invoices += 1;
        agg[techId].subtotal += Number(inv.subtotal || 0);
      });

      const list: TechRow[] = (profs ?? []).map((p: any) => {
        const a = agg[p.id] || { invoices: 0, subtotal: 0 };
        const hours = rate > 0 ? a.subtotal / rate : 0;
        const hourlyRate = empByUser[p.id] || 0;
        return {
          id: p.id,
          name: p.full_name || p.email || p.id.slice(0, 8),
          hourlyRate,
          invoices: a.invoices,
          subtotal: a.subtotal,
          hours,
          pay: hours * hourlyRate,
        };
      }).sort((a, b) => b.pay - a.pay);

      setRows(list);
      setLoading(false);
    })();
  }, [days]);

  const totals = rows.reduce(
    (acc, r) => ({ invoices: acc.invoices + r.invoices, subtotal: acc.subtotal + r.subtotal, hours: acc.hours + r.hours, pay: acc.pay + r.pay }),
    { invoices: 0, subtotal: 0, hours: 0, pay: 0 }
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5" /> Technician Labor Pay</CardTitle>
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
          <p className="text-sm text-muted-foreground py-8 text-center">No technicians found.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              <Stat label="Paid Invoices" value={totals.invoices} />
              <Stat label="Subtotals" value={`$${totals.subtotal.toFixed(0)}`} />
              <Stat label="Billable Hrs" value={totals.hours.toFixed(1)} />
              <Stat label="Total Pay" value={`$${totals.pay.toFixed(0)}`} accent />
            </div>
            <div className="space-y-3">
              {rows.map((r) => (
                <div key={r.id} className="p-3 rounded-lg border border-border/50">
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-medium">{r.name}</div>
                    <div className="text-sm text-primary font-semibold">${r.pay.toFixed(0)}</div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <Cell label="Paid Invoices" value={r.invoices} />
                    <Cell label="Subtotals" value={`$${r.subtotal.toFixed(0)}`} />
                    <Cell label="Hours" value={r.hours.toFixed(2)} />
                    <Cell label="Rate" value={r.hourlyRate ? `$${r.hourlyRate}/hr` : "not set"} />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Hours = paid invoice subtotal ÷ shop labor rate (${laborRate}/hr). Pay = hours × employee hourly rate. Set hourly rate per tech in Employees.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

const Stat = ({ label, value, accent }: { label: string; value: any; accent?: boolean }) => (
  <div className={`p-3 rounded-lg border ${accent ? "border-primary/40 bg-primary/5" : "border-border/50"}`}>
    <div className={`text-2xl font-bold ${accent ? "text-primary" : ""}`}>{value}</div>
    <div className="text-[10px] uppercase text-muted-foreground tracking-wide">{label}</div>
  </div>
);
const Cell = ({ label, value }: { label: string; value: any }) => (
  <div>
    <div className="text-muted-foreground">{label}</div>
    <div className="font-medium">{value}</div>
  </div>
);
