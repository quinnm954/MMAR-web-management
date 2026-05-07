import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import TechLayout from "@/components/tech/TechLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus, ClipboardCheck, Camera } from "lucide-react";
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

const DEFAULT_TEMPLATE = [
  { category: "Engine", item_name: "Oil level & condition" },
  { category: "Engine", item_name: "Coolant level" },
  { category: "Engine", item_name: "Belts & hoses" },
  { category: "Brakes", item_name: "Front brake pads" },
  { category: "Brakes", item_name: "Rear brake pads" },
  { category: "Brakes", item_name: "Brake fluid" },
  { category: "Tires", item_name: "Tread depth" },
  { category: "Tires", item_name: "Tire pressure" },
  { category: "Lights", item_name: "Headlights" },
  { category: "Lights", item_name: "Brake lights" },
  { category: "Suspension", item_name: "Shocks/struts" },
  { category: "Battery", item_name: "Battery & terminals" },
];

const ITEM_STATUSES = ["na", "pass", "warning", "fail"];
const statusBadge = (s: string) => {
  if (s === "pass") return "bg-green-500/15 text-green-500";
  if (s === "warning") return "bg-yellow-500/15 text-yellow-500";
  if (s === "fail") return "bg-destructive/15 text-destructive";
  return "bg-muted text-muted-foreground";
};

const TechInspections = () => {
  const { user } = useAuth();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [appts, setAppts] = useState<Appt[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [items, setItems] = useState<InspItem[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [newApptId, setNewApptId] = useState("");
  const [creating, setCreating] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [i, a] = await Promise.all([
      supabase.from("inspections")
        .select("*")
        .eq("technician_id", user.id)
        .order("created_at", { ascending: false }),
      supabase.from("appointments")
        .select("id, service_type, customer_id, vehicle_id")
        .eq("assigned_technician_id", user.id)
        .in("status", ["scheduled", "in_progress"]),
    ]);
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
    setAppts((a.data ?? []) as Appt[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const openInspection = async (id: string) => {
    setOpenId(id);
    const { data } = await supabase.from("inspection_items").select("*").eq("inspection_id", id).order("sort_order");
    setItems((data ?? []) as InspItem[]);
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

    const rows = DEFAULT_TEMPLATE.map((t, idx) => ({
      inspection_id: insp.id,
      category: t.category,
      item_name: t.item_name,
      status: "na",
      sort_order: idx,
    }));
    await supabase.from("inspection_items").insert(rows);
    setCreating(false);
    setCreateOpen(false);
    setNewApptId("");
    toast.success("Inspection created");
    await load();
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
    await supabase.from("inspections").update({
      status: "completed",
      completed_at: new Date().toISOString(),
    }).eq("id", openId);
    toast.success("Inspection completed");
    setOpenId(null);
    load();
  };

  const updateMileageNotes = async (mileage: string, summary: string) => {
    if (!openId) return;
    await supabase.from("inspections").update({
      mileage: mileage ? parseInt(mileage) : null,
      summary_notes: summary || null,
    }).eq("id", openId);
  };

  const current = inspections.find((i) => i.id === openId) ?? null;

  return (
    <TechLayout>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : openId && current ? (
        <div className="space-y-4 max-w-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Inspection</h2>
              <p className="text-sm text-muted-foreground">
                {current.vehicle ? `${current.vehicle.year} ${current.vehicle.make} ${current.vehicle.model}` : "Vehicle"}
                {" — "}{current.customer?.full_name || current.customer?.email}
              </p>
            </div>
            <Button variant="ghost" onClick={() => setOpenId(null)}>Back</Button>
          </div>

          <Card>
            <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Mileage</Label>
                <Input type="number" defaultValue={current.mileage ?? ""} onBlur={(e) => updateMileageNotes(e.target.value, current.summary_notes ?? "")} />
              </div>
              <div>
                <Label>Summary</Label>
                <Input defaultValue={current.summary_notes ?? ""} onBlur={(e) => updateMileageNotes(String(current.mileage ?? ""), e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {Object.entries(items.reduce<Record<string, InspItem[]>>((acc, it) => {
            (acc[it.category] ||= []).push(it);
            return acc;
          }, {})).map(([cat, list]) => (
            <Card key={cat}>
              <CardHeader className="pb-2"><CardTitle className="text-base">{cat}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {list.map((it) => (
                  <div key={it.id} className="border-b border-border/50 pb-3 last:border-0 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-medium">{it.item_name}</div>
                      <div className="flex gap-1">
                        {ITEM_STATUSES.map((s) => (
                          <button
                            key={s}
                            onClick={() => updateItem(it.id, { status: s })}
                            className={`text-xs px-2 py-1 rounded ${it.status === s ? statusBadge(s) : "bg-muted text-muted-foreground"}`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                    <Textarea rows={1} placeholder="Notes" defaultValue={it.notes ?? ""} onBlur={(e) => updateItem(it.id, { notes: e.target.value })} />
                    <div className="flex flex-wrap gap-2 items-center">
                      {(it.photo_urls ?? []).map((u, idx) => (
                        <img key={idx} src={u} className="h-14 w-14 rounded object-cover border border-border" />
                      ))}
                      <label className="cursor-pointer text-xs flex items-center gap-1 px-2 py-1 rounded border border-dashed border-border text-muted-foreground hover:text-foreground">
                        <Camera className="h-3 w-3" /> Photo
                        <input type="file" accept="image/*" capture="environment" hidden onChange={(e) => e.target.files?.[0] && uploadPhoto(it, e.target.files[0])} />
                      </label>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

          <Button variant="hero" className="w-full" onClick={completeInspection}>
            <ClipboardCheck className="h-4 w-4 mr-1" /> Complete Inspection
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">My Inspections</h2>
            <Button variant="hero" size="sm" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-1" /> New</Button>
          </div>
          {inspections.length === 0 ? (
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
        </div>
      )}

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
