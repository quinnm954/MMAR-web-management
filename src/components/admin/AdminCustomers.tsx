import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Search, Mail, Car, CreditCard, Calendar, FileText, Receipt } from "lucide-react";

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
  const [selected, setSelected] = useState<Customer | null>(null);
  const [details, setDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

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

  const openCustomer = async (c: Customer) => {
    setSelected(c);
    setDetails(null);
    setDetailsLoading(true);
    const [vehicles, memberships, appts, estimates, invoices] = await Promise.all([
      supabase.from("vehicles").select("*").eq("owner_id", c.id).eq("is_active", true).order("created_at", { ascending: false }),
      supabase.from("memberships").select("*, membership_plans(name)").eq("customer_id", c.id).order("created_at", { ascending: false }),
      supabase.from("appointments").select("*").eq("customer_id", c.id).order("created_at", { ascending: false }).limit(10),
      supabase.from("estimates").select("id, estimate_number, status, total, created_at").eq("customer_id", c.id).order("created_at", { ascending: false }).limit(10),
      supabase.from("invoices").select("id, invoice_number, status, total, created_at").eq("customer_id", c.id).order("created_at", { ascending: false }).limit(10),
    ]);
    setDetails({
      vehicles: vehicles.data ?? [],
      memberships: memberships.data ?? [],
      appointments: appts.data ?? [],
      estimates: estimates.data ?? [],
      invoices: invoices.data ?? [],
    });
    setDetailsLoading(false);
  };

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
            <Card
              key={c.id}
              className="border-border/50 cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => openCustomer(c)}
            >
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

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selected?.full_name || "Customer"}</DialogTitle>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Mail className="h-3 w-3" /> {selected?.email}
            </p>
          </DialogHeader>

          {detailsLoading || !details ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <div className="space-y-5">
              <Section icon={Car} title={`Vehicles (${details.vehicles.length})`}>
                {details.vehicles.length === 0 ? <Empty /> : details.vehicles.map((v: any) => (
                  <Row key={v.id} primary={`${v.year} ${v.make} ${v.model}${v.trim ? ' ' + v.trim : ''}`}
                       secondary={[v.license_plate, v.vin, v.current_mileage ? `${v.current_mileage.toLocaleString()} mi` : null].filter(Boolean).join(' • ')} />
                ))}
              </Section>

              <Section icon={CreditCard} title={`Memberships (${details.memberships.length})`}>
                {details.memberships.length === 0 ? <Empty /> : details.memberships.map((m: any) => (
                  <Row key={m.id}
                       primary={m.membership_plans?.name || 'Membership'}
                       secondary={`${m.status} • Started ${m.start_date || '—'}`}
                       badge={m.status} />
                ))}
              </Section>

              <Section icon={Calendar} title={`Recent Appointments (${details.appointments.length})`}>
                {details.appointments.length === 0 ? <Empty /> : details.appointments.map((a: any) => (
                  <Row key={a.id} primary={a.service_type}
                       secondary={`${a.requested_date || a.scheduled_at?.slice(0, 10) || '—'} • ${a.status}`}
                       badge={a.status} />
                ))}
              </Section>

              <Section icon={FileText} title={`Estimates (${details.estimates.length})`}>
                {details.estimates.length === 0 ? <Empty /> : details.estimates.map((e: any) => (
                  <Row key={e.id} primary={`#${e.estimate_number || e.id.slice(0, 8)}`}
                       secondary={`$${Number(e.total).toFixed(2)} • ${new Date(e.created_at).toLocaleDateString()}`}
                       badge={e.status} />
                ))}
              </Section>

              <Section icon={Receipt} title={`Invoices (${details.invoices.length})`}>
                {details.invoices.length === 0 ? <Empty /> : details.invoices.map((i: any) => (
                  <Row key={i.id} primary={i.invoice_number || i.id.slice(0, 8)}
                       secondary={`$${Number(i.total).toFixed(2)} • ${new Date(i.created_at).toLocaleDateString()}`}
                       badge={i.status} />
                ))}
              </Section>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Section = ({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) => (
  <div>
    <div className="flex items-center gap-2 mb-2 text-sm font-semibold">
      <Icon className="h-4 w-4 text-primary" /> {title}
    </div>
    <div className="space-y-1.5">{children}</div>
  </div>
);

const Row = ({ primary, secondary, badge }: { primary: string; secondary?: string; badge?: string }) => (
  <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-md bg-muted/30 text-sm">
    <div className="min-w-0">
      <div className="font-medium truncate">{primary}</div>
      {secondary && <div className="text-xs text-muted-foreground truncate">{secondary}</div>}
    </div>
    {badge && <Badge variant="outline" className="text-[10px] uppercase shrink-0">{badge}</Badge>}
  </div>
);

const Empty = () => <div className="text-xs text-muted-foreground px-3 py-2">None</div>;

export default AdminCustomers;
