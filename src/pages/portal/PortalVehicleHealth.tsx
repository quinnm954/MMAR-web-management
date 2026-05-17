import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PortalLayout from "@/components/portal/PortalLayout";
import VehicleMasterChecklist from "@/components/VehicleMasterChecklist";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface Vehicle { id: string; year: number | null; make: string | null; model: string | null; }

const label = (v: Vehicle) => [v.year, v.make, v.model].filter(Boolean).join(" ") || "Vehicle";

const PortalVehicleHealth = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("vehicles")
        .select("id, year, make, model")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });
      const list = (data ?? []) as Vehicle[];
      setVehicles(list);
      if (list[0]) setVehicleId(list[0].id);
    })();
  }, [user]);

  return (
    <PortalLayout>
      <div className="space-y-4 p-4 lg:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Health Checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              A living record of every inspection point on your vehicle. It updates automatically when our techs
              complete an inspection, and you can edit any item yourself if you serviced it or had it done elsewhere.
            </p>
            {vehicles.length > 1 && (
              <Select value={vehicleId} onValueChange={setVehicleId}>
                <SelectTrigger className="w-full sm:w-80"><SelectValue placeholder="Choose vehicle" /></SelectTrigger>
                <SelectContent>
                  {vehicles.map(v => <SelectItem key={v.id} value={v.id}>{label(v)}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>

        {vehicleId && user && (
          <VehicleMasterChecklist vehicleId={vehicleId} mode="customer" customerId={user.id} />
        )}
        {!vehicleId && (
          <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">
            Add a vehicle to your account to see its health checklist.
          </CardContent></Card>
        )}
      </div>
    </PortalLayout>
  );
};

export default PortalVehicleHealth;
