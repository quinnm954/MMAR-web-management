import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Mail } from "lucide-react";

interface Customer {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
  vehicle_count: number;
  membership_count: number;
}

const AdminCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, full_name, created_at")
        .order("created_at", { ascending: false });

      const ids = (profiles ?? []).map((p) => p.id);
      const [v, m] = await Promise.all([
        supabase.from("vehicles").select("owner_id").in("owner_id", ids).eq("is_active", true),
        supabase.from("memberships").select("customer_id, status").in("customer_id", ids),
      ]);
      const vCount: Record<string, number> = {};
      const mCount: Record<string, number> = {};
      (v.data ?? []).forEach((r: { owner_id: string }) => { vCount[r.owner_id] = (vCount[r.owner_id] ?? 0) + 1; });
      (m.data ?? []).forEach((r: { customer_id: string; status: string }) => {
        if (r.status === "active" || r.status === "pending") mCount[r.customer_id] = (mCount[r.customer_id] ?? 0) + 1;
      });

      setCustomers((profiles ?? []).map((p) => ({
        ...p,
        vehicle_count: vCount[p.id] ?? 0,
        membership_count: mCount[p.id] ?? 0,
      })));
      setLoading(false);
    })();
  }, []);

  const filtered = customers.filter((c) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return (c.email ?? "").toLowerCase().includes(s) || (c.full_name ?? "").toLowerCase().includes(s);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by name or email…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} of {customers.length}</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((c) => (
            <Card key={c.id} className="border-border/50">
              <CardContent className="p-4">
                <div className="font-semibold truncate">{c.full_name || "—"}</div>
                <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                  <Mail className="h-3 w-3" /> {c.email}
                </div>
                <div className="flex gap-2 mt-3">
                  <Badge variant="secondary">{c.vehicle_count} vehicle{c.vehicle_count === 1 ? "" : "s"}</Badge>
                  <Badge variant="secondary">{c.membership_count} membership{c.membership_count === 1 ? "" : "s"}</Badge>
                </div>
                <div className="text-[10px] text-muted-foreground mt-2">
                  Joined {new Date(c.created_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminCustomers;
