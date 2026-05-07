import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { decodeVin } from "@/lib/nhtsa";
import { toast } from "sonner";
import { Loader2, Search } from "lucide-react";
import type { WizardData } from "@/pages/portal/MembershipSignup";

interface Props {
  data: WizardData;
  setData: (d: WizardData) => void;
  onNext: () => void;
  onBack?: () => void;
  defaultPlanSlug?: string | null;
}

const StepVehicle = ({ data, setData, onNext, onBack }: Props) => {
  const { user } = useAuth();
  const [v, setV] = useState(data.vehicle);
  const [decoding, setDecoding] = useState(false);
  const [saving, setSaving] = useState(false);

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

  const handleSave = async () => {
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

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Tell us about your vehicle</h2>
        <p className="text-sm text-muted-foreground">Enter your VIN for instant lookup, or fill in details manually.</p>
      </div>

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
        <Button variant="hero" className="flex-1" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue to Plan Selection"}
        </Button>
      </div>
    </div>
  );
};

export default StepVehicle;
