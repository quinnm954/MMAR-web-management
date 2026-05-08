import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, MapPin, Calendar } from "lucide-react";
import { toast } from "sonner";
import DeleteButton from "@/components/admin/DeleteButton";

interface Row {
  id: string;
  service_type: string;
  description: string | null;
  service_address: string | null;
  requested_date: string | null;
  requested_time_window: string | null;
  scheduled_at: string | null;
  status: string;
  customer_id: string;
  technician_notes: string | null;
  assigned_technician_id: string | null;
  customer: { full_name: string | null; email: string | null } | null;
  vehicle: { year: number | null; make: string | null; model: string | null } | null;
}

interface Tech { user_id: string; full_name: string | null; email: string | null }


const STATUSES = ["requested", "scheduled", "in_progress", "completed", "cancelled"];

const statusColor = (s: string) => {
  if (s === "scheduled" || s === "in_progress") return "bg-primary/15 text-primary";
  if (s === "completed") return "bg-accent/15 text-accent-foreground";
  if (s === "cancelled") return "bg-muted text-muted-foreground";
  return "bg-yellow-500/15 text-yellow-500";
};

const AdminAppointments = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [techs, setTechs] = useState<Tech[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("appointments")
      .select("id, service_type, description, service_address, requested_date, requested_time_window, scheduled_at, status, customer_id, technician_notes, assigned_technician_id, vehicle:vehicles(year, make, model)")
      .order("requested_date", { ascending: false, nullsFirst: false });
    const list = (data as unknown as Row[]) ?? [];
    const ids = Array.from(new Set(list.map((r) => r.customer_id)));
    const { data: profs } = await supabase.from("profiles").select("id, full_name, email").in("id", ids);
    const byId: Record<string, { full_name: string | null; email: string | null }> = {};
    (profs ?? []).forEach((p) => { byId[p.id] = { full_name: p.full_name, email: p.email }; });
    list.forEach((r) => { r.customer = byId[r.customer_id] ?? null; });

    // Load technicians
    const { data: techRoles } = await supabase.from("user_roles").select("user_id").eq("role", "technician");
    const techIds = (techRoles ?? []).map((t) => t.user_id);
    if (techIds.length) {
      const { data: techProfs } = await supabase.from("profiles").select("id, full_name, email").in("id", techIds);
      setTechs((techProfs ?? []).map((p) => ({ user_id: p.id, full_name: p.full_name, email: p.email })));
    } else {
      setTechs([]);
    }

    setRows(list);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const update = async (id: string, patch: Record<string, unknown>) => {
    const row = rows.find((r) => r.id === id);
    const { error } = await supabase.from("appointments").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Updated");

    // Trigger appointment-confirmed email when transitioning to scheduled
    const becameScheduled =
      (patch.status === "scheduled" && row?.status !== "scheduled") ||
      (patch.scheduled_at && row?.status === "requested");
    if (becameScheduled && row?.customer?.email) {
      const { sendNotification } = await import("@/lib/notify");
      const when = (patch.scheduled_at as string) || row.scheduled_at || row.requested_date || "";
      sendNotification({
        templateName: "appointment-confirmed",
        recipientEmail: row.customer.email,
        idempotencyKey: `appt-confirmed-${id}-${when}`,
        templateData: {
          customerName: row.customer.full_name || undefined,
          appointmentDate: when ? new Date(when).toLocaleString() : (row.requested_date ?? undefined),
          serviceType: row.service_type,
          vehicle: row.vehicle ? `${row.vehicle.year ?? ""} ${row.vehicle.make ?? ""} ${row.vehicle.model ?? ""}`.trim() : undefined,
        },
      });
    }
    load();
  };

  const filtered = filter === "all" ? rows : rows.filter((r) => r.status === filter);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} appointments</span>
      </div>

      {filtered.map((r) => (
        <Card key={r.id} className="border-border/50">
          <CardContent className="p-4 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{r.service_type}</span>
                  <Badge className={statusColor(r.status)}>{r.status}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">{r.customer?.full_name || r.customer?.email}</div>
                {r.vehicle && <div className="text-xs">{r.vehicle.year} {r.vehicle.make} {r.vehicle.model}</div>}
              </div>
              <div className="text-right text-sm">
                <div className="flex items-center gap-1 justify-end"><Calendar className="h-3 w-3" /> {r.requested_date}</div>
                {r.requested_time_window && <div className="text-xs text-muted-foreground">{r.requested_time_window}</div>}
              </div>
            </div>
            {r.service_address && (
              <div className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> {r.service_address}</div>
            )}
            {r.description && <p className="text-sm">{r.description}</p>}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2 border-t border-border">
              <div>
                <label className="text-xs text-muted-foreground">Status</label>
                <Select value={r.status} onValueChange={(v) => update(r.id, { status: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Schedule for</label>
                <Input
                  type="datetime-local"
                  className="h-8 text-xs"
                  defaultValue={r.scheduled_at ? new Date(r.scheduled_at).toISOString().slice(0, 16) : ""}
                  onBlur={(e) => e.target.value && update(r.id, { scheduled_at: new Date(e.target.value).toISOString(), status: r.status === "requested" ? "scheduled" : r.status })}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Technician notes</label>
                <Input
                  className="h-8 text-xs"
                  defaultValue={r.technician_notes ?? ""}
                  onBlur={(e) => e.target.value !== (r.technician_notes ?? "") && update(r.id, { technician_notes: e.target.value })}
                />
              </div>
            </div>
            <div className="pt-2 border-t border-border">
              <label className="text-xs text-muted-foreground">Assigned technician</label>
              <Select
                value={r.assigned_technician_id ?? "unassigned"}
                onValueChange={(v) => update(r.id, { assigned_technician_id: v === "unassigned" ? null : v })}
              >
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {techs.map((t) => <SelectItem key={t.user_id} value={t.user_id}>{t.full_name || t.email}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end pt-2 border-t border-border">
              <DeleteButton
                table="appointments"
                id={r.id}
                description="Delete this appointment? Linked service records and invoices will remain."
                onDeleted={load}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminAppointments;
