import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import TechLayout from "@/components/tech/TechLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader2, ClipboardList, Check, X, AlertTriangle, ArrowLeft, Sparkles, DollarSign } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Checklist = {
  id: string; title: string; status: string; notes: string | null;
  completed_at: string | null; created_at: string;
};

type Item = {
  id: string; label: string; description: string | null; status: string;
  notes: string | null; required: boolean; sort_order: number;
  severity: string | null; recommended: boolean; estimate_id: string | null;
};

const SEVERITIES: { key: string; label: string; cls: string }[] = [
  { key: "good", label: "Good", cls: "bg-green-600 hover:bg-green-700 text-white" },
  { key: "monitor", label: "Monitor", cls: "bg-yellow-500 hover:bg-yellow-600 text-black" },
  { key: "needs_service", label: "Needs", cls: "bg-orange-500 hover:bg-orange-600 text-white" },
  { key: "urgent", label: "Urgent", cls: "bg-destructive hover:bg-destructive/90 text-destructive-foreground" },
];

const TechChecklists = () => {
  const { id } = useParams();
  if (id) return <TechChecklistDetail id={id} />;
  return <TechChecklistList />;
};

const TechChecklistList = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from("service_checklists")
      .select("id, title, status, notes, completed_at, created_at")
      .eq("assigned_technician_id", user.id)
      .order("created_at", { ascending: false });
    setRows((data as any) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [user]);

  return (
    <TechLayout>
      <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" /> My Checklists</h2>
      {loading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : rows.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No checklists assigned yet.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {rows.map(r => (
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
    </TechLayout>
  );
};

const TechChecklistDetail = ({ id }: { id: string }) => {
  const navigate = useNavigate();
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [recommendItem, setRecommendItem] = useState<Item | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: c }, { data: i }] = await Promise.all([
      supabase.from("service_checklists").select("*").eq("id", id).maybeSingle(),
      supabase.from("service_checklist_items").select("*").eq("checklist_id", id).order("sort_order"),
    ]);
    setChecklist(c as any);
    setItems((i as any) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [id]);

  const setSeverity = async (itemId: string, severity: string) => {
    const patch: any = { severity };
    // Auto-map to legacy status: good→done, urgent/needs_service→issue, monitor→pending
    if (severity === "good") { patch.status = "done"; patch.completed_at = new Date().toISOString(); }
    else if (severity === "urgent" || severity === "needs_service") { patch.status = "issue"; }
    else { patch.status = "pending"; patch.completed_at = null; }
    const { error } = await supabase.from("service_checklist_items").update(patch).eq("id", itemId);
    if (error) return toast.error(error.message);
    load();
    if (checklist?.status === "open") {
      await supabase.from("service_checklists").update({ status: "in_progress", started_at: new Date().toISOString() }).eq("id", id);
    }
  };

  const setNotes = async (itemId: string, notes: string) => {
    await supabase.from("service_checklist_items").update({ notes }).eq("id", itemId);
  };

  const markNA = async (itemId: string) => {
    const { error } = await supabase.from("service_checklist_items").update({ status: "na", severity: null }).eq("id", itemId);
    if (error) return toast.error(error.message);
    load();
  };

  const complete = async () => {
    const { error } = await supabase.from("service_checklists").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Checklist completed");
    navigate("/tech/checklists");
  };

  return (
    <TechLayout>
      <Button variant="ghost" size="sm" onClick={() => navigate("/tech/checklists")} className="mb-3"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
      {loading || !checklist ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">{checklist.title}</h2>
            <Badge variant={checklist.status === "completed" ? "secondary" : "default"}>{checklist.status}</Badge>
          </div>
          {items.map(it => {
            const canRecommend = it.severity === "monitor" || it.severity === "needs_service" || it.severity === "urgent";
            return (
              <Card key={it.id}>
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-medium text-sm">{it.label}{it.required && <Badge variant="outline" className="ml-2 text-[10px]">required</Badge>}</div>
                    {it.recommended && <Badge className="bg-yellow-500 text-black"><DollarSign className="h-3 w-3 mr-0.5" />Recommended</Badge>}
                  </div>
                  {it.description && <p className="text-xs text-muted-foreground">{it.description}</p>}
                  <div className="grid grid-cols-4 gap-1">
                    {SEVERITIES.map(s => (
                      <Button key={s.key} size="sm" className={`h-9 text-xs ${it.severity === s.key ? s.cls : "bg-muted text-foreground hover:bg-muted/70"}`} onClick={() => setSeverity(it.id, s.key)}>
                        {s.label}
                      </Button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={() => markNA(it.id)} className="text-xs"><X className="h-3 w-3 mr-1" />N/A</Button>
                    {canRecommend && (
                      <Button size="sm" variant="default" className="ml-auto bg-yellow-500 text-black hover:bg-yellow-600" onClick={() => setRecommendItem(it)} disabled={it.recommended}>
                        <Sparkles className="h-3 w-3 mr-1" />{it.recommended ? "Added to estimate" : "Recommend"}
                      </Button>
                    )}
                  </div>
                  <Input placeholder="Notes" defaultValue={it.notes ?? ""} onBlur={(e) => e.target.value !== (it.notes ?? "") && setNotes(it.id, e.target.value)} className="h-8 text-xs" />
                </CardContent>
              </Card>
            );
          })}
          <Button onClick={complete} className="w-full" disabled={checklist.status === "completed"}>Mark checklist complete</Button>
        </div>
      )}
      {recommendItem && <RecommendDialog item={recommendItem} onClose={(ok) => { setRecommendItem(null); if (ok) load(); }} />}
    </TechLayout>
  );
};

const RecommendDialog = ({ item, onClose }: { item: Item; onClose: (ok: boolean) => void }) => {
  const [hours, setHours] = useState("1");
  const [price, setPrice] = useState("0");
  const [priceLow, setPriceLow] = useState("");
  const [priceHigh, setPriceHigh] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    const { error } = await supabase.rpc("recommend_checklist_item", {
      _item_id: item.id,
      _labor_hours: Number(hours) || 0,
      _unit_price: Number(price) || 0,
      _note: note || null,
    });
    if (!error) {
      await supabase.from("service_checklist_items").update({
        price_low: priceLow === "" ? null : Number(priceLow),
        price_high: priceHigh === "" ? null : Number(priceHigh),
      }).eq("id", item.id);
    }
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Added to draft estimate");
    onClose(true);
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose(false)}>
      <DialogContent>
        <DialogHeader><DialogTitle>Recommend: {item.label}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Labor hours</Label><Input type="number" step="0.25" value={hours} onChange={e => setHours(e.target.value)} /></div>
            <div><Label>Price ($)</Label><Input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} /></div>
          </div>
          <div>
            <Label>Local shop price range shown to customer ($)</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input type="number" step="1" placeholder="low" value={priceLow} onChange={e => setPriceLow(e.target.value)} />
              <span className="text-xs text-muted-foreground">to</span>
              <Input type="number" step="1" placeholder="high" value={priceHigh} onChange={e => setPriceHigh(e.target.value)} />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Typical range at nearby shops. Shown to customer with a "not a quote" disclaimer.</p>
          </div>
          <div><Label>Note (optional)</Label><Input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. left CV boot torn" /></div>
          <p className="text-xs text-muted-foreground">Adds a line to a draft estimate for this customer/vehicle. Admin will review and send.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onClose(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add to estimate"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TechChecklists;
