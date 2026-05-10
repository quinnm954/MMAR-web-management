import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2,
  Phone,
  MapPin,
  Car,
  Wrench,
  ArrowRight,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import { MAINTENANCE_INTERVALS, SELF_REPORTED_NOTE } from "@/data/maintenanceIntervals";

const profileSchema = z.object({
  phone: z.string().trim().min(10, "Enter a valid phone number").max(20),
  address_line1: z.string().trim().min(3, "Street address is required").max(200),
  address_line2: z.string().trim().max(100).optional().or(z.literal("")),
  city: z.string().trim().min(2, "City is required").max(80),
  state: z.string().trim().min(2, "State is required").max(2),
  postal_code: z.string().trim().min(5, "ZIP is required").max(10),
});

type ProfileForm = z.infer<typeof profileSchema>;

interface MaintRow {
  checked: boolean;
  miles: string;
}

interface VehicleDraft {
  key: string;
  year: string;
  make: string;
  model: string;
  mileage: string;
  plate: string;
  expanded: boolean;
  maint: Record<string, MaintRow>;
}

const emptyProfile: ProfileForm = {
  phone: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "FL",
  postal_code: "",
};

const emptyMaint = (): Record<string, MaintRow> =>
  Object.fromEntries(MAINTENANCE_INTERVALS.map((m) => [m.name, { checked: false, miles: "" }]));

const newVehicle = (expanded = true): VehicleDraft => ({
  key: crypto.randomUUID(),
  year: "",
  make: "",
  model: "",
  mileage: "",
  plate: "",
  expanded,
  maint: emptyMaint(),
});

const today = () => new Date().toISOString().slice(0, 10);

