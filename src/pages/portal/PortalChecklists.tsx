import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PortalLayout from "@/components/portal/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ClipboardList, Check, X, AlertTriangle, Circle, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type Checklist = {
  id: string; title: string; status: string; created_at: string; completed_at: string | null;
};
type Item = {
  id: string; label: string; description: string | null; status: string; notes: string | null; sort_order: number;
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
        .select("id, title, status, created_at, completed_at")
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

const Detail = ({ id }: { id: string }) => {
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: c }, { data: i }] = await Promise.all([
        supabase.from("service_checklists").select("*").eq("id", id).maybeSingle(),
        supabase.from("service_checklist_items").select("*").eq("checklist_id", id).order("sort_order"),
      ]);
      setChecklist(c as any);
      setItems((i as any) ?? []);
      setLoading(false);
    })();
  }, [id]);

  return (
    <PortalLayout>
      <Link to="/portal/checklists"><Button variant="ghost" size="sm" className="mb-3"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button></Link>
      {loading || !checklist ? <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div> : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">{checklist.title}</h2>
            <Badge variant={checklist.status === "completed" ? "secondary" : "default"}>{checklist.status}</Badge>
          </div>
          {items.map(it => (
            <Card key={it.id}>
              <CardContent className="p-3 flex items-start gap-3">
                <div className="mt-0.5">{statusIcon(it.status)}</div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{it.label}</div>
                  {it.description && <p className="text-xs text-muted-foreground">{it.description}</p>}
                  {it.notes && <p className="text-xs mt-1 italic">{it.notes}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PortalLayout>
  );
};

export default PortalChecklists;
