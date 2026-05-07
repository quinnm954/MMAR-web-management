import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PortalLayout from "@/components/portal/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { decodeVin } from "@/lib/nhtsa";
import { toast } from "sonner";
import { Car, Plus, Loader2, Search, Trash2 } from "lucide-react";

interface Vehicle {
  id: string;
  vin: string | null;
  year: number | null;
  make: string | null;
  model: string | null;
  trim: string | null;
  engine: string | null;
  license_plate: string | null;
  color: string | null;
  current_mileage: number | null;
}

const PortalVehicles = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [decoding, setDecoding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Vehicle>>({});

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("vehicles")
      .select("*")
      .eq("owner_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    setVehicles((data as Vehicle[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleDecode = async () => {
    if (!form.vin || form.vin.length !== 17) return toast.error("VIN must be 17 chars");
    setDecoding(true);
    const r = await decodeVin(form.vin);
    setDecoding(false);
    if (!r || !r.make) return toast.error("Could not decode VIN");
    setForm({ ...form, ...r, vin: r.vin });
    toast.success(`Found ${r.year} ${r.make} ${r.model}`);
  };

  const handleSave = async () => {
    if (!user) return;
    if (!form.year || !form.make || !form.model) return toast.error("Year, Make, Model required");
    setSaving(true);
    const { error } = await supabase.from("vehicles").insert({
      owner_id: user.id,
      vin: form.vin || null,
      year: form.year,
      make: form.make,
      model: form.model,
      trim: form.trim || null,
      engine: form.engine || null,
      license_plate: form.license_plate || null,
      color: form.color || null,
      current_mileage: form.current_mileage || null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Vehicle added");
    setForm({});
    setOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this vehicle?")) return;
    const { error } = await supabase.from("vehicles").update({ is_active: false }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Vehicle removed");
    load();
  };

  return (
    <PortalLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">My Vehicles</h1>
          <p className="text-muted-foreground mt-1">Vehicles linked to your MMAR Care account.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="hero"><Plus className="h-4 w-4 mr-1" /> Add Vehicle</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Add a Vehicle</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>VIN (auto-fill)</Label>
                <div className="flex gap-2">
                  <Input maxLength={17} value={form.vin || ""} onChange={(e) => setForm({ ...form, vin: e.target.value.toUpperCase() })} />
                  <Button type="button" variant="outline" onClick={handleDecode} disabled={decoding}>
                    {decoding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Year *</Label><Input type="number" value={form.year || ""} onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) || undefined })} /></div>
                <div><Label>Make *</Label><Input value={form.make || ""} onChange={(e) => setForm({ ...form, make: e.target.value })} /></div>
                <div><Label>Model *</Label><Input value={form.model || ""} onChange={(e) => setForm({ ...form, model: e.target.value })} /></div>
                <div><Label>Trim</Label><Input value={form.trim || ""} onChange={(e) => setForm({ ...form, trim: e.target.value })} /></div>
                <div className="col-span-2"><Label>Engine</Label><Input value={form.engine || ""} onChange={(e) => setForm({ ...form, engine: e.target.value })} /></div>
                <div><Label>License Plate</Label><Input value={form.license_plate || ""} onChange={(e) => setForm({ ...form, license_plate: e.target.value.toUpperCase() })} /></div>
                <div><Label>Color</Label><Input value={form.color || ""} onChange={(e) => setForm({ ...form, color: e.target.value })} /></div>
                <div className="col-span-2"><Label>Current Mileage</Label><Input type="number" value={form.current_mileage || ""} onChange={(e) => setForm({ ...form, current_mileage: parseInt(e.target.value) || undefined })} /></div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button variant="hero" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Vehicle"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : vehicles.length === 0 ? (
        <Card className="border-dashed border-border/50">
          <CardContent className="p-12 text-center">
            <Car className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">No vehicles yet.</p>
            <Button variant="hero" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add your first vehicle</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vehicles.map((v) => (
            <Card key={v.id} className="border-border/50 hover:border-primary/30 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Car className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-bold">{v.year} {v.make} {v.model}</div>
                      {v.trim && <div className="text-xs text-muted-foreground">{v.trim}</div>}
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(v.id)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
                <dl className="grid grid-cols-2 gap-y-1.5 text-xs">
                  {v.vin && <><dt className="text-muted-foreground">VIN</dt><dd className="font-mono">{v.vin}</dd></>}
                  {v.engine && <><dt className="text-muted-foreground">Engine</dt><dd>{v.engine}</dd></>}
                  {v.license_plate && <><dt className="text-muted-foreground">Plate</dt><dd>{v.license_plate}</dd></>}
                  {v.color && <><dt className="text-muted-foreground">Color</dt><dd>{v.color}</dd></>}
                  {v.current_mileage != null && <><dt className="text-muted-foreground">Mileage</dt><dd>{v.current_mileage.toLocaleString()} mi</dd></>}
                </dl>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PortalLayout>
  );
};

export default PortalVehicles;
