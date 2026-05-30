import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import TechLayout from "@/components/tech/TechLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Users, Car, Wrench, Phone } from "lucide-react";

type Customer = { id: string; full_name: string | null; email: string | null; phone: string | null };
type Vehicle = { id: string; owner_id: string; year: number | null; make: string | null; model: string | null; license_plate: string | null; vin: string | null };
type ServiceRec = { id: string; vehicle_id: string; service_date: string; service_type: string; labor_performed: string | null };

const TechCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [records, setRecords] = useState<Record<string, ServiceRec[]>>({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [cRes, vRes] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email, phone").order("full_name", { ascending: true }).limit(500),
        supabase.from("vehicles").select("id, owner_id, year, make, model, license_plate, vin").limit(2000),
      ]);
      setCustomers((cRes.data as Customer[]) ?? []);
      setVehicles((vRes.data as Vehicle[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return customers;
    return customers.filter((c) => {
      if ((c.full_name ?? "").toLowerCase().includes(needle)) return true;
      if ((c.email ?? "").toLowerCase().includes(needle)) return true;
      if ((c.phone ?? "").toLowerCase().includes(needle)) return true;
      const cars = vehicles.filter((v) => v.owner_id === c.id);
      return cars.some(
        (v) =>
          `${v.year ?? ""} ${v.make ?? ""} ${v.model ?? ""}`.toLowerCase().includes(needle) ||
          (v.license_plate ?? "").toLowerCase().includes(needle) ||
          (v.vin ?? "").toLowerCase().includes(needle),
      );
    });
  }, [q, customers, vehicles]);

  const toggle = async (id: string) => {
    const next = openId === id ? null : id;
    setOpenId(next);
    if (next && !records[next]) {
      const cars = vehicles.filter((v) => v.owner_id === next).map((v) => v.id);
      if (!cars.length) {
        setRecords((r) => ({ ...r, [next]: [] }));
        return;
      }
      const { data } = await supabase
        .from("service_records")
        .select("id, vehicle_id, service_date, service_type, labor_performed")
        .in("vehicle_id", cars)
        .order("service_date", { ascending: false })
        .limit(20);
      setRecords((r) => ({ ...r, [next]: (data as ServiceRec[]) ?? [] }));
    }
  };

  return (
    <TechLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Customers</h1>
          <p className="text-xs text-muted-foreground">Read-only lookup. Tap a customer to see vehicles and recent service.</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, phone, plate, VIN…" className="pl-9" />
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">No matches.</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {filtered.slice(0, 100).map((c) => {
              const cars = vehicles.filter((v) => v.owner_id === c.id);
              const open = openId === c.id;
              return (
                <Card key={c.id}>
                  <CardContent className="p-0">
                    <button onClick={() => toggle(c.id)} className="w-full text-left p-3 flex items-center justify-between gap-2 hover:bg-muted/40 transition">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{c.full_name || c.email || "Unnamed"}</div>
                        <div className="text-xs text-muted-foreground truncate flex items-center gap-2">
                          {c.phone && (<><Phone className="h-3 w-3" />{c.phone}</>)}
                          {c.email && <span className="truncate">{c.email}</span>}
                        </div>
                      </div>
                      <Badge variant="outline" className="shrink-0">{cars.length} {cars.length === 1 ? "vehicle" : "vehicles"}</Badge>
                    </button>
                    {open && (
                      <div className="px-3 pb-3 pt-1 border-t border-border space-y-3">
                        {cars.length === 0 ? (
                          <p className="text-xs text-muted-foreground py-2">No vehicles on file.</p>
                        ) : cars.map((v) => (
                          <div key={v.id} className="space-y-1">
                            <div className="text-sm font-medium flex items-center gap-1">
                              <Car className="h-3.5 w-3.5 text-primary" />
                              {v.year} {v.make} {v.model}
                              {v.license_plate && <span className="text-xs text-muted-foreground ml-1">· {v.license_plate}</span>}
                            </div>
                            {v.vin && <div className="text-[11px] text-muted-foreground font-mono">VIN {v.vin}</div>}
                          </div>
                        ))}
                        <div className="pt-2 border-t border-border">
                          <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1"><Wrench className="h-3 w-3" /> Recent service</div>
                          {!records[c.id] ? (
                            <div className="py-2"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
                          ) : records[c.id].length === 0 ? (
                            <p className="text-xs text-muted-foreground">No service records yet.</p>
                          ) : (
                            <ul className="space-y-1">
                              {records[c.id].map((r) => (
                                <li key={r.id} className="text-xs flex justify-between gap-2">
                                  <span className="truncate">{r.service_type}</span>
                                  <span className="text-muted-foreground shrink-0">{new Date(r.service_date).toLocaleDateString()}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </TechLayout>
  );
};

export default TechCustomers;
