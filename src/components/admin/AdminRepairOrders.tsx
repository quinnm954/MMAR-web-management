import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Wrench } from "lucide-react";
import RepairOrderDetail from "./RepairOrderDetail";
import DeleteButton from "./DeleteButton";
import { format } from "date-fns";

export default function AdminRepairOrders() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: appts } = await supabase
        .from("appointments")
        .select("id,service_type,status,scheduled_at,requested_date,customer_id,vehicle_id,board_column,priority,created_at")
        .order("created_at", { ascending: false })
        .limit(200);

      const customerIds = Array.from(new Set((appts || []).map((a: any) => a.customer_id).filter(Boolean)));
      const vehicleIds = Array.from(new Set((appts || []).map((a: any) => a.vehicle_id).filter(Boolean)));

      const [{ data: customers }, { data: vehicles }] = await Promise.all([
        customerIds.length ? supabase.from("profiles").select("id,full_name,email").in("id", customerIds) : Promise.resolve({ data: [] }),
        vehicleIds.length ? supabase.from("vehicles").select("id,year,make,model,license_plate").in("id", vehicleIds) : Promise.resolve({ data: [] }),
      ]);

      const cmap = new Map((customers || []).map((c: any) => [c.id, c]));
      const vmap = new Map((vehicles || []).map((v: any) => [v.id, v]));

      setRows(
        (appts || []).map((a: any) => ({
          ...a,
          customer: cmap.get(a.customer_id),
          vehicle: vmap.get(a.vehicle_id),
        }))
      );
      setLoading(false);
    })();
  }, []);

  const filtered = rows.filter((r) => {
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return (
      r.id.toLowerCase().includes(s) ||
      r.service_type?.toLowerCase().includes(s) ||
      r.customer?.full_name?.toLowerCase().includes(s) ||
      r.customer?.email?.toLowerCase().includes(s) ||
      r.vehicle?.make?.toLowerCase().includes(s) ||
      r.vehicle?.model?.toLowerCase().includes(s) ||
      r.vehicle?.license_plate?.toLowerCase().includes(s)
    );
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Wrench className="h-5 w-5" /> Repair Orders</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search RO #, customer, vehicle..." className="pl-9" />
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-muted-foreground py-8 text-sm">No repair orders found.</div>
        ) : (
          <div className="space-y-2">
            {filtered.map((r) => (
              <div
                key={r.id}
                className="w-full p-3 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-colors flex items-center gap-2"
              >
                <button onClick={() => setOpenId(r.id)} className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">RO#{r.id.slice(0, 8).toUpperCase()}</span>
                        <Badge variant="outline" className="text-xs">{r.status}</Badge>
                        {r.priority && r.priority !== "normal" && <Badge variant="destructive" className="text-xs">{r.priority}</Badge>}
                      </div>
                      <div className="font-medium mt-1 truncate">{r.service_type}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {r.customer?.full_name || "Unknown"} · {r.vehicle ? `${r.vehicle.year} ${r.vehicle.make} ${r.vehicle.model}` : "No vehicle"}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground text-right">
                      {r.scheduled_at ? format(new Date(r.scheduled_at), "MMM d, p") : r.requested_date || format(new Date(r.created_at), "MMM d")}
                    </div>
                  </div>
                </button>
                <DeleteButton
                  table="appointments"
                  id={r.id}
                  size="icon"
                  label="Delete repair order"
                  description="This permanently deletes the repair order and any linked estimates/invoices may be orphaned. This cannot be undone."
                  onDeleted={() => setRows((prev) => prev.filter((x) => x.id !== r.id))}
                />
              </div>
            ))}
          </div>
        )}

        <RepairOrderDetail appointmentId={openId} open={!!openId} onClose={() => setOpenId(null)} />
      </CardContent>
    </Card>
  );
}
