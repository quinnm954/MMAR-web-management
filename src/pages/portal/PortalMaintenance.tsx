import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PortalLayout from "@/components/portal/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Wrench, Trash2, Save, Plus } from "lucide-react";
import { toast } from "sonner";
import { MAINTENANCE_INTERVALS, SELF_REPORTED_NOTE } from "@/data/maintenanceIntervals";

interface Vehicle {
  id: string;
  year: number | null;
  make: string | null;
  model: string | null;
  current_mileage: number | null;
}

interface ServiceRecord {
  id: string;
  vehicle_id: string;
  service_type: string;
  mileage_at_service: number | null;
  service_date: string;
  technician_notes: string | null;
}

const fmt = (n: number | null | undefined) => (n != null ? n.toLocaleString() : "—");

const PortalMaintenance = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState<string>("");
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({}); // service_name -> miles input
  const [savingName, setSavingName] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data: vData } = await supabase
      .from("vehicles")
      .select("id, year, make, model, current_mileage")
      .eq("owner_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    const list = (vData as Vehicle[]) ?? [];
    setVehicles(list);
    const targetId = vehicleId || list[0]?.id || "";
    setVehicleId(targetId);
    if (targetId) {
      const { data: rData } = await supabase
        .from("service_records")
        .select("id, vehicle_id, service_type, mileage_at_service, service_date, technician_notes")
        .eq("vehicle_id", targetId)
        .not("mileage_at_service", "is", null)
        .order("mileage_at_service", { ascending: false });
      setRecords((rData as ServiceRecord[]) ?? []);
    } else {
      setRecords([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, vehicleId]);

  // Most recent self-reported / matched mileage per canonical service name
  const lastMilesByName = useMemo(() => {
    const out: Record<string, { miles: number; recordId: string }> = {};
    for (const r of records) {
      const match = MAINTENANCE_INTERVALS.find(
        (m) => m.name.toLowerCase() === (r.service_type || "").toLowerCase(),
      );
      if (!match || r.mileage_at_service == null) continue;
      const cur = out[match.name];
      if (!cur || r.mileage_at_service > cur.miles) {
        out[match.name] = { miles: r.mileage_at_service, recordId: r.id };
      }
    }
    return out;
  }, [records]);

  const saveRow = async (name: string) => {
    if (!user || !vehicleId) return;
    const raw = drafts[name];
    const miles = Number(raw);
    if (!raw || !Number.isFinite(miles) || miles <= 0) {
      toast.error("Enter a valid mileage");
      return;
    }
    setSavingName(name);
    const { error } = await supabase.from("service_records").insert({
      customer_id: user.id,
      vehicle_id: vehicleId,
      service_type: name,
      mileage_at_service: miles,
      service_date: new Date().toISOString().slice(0, 10),
      technician_notes: SELF_REPORTED_NOTE,
    });
    setSavingName(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`${name} logged at ${miles.toLocaleString()} mi`);
    setDrafts((d) => ({ ...d, [name]: "" }));
    load();
  };

  const removeRow = async (name: string) => {
    const last = lastMilesByName[name];
    if (!last) return;
    if (!confirm(`Remove your ${name} record at ${last.miles.toLocaleString()} mi?`)) return;
    const { error } = await supabase.from("service_records").delete().eq("id", last.recordId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Removed");
    load();
  };

  const currentVehicle = vehicles.find((v) => v.id === vehicleId);

  return (
    <PortalLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Wrench className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Maintenance log</h1>
            <p className="text-sm text-muted-foreground">
              Track services performed elsewhere so we only remind you about what you actually need.
            </p>
          </div>
        </div>

        {vehicles.length === 0 ? (
          <Card><CardContent className="p-6 text-sm text-muted-foreground">Add a vehicle first to start logging maintenance.</CardContent></Card>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <Label htmlFor="veh" className="shrink-0">Vehicle</Label>
              <Select value={vehicleId} onValueChange={setVehicleId}>
                <SelectTrigger id="veh" className="sm:max-w-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {[v.year, v.make, v.model].filter(Boolean).join(" ")}
                      {v.current_mileage ? ` · ${fmt(v.current_mileage)} mi` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Standard services
                  {currentVehicle && (
                    <span className="text-xs font-normal text-muted-foreground ml-2">
                      Current odometer: {fmt(currentVehicle.current_mileage)} mi
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <ul className="divide-y divide-border/60">
                    {MAINTENANCE_INTERVALS.map((item) => {
                      const last = lastMilesByName[item.name];
                      const draft = drafts[item.name] ?? "";
                      const nextDue = last ? last.miles + item.intervalMiles : null;
                      return (
                        <li key={item.name} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-foreground">{item.name}</div>
                            <div className="text-[11px] text-muted-foreground">
                              every {item.intervalMiles.toLocaleString()} mi
                              {last ? (
                                <>
                                  {" · last "}
                                  <span className="text-foreground font-medium">{fmt(last.miles)} mi</span>
                                  {nextDue ? ` · next due ${fmt(nextDue)} mi` : ""}
                                </>
                              ) : (
                                " · no record on file"
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              type="text"
                              inputMode="numeric"
                              placeholder="miles"
                              className="w-28 h-9"
                              value={draft}
                              onChange={(e) =>
                                setDrafts((d) => ({ ...d, [item.name]: e.target.value.replace(/[^\d]/g, "") }))
                              }
                            />
                            <Button
                              size="sm"
                              onClick={() => saveRow(item.name)}
                              disabled={savingName === item.name || !draft}
                            >
                              {savingName === item.name ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : last ? (
                                <><Plus className="h-3.5 w-3.5 mr-1" /> Update</>
                              ) : (
                                <><Save className="h-3.5 w-3.5 mr-1" /> Save</>
                              )}
                            </Button>
                            {last && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeRow(item.name)}
                                aria-label="Remove"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </PortalLayout>
  );
};

export default PortalMaintenance;
