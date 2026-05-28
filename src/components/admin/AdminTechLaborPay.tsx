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

const lineAmount = (li: any) => {
  const qty = Number(li?.quantity ?? 1);
  const price = Number(li?.unit_price ?? 0);
  return Number(li?.amount ?? qty * price) || 0;
};

const paidLaborHours = (items: any[], fallbackRate: number, fallbackSubtotal: number) => {
  const hours = items.reduce((sum, li) => {
    const kind = String(li?.kind ?? (Number(li?.labor_hours ?? 0) > 0 ? "labor" : "part")).toLowerCase();
    if (kind !== "labor" && !(kind !== "part" && Number(li?.labor_hours) > 0)) return sum;
    const explicit = Number(li?.labor_hours ?? 0);
    if (explicit > 0) return sum + explicit;
    const qty = Number(li?.quantity ?? 0);
    if (qty > 0 && kind === "labor") return sum + qty;
    const unit = Number(li?.unit_price ?? 0);
    const amount = lineAmount(li);
    return sum + (unit > 0 ? amount / unit : 0);
  }, 0);
  return hours > 0 ? hours : (items.length === 0 && fallbackRate > 0 && fallbackSubtotal > 0 ? fallbackSubtotal / fallbackRate : 0);
};

const resolveTechId = (techId: string | null | undefined, employeeById: Map<string, any>) => {
  if (!techId) return null;
  const employee = employeeById.get(techId);
  return employee?.user_id || employee?.id || techId;
};

export default function AdminTechLaborPay() {
  const [days, setDays] = useState<keyof typeof ranges>("30");
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<TechRow[]>([]);
  const [laborRate, setLaborRate] = useState(35);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const since = startOfDay(subDays(new Date(), parseInt(days))).toISOString();

      const [{ data: settings }, { data: techRoles }, { data: employees }] = await Promise.all([
        supabase.from("shop_settings").select("labor_cost_per_hour").eq("id", 1).maybeSingle(),
        supabase.from("user_roles").select("user_id").eq("role", "technician"),
        supabase.from("employees" as any).select("id, user_id, full_name, hourly_rate").eq("is_active", true).eq("employee_type", "technician"),
      ]);
      const rate = Number(settings?.labor_cost_per_hour) > 0 ? Number(settings?.labor_cost_per_hour) : 35;
      setLaborRate(rate);

      const { data: paidInvoices } = await supabase.from("invoices")
        .select("id, subtotal, status, paid_at, service_record_id, technician_id, line_items")
        .eq("status", "paid")
        .gte("paid_at", since);

      const serviceIds = ((paidInvoices ?? []) as any[]).filter((i) => !i.technician_id && i.service_record_id).map((i) => i.service_record_id);
      const techByService = new Map<string, string | null>();
      if (serviceIds.length) {
        const { data: srs } = await supabase.from("service_records").select("id, appointment_id").in("id", serviceIds);
        const apptByService = new Map<string, string>();
        (srs ?? []).forEach((s: any) => { if (s.appointment_id) apptByService.set(s.id, s.appointment_id); });
        const apptIds = Array.from(new Set(Array.from(apptByService.values())));
        if (apptIds.length) {
          const { data: appts } = await supabase.from("appointments").select("id, assigned_technician_id").in("id", apptIds);
          const techByAppt = new Map<string, string | null>((appts ?? []).map((a: any) => [a.id, a.assigned_technician_id]));
          apptByService.forEach((apptId, serviceId) => techByService.set(serviceId, techByAppt.get(apptId) ?? null));
        }
      }

      const employeeRows = ((employees ?? []) as any[]);
      const employeeById = new Map<string, any>();
      employeeRows.forEach((e: any) => {
        if (e.id) employeeById.set(e.id, e);
      });
      const techIds = new Set<string>();
      (techRoles ?? []).forEach((r: any) => { if (r.user_id) techIds.add(r.user_id); });
      employeeRows.forEach((e: any) => techIds.add(e.user_id || e.id));
      ((paidInvoices ?? []) as any[]).forEach((inv: any) => {
        const tid = resolveTechId(inv.technician_id ?? (inv.service_record_id ? techByService.get(inv.service_record_id) : null), employeeById);
        if (tid) techIds.add(tid);
      });
      if (!techIds.size) { setRows([]); setLoading(false); return; }

      const profileIds = Array.from(techIds).filter((id) => employeeRows.some((e: any) => e.user_id === id) || (techRoles ?? []).some((r: any) => r.user_id === id));
      const { data: profs } = profileIds.length
        ? await supabase.from("profiles").select("id, full_name, email").in("id", profileIds)
        : { data: [] as any[] };
      const profileById = new Map<string, any>((profs ?? []).map((p: any) => [p.id, p]));
      const empById = new Map<string, any>();
      employeeRows.forEach((e: any) => {
        if (e.user_id) empById.set(e.user_id, e);
        empById.set(e.id, e);
      });

      const agg: Record<string, { invoices: number; subtotal: number; hours: number }> = {};
      ((paidInvoices ?? []) as any[]).forEach((inv: any) => {
        const techId = resolveTechId(inv.technician_id ?? (inv.service_record_id ? techByService.get(inv.service_record_id) : null), employeeById);
        if (!techId) return;
        if (!agg[techId]) agg[techId] = { invoices: 0, subtotal: 0, hours: 0 };
        agg[techId].invoices += 1;
        agg[techId].subtotal += Number(inv.subtotal || 0);
        agg[techId].hours += paidLaborHours(Array.isArray(inv.line_items) ? inv.line_items : [], rate, Number(inv.subtotal || 0));
      });

      const list: TechRow[] = Array.from(techIds).map((id) => {
        const a = agg[id] || { invoices: 0, subtotal: 0, hours: 0 };
        const employee = empById.get(id);
        const profile = profileById.get(id);
        const hourlyRate = Number(employee?.hourly_rate ?? 0) || rate;
        return {
          id,
          name: employee?.full_name || profile?.full_name || profile?.email || id.slice(0, 8),
          hourlyRate,
          invoices: a.invoices,
          subtotal: a.subtotal,
          hours: a.hours,
          pay: a.hours * hourlyRate,
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
              Hours come from paid invoice labor line items. If an invoice has no labor lines, subtotal ÷ shop labor rate (${laborRate}/hr) is used as a fallback. Pay = hours × employee hourly rate.
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
