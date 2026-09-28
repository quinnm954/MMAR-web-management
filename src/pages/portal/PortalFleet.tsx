import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PortalLayout from "@/components/portal/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Car, CreditCard, Calendar, Receipt, Plus, Search, Truck, MessageCircle } from "lucide-react";

type Vehicle = { id: string; year: number | null; make: string | null; model: string | null; license_plate: string | null; vin: string | null; current_mileage: number | null };
type Membership = { id: string; vehicle_id: string | null; status: string; next_billing_date: string | null; current_period_end: string | null; membership_plans: { name: string } | null };
type Appt = { id: string; vehicle_id: string | null; service_type: string | null; scheduled_at: string | null; requested_date: string | null; status: string };
type Record_ = { vehicle_id: string; service_date: string; service_type: string | null };
type Invoice = { id: string; invoice_number: string | null; total: number | null; amount_paid: number | null; status: string; due_date: string | null };
type Fleet = { company_name: string; fleet_size: number; status: string };

const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—");
const money = (n: number) => n.toLocaleString(undefined, { style: "currency", currency: "USD" });

export default function PortalFleet() {
  const { user } = useAuth();
  const [fleet, setFleet] = useState<Fleet | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [members, setMembers] = useState<Membership[]>([]);
  const [appts, setAppts] = useState<Appt[]>([]);
  const [records, setRecords] = useState<Record_[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [f, v, m, a, r, i] = await Promise.all([
        supabase.from("fleet_accounts").select("company_name,fleet_size,status").eq("user_id", user.id).maybeSingle(),
        supabase.from("vehicles").select("id,year,make,model,license_plate,vin,current_mileage").eq("owner_id", user.id).eq("is_active", true).order("created_at"),
        supabase.from("memberships").select("id,vehicle_id,status,next_billing_date,current_period_end,membership_plans(name)").eq("customer_id", user.id),
        supabase.from("appointments").select("id,vehicle_id,service_type,scheduled_at,requested_date,status").eq("customer_id", user.id).in("status", ["requested", "scheduled"]),
        supabase.from("service_records").select("vehicle_id,service_date,service_type").eq("customer_id", user.id).order("service_date", { ascending: false }).limit(500),
        supabase.from("invoices").select("id,invoice_number,total,amount_paid,status,due_date").eq("customer_id", user.id).neq("status", "paid").neq("status", "void"),
      ]);
      setFleet(f.data as Fleet | null);
      setVehicles((v.data as Vehicle[]) || []);
      setMembers((m.data as unknown as Membership[]) || []);
      setAppts((a.data as Appt[]) || []);
      setRecords((r.data as Record_[]) || []);
      setInvoices((i.data as Invoice[]) || []);
      setLoading(false);
    })();
  }, [user]);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return vehicles
      .map((v) => {
        const plan = members.find((m) => m.vehicle_id === v.id && m.status === "active") || members.find((m) => m.vehicle_id === v.id);
        const next = appts.filter((a) => a.vehicle_id === v.id).sort((x, y) => String(x.scheduled_at || x.requested_date).localeCompare(String(y.scheduled_at || y.requested_date)))[0];
        const last = records.find((r) => r.vehicle_id === v.id);
        return { v, plan, next, last };
      })
      .filter(({ v }) => !term || [v.year, v.make, v.model, v.license_plate, v.vin].join(" ").toLowerCase().includes(term));
  }, [vehicles, members, appts, records, q]);

  const activePlans = members.filter((m) => m.status === "active");
  const balance = invoices.reduce((s, i) => s + Math.max(0, Number(i.total || 0) - Number(i.amount_paid || 0)), 0);

  return (
    <PortalLayout>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><Truck className="h-7 w-7 text-primary" />{fleet?.company_name || "My Fleet"}</h1>
          <p className="text-muted-foreground mt-1">Every vehicle, plan, and upcoming service in one place.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="secondary"><Link to="/portal/vehicles"><Plus className="h-4 w-4 mr-1" />Add vehicle</Link></Button>
          <Button asChild><Link to="/portal/appointments"><Calendar className="h-4 w-4 mr-1" />Book service</Link></Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Tile icon={Car} label="Vehicles" value={String(vehicles.length)} to="/portal/vehicles" />
        <Tile icon={CreditCard} label="On a plan" value={`${activePlans.length} of ${vehicles.length}`} to="/portal/membership" />
        <Tile icon={Calendar} label="Upcoming service" value={String(appts.length)} to="/portal/appointments" />
        <Tile icon={Receipt} label="Balance due" value={money(balance)} to="/portal/invoices" highlight={balance > 0} />
      </div>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle>Vehicles</CardTitle>
          <div className="relative w-full max-w-xs">
            <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input className="pl-8" placeholder="Search plate, VIN, model" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-6 text-sm text-muted-foreground">Loading…</p>
          ) : vehicles.length === 0 ? (
            <div className="p-6 text-center space-y-3">
              <p className="text-muted-foreground">No vehicles yet. Add your first vehicle, or text us a list and we'll add them for you.</p>
              <div className="flex justify-center gap-2">
                <Button asChild size="sm"><Link to="/portal/vehicles">Add vehicle</Link></Button>
                <Button asChild size="sm" variant="secondary"><a href="sms:813-501-7572"><MessageCircle className="h-4 w-4 mr-1" />Text us</a></Button>
              </div>
            </div>
          ) : (
            <div className="divide-y">
              {rows.map(({ v, plan, next, last }) => (
                <div key={v.id} className="p-4 grid gap-2 sm:grid-cols-[1.6fr_1fr_1fr_1fr] sm:items-center">
                  <div>
                    <div className="font-semibold">{[v.year, v.make, v.model].filter(Boolean).join(" ") || "Vehicle"}</div>
                    <div className="text-xs text-muted-foreground">{v.license_plate ? `Plate ${v.license_plate}` : "No plate"}{v.current_mileage ? ` · ${v.current_mileage.toLocaleString()} mi` : ""}</div>
                  </div>
                  <Cell label="Plan">
                    {plan ? (
                      <span className="flex items-center gap-1.5 flex-wrap">
                        {plan.membership_plans?.name || "Plan"}
                        <Badge variant={plan.status === "active" ? "default" : "secondary"} className="capitalize">{plan.status}</Badge>
                      </span>
                    ) : <span className="text-muted-foreground">None</span>}
                    {plan?.status === "active" && plan.next_billing_date && <div className="text-xs text-muted-foreground">Renews {fmtDate(plan.next_billing_date)}</div>}
                  </Cell>
                  <Cell label="Next service">
                    {next ? <>{next.service_type || "Service"}<div className="text-xs text-muted-foreground">{fmtDate(next.scheduled_at || next.requested_date)}{next.status === "requested" ? " (requested)" : ""}</div></> : <span className="text-muted-foreground">Not scheduled</span>}
                  </Cell>
                  <Cell label="Last service">
                    {last ? <>{last.service_type || "Service"}<div className="text-xs text-muted-foreground">{fmtDate(last.service_date)}</div></> : <span className="text-muted-foreground">—</span>}
                  </Cell>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {invoices.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Open invoices</CardTitle></CardHeader>
          <CardContent className="divide-y p-0">
            {invoices.map((i) => (
              <Link key={i.id} to={`/portal/invoices/${i.id}`} className="flex items-center justify-between p-4 hover:bg-muted/40">
                <div>
                  <div className="font-medium">Invoice {i.invoice_number || ""}</div>
                  <div className="text-xs text-muted-foreground">Due {fmtDate(i.due_date)}</div>
                </div>
                <div className="font-semibold">{money(Math.max(0, Number(i.total || 0) - Number(i.amount_paid || 0)))}</div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </PortalLayout>
  );
}

const Tile = ({ icon: Icon, label, value, to, highlight }: { icon: typeof Car; label: string; value: string; to: string; highlight?: boolean }) => (
  <Link to={to}>
    <Card className={`h-full hover:border-primary/40 transition-colors ${highlight ? "border-accent/60" : ""}`}>
      <CardContent className="p-4">
        <Icon className="h-5 w-5 text-primary mb-2" />
        <div className="text-xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  </Link>
);

const Cell = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="text-sm">
    <div className="text-[11px] uppercase tracking-wide text-muted-foreground sm:hidden">{label}</div>
    {children}
  </div>
);
