import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Phone, MapPin, Car, ArrowRight } from "lucide-react";
import Navigation from "@/components/Navigation";

const schema = z.object({
  phone: z
    .string()
    .trim()
    .min(10, "Enter a valid phone number")
    .max(20),
  address_line1: z.string().trim().min(3, "Street address is required").max(200),
  address_line2: z.string().trim().max(100).optional().or(z.literal("")),
  city: z.string().trim().min(2, "City is required").max(80),
  state: z.string().trim().min(2, "State is required").max(2),
  postal_code: z.string().trim().min(5, "ZIP is required").max(10),
  vehicle_year: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "Enter a 4-digit year"),
  vehicle_make: z.string().trim().min(1, "Make is required").max(40),
  vehicle_model: z.string().trim().min(1, "Model is required").max(40),
  vehicle_mileage: z
    .string()
    .trim()
    .max(7)
    .optional()
    .or(z.literal("")),
  vehicle_plate: z.string().trim().max(15).optional().or(z.literal("")),
});

type FormState = z.infer<typeof schema>;

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

const PortalOnboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState<FormState>(empty);
  const [busy, setBusy] = useState(false);
  const [hydrating, setHydrating] = useState(true);

  // Pre-fill any data the user already has so they don't re-type it
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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setBusy(true);
    const v = parsed.data;
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
    const { error: vErr } = await supabase.from("vehicles").insert({
      owner_id: user.id,
      year: Number(v.vehicle_year),
      make: v.vehicle_make,
      model: v.vehicle_model,
      current_mileage: v.vehicle_mileage ? Number(v.vehicle_mileage) : null,
      license_plate: v.vehicle_plate || null,
      is_active: true,
    });
    setBusy(false);
    if (vErr) {
      toast.error(vErr.message);
      return;
    }
    try {
      sessionStorage.setItem(`onboarded:${user.id}`, "1");
    } catch {}
    toast.success("Welcome aboard! Your account is all set.");
    navigate("/portal/dashboard", { replace: true });
  };

  const skip = () => {
    if (!user) return;
    try {
      sessionStorage.setItem(`onboarded:${user.id}`, "skipped");
    } catch {}
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
                vehicle's service history. Takes under a minute.
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
                      <Input
                        id="addr1"
                        autoComplete="address-line1"
                        value={form.address_line1}
                        onChange={set("address_line1")}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="addr2">Apt / Suite (optional)</Label>
                      <Input
                        id="addr2"
                        autoComplete="address-line2"
                        value={form.address_line2}
                        onChange={set("address_line2")}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          autoComplete="address-level2"
                          value={form.city}
                          onChange={set("city")}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          autoComplete="address-level1"
                          maxLength={2}
                          value={form.state}
                          onChange={set("state")}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="zip">ZIP code</Label>
                      <Input
                        id="zip"
                        autoComplete="postal-code"
                        inputMode="numeric"
                        value={form.postal_code}
                        onChange={set("postal_code")}
                        required
                      />
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
                        <Input
                          id="year"
                          inputMode="numeric"
                          maxLength={4}
                          placeholder="2020"
                          value={form.vehicle_year}
                          onChange={set("vehicle_year")}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="make">Make</Label>
                        <Input
                          id="make"
                          placeholder="Honda"
                          value={form.vehicle_make}
                          onChange={set("vehicle_make")}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="model">Model</Label>
                        <Input
                          id="model"
                          placeholder="Civic"
                          value={form.vehicle_model}
                          onChange={set("vehicle_model")}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="mileage">Current mileage (optional)</Label>
                        <Input
                          id="mileage"
                          inputMode="numeric"
                          placeholder="85000"
                          value={form.vehicle_mileage}
                          onChange={set("vehicle_mileage")}
                        />
                      </div>
                      <div>
                        <Label htmlFor="plate">License plate (optional)</Label>
                        <Input
                          id="plate"
                          value={form.vehicle_plate}
                          onChange={set("vehicle_plate")}
                        />
                      </div>
                    </div>
                  </section>

                  <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 pt-2">
                    <Button type="button" variant="ghost" onClick={skip} disabled={busy}>
                      Skip for now
                    </Button>
                    <Button type="submit" variant="hero" disabled={busy} className="sm:min-w-[200px]">
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
