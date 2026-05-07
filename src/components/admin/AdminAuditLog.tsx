import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, History } from "lucide-react";

const TABLES = ["all","invoices","estimates","appointments","service_records","memberships","user_roles"];

export default function AdminAuditLog() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [table, setTable] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      let q = supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(300);
      if (table !== "all") q = q.eq("table_name", table);
      const { data } = await q;
      setRows(data ?? []);
      setLoading(false);
    })();
  }, [table]);

  const filtered = rows.filter(r => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (r.actor_email || "").toLowerCase().includes(s)
      || (r.table_name || "").toLowerCase().includes(s)
      || (r.record_id || "").toLowerCase().includes(s)
      || (r.changed_fields || []).join(",").toLowerCase().includes(s);
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2"><History className="h-5 w-5" /> Audit Log</CardTitle>
          <div className="flex gap-2">
            <Select value={table} onValueChange={setTable}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>{TABLES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
            <Input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} className="w-[200px]" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-muted-foreground py-8 text-sm">No audit entries.</div>
        ) : (
          <div className="space-y-1 max-h-[600px] overflow-auto">
            {filtered.map(r => (
              <details key={r.id} className="border border-border/50 rounded p-2 text-xs">
                <summary className="cursor-pointer flex items-center gap-2 flex-wrap">
                  <Badge variant={r.action === "DELETE" ? "destructive" : r.action === "INSERT" ? "default" : "secondary"}>{r.action}</Badge>
                  <span className="font-mono">{r.table_name}</span>
                  <span className="text-muted-foreground">{(r.record_id || "").slice(0, 8)}</span>
                  <span className="text-muted-foreground">by {r.actor_email || r.actor_id?.slice(0,8) || "system"}</span>
                  <span className="ml-auto text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
                </summary>
                {r.changed_fields?.length > 0 && (
                  <div className="mt-2 text-muted-foreground">Changed: <span className="font-mono">{r.changed_fields.join(", ")}</span></div>
                )}
                {(r.before_data || r.after_data) && (
                  <pre className="mt-2 bg-muted p-2 rounded overflow-x-auto text-[10px]">{JSON.stringify({ before: r.before_data, after: r.after_data }, null, 2)}</pre>
                )}
              </details>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
