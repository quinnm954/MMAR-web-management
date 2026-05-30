import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Calendar, MapPin, Wrench, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import TechLayout from "@/components/tech/TechLayout";

interface Appt {
  id: string;
  service_type: string;
  description: string | null;
  service_address: string | null;
  scheduled_at: string | null;
  requested_date: string | null;
  status: string;
  customer_id: string;
  vehicle_id: string | null;
  technician_notes: string | null;
  vehicle: { id: string; year: number | null; make: string | null; model: string | null } | null;
  customer?: { full_name: string | null; email: string | null } | null;
}

const STATUSES = ["scheduled", "in_progress", "completed", "cancelled"];

const statusColor = (s: string) => {
  if (s === "in_progress") return "bg-primary/15 text-primary";
  if (s === "completed") return "bg-accent/15 text-accent-foreground";
  if (s === "cancelled") return "bg-muted text-muted-foreground";
  return "bg-yellow-500/15 text-yellow-500";
};

const TechJobs = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<Appt[]>([]);
  const [loading, setLoading] = useState(true);
  const [logOpen, setLogOpen] = useState<Appt | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    service_type: "",
    mileage_at_service: "",
    labor_performed: "",
    technician_notes: "",
    invoice_total: "",
  });

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("appointments")
      .select("id, service_type, description, service_address, scheduled_at, requested_date, status, customer_id, vehicle_id, technician_notes, vehicle:vehicles(id, year, make, model)")
      .eq("assigned_technician_id", user.id)
      .order("scheduled_at", { ascending: true, nullsFirst: false });
    const list = (data as unknown as Appt[]) ?? [];
    const ids = Array.from(new Set(list.map((r) => r.customer_id)));
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name, email").in("id", ids);
      const byId: Record<string, { full_name: string | null; email: string | null }> = {};
      (profs ?? []).forEach((p) => { byId[p.id] = { full_name: p.full_name, email: p.email }; });
      list.forEach((r) => { r.customer = byId[r.customer_id] ?? null; });
    }
    setRows(list);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const onFocus = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onFocus);
    window.addEventListener('focus', onFocus);
    const interval = setInterval(load, 60000);
    return () => {
      document.removeEventListener('visibilitychange', onFocus);
      window.removeEventListener('focus', onFocus);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Status updated");
    load();
  };

  const updateNotes = async (id: string, technician_notes: string) => {
    const { error } = await supabase.from("appointments").update({ technician_notes }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Notes saved");
  };

  const openLog = (a: Appt) => {
    setForm({
      service_type: a.service_type,
      mileage_at_service: "",
      labor_performed: "",
      technician_notes: a.technician_notes ?? "",
      invoice_total: "",
    });
    setLogOpen(a);
  };

  const saveLog = async () => {
    if (!logOpen) return;
    if (!logOpen.vehicle_id) return toast.error("This appointment has no vehicle attached");
    setSaving(true);
    const { error } = await supabase.from("service_records").insert({
      appointment_id: logOpen.id,
      customer_id: logOpen.customer_id,
      vehicle_id: logOpen.vehicle_id,
      service_date: new Date().toISOString().slice(0, 10),
      service_type: form.service_type,
      mileage_at_service: form.mileage_at_service ? parseInt(form.mileage_at_service) : null,
      labor_performed: form.labor_performed || null,
      technician_notes: form.technician_notes || null,
      invoice_total: form.invoice_total ? parseFloat(form.invoice_total) : null,
    });
    if (!error) {
      await supabase.from("appointments").update({ status: "completed" }).eq("id", logOpen.id);
    }
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Service logged");
    setLogOpen(null);
    load();
  };

  return (
    <TechLayout>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">My Assigned Jobs</h2>
          <Button variant="ghost" size="icon" onClick={load} disabled={loading} aria-label="Refresh">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : rows.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">No jobs assigned to you yet.</CardContent></Card>
        ) : rows.map((r) => (
          <Card key={r.id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{r.service_type}</span>
                    <Badge className={statusColor(r.status)}>{r.status}</Badge>
                  </div>
                  <div className="text-sm">{r.customer?.full_name || r.customer?.email}</div>
                  {r.vehicle && <div className="text-xs text-muted-foreground">{r.vehicle.year} {r.vehicle.make} {r.vehicle.model}</div>}
                </div>
                <div className="text-right text-sm">
                  <div className="flex items-center gap-1 justify-end"><Calendar className="h-3 w-3" /> {r.scheduled_at ? new Date(r.scheduled_at).toLocaleString() : r.requested_date}</div>
                </div>
              </div>
              {r.service_address && (
                <div className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> {r.service_address}</div>
              )}
              {r.description && <p className="text-sm">{r.description}</p>}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-border">
                <div>
                  <Label className="text-xs">Status</Label>
                  <Select value={r.status} onValueChange={(v) => updateStatus(r.id, v)}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Notes</Label>
                  <Input
                    className="h-9"
                    defaultValue={r.technician_notes ?? ""}
                    onBlur={(e) => e.target.value !== (r.technician_notes ?? "") && updateNotes(r.id, e.target.value)}
                  />
                </div>
              </div>

              <Button variant="hero" size="sm" onClick={() => openLog(r)} className="w-full">
                <Wrench className="h-4 w-4 mr-1" /> Log Service & Complete
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!logOpen} onOpenChange={(v) => !v && setLogOpen(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Log Service Record</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Service Type *</Label><Input value={form.service_type} onChange={(e) => setForm({ ...form, service_type: e.target.value })} /></div>
            <div><Label>Mileage</Label><Input type="number" value={form.mileage_at_service} onChange={(e) => setForm({ ...form, mileage_at_service: e.target.value })} /></div>
            <div><Label>Labor Performed</Label><Textarea rows={2} value={form.labor_performed} onChange={(e) => setForm({ ...form, labor_performed: e.target.value })} /></div>
            <div><Label>Technician Notes</Label><Textarea rows={2} value={form.technician_notes} onChange={(e) => setForm({ ...form, technician_notes: e.target.value })} /></div>
            <div><Label>Invoice Total ($)</Label><Input type="number" step="0.01" value={form.invoice_total} onChange={(e) => setForm({ ...form, invoice_total: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogOpen(null)}>Cancel</Button>
            <Button variant="hero" onClick={saveLog} disabled={saving || !form.service_type}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save & Complete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TechLayout>
  );
};

export default TechJobs;
