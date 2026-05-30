import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Calendar, MapPin, ClipboardCheck, RefreshCw } from "lucide-react";
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
  const [rows, setRows] = useState<Appt[]>([]);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState<string | null>(null);

  const load = async () => {
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
    // Attach existing inspection ids
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

  const openInspection = async (a: Appt) => {
    if (!user) return;
    if (a.inspection_id) {
      navigate(`/tech/inspections?inspection=${a.inspection_id}`);
      return;
    }
    if (!a.vehicle_id) return toast.error("This job has no vehicle attached");
    setOpening(a.id);

    // Build item list from all active checklist templates
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
        ))}
      </div>
    </TechLayout>
  );
};

export default TechJobs;
