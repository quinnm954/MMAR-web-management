import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PortalLayout from "@/components/portal/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ClipboardList, Check, X, AlertTriangle, Circle, ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Checklist = {
  id: string; title: string; status: string; created_at: string; completed_at: string | null; notes: string | null;
};
type Item = {
  id: string; label: string; description: string | null; status: string; notes: string | null; sort_order: number;
  severity: string | null; recommended: boolean;
};

const severityBadge = (s: string | null) => {
  if (!s) return null;
  const map: Record<string, string> = {
    good: "bg-green-600 text-white",
    monitor: "bg-yellow-500 text-black",
    needs_service: "bg-orange-500 text-white",
    urgent: "bg-destructive text-destructive-foreground",
  };
  const labels: Record<string, string> = { good: "Good", monitor: "Monitor", needs_service: "Needs service", urgent: "Urgent" };
  return <Badge className={map[s] ?? ""}>{labels[s] ?? s}</Badge>;
};

const statusIcon = (s: string) => {
  if (s === "done") return <Check className="h-4 w-4 text-green-500" />;
  if (s === "na") return <X className="h-4 w-4 text-muted-foreground" />;
  if (s === "issue") return <AlertTriangle className="h-4 w-4 text-destructive" />;
  return <Circle className="h-4 w-4 text-muted-foreground" />;
};

const PortalChecklists = () => {
  const { id } = useParams();
  if (id) return <Detail id={id} />;
  return <List />;
};

const List = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data } = await supabase.from("service_checklists")
        .select("id, title, status, created_at, completed_at, notes")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });
      setRows((data as any) ?? []);
      setLoading(false);
    })();
  }, [user]);

  return (
    <PortalLayout>
      <h2 className="text-xl font-bold mb-3 flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" /> Service Checklists</h2>
      {loading ? <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div> : rows.length === 0 ? (
        <Card><CardContent className="p-6 text-center text-muted-foreground">No service checklists yet.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {rows.map(r => (
            <Link to={`/portal/checklists/${r.id}`} key={r.id}>
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
    </PortalLayout>
  );
};

const STATUSES = ["pending", "done", "na", "issue"] as const;

const Detail = ({ id }: { id: string }) => {
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLabel, setNewLabel] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [{ data: c }, { data: i }] = await Promise.all([
      supabase.from("service_checklists").select("*").eq("id", id).maybeSingle(),
      supabase.from("service_checklist_items").select("*").eq("checklist_id", id).order("sort_order"),
    ]);
    setChecklist(c as any);
    setItems((i as any) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const cycleStatus = async (it: Item) => {
    const next = STATUSES[(STATUSES.indexOf(it.status as any) + 1) % STATUSES.length];
    setItems(prev => prev.map(x => x.id === it.id ? { ...x, status: next } : x));
    const { error } = await supabase.from("service_checklist_items").update({ status: next }).eq("id", it.id);
    if (error) { toast.error("Could not update"); load(); }
  };

  const updateNotes = async (itemId: string, notes: string) => {
    const { error } = await supabase.from("service_checklist_items").update({ notes }).eq("id", itemId);
    if (error) toast.error("Could not save note");
  };

  const addItem = async () => {
    if (!newLabel.trim()) return;
    setSaving(true);
    const { data, error } = await supabase.from("service_checklist_items").insert({
      checklist_id: id, label: newLabel.trim(), sort_order: items.length,
    }).select().single();
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    setItems([...items, data as any]);
    setNewLabel("");
  };

  const removeItem = async (itemId: string) => {
    const prev = items;
    setItems(items.filter(x => x.id !== itemId));
    const { error } = await supabase.from("service_checklist_items").delete().eq("id", itemId);
    if (error) { toast.error("Could not remove"); setItems(prev); }
  };

  return (
    <PortalLayout>
      <Link to="/portal/checklists"><Button variant="ghost" size="sm" className="mb-3"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button></Link>
      {loading || !checklist ? <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div> : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">{checklist.title}</h2>
            <Badge variant={checklist.status === "completed" ? "secondary" : "default"}>{checklist.status}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">Tap the status icon to cycle: pending → done → not applicable → issue.</p>
          {items.map(it => (
            <Card key={it.id}>
              <CardContent className="p-3 flex items-start gap-3">
                <button onClick={() => cycleStatus(it)} className="mt-0.5 p-1 rounded hover:bg-muted" aria-label="Change status">
                  {statusIcon(it.status)}
                </button>
                <div className="flex-1 space-y-2">
                  <div className="text-sm font-medium">{it.label}</div>
                  {it.description && <p className="text-xs text-muted-foreground">{it.description}</p>}
                  <Textarea
                    defaultValue={it.notes ?? ""}
                    placeholder="Add a note…"
                    className="text-xs min-h-[60px]"
                    onBlur={(e) => { if ((e.target.value || "") !== (it.notes ?? "")) updateNotes(it.id, e.target.value); }}
                  />
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeItem(it.id)} aria-label="Remove">
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </CardContent>
            </Card>
          ))}
          <Card>
            <CardContent className="p-3 flex gap-2">
              <Input placeholder="Add a checklist item…" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addItem()} />
              <Button onClick={addItem} disabled={saving || !newLabel.trim()}><Plus className="h-4 w-4 mr-1" /> Add</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </PortalLayout>
  );
};

export default PortalChecklists;
