import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PortalLayout from "@/components/portal/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Loader2, Wrench, Lightbulb } from "lucide-react";

interface ServiceRecord {
  id: string;
  service_date: string;
  service_type: string;
  mileage_at_service: number | null;
  labor_performed: string | null;
  technician_notes: string | null;
  parts_used: unknown;
  invoice_total: number | null;
  vehicle: { year: number | null; make: string | null; model: string | null } | null;
}

interface Recommendation {
  id: string;
  recommendation: string;
  priority: string;
  status: string;
  due_date: string | null;
  due_mileage: number | null;
  estimated_cost: number | null;
  vehicle: { year: number | null; make: string | null; model: string | null } | null;
}

const PortalServiceHistory = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase
        .from("service_records")
        .select("id, service_date, service_type, mileage_at_service, labor_performed, technician_notes, parts_used, invoice_total, vehicle:vehicles(year, make, model)")
        .eq("customer_id", user.id)
        .order("service_date", { ascending: false }),
      supabase
        .from("service_recommendations")
        .select("id, recommendation, priority, status, due_date, due_mileage, estimated_cost, vehicle:vehicles(year, make, model)")
        .eq("customer_id", user.id)
        .eq("status", "pending")
        .order("priority", { ascending: false }),
    ]).then(([r, rec]) => {
      setRecords((r.data as unknown as ServiceRecord[]) ?? []);
      setRecs((rec.data as unknown as Recommendation[]) ?? []);
      setLoading(false);
    });
  }, [user]);

  return (
    <PortalLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Service History</h1>
        <p className="text-muted-foreground mt-1">Maintenance records and upcoming recommendations.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <>
          {recs.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-accent" /> Upcoming Recommendations
              </h2>
              <div className="space-y-2">
                {recs.map((r) => (
                  <Card key={r.id} className="border-accent/30 bg-accent/5">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{r.recommendation}</span>
                            <Badge variant={r.priority === "high" ? "destructive" : "secondary"} className="text-xs">{r.priority}</Badge>
                          </div>
                          {r.vehicle && <div className="text-xs text-muted-foreground">{r.vehicle.year} {r.vehicle.make} {r.vehicle.model}</div>}
                          <div className="text-xs text-muted-foreground mt-1">
                            {r.due_date && `Due ${r.due_date}`}{r.due_mileage && ` • ${r.due_mileage.toLocaleString()} mi`}
                          </div>
                        </div>
                        {r.estimated_cost != null && (
                          <div className="text-sm font-semibold">~${r.estimated_cost.toFixed(2)}</div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" /> Past Service
          </h2>
          {records.length === 0 ? (
            <Card className="border-dashed border-border/50">
              <CardContent className="p-12 text-center">
                <ClipboardList className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground">No service records yet. They'll appear here after your first MMAR visit.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {records.map((s) => (
                <Card key={s.id} className="border-border/50">
                  <CardContent className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                      <div>
                        <h3 className="font-bold">{s.service_type}</h3>
                        {s.vehicle && <div className="text-xs text-muted-foreground">{s.vehicle.year} {s.vehicle.make} {s.vehicle.model}</div>}
                      </div>
                      <div className="text-right text-sm">
                        <div className="font-medium">{s.service_date}</div>
                        {s.mileage_at_service != null && <div className="text-xs text-muted-foreground">{s.mileage_at_service.toLocaleString()} mi</div>}
                      </div>
                    </div>
                    {s.labor_performed && <p className="text-sm mt-2"><span className="text-muted-foreground">Work performed:</span> {s.labor_performed}</p>}
                    {s.technician_notes && <p className="text-sm mt-1 text-muted-foreground italic">"{s.technician_notes}"</p>}
                    {s.invoice_total != null && (
                      <div className="text-sm font-semibold mt-2">Total: ${s.invoice_total.toFixed(2)}</div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </PortalLayout>
  );
};

export default PortalServiceHistory;
