import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Calendar, MapPin, ClipboardCheck, RefreshCw, History, Wrench } from "lucide-react";
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
  inspection_id?: string | null;
}

interface ServiceRecord {
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

type Tab = "active" | "history";

const STATUSES = ["scheduled", "in_progress", "completed", "cancelled"];

const statusColor = (s: string) => {
  if (s === "in_progress") return "bg-primary/15 text-primary";
  if (s === "completed") return "bg-accent/15 text-accent-foreground";
  if (s === "cancelled") return "bg-muted text-muted-foreground";
  return "bg-yellow-500/15 text-yellow-500";
};

const TechJobs = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("active");
  const [rows, setRows] = useState<Appt[]>([]);
  const [historyRows, setHistoryRows] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState<string | null>(null);

  const loadActive = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("appointments")
      .select("id, service_type, description, service_address, scheduled_at, requested_date, status, customer_id, vehicle_id, technician_notes, vehicle:vehicles(id, year, make, model)")
      .eq("assigned_technician_id", user.id)
      .in("status", ["scheduled", "in_progress"])
      .order("scheduled_at", { ascending: true, nullsFirst: false });
    const list = (data as unknown as Appt[]) ?? [];
    const ids = Array.from(new Set(list.map((r) => r.customer_id)));
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name, email").in("id", ids);
      const byId: Record<string, { full_name: string | null; email: string | null }> = {};
      (profs ?? []).forEach((p) => { byId[p.id] = { full_name: p.full_name, email: p.email }; });
      list.forEach((r) => { r.customer = byId[r.customer_id] ?? null; });
    }
    const apptIds = list.map((r) => r.id);
    if (apptIds.length) {
      const { data: insps } = await supabase
        .from("inspections")
        .select("id, appointment_id")
        .in("appointment_id", apptIds);
      const map: Record<string, string> = {};
      (insps ?? []).forEach((i: any) => { if (i.appointment_id) map[i.appointment_id] = i.id; });
      list.forEach((r) => { r.inspection_id = map[r.id] ?? null; });
    }
    setRows(list);
    setLoading(false);
  };

  const loadHistory = async () => {
    if (!user) return;
    setLoading(true);
    const { data: appts } = await supabase
      .from("appointments")
      .select("id")
      .eq("assigned_technician_id", user.id);
    const apptIds = (appts ?? []).map((a: any) => a.id);
    if (!apptIds.length) {
      setHistoryRows([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("service_records")
      .select("id, service_date, service_type, labor_performed, mileage_at_service, invoice_total, customer_id, vehicle_id, appointment_id")
      .in("appointment_id", apptIds)
      .order("service_date", { ascending: false })
      .limit(200);
    const list = (data as ServiceRecord[]) ?? [];
    const custIds = Array.from(new Set(list.map((r) => r.customer_id)));
    const vehIds = Array.from(new Set(list.map((r) => r.vehicle_id)));
    const [profs, vehs] = await Promise.all([
      custIds.length ? supabase.from("profiles").select("id, full_name, email").in("id", custIds) : Promise.resolve({ data: [] as any[] }),
      vehIds.length ? supabase.from("vehicles").select("id, year, make, model").in("id", vehIds) : Promise.resolve({ data: [] as any[] }),
    ]);
    const pMap: any = {}; (profs.data ?? []).forEach((p: any) => (pMap[p.id] = p));
    const vMap: any = {}; (vehs.data ?? []).forEach((v: any) => (vMap[v.id] = v));
    list.forEach((r) => { r.customer = pMap[r.customer_id] ?? null; r.vehicle = vMap[r.vehicle_id] ?? null; });
    setHistoryRows(list);
    setLoading(false);
  };

  useEffect(() => {
    if (tab === "active") loadActive();
    else loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, tab]);

  useEffect(() => {
    if (!user) return;
    const onFocus = () => {
      if (document.visibilityState === 'visible') {
        if (tab === "active") loadActive();
        else loadHistory();
      }
    };
    document.addEventListener('visibilitychange', onFocus);
    window.addEventListener('focus', onFocus);
    const interval = setInterval(() => {
      if (tab === "active") loadActive();
      else loadHistory();
    }, 60000);
    return () => {
      document.removeEventListener('visibilitychange', onFocus);
      window.removeEventListener('focus', onFocus);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, tab]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Status updated");
    loadActive();
  };

  const updateNotes = async (id: string, technician_notes: string) => {
    const { error } = await supabase.from("appointments").update({ technician_notes }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Notes saved");
  };

  const openInspection = async (a: Appt) => {
    if (!user) return;
    if (a.inspection_id) {
      navigate(`/tech/inspections?inspection=${a.inspection_id}`);
      return;
    }
    if (!a.vehicle_id) return toast.error("This job has no vehicle attached");
    setOpening(a.id);

    const { data: templates } = await supabase
      .from("checklist_templates")
      .select("id, name")
      .eq("is_active", true);
    const tplIds = (templates ?? []).map((t: any) => t.id);
    let mergedItems: { category: string; item_name: string; sort_order: number }[] = [];
    if (tplIds.length) {
      const { data: tItems } = await supabase
        .from("checklist_template_items")
        .select("template_id, label, sort_order")
        .in("template_id", tplIds)
        .order("sort_order", { ascending: true });
      const tplById: Record<string, string> = {};
      (templates ?? []).forEach((t: any) => { tplById[t.id] = t.name; });
      const seen = new Set<string>();
      let order = 0;
      (tItems ?? []).forEach((it: any) => {
        const cat = tplById[it.template_id] ?? "General";
        const key = `${cat}::${it.label}`;
        if (seen.has(key)) return;
        seen.add(key);
        mergedItems.push({ category: cat, item_name: it.label, sort_order: order++ });
      });
    }
    if (!mergedItems.length) {
      mergedItems = [
        { category: "General", item_name: "Walk-around inspection", sort_order: 0 },
      ];
    }

    const { data: insp, error } = await supabase.from("inspections").insert({
      technician_id: user.id,
      customer_id: a.customer_id,
      vehicle_id: a.vehicle_id,
      appointment_id: a.id,
      status: "in_progress",
    }).select().single();

    if (error || !insp) {
      setOpening(null);
      return toast.error(error?.message ?? "Failed to start inspection");
    }
    await supabase.from("inspection_items").insert(
      mergedItems.map((m) => ({
        inspection_id: insp.id,
        category: m.category,
        item_name: m.item_name,
        status: "na",
        sort_order: m.sort_order,
      })),
    );
    setOpening(null);
    navigate(`/tech/inspections?inspection=${insp.id}`);
  };

  return (
    <TechLayout>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">My Jobs</h2>
          <Button variant="ghost" size="icon" onClick={() => tab === "active" ? loadActive() : loadHistory()} disabled={loading} aria-label="Refresh">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="flex rounded-lg overflow-hidden border border-border bg-muted/40">
          <button
            onClick={() => setTab("active")}
            className={`flex-1 py-2 text-sm font-medium text-center transition-colors ${tab === "active" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            Active
          </button>
          <button
            onClick={() => setTab("history")}
            className={`flex-1 py-2 text-sm font-medium text-center transition-colors ${tab === "history" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            History
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : tab === "active" ? (
          rows.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">No active jobs assigned to you.</CardContent></Card>
          ) : (
            rows.map((r) => (
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

                  <Button
                    variant="hero"
                    size="sm"
                    onClick={() => openInspection(r)}
                    disabled={opening === r.id}
                    className="w-full min-h-11"
                  >
                    {opening === r.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <ClipboardCheck className="h-4 w-4 mr-1" />
                        {r.inspection_id ? "Open Inspection" : "Start Inspection"}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))
          )
        ) : (
          historyRows.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">No completed jobs yet.</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {historyRows.map((r) => (
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
          )
        )}
      </div>
    </TechLayout>
  );
};

export default TechJobs;
