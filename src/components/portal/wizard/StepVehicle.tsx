import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { decodeVin } from "@/lib/nhtsa";
import { toast } from "sonner";
import { Loader2, Search, Car, Plus, Check } from "lucide-react";
import type { WizardData } from "@/pages/portal/MembershipSignup";

interface Props {
  data: WizardData;
  setData: (d: WizardData) => void;
  onNext: () => void;
  onBack?: () => void;
  defaultPlanSlug?: string | null;
}

type ExistingVehicle = {
  id: string;
  year: number | null;
  make: string | null;
  model: string | null;
  trim: string | null;
  vin: string | null;
  license_plate: string | null;
  color: string | null;
  current_mileage: number | null;
};

const StepVehicle = ({ data, setData, onNext, onBack }: Props) => {
  const { user } = useAuth();
  const [v, setV] = useState(data.vehicle);
  const [decoding, setDecoding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [existing, setExisting] = useState<ExistingVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"select" | "new">("select");
  const [selectedId, setSelectedId] = useState<string | null>(data.vehicleId ?? null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      const { data: rows, error } = await supabase
        .from("vehicles")
        .select("id, year, make, model, trim, vin, license_plate, color, current_mileage")
        .eq("owner_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (error) {
        toast.error("Could not load your vehicles");
      }
      const list = (rows as ExistingVehicle[] | null) ?? [];
      setExisting(list);
      // If they have no vehicles, jump straight to "add new"
      if (list.length === 0) setMode("new");
      setLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleDecode = async () => {
    if (!v.vin || v.vin.length !== 17) {
      return toast.error("VIN must be 17 characters");
    }
    setDecoding(true);
    const result = await decodeVin(v.vin);
    setDecoding(false);
    if (!result || !result.make) return toast.error("Could not decode VIN. Enter manually below.");
    setV({
      ...v,
      vin: result.vin,
      year: result.year ?? undefined,
      make: result.make ?? undefined,
      model: result.model ?? undefined,
      trim: result.trim ?? undefined,
      engine: result.engine ?? undefined,
    });
    toast.success(`Found ${result.year} ${result.make} ${result.model}`);
  };

  const handleUseExisting = () => {
    if (!selectedId) return toast.error("Pick a vehicle to continue");
    const chosen = existing.find((e) => e.id === selectedId);
    if (!chosen) return toast.error("Vehicle not found");
    setData({
      ...data,
      vehicleId: chosen.id,
      vehicle: {
        vin: chosen.vin ?? undefined,
        year: chosen.year ?? undefined,
        make: chosen.make ?? undefined,
        model: chosen.model ?? undefined,
        trim: chosen.trim ?? undefined,
        license_plate: chosen.license_plate ?? undefined,
        color: chosen.color ?? undefined,
        current_mileage: chosen.current_mileage ?? undefined,
      },
    });
    onNext();
  };

  const handleSaveNew = async () => {
    if (!user) return toast.error("Please sign in first");
    if (!v.year || !v.make || !v.model) return toast.error("Year, Make, and Model are required");
    setSaving(true);
    const { data: row, error } = await supabase
      .from("vehicles")
      .insert({
        owner_id: user.id,
        vin: v.vin || null,
        year: v.year,
        make: v.make,
        model: v.model,
        trim: v.trim || null,
        engine: v.engine || null,
        license_plate: v.license_plate || null,
        color: v.color || null,
        current_mileage: v.current_mileage || null,
      })
      .select()
      .single();
    setSaving(false);
    if (error || !row) return toast.error(error?.message || "Failed to save vehicle");
    setData({ ...data, vehicle: v, vehicleId: row.id });
    onNext();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Pick the vehicle for this plan</h2>
        <p className="text-sm text-muted-foreground">
          {existing.length > 0
            ? "Choose one of your saved vehicles, or add a new one."
            : "Tell us about your vehicle — VIN lookup is fastest."}
        </p>
      </div>

      {existing.length > 0 && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant={mode === "select" ? "hero" : "outline"}
            size="sm"
            onClick={() => setMode("select")}
            className="flex-1"
          >
            <Car className="h-4 w-4 mr-1" /> My Vehicles ({existing.length})
          </Button>
          <Button
            type="button"
            variant={mode === "new" ? "hero" : "outline"}
            size="sm"
            onClick={() => setMode("new")}
            className="flex-1"
          >
            <Plus className="h-4 w-4 mr-1" /> Add New
          </Button>
        </div>
      )}

      {mode === "select" && existing.length > 0 && (
        <>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {existing.map((veh) => {
              const selected = selectedId === veh.id;
              return (
                <button
                  key={veh.id}
                  type="button"
                  onClick={() => setSelectedId(veh.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selected
                      ? "border-primary bg-primary/10"
                      : "border-border/40 hover:border-primary/50 bg-background/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-foreground">
                        {veh.year} {veh.make} {veh.model}
                        {veh.trim ? ` ${veh.trim}` : ""}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {veh.license_plate && <span>Plate: {veh.license_plate}</span>}
                        {veh.license_plate && veh.vin && <span> · </span>}
                        {veh.vin && <span>VIN: {veh.vin.slice(-6)}</span>}
                        {veh.color && <span> · {veh.color}</span>}
                      </div>
                      {veh.current_mileage != null && (
                        <div className="text-xs text-muted-foreground">
                          {veh.current_mileage.toLocaleString()} mi
                        </div>
                      )}
                    </div>
                    {selected && (
                      <div className="shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        <Check className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex gap-2 pt-2">
            {onBack && <Button variant="outline" onClick={onBack}>Back</Button>}
            <Button
              variant="hero"
              className="flex-1"
              onClick={handleUseExisting}
              disabled={!selectedId}
            >
              Continue to Plan Selection
            </Button>
          </div>
        </>
      )}

      {mode === "new" && (
        <>
          <div>
            <Label htmlFor="vin">VIN (17 characters)</Label>
            <div className="flex gap-2">
              <Input
                id="vin"
                maxLength={17}
                value={v.vin || ""}
                onChange={(e) => setV({ ...v, vin: e.target.value.toUpperCase() })}
                placeholder="1HGBH41JXMN109186"
              />
              <Button type="button" variant="outline" onClick={handleDecode} disabled={decoding}>
                {decoding ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Search className="h-4 w-4 mr-1" /> Lookup</>}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="year">Year *</Label>
              <Input id="year" type="number" min="1980" max="2030" value={v.year || ""} onChange={(e) => setV({ ...v, year: parseInt(e.target.value) || undefined })} />
            </div>
            <div>
              <Label htmlFor="make">Make *</Label>
              <Input id="make" value={v.make || ""} onChange={(e) => setV({ ...v, make: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="model">Model *</Label>
              <Input id="model" value={v.model || ""} onChange={(e) => setV({ ...v, model: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="trim">Trim</Label>
              <Input id="trim" value={v.trim || ""} onChange={(e) => setV({ ...v, trim: e.target.value })} />
            </div>
            <div className="col-span-2">
              <Label htmlFor="engine">Engine</Label>
              <Input id="engine" value={v.engine || ""} onChange={(e) => setV({ ...v, engine: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="plate">License Plate</Label>
              <Input id="plate" value={v.license_plate || ""} onChange={(e) => setV({ ...v, license_plate: e.target.value.toUpperCase() })} />
            </div>
            <div>
              <Label htmlFor="color">Color</Label>
              <Input id="color" value={v.color || ""} onChange={(e) => setV({ ...v, color: e.target.value })} />
            </div>
            <div className="col-span-2">
              <Label htmlFor="mileage">Current Mileage</Label>
              <Input id="mileage" type="number" min="0" value={v.current_mileage || ""} onChange={(e) => setV({ ...v, current_mileage: parseInt(e.target.value) || undefined })} />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            {onBack && <Button variant="outline" onClick={onBack}>Back</Button>}
            <Button variant="hero" className="flex-1" onClick={handleSaveNew} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue to Plan Selection"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default StepVehicle;