const PortalOnboarding = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isStaff } = useAuth();
  const [profile, setProfile] = useState<ProfileForm>(emptyProfile);
  const [vehicles, setVehicles] = useState<VehicleDraft[]>([newVehicle(true)]);
  const [busy, setBusy] = useState(false);
  const [hydrating, setHydrating] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: p } = await supabase
        .from("profiles")
        .select("phone, address_line1, address_line2, city, state, postal_code")
        .eq("id", user.id)
        .maybeSingle();
      if (p) {
        setProfile((f) => ({
          ...f,
          phone: p.phone ?? "",
          address_line1: p.address_line1 ?? "",
          address_line2: p.address_line2 ?? "",
          city: p.city ?? "",
          state: p.state ?? "FL",
          postal_code: p.postal_code ?? "",
        }));
      }
      setHydrating(false);
    })();
  }, [user]);

  const setP = (k: keyof ProfileForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setProfile((f) => ({ ...f, [k]: e.target.value }));

  const updateVehicle = (key: string, patch: Partial<VehicleDraft>) =>
    setVehicles((vs) => vs.map((v) => (v.key === key ? { ...v, ...patch } : v)));

  const updateMaint = (key: string, name: string, patch: Partial<MaintRow>) =>
    setVehicles((vs) =>
      vs.map((v) =>
        v.key === key
          ? { ...v, maint: { ...v.maint, [name]: { ...v.maint[name], ...patch } } }
          : v,
      ),
    );

  const addVehicle = () => {
    setVehicles((vs) => [...vs.map((v) => ({ ...v, expanded: false })), newVehicle(true)]);
  };

  const removeVehicle = (key: string) => {
    setVehicles((vs) => (vs.length === 1 ? vs : vs.filter((v) => v.key !== key)));
  };

  const totalChecked = useMemo(
    () =>
      vehicles.reduce(
        (sum, v) => sum + Object.values(v.maint).filter((r) => r.checked).length,
        0,
      ),
    [vehicles],
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const parsed = profileSchema.safeParse(profile);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }

    // Validate every vehicle
    for (const v of vehicles) {
      if (!/^\d{4}$/.test(v.year.trim())) {
        toast.error("Enter a 4-digit year for every vehicle");
        updateVehicle(v.key, { expanded: true });
        return;
      }
      if (!v.make.trim() || !v.model.trim()) {
        toast.error("Make and model are required for every vehicle");
        updateVehicle(v.key, { expanded: true });
        return;
      }
      const checkedRows = Object.entries(v.maint).filter(([, r]) => r.checked);
      for (const [name, row] of checkedRows) {
        const n = Number(row.miles);
        if (!row.miles || !Number.isFinite(n) || n <= 0) {
          toast.error(
            `Enter the mileage when "${name}" was last done on the ${v.year} ${v.make} ${v.model}`,
          );
          updateVehicle(v.key, { expanded: true });
          return;
        }
      }
    }

    setBusy(true);
    const pv = parsed.data;

    // 1) Profile
    const { error: pErr } = await supabase
      .from("profiles")
      .update({
        phone: pv.phone,
        address_line1: pv.address_line1,
        address_line2: pv.address_line2 || null,
        city: pv.city,
        state: pv.state.toUpperCase(),
        postal_code: pv.postal_code,
      })
      .eq("id", user.id);
    if (pErr) {
      setBusy(false);
      toast.error(pErr.message);
      return;
    }

    // 2) Insert each vehicle + its maintenance records
    let warnings = 0;
    for (const v of vehicles) {
      const { data: vehicle, error: vErr } = await supabase
        .from("vehicles")
        .insert({
          owner_id: user.id,
          year: Number(v.year),
          make: v.make.trim(),
          model: v.model.trim(),
          current_mileage: v.mileage ? Number(v.mileage) : null,
          license_plate: v.plate.trim() || null,
          is_active: true,
        })
        .select("id")
        .single();
      if (vErr || !vehicle) {
        setBusy(false);
        toast.error(vErr?.message ?? `Could not save ${v.year} ${v.make} ${v.model}`);
        return;
      }

      const checkedRows = Object.entries(v.maint).filter(([, r]) => r.checked);
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
        if (srErr) warnings++;
      }
    }

    setBusy(false);
    try {
      sessionStorage.setItem(`onboarded:${user.id}`, "1");
    } catch {}
    if (warnings > 0) {
      toast.warning("Account saved, but some maintenance entries didn't sync. You can fix from Maintenance.");
    } else {
      toast.success("Welcome aboard! Your account is all set.");
    }
    const dest = isAdmin ? "/admin/dashboard" : isStaff ? "/tech" : "/portal/dashboard";
    // Use a microtask + hard fallback so a stale render can't block the redirect
    setTimeout(() => {
      navigate(dest, { replace: true });
      setTimeout(() => {
        if (window.location.pathname === "/portal/onboarding") {
          window.location.assign(dest);
        }
      }, 250);
    }, 0);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-24 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="border-border/50">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Finish setting up your account</CardTitle>
              <CardDescription>
                A few quick details so we can dispatch a tech to you and start tracking your
                vehicle service history.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {hydrating ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-8">
                  {/* Phone */}
                  <section className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Phone className="h-4 w-4 text-primary" /> Contact phone
                    </div>
                    <div>
                      <Label htmlFor="phone">Mobile number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        autoComplete="tel"
                        placeholder="(555) 555-5555"
                        value={profile.phone}
                        onChange={setP("phone")}
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Used for appointment confirmations and tech ETA texts.
                      </p>
                    </div>
                  </section>

                  {/* Address */}
                  <section className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <MapPin className="h-4 w-4 text-primary" /> Service address
                    </div>
                    <div>
                      <Label htmlFor="addr1">Street address</Label>
                      <Input id="addr1" autoComplete="address-line1" value={profile.address_line1} onChange={setP("address_line1")} required />
                    </div>
                    <div>
                      <Label htmlFor="addr2">Apt / Suite (optional)</Label>
                      <Input id="addr2" autoComplete="address-line2" value={profile.address_line2} onChange={setP("address_line2")} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <Label htmlFor="city">City</Label>
                        <Input id="city" autoComplete="address-level2" value={profile.city} onChange={setP("city")} required />
                      </div>
                      <div>
                        <Label htmlFor="state">State</Label>
                        <Input id="state" autoComplete="address-level1" maxLength={2} value={profile.state} onChange={setP("state")} required />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="zip">ZIP code</Label>
                      <Input id="zip" autoComplete="postal-code" inputMode="numeric" value={profile.postal_code} onChange={setP("postal_code")} required />
                    </div>
                  </section>

                  {/* Vehicles */}
                  <section className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Car className="h-4 w-4 text-primary" /> Your vehicles
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {vehicles.length} {vehicles.length === 1 ? "vehicle" : "vehicles"}
                        {totalChecked > 0 ? ` · ${totalChecked} services logged` : ""}
                      </span>
                    </div>

                    {vehicles.map((v, idx) => {
                      const checkedCount = Object.values(v.maint).filter((r) => r.checked).length;
                      const label =
                        v.year || v.make || v.model
                          ? [v.year, v.make, v.model].filter(Boolean).join(" ")
                          : `Vehicle ${idx + 1}`;
                      return (
                        <div key={v.key} className="rounded-lg border border-border/60 bg-background/40">
                          <div className="flex items-center gap-2 px-3 py-2">
                            <button
                              type="button"
                              onClick={() => updateVehicle(v.key, { expanded: !v.expanded })}
                              className="flex items-center gap-2 flex-1 text-left text-sm font-medium text-foreground"
                            >
                              {v.expanded ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span className="truncate">{label}</span>
                              {checkedCount > 0 && (
                                <span className="text-[11px] text-muted-foreground font-normal">
                                  · {checkedCount} services
                                </span>
                              )}
                            </button>
                            {vehicles.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeVehicle(v.key)}
                                aria-label="Remove vehicle"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>

                          {v.expanded && (
                            <div className="px-3 pb-4 pt-1 space-y-4 border-t border-border/40">
                              <div className="grid grid-cols-3 gap-3">
                                <div>
                                  <Label>Year</Label>
                                  <Input
                                    inputMode="numeric"
                                    maxLength={4}
                                    placeholder="2020"
                                    value={v.year}
                                    onChange={(e) => updateVehicle(v.key, { year: e.target.value })}
                                    required
                                  />
                                </div>
                                <div>
                                  <Label>Make</Label>
                                  <Input
                                    placeholder="Honda"
                                    value={v.make}
                                    onChange={(e) => updateVehicle(v.key, { make: e.target.value })}
                                    required
                                  />
                                </div>
                                <div>
                                  <Label>Model</Label>
                                  <Input
                                    placeholder="Civic"
                                    value={v.model}
                                    onChange={(e) => updateVehicle(v.key, { model: e.target.value })}
                                    required
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <Label>Current mileage (optional)</Label>
                                  <Input
                                    inputMode="numeric"
                                    placeholder="85000"
                                    value={v.mileage}
                                    onChange={(e) =>
                                      updateVehicle(v.key, { mileage: e.target.value.replace(/[^\d]/g, "") })
                                    }
                                  />
                                </div>
                                <div>
                                  <Label>License plate (optional)</Label>
                                  <Input
                                    value={v.plate}
                                    onChange={(e) => updateVehicle(v.key, { plate: e.target.value })}
                                  />
                                </div>
                              </div>

                              {/* Per-vehicle maintenance checklist */}
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                                  <Wrench className="h-3.5 w-3.5 text-primary" /> Recent maintenance for this vehicle
                                </div>
                                <p className="text-[11px] text-muted-foreground">
                                  Check off anything done elsewhere recently and enter the odometer reading at the time.
                                </p>
                                <div className="rounded-md border border-border/60 divide-y divide-border/60 max-h-[280px] overflow-y-auto">
                                  {MAINTENANCE_INTERVALS.map((item) => {
                                    const row = v.maint[item.name];
                                    const id = `m-${v.key}-${item.name}`;
                                    return (
                                      <div key={item.name} className="flex items-center gap-3 px-3 py-2">
                                        <Checkbox
                                          id={id}
                                          checked={row.checked}
                                          onCheckedChange={(c) =>
                                            updateMaint(v.key, item.name, { checked: c === true })
                                          }
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
                                          onChange={(e) =>
                                            updateMaint(v.key, item.name, {
                                              miles: e.target.value.replace(/[^\d]/g, ""),
                                            })
                                          }
                                          disabled={!row.checked}
                                        />
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addVehicle}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add another vehicle
                    </Button>
                  </section>

                  <div className="flex justify-end pt-2">
                    <Button type="submit" variant="hero" disabled={busy} className="sm:min-w-[220px]">
                      {busy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          Save & continue <ArrowRight className="h-4 w-4 ml-1" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default PortalOnboarding;
