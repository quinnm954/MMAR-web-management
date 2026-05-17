import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import VehicleMasterChecklist from "@/components/VehicleMasterChecklist";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface VehicleRow {
  id: string; year: number | null; make: string | null; model: string | null;
  license_plate: string | null; owner_id: string;
  owner?: { full_name: string | null; email: string | null } | null;
}

const vlabel = (v: VehicleRow) =>
  `${[v.year, v.make, v.model].filter(Boolean).join(" ") || "Vehicle"}${v.license_plate ? ` (${v.license_plate})` : ""}`;

const AdminVehicleHealth = () => {
  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
  const [vehicleId, setVehicleId] = useState<string>("");
  const [filter, setFilter] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("vehicles")
        .select("id, year, make, model, license_plate, owner_id, owner:profiles!vehicles_owner_id_fkey(full_name, email)")
        .order("created_at", { ascending: false })
        .limit(500);
      setVehicles((data ?? []) as any);
    })();
  }, []);

  const filtered = vehicles.filter(v => {
    const q = filter.trim().toLowerCase();
    if (!q) return true;
    return (
      vlabel(v).toLowerCase().includes(q) ||
      (v.owner?.full_name ?? "").toLowerCase().includes(q) ||
      (v.owner?.email ?? "").toLowerCase().includes(q)
    );
  });

  const current = vehicles.find(v => v.id === vehicleId);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Vehicle Health</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Master checklist per vehicle. Auto-synced from tech inspections. Edit anything; the customer sees the result in their portal.
          </p>
          <div className="grid gap-2 grid-cols-1 sm:grid-cols-[1fr_2fr]">
            <Input placeholder="Filter by vehicle, owner, plate…" value={filter} onChange={(e) => setFilter(e.target.value)} />
            <Select value={vehicleId} onValueChange={setVehicleId}>
              <SelectTrigger><SelectValue placeholder={`Choose vehicle (${filtered.length})`} /></SelectTrigger>
              <SelectContent>
                {filtered.map(v => (
                  <SelectItem key={v.id} value={v.id}>
                    {vlabel(v)} — {v.owner?.full_name || v.owner?.email || "Unknown"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {current && (
        <VehicleMasterChecklist vehicleId={current.id} mode="admin" customerId={current.owner_id} />
      )}
    </div>
  );
};

export default AdminVehicleHealth;
