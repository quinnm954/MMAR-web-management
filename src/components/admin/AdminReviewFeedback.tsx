import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { toast } from "sonner";

type Row = {
  id: string; rating: number; comments: string | null; name: string | null; phone: string | null;
  email: string | null; status: string; admin_notes: string | null; created_at: string;
};

export default function AdminReviewFeedback() {
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState<"open" | "all" | "five">("open");
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = async () => {
    const { data, error } = await supabase.from("review_feedback").select("*").order("created_at", { ascending: false }).limit(300);
    if (error) toast.error(error.message); else setRows(data as Row[]);
  };
  useEffect(() => { load(); }, []);

  const update = async (id: string, patch: Partial<Row>) => {
    const { error } = await supabase.from("review_feedback").update(patch).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Saved"); load(); }
  };

  const list = rows.filter((r) =>
    filter === "five" ? r.rating === 5 : filter === "open" ? r.rating < 5 && r.status !== "resolved" : true);
  const fives = rows.filter((r) => r.rating === 5).length;
  const avg = rows.length ? (rows.reduce((s, r) => s + r.rating, 0) / rows.length).toFixed(1) : "—";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Feedback</CardTitle>
        <p className="text-sm text-muted-foreground">{rows.length} ratings · avg {avg} · {fives} sent to Google</p>
        <div className="flex gap-2 pt-2">
          {(["open", "all", "five"] as const).map((f) => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
              {f === "open" ? "Needs attention" : f === "all" ? "All" : "5-star"}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 max-h-[70vh] overflow-y-auto">
        {list.length === 0 && <p className="text-sm text-muted-foreground">Nothing here.</p>}
        {list.map((r) => (
          <div key={r.id} className="rounded-lg border border-border p-4 space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className={`w-4 h-4 ${n <= r.rating ? "text-gold fill-current" : "text-muted-foreground"}`} />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={r.status === "resolved" ? "secondary" : "default"}>{r.status}</Badge>
                <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
              </div>
            </div>
            {r.comments && <p className="text-sm whitespace-pre-wrap">{r.comments}</p>}
            {(r.name || r.phone || r.email) && (
              <p className="text-xs text-muted-foreground">
                {r.name}{r.phone && <> · <a className="underline" href={`tel:${r.phone}`}>{r.phone}</a></>}
                {r.email && <> · <a className="underline" href={`mailto:${r.email}`}>{r.email}</a></>}
              </p>
            )}
            {r.rating < 5 && (
              <>
                <Textarea rows={2} placeholder="Notes" value={notes[r.id] ?? r.admin_notes ?? ""}
                  onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })} />
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => update(r.id, { admin_notes: notes[r.id] ?? r.admin_notes })}>Save notes</Button>
                  <Button size="sm" variant="outline" onClick={() => update(r.id, { status: "contacted" })}>Mark contacted</Button>
                  <Button size="sm" onClick={() => update(r.id, { status: "resolved" })}>Resolve</Button>
                </div>
              </>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
