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
import { Loader2, Phone, MapPin, Car, Wrench, ArrowRight } from "lucide-react";
import Navigation from "@/components/Navigation";
import { MAINTENANCE_INTERVALS, SELF_REPORTED_NOTE } from "@/data/maintenanceIntervals";

const baseSchema = z.object({
  phone: z.string().trim().min(10, "Enter a valid phone number").max(20),
  address_line1: z.string().trim().min(3, "Street address is required").max(200),
  address_line2: z.string().trim().max(100).optional().or(z.literal("")),
  city: z.string().trim().min(2, "City is required").max(80),
  state: z.string().trim().min(2, "State is required").max(2),
  postal_code: z.string().trim().min(5, "ZIP is required").max(10),
  vehicle_year: z.string().trim().regex(/^\d{4}$/, "Enter a 4-digit year"),
  vehicle_make: z.string().trim().min(1, "Make is required").max(40),
  vehicle_model: z.string().trim().min(1, "Model is required").max(40),
  vehicle_mileage: z.string().trim().max(7).optional().or(z.literal("")),
  vehicle_plate: z.string().trim().max(15).optional().or(z.literal("")),
});

type FormState = z.infer<typeof baseSchema>;

const empty: FormState = {
  phone: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "FL",
  postal_code: "",
  vehicle_year: "",
  vehicle_make: "",
  vehicle_model: "",
  vehicle_mileage: "",
  vehicle_plate: "",
};

interface MaintRow {
  checked: boolean;
  miles: string;
}

const today = () => new Date().toISOString().slice(0, 10);

const PortalOnboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState<FormState>(empty);
  const [maint, setMaint] = useState<Record<string, MaintRow>>(() =>
    Object.fromEntries(MAINTENANCE_INTERVALS.map((m) => [m.name, { checked: false, miles: "" }])),
  );
  const [busy, setBusy] = useState(false);
  const [hydrating, setHydrating] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("phone, address_line1, address_line2, city, state, postal_code")
        .eq("id", user.id)
        .maybeSingle();
      if (profile) {
        setForm((f) => ({
          ...f,
          phone: profile.phone ?? "",
          address_line1: profile.address_line1 ?? "",
          address_line2: profile.address_line2 ?? "",
          city: profile.city ?? "",
          state: profile.state ?? "FL",
          postal_code: profile.postal_code ?? "",
        }));
      }
      setHydrating(false);
    })();
  }, [user]);

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const toggleMaint = (name: string, checked: boolean) =>
    setMaint((m) => ({ ...m, [name]: { ...m[name], checked } }));

  const setMaintMiles = (name: string, miles: string) =>
    setMaint((m) => ({ ...m, [name]: { ...m[name], miles } }));

  const checkedCount = useMemo(
    () => Object.values(maint).filter((r) => r.checked).length,
    [maint],
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const parsed = baseSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    // Validate that every checked maintenance row has a positive mileage value
    const checkedRows = Object.entries(maint).filter(([, r]) => r.checked);
    for (const [name, row] of checkedRows) {
      const n = Number(row.miles);
      if (!row.miles || !Number.isFinite(n) || n <= 0) {
        toast.error(`Enter the mileage when "${name}" was last done`);
        return;
      }
    }

    setBusy(true);
    const v = parsed.data;

    // 1) Update profile
    const { error: pErr } = await supabase
      .from("profiles")
      .update({
        phone: v.phone,
        address_line1: v.address_line1,
        address_line2: v.address_line2 || null,
        city: v.city,
        state: v.state.toUpperCase(),
        postal_code: v.postal_code,
      })
      .eq("id", user.id);
    if (pErr) {
      setBusy(false);
      toast.error(pErr.message);
      return;
    }

    // 2) Create vehicle
    const { data: vehicle, error: vErr } = await supabase
      .from("vehicles")
      .insert({
        owner_id: user.id,
        year: Number(v.vehicle_year),
        make: v.vehicle_make,
        model: v.vehicle_model,
        current_mileage: v.vehicle_mileage ? Number(v.vehicle_mileage) : null,
        license_plate: v.vehicle_plate || null,
        is_active: true,
      })
      .select("id")
      .single();
    if (vErr || !vehicle) {
      setBusy(false);
      toast.error(vErr?.message ?? "Could not save vehicle");
      return;
    }

    // 3) Insert any self-reported maintenance records
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
        // Non-fatal: vehicle is saved, just warn so they can fix from /portal/maintenance later
        toast.warning(`Saved your account, but maintenance log failed: ${srErr.message}`);
      }
    }

    setBusy(false);
    try {
      sessionStorage.setItem(`onboarded:${user.id}`, "1");
    } catch {}
    toast.success("Welcome aboard! Your account is all set.");
    navigate("/portal/dashboard", { replace: true });
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
                vehicle's service history.
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
                        value={form.phone}
                        onChange={set("phone")}
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
                      <Input id="addr1" autoComplete="address-line1" value={form.address_line1} onChange={set("address_line1")} required />
                    </div>
                    <div>
                      <Label htmlFor="addr2">Apt / Suite (optional)</Label>
                      <Input id="addr2" autoComplete="address-line2" value={form.address_line2} onChange={set("address_line2")} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <Label htmlFor="city">City</Label>
                        <Input id="city" autoComplete="address-level2" value={form.city} onChange={set("city")} required />
                      </div>
                      <div>
                        <Label htmlFor="state">State</Label>
                        <Input id="state" autoComplete="address-level1" maxLength={2} value={form.state} onChange={set("state")} required />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="zip">ZIP code</Label>
                      <Input id="zip" autoComplete="postal-code" inputMode="numeric" value={form.postal_code} onChange={set("postal_code")} required />
                    </div>
                  </section>

                  {/* Vehicle */}
                  <section className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Car className="h-4 w-4 text-primary" /> Your vehicle
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label htmlFor="year">Year</Label>
                        <Input id="year" inputMode="numeric" maxLength={4} placeholder="2020" value={form.vehicle_year} onChange={set("vehicle_year")} required />
                      </div>
                      <div>
                        <Label htmlFor="make">Make</Label>
                        <Input id="make" placeholder="Honda" value={form.vehicle_make} onChange={set("vehicle_make")} required />
                      </div>
                      <div>
                        <Label htmlFor="model">Model</Label>
                        <Input id="model" placeholder="Civic" value={form.vehicle_model} onChange={set("vehicle_model")} required />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="mileage">Current mileage (optional)</Label>
                        <Input id="mileage" inputMode="numeric" placeholder="85000" value={form.vehicle_mileage} onChange={set("vehicle_mileage")} />
                      </div>
                      <div>
                        <Label htmlFor="plate">License plate (optional)</Label>
                        <Input id="plate" value={form.vehicle_plate} onChange={set("vehicle_plate")} />
                      </div>
                    </div>
                  </section>

                  {/* Maintenance checklist */}
                  <section className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Wrench className="h-4 w-4 text-primary" /> Recent maintenance
                      </div>
                      {checkedCount > 0 && (
                        <span className="text-xs text-muted-foreground">{checkedCount} checked</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Check off anything that's already been done elsewhere recently and enter the
                      odometer reading at the time. This stops us from reminding you about services
                      you don't need yet. You can edit this list anytime from{" "}
                      <span className="font-medium text-foreground">My Vehicles → Maintenance</span>.
                    </p>
                    <div className="rounded-md border border-border/60 divide-y divide-border/60 max-h-[360px] overflow-y-auto">
                      {MAINTENANCE_INTERVALS.map((item) => {
                        const row = maint[item.name];
                        return (
                          <div key={item.name} className="flex items-center gap-3 px-3 py-2">
                            <Checkbox
                              id={`m-${item.name}`}
                              checked={row.checked}
                              onCheckedChange={(v) => toggleMaint(item.name, v === true)}
                            />
                            <label
                              htmlFor={`m-${item.name}`}
                              className="flex-1 text-sm cursor-pointer leading-tight"
                            >
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
