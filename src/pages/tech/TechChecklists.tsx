import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import TechLayout from "@/components/tech/TechLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, ClipboardList, Check, X, AlertTriangle, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Checklist = {
  id: string;
  title: string;
  status: string;
  notes: string | null;
  completed_at: string | null;
  created_at: string;
};

type Item = {
  id: string;
  label: string;
  description: string | null;
  status: string;
  notes: string | null;
  required: boolean;
  sort_order: number;
};

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

  const setStatus = async (itemId: string, status: string) => {
    const completed = status === "done" ? { completed_at: new Date().toISOString() } : { completed_at: null };
    const { error } = await supabase.from("service_checklist_items").update({ status, ...completed }).eq("id", itemId);
    if (error) return toast.error(error.message);
    load();
    // auto-progress to in_progress
    if (checklist?.status === "open") {
      await supabase.from("service_checklists").update({ status: "in_progress", started_at: new Date().toISOString() }).eq("id", id);
    }
  };

  const setNotes = async (itemId: string, notes: string) => {
    await supabase.from("service_checklist_items").update({ notes }).eq("id", itemId);
  };

  const complete = async () => {
    const { error } = await supabase.from("service_checklists").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Checklist completed");
    navigate("/tech/checklists");
  };

  const btn = (s: string, icon: any, label: string, color: string, current: string, onClick: () => void) => {
    const Icon = icon;
    const isActive = current === s;
    return (
      <Button variant={isActive ? "default" : "outline"} size="sm" className={`flex-1 ${isActive ? color : ""}`} onClick={onClick}>
        <Icon className="h-4 w-4 mr-1" /> {label}
      </Button>
    );
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
          {items.map(it => (
            <Card key={it.id}>
              <CardContent className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-medium text-sm">{it.label}{it.required && <Badge variant="outline" className="ml-2 text-[10px]">required</Badge>}</div>
                </div>
                {it.description && <p className="text-xs text-muted-foreground">{it.description}</p>}
                <div className="flex gap-2">
                  {btn("done", Check, "Done", "bg-green-600 hover:bg-green-700", it.status, () => setStatus(it.id, "done"))}
                  {btn("na", X, "N/A", "bg-muted", it.status, () => setStatus(it.id, "na"))}
                  {btn("issue", AlertTriangle, "Issue", "bg-destructive", it.status, () => setStatus(it.id, "issue"))}
                </div>
                <Input placeholder="Notes" defaultValue={it.notes ?? ""} onBlur={(e) => e.target.value !== (it.notes ?? "") && setNotes(it.id, e.target.value)} className="h-8 text-xs" />
              </CardContent>
            </Card>
          ))}
          <Button onClick={complete} className="w-full" disabled={checklist.status === "completed"}>Mark checklist complete</Button>
        </div>
      )}
    </TechLayout>
  );
};

export default TechChecklists;
