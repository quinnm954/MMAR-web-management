import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import TechLayout from "@/components/tech/TechLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, History, Wrench } from "lucide-react";

interface Record {
  id: string;
  service_date: string;
  service_type: string;
  labor_performed: string | null;
  mileage_at_service: number | null;
  invoice_total: number | null;
  customer_id: string;
  vehicle_id: string;
  appointment_id: string | null;
  customer?: { full_name: string | null; email: string | null } | null;
  vehicle?: { year: number | null; make: string | null; model: string | null } | null;
}

const TechHistory = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      // Service records I logged: filtered via appointment.assigned_technician_id
      const { data: appts } = await supabase
        .from("appointments")
        .select("id")
        .eq("assigned_technician_id", user.id);
      const apptIds = (appts ?? []).map((a: any) => a.id);
      if (!apptIds.length) {
        setRows([]);
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("service_records")
        .select("id, service_date, service_type, labor_performed, mileage_at_service, invoice_total, customer_id, vehicle_id, appointment_id")
        .in("appointment_id", apptIds)
        .order("service_date", { ascending: false })
        .limit(200);
      const list = (data as Record[]) ?? [];
      const custIds = Array.from(new Set(list.map((r) => r.customer_id)));
      const vehIds = Array.from(new Set(list.map((r) => r.vehicle_id)));
      const [profs, vehs] = await Promise.all([
        custIds.length ? supabase.from("profiles").select("id, full_name, email").in("id", custIds) : Promise.resolve({ data: [] as any[] }),
        vehIds.length ? supabase.from("vehicles").select("id, year, make, model").in("id", vehIds) : Promise.resolve({ data: [] as any[] }),
      ]);
      const pMap: any = {}; (profs.data ?? []).forEach((p: any) => (pMap[p.id] = p));
      const vMap: any = {}; (vehs.data ?? []).forEach((v: any) => (vMap[v.id] = v));
      list.forEach((r) => { r.customer = pMap[r.customer_id] ?? null; r.vehicle = vMap[r.vehicle_id] ?? null; });
      setRows(list);
      setLoading(false);
    })();
  }, [user]);

  return (
    <TechLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><History className="h-5 w-5 text-primary" /> Service History</h1>
          <p className="text-xs text-muted-foreground">Records logged from jobs assigned to you.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : rows.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">No service records yet.</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => (
              <Card key={r.id}>
                <CardContent className="p-3 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-medium text-sm flex items-center gap-1.5"><Wrench className="h-3.5 w-3.5 text-primary" />{r.service_type}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {r.customer?.full_name || r.customer?.email}
                        {r.vehicle ? ` · ${r.vehicle.year} ${r.vehicle.make} ${r.vehicle.model}` : ""}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground shrink-0">
                      {new Date(r.service_date).toLocaleDateString()}
                    </div>
                  </div>
                  {r.labor_performed && <p className="text-xs">{r.labor_performed}</p>}
                  <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground pt-1">
                    {r.mileage_at_service != null && <span>{r.mileage_at_service.toLocaleString()} mi</span>}
                    {r.invoice_total != null && <span>${Number(r.invoice_total).toFixed(2)}</span>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </TechLayout>
  );
};

export default TechHistory;
