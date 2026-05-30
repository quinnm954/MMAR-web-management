import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import TechLayout from "@/components/tech/TechLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Loader2, Plus, ClipboardCheck, ClipboardList, Camera, ChevronDown, ChevronRight, ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";

interface Inspection {
  id: string;
  customer_id: string;
  vehicle_id: string;
  appointment_id: string | null;
  status: string;
  mileage: number | null;
  summary_notes: string | null;
  created_at: string;
  vehicle?: { year: number | null; make: string | null; model: string | null } | null;
  customer?: { full_name: string | null; email: string | null } | null;
}
interface InspItem {
  id: string;
  inspection_id: string;
  category: string;
  item_name: string;
  status: string;
  notes: string | null;
  photo_urls: string[];
  sort_order: number;
}
interface Appt {
  id: string;
  service_type: string;
  customer_id: string;
  vehicle_id: string | null;
}
type Checklist = {
  id: string; title: string; status: string; notes: string | null;
  completed_at: string | null; created_at: string;
};

const ITEM_STATUSES = ["na", "pass", "warning", "fail"] as const;
const STATUS_LABEL: Record<string, string> = { na: "N/A", pass: "Pass", warning: "Warn", fail: "Fail" };
const statusBadge = (s: string) => {
  if (s === "pass") return "bg-green-500/15 text-green-500";
  if (s === "warning") return "bg-yellow-500/15 text-yellow-500";
  if (s === "fail") return "bg-destructive/15 text-destructive";
  return "bg-muted text-muted-foreground";
};

const buildMergedTemplateItems = async (): Promise<{ category: string; item_name: string; sort_order: number }[]> => {
  const { data: templates } = await supabase
    .from("checklist_templates")
    .select("id, name")
    .eq("is_active", true);
  const tplIds = (templates ?? []).map((t: any) => t.id);
  const merged: { category: string; item_name: string; sort_order: number }[] = [];
  if (!tplIds.length) return merged;
  const { data: tItems } = await supabase
    .from("checklist_template_items")
    .select("template_id, label, sort_order")
    .in("template_id", tplIds)
    .order("sort_order", { ascending: true });
  const tplName: Record<string, string> = {};
  (templates ?? []).forEach((t: any) => { tplName[t.id] = t.name; });
  const seen = new Set<string>();
  let order = 0;
  (tItems ?? []).forEach((it: any) => {
    const cat = tplName[it.template_id] ?? "General";
    const key = `${cat}::${it.label}`;
    if (seen.has(key)) return;
    seen.add(key);
    merged.push({ category: cat, item_name: it.label, sort_order: order++ });
  });
  return merged;
};

