import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { isSatisfiedFeedback, needsFeedbackAttention } from "@/lib/satisfactionFeedback";

type Row = {
  id: string; rating: number | null; satisfied: boolean | null; source: "legacy" | "satisfaction"; comments: string | null; name: string | null; phone: string | null;
  email: string | null; customer_id: string | null; status: string; admin_notes: string | null; created_at: string;
};

export default function AdminReviewFeedback() {
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState<"open" | "all" | "happy">("open");
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = async () => {
    const [legacy, satisfaction] = await Promise.all([
      supabase.from("review_feedback").select("*").order("created_at", { ascending: false }).limit(300),
      supabase.from("customer_satisfaction_feedback").select("*").order("created_at", { ascending: false }).limit(300),
    ]);
    if (legacy.error || satisfaction.error) { toast.error("Couldn't load feedback."); return; }
    setRows([
      ...(legacy.data ?? []).map((r) => ({ ...r, satisfied: null, source: "legacy" as const })),
      ...(satisfaction.data ?? []).map((r) => ({ ...r, rating: null, source: "satisfaction" as const })),
    ].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)));
  };
  useEffect(() => { load(); }, []);

  const update = async (row: Row, patch: { status?: string; admin_notes?: string | null }) => {
    const table = row.source === "legacy" ? "review_feedback" : "customer_satisfaction_feedback";
    const { error } = await supabase.from(table).update(patch).eq("id", row.id);
    if (error) toast.error(error.message); else { toast.success("Saved"); load(); }
  };

  const list = rows.filter((r) =>
    filter === "happy" ? isSatisfiedFeedback(r) : filter === "open" ? needsFeedbackAttention(r) : true);
  const answers = rows.filter((r) => r.satisfied !== null);
  const yes = answers.filter((r) => r.satisfied === true).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Feedback</CardTitle>
        <p className="text-sm text-muted-foreground">{answers.length} satisfaction answers · {yes} Yes · {answers.length - yes} No · {rows.length - answers.length} past ratings</p>
        <div className="flex gap-2 pt-2">
          {(["open", "all", "happy"] as const).map((f) => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
              {f === "open" ? "Needs attention" : f === "all" ? "All" : "Satisfied"}
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
                {r.satisfied !== null ? <span className="text-sm font-medium">Happy with service: {r.satisfied ? "Yes" : "No"}</span> : (
                  <div className="flex items-center gap-1"><span className="text-xs text-muted-foreground mr-2">Past rating</span>{[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} className={`w-4 h-4 ${n <= (r.rating ?? 0) ? "text-gold fill-current" : "text-muted-foreground"}`} />
                  ))}</div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={r.status === "resolved" ? "secondary" : "default"}>{r.status}</Badge>
                <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
              </div>
            </div>
            {r.comments && <p className="text-sm whitespace-pre-wrap">{r.comments}</p>}
            {(r.name || r.phone || r.email) ? (
              <p className="text-sm">
                <span className="font-medium">{r.name || "Unnamed customer"}</span>{r.phone && <> · <a className="underline" href={`tel:${r.phone}`}>{r.phone}</a></>}
                {r.email && <> · <a className="underline" href={`mailto:${r.email}`}>{r.email}</a></>}
              </p>
            ) : <p className="text-xs text-muted-foreground">Anonymous (left before review links identified customers)</p>}
            {(r.satisfied === false || (r.satisfied === null && (r.rating ?? 5) < 5)) && (
              <>
                <Textarea rows={2} placeholder="Notes" value={notes[r.id] ?? r.admin_notes ?? ""}
                  onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })} />
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => update(r, { admin_notes: notes[r.id] ?? r.admin_notes })}>Save notes</Button>
                  <Button size="sm" variant="outline" onClick={() => update(r, { status: "contacted" })}>Mark contacted</Button>
                  <Button size="sm" onClick={() => update(r, { status: "resolved" })}>Resolve</Button>
                </div>
              </>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
