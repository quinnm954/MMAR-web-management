import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PortalLayout from "@/components/portal/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { decodeVin } from "@/lib/nhtsa";
import { toast } from "sonner";
import { Car, Plus, Loader2, Search, Trash2, Wrench, ChevronDown, ChevronRight } from "lucide-react";
import { portalStrings } from "@/lib/portalStrings";
import { MAINTENANCE_INTERVALS, SELF_REPORTED_NOTE } from "@/data/maintenanceIntervals";

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

interface MaintRow {
  checked: boolean;
  miles: string;
}

const emptyMaint = (): Record<string, MaintRow> =>
  Object.fromEntries(MAINTENANCE_INTERVALS.map((m) => [m.name, { checked: false, miles: "" }]));

const today = () => new Date().toISOString().slice(0, 10);

const PortalVehicles = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [decoding, setDecoding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Vehicle>>({});
  const [maint, setMaint] = useState<Record<string, MaintRow>>(emptyMaint);
  const [maintOpen, setMaintOpen] = useState(false);

  const resetForm = () => {
    setForm({});
    setMaint(emptyMaint());
    setMaintOpen(false);
  };

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

  const toggleMaint = (name: string, checked: boolean) =>
    setMaint((m) => ({ ...m, [name]: { ...m[name], checked } }));

  const setMaintMiles = (name: string, miles: string) =>
    setMaint((m) => ({ ...m, [name]: { ...m[name], miles } }));

  const checkedCount = Object.values(maint).filter((r) => r.checked).length;

  const handleSave = async () => {
    if (!user) return;
    if (!form.year || !form.make || !form.model) return toast.error("Year, Make, Model required");

    // Validate any checked maintenance rows have a positive mileage
    const checkedRows = Object.entries(maint).filter(([, r]) => r.checked);
    for (const [name, row] of checkedRows) {
      const n = Number(row.miles);
      if (!row.miles || !Number.isFinite(n) || n <= 0) {
        setMaintOpen(true);
        return toast.error(`Enter the mileage when "${name}" was last done`);
      }
    }

    setSaving(true);
    const { data: vehicle, error } = await supabase
      .from("vehicles")
      .insert({
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
      })
      .select("id")
      .single();
    if (error || !vehicle) {
      setSaving(false);
      return toast.error(error?.message ?? "Could not save vehicle");
    }

    if (checkedRows.length > 0) {
      const rows = checkedRows.map(([name, row]) => ({
        customer_id: user.id,
        vehicle_id: vehicle.id,
        service_type: name,
        mileage_at_service: Number(row.miles),
        service_date: today(),
        technician_notes: SELF_REPORTED_NOTE,
      }));
      const { error: srErr } = await supabase.from("service_records").insert(rows);
      if (srErr) {
        toast.warning(`Vehicle added, but maintenance log failed: ${srErr.message}`);
      } else {
        toast.success(`Vehicle added with ${checkedRows.length} maintenance ${checkedRows.length === 1 ? "record" : "records"}`);
      }
    } else {
      toast.success("Vehicle added");
    }

    setSaving(false);
    resetForm();
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
          <p className="text-muted-foreground mt-1">{portalStrings.account.vehiclesSubtitle}</p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(o) => {
            setOpen(o);
            if (!o) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button variant="hero"><Plus className="h-4 w-4 mr-1" /> Add Vehicle</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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

              {/* Maintenance checklist */}
              <div className="rounded-lg border border-border/60 bg-background/40">
                <button
                  type="button"
                  onClick={() => setMaintOpen((v) => !v)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm font-medium text-foreground"
                >
                  {maintOpen ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <Wrench className="h-4 w-4 text-primary" />
                  <span className="flex-1">Recent maintenance for this vehicle</span>
                  {checkedCount > 0 && (
                    <span className="text-[11px] text-muted-foreground font-normal">{checkedCount} checked</span>
                  )}
                </button>
                {maintOpen && (
                  <div className="px-3 pb-3 pt-1 space-y-2 border-t border-border/40">
                    <p className="text-[11px] text-muted-foreground">
                      Check off anything done elsewhere recently and enter the odometer reading at the time. You can edit anytime from Maintenance.
                    </p>
                    <div className="rounded-md border border-border/60 divide-y divide-border/60 max-h-[280px] overflow-y-auto">
                      {MAINTENANCE_INTERVALS.map((item) => {
                        const row = maint[item.name];
                        const id = `mv-${item.name}`;
                        return (
                          <div key={item.name} className="flex items-center gap-3 px-3 py-2">
                            <Checkbox
                              id={id}
                              checked={row.checked}
                              onCheckedChange={(c) => toggleMaint(item.name, c === true)}
                            />
                            <label htmlFor={id} className="flex-1 text-sm cursor-pointer leading-tight">
                              <div className="font-medium text-foreground">{item.name}</div>
                              <div className="text-[11px] text-muted-foreground">
                                every {item.intervalMiles.toLocaleString()} mi
                              </div>
                            </label>
                            <Input
                              type="text"
                              inputMode="numeric"
                              placeholder="miles"
                              className="w-24 h-8 text-sm"
                              value={row.miles}
                              onChange={(e) => setMaintMiles(item.name, e.target.value.replace(/[^\d]/g, ""))}
                              disabled={!row.checked}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setOpen(false); resetForm(); }}>Cancel</Button>
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