const TechInspections = () => {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "checklists" ? "checklists" : "inspections";
  const inspectionParam = params.get("inspection");

  // Inspections
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [appts, setAppts] = useState<Appt[]>([]);
  const [loadingInsp, setLoadingInsp] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [items, setItems] = useState<InspItem[]>([]);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [createOpen, setCreateOpen] = useState(false);
  const [newApptId, setNewApptId] = useState("");
  const [creating, setCreating] = useState(false);
  const [completing, setCompleting] = useState(false);

  // Checklists
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loadingCl, setLoadingCl] = useState(true);

  const loadInsp = async () => {
    if (!user) return;
    setLoadingInsp(true);
    // Get all appointments assigned to this tech (any status) so we can
    // surface inspections linked to those appointments — even when the
    // inspection itself has no technician_id set yet.
    const { data: allAssigned } = await supabase
      .from("appointments")
      .select("id, service_type, customer_id, vehicle_id, status")
      .eq("assigned_technician_id", user.id);
    const assignedApptIds = (allAssigned ?? []).map((x: any) => x.id);
    const assignedCustomerIds = Array.from(
      new Set((allAssigned ?? []).map((x: any) => x.customer_id).filter(Boolean))
    );

    // Build an OR filter: own inspections, linked appointment, or
    // unclaimed inspection for a customer this tech is assigned to.
    const orParts: string[] = [`technician_id.eq.${user.id}`];
    if (assignedApptIds.length) orParts.push(`appointment_id.in.(${assignedApptIds.join(",")})`);
    if (assignedCustomerIds.length) orParts.push(`customer_id.in.(${assignedCustomerIds.join(",")})`);

    const i = await supabase
      .from("inspections")
      .select("*")
      .or(orParts.join(","))
      .order("created_at", { ascending: false });

    const activeAppts = (allAssigned ?? []).filter((x: any) =>
      ["scheduled", "in_progress"].includes(x.status)
    );

    const list = ((i.data ?? []) as unknown) as Inspection[];
    const custIds = Array.from(new Set(list.map((x) => x.customer_id)));
    const vehIds = Array.from(new Set(list.map((x) => x.vehicle_id).filter(Boolean)));
    const [profsRes, vehsRes] = await Promise.all([
      custIds.length ? supabase.from("profiles").select("id, full_name, email").in("id", custIds) : Promise.resolve({ data: [] as any[] }),
      vehIds.length ? supabase.from("vehicles").select("id, year, make, model").in("id", vehIds) : Promise.resolve({ data: [] as any[] }),
    ]);
    const profMap: Record<string, { full_name: string | null; email: string | null }> = {};
    (profsRes.data ?? []).forEach((p: any) => { profMap[p.id] = { full_name: p.full_name, email: p.email }; });
    const vehMap: Record<string, { year: number | null; make: string | null; model: string | null }> = {};
    (vehsRes.data ?? []).forEach((v: any) => { vehMap[v.id] = { year: v.year, make: v.make, model: v.model }; });
    list.forEach((x) => {
      x.customer = profMap[x.customer_id] ?? null;
      x.vehicle = vehMap[x.vehicle_id] ?? null;
    });
    setInspections(list);
    setAppts(activeAppts as Appt[]);
    setLoadingInsp(false);
  };

  const loadCl = async () => {
    if (!user) return;
    setLoadingCl(true);
    const { data } = await supabase.from("service_checklists")
      .select("id, title, status, notes, completed_at, created_at")
      .eq("assigned_technician_id", user.id)
      .order("created_at", { ascending: false });
    setChecklists((data as any) ?? []);
    setLoadingCl(false);
  };

  useEffect(() => { loadInsp(); loadCl(); /* eslint-disable-next-line */ }, [user]);

  const openInspection = async (id: string) => {
    setOpenId(id);
    const { data } = await supabase
      .from("inspection_items")
      .select("*")
      .eq("inspection_id", id)
      .order("sort_order");
    setItems((data ?? []) as InspItem[]);
  };

  // Deep link: /tech/inspections?inspection=<id>
  useEffect(() => {
    if (inspectionParam && inspectionParam !== openId) {
      openInspection(inspectionParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inspectionParam]);

  const closeDetail = () => {
    setOpenId(null);
    if (params.get("inspection")) {
      const next = new URLSearchParams(params);
      next.delete("inspection");
      setParams(next, { replace: true });
    }
  };

  const createInspection = async () => {
    if (!user || !newApptId) return toast.error("Pick a job");
    const appt = appts.find((a) => a.id === newApptId);
    if (!appt?.vehicle_id) return toast.error("That job has no vehicle attached");
    setCreating(true);
    const { data: insp, error } = await supabase.from("inspections").insert({
      technician_id: user.id,
      customer_id: appt.customer_id,
      vehicle_id: appt.vehicle_id,
      appointment_id: appt.id,
      status: "in_progress",
    }).select().single();
    if (error || !insp) { setCreating(false); return toast.error(error?.message ?? "Failed"); }

    const merged = await buildMergedTemplateItems();
    const rows = (merged.length ? merged : [{ category: "General", item_name: "Walk-around inspection", sort_order: 0 }])
      .map((t) => ({
        inspection_id: insp.id,
        category: t.category,
        item_name: t.item_name,
        status: "na",
        sort_order: t.sort_order,
      }));
    await supabase.from("inspection_items").insert(rows);
    setCreating(false);
    setCreateOpen(false);
    setNewApptId("");
    toast.success("Inspection created");
    await loadInsp();
    openInspection(insp.id);
  };

  const updateItem = async (id: string, patch: Partial<InspItem>) => {
    setItems((prev) => prev.map((it) => it.id === id ? { ...it, ...patch } : it));
    const { error } = await supabase.from("inspection_items").update(patch).eq("id", id);
    if (error) toast.error(error.message);
  };

  const uploadPhoto = async (item: InspItem, file: File) => {
    if (!user) return;
    const path = `${user.id}/${item.inspection_id}/${item.id}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("inspection-photos").upload(path, file);
    if (upErr) return toast.error(upErr.message);
    const { data: pub } = supabase.storage.from("inspection-photos").getPublicUrl(path);
    const next = [...(item.photo_urls ?? []), pub.publicUrl];
    await updateItem(item.id, { photo_urls: next });
    toast.success("Photo added");
  };

  const completeInspection = async () => {
    if (!openId) return;
    const current = inspections.find((i) => i.id === openId);
    setCompleting(true);
    const completedAt = new Date().toISOString();

    // 1. mark inspection complete
    const { error: e1 } = await supabase
      .from("inspections")
      .update({ status: "completed", completed_at: completedAt })
      .eq("id", openId);
    if (e1) { setCompleting(false); return toast.error(e1.message); }

    // 2. if linked to an appointment, complete it + ensure a service_record exists
    if (current?.appointment_id) {
      const { data: appt } = await supabase
        .from("appointments")
        .select("id, service_type, customer_id, vehicle_id")
        .eq("id", current.appointment_id)
        .maybeSingle();

      await supabase
        .from("appointments")
        .update({ status: "completed" })
        .eq("id", current.appointment_id);

      if (appt?.vehicle_id) {
        const { data: existing } = await supabase
          .from("service_records")
          .select("id")
          .eq("appointment_id", current.appointment_id)
          .maybeSingle();
        if (!existing) {
          await supabase.from("service_records").insert({
            appointment_id: appt.id,
            customer_id: appt.customer_id,
            vehicle_id: appt.vehicle_id,
            service_date: new Date().toISOString().slice(0, 10),
            service_type: appt.service_type,
            mileage_at_service: current.mileage ?? null,
            labor_performed: current.summary_notes ?? null,
            technician_notes: `Inspection #${openId.slice(0, 8)}`,
          });
        }
      }
    }

    setCompleting(false);
    toast.success("Inspection completed");
    closeDetail();
    loadInsp();
  };

  const updateMileageNotes = async (mileage: string, summary: string) => {
    if (!openId) return;
    const patch: any = {
      mileage: mileage ? parseInt(mileage) : null,
      summary_notes: summary || null,
    };
    await supabase.from("inspections").update(patch).eq("id", openId);
    setInspections((prev) => prev.map((i) => i.id === openId ? { ...i, ...patch } : i));
  };

  const current = inspections.find((i) => i.id === openId) ?? null;
  const grouped = items.reduce<Record<string, InspItem[]>>((acc, it) => {
    (acc[it.category] ||= []).push(it);
    return acc;
  }, {});
  const totalItems = items.length;
  const answered = items.filter((i) => i.status !== "na").length;

  // Single inspection view (mobile-first)
  if (openId && current) {
    return (
      <TechLayout>
        <div className="space-y-4 max-w-3xl pb-24">
          <div className="flex items-center justify-between gap-2">
            <Button variant="ghost" size="sm" onClick={closeDetail} className="-ml-2">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <div className="text-xs text-muted-foreground">
              {answered} / {totalItems} answered
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold">Inspection</h2>
            <p className="text-sm text-muted-foreground">
              {current.vehicle ? `${current.vehicle.year} ${current.vehicle.make} ${current.vehicle.model}` : "Vehicle"}
              {" — "}{current.customer?.full_name || current.customer?.email}
            </p>
          </div>

          <Card>
            <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Mileage</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  defaultValue={current.mileage ?? ""}
                  onBlur={(e) => updateMileageNotes(e.target.value, current.summary_notes ?? "")}
                />
              </div>
              <div>
                <Label>Summary / labor performed</Label>
                <Input
                  defaultValue={current.summary_notes ?? ""}
                  onBlur={(e) => updateMileageNotes(String(current.mileage ?? ""), e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {Object.entries(grouped).map(([cat, list]) => {
            const isCollapsed = collapsed[cat];
            const catAnswered = list.filter((i) => i.status !== "na").length;
            return (
              <Card key={cat}>
                <CardHeader className="pb-2 cursor-pointer select-none" onClick={() => setCollapsed((c) => ({ ...c, [cat]: !c[cat] }))}>
                  <CardTitle className="text-base flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5">
                      {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      {cat}
                    </span>
                    <Badge variant="outline" className="text-[10px]">{catAnswered}/{list.length}</Badge>
                  </CardTitle>
                </CardHeader>
                {!isCollapsed && (
                  <CardContent className="space-y-3">
                    {list.map((it) => (
                      <div key={it.id} className="border-b border-border/50 pb-3 last:border-0 space-y-2">
                        <div className="text-sm font-medium">{it.item_name}</div>
                        <div className="grid grid-cols-4 gap-1.5">
                          {ITEM_STATUSES.map((s) => (
                            <button
                              key={s}
                              onClick={() => updateItem(it.id, { status: s })}
                              className={`min-h-11 text-xs font-medium rounded px-2 ${
                                it.status === s ? statusBadge(s) : "bg-muted text-muted-foreground hover:bg-muted/70"
                              }`}
                            >
                              {STATUS_LABEL[s]}
                            </button>
                          ))}
                        </div>
                        <Textarea
                          rows={1}
                          placeholder="Notes (optional)"
                          defaultValue={it.notes ?? ""}
                          onBlur={(e) => updateItem(it.id, { notes: e.target.value })}
                        />
                        <div className="flex flex-wrap gap-2 items-center">
                          {(it.photo_urls ?? []).map((u, idx) => (
                            <img key={idx} src={u} alt="" className="h-14 w-14 rounded object-cover border border-border" />
                          ))}
                          <label className="cursor-pointer text-xs flex items-center gap-1 min-h-11 px-3 rounded border border-dashed border-border text-muted-foreground hover:text-foreground">
                            <Camera className="h-4 w-4" /> Photo
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              hidden
                              onChange={(e) => e.target.files?.[0] && uploadPhoto(it, e.target.files[0])}
                            />
                          </label>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* Sticky bottom complete bar */}
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur safe-pb lg:left-auto lg:right-0 lg:w-[calc(100%-0px)]">
          <div className="container mx-auto px-4 py-3">
            <Button
              variant="hero"
              className="w-full min-h-12"
              onClick={completeInspection}
              disabled={completing || current.status === "completed"}
            >
              {completing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : current.status === "completed" ? (
                <>Inspection already completed</>
              ) : (
                <>
                  <ClipboardCheck className="h-4 w-4 mr-1" />
                  Complete Inspection & Job
                </>
              )}
            </Button>
          </div>
        </div>
      </TechLayout>
    );
  }

  return (
    <TechLayout>
      <Tabs value={tab} onValueChange={(v) => setParams(v === "inspections" ? {} : { tab: v }, { replace: true })}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="inspections"><ClipboardCheck className="h-4 w-4 mr-1" />Inspections</TabsTrigger>
          <TabsTrigger value="checklists"><ClipboardList className="h-4 w-4 mr-1" />Checklists</TabsTrigger>
        </TabsList>

        <TabsContent value="inspections" className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">My Inspections</h2>
            <Button variant="hero" size="sm" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-1" /> New</Button>
          </div>
          {loadingInsp ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : inspections.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">No inspections yet.</CardContent></Card>
          ) : inspections.map((i) => (
            <Card key={i.id} className="cursor-pointer hover:border-primary/50" onClick={() => openInspection(i.id)}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">
                    {i.vehicle ? `${i.vehicle.year} ${i.vehicle.make} ${i.vehicle.model}` : "Vehicle"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {i.customer?.full_name || i.customer?.email} · {new Date(i.created_at).toLocaleDateString()}
                  </div>
                </div>
                <Badge className={i.status === "completed" ? "bg-green-500/15 text-green-500" : "bg-yellow-500/15 text-yellow-500"}>{i.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="checklists" className="mt-4 space-y-3">
          <h2 className="text-lg font-bold">My Checklists</h2>
          {loadingCl ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : checklists.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">No checklists assigned yet.</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {checklists.map((r) => (
                <Link to={`/tech/checklists/${r.id}`} key={r.id}>
                  <Card className="hover:bg-muted/40 transition">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <div className="font-medium">{r.title}</div>
                        <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</div>
                      </div>
                      <Badge variant={r.status === "completed" ? "secondary" : "default"}>{r.status}</Badge>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Inspection</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label>Job</Label>
            <Select value={newApptId} onValueChange={setNewApptId}>
              <SelectTrigger><SelectValue placeholder="Pick an assigned job" /></SelectTrigger>
              <SelectContent>
                {appts.length === 0 && <SelectItem value="none" disabled>No active jobs</SelectItem>}
                {appts.map((a) => <SelectItem key={a.id} value={a.id}>{a.service_type}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button variant="hero" onClick={createInspection} disabled={creating || !newApptId}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TechLayout>
  );
};

export default TechInspections;
