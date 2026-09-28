import { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Loader2, Truck } from "lucide-react";
import { useSeo } from "@/lib/useSeo";

const VEHICLE_TYPES = ["Pickup trucks", "Cargo vans", "Box trucks", "SUVs", "Sedans", "Trailers / equipment"];
const CITIES = ["Fort Myers", "Lehigh Acres", "Cape Coral", "Estero", "Gateway", "Other"];

const schema = z.object({
  company: z.string().trim().min(2, "Enter your company name").max(120),
  contact: z.string().trim().min(2, "Enter your name").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().regex(/^[\d\s()+.-]{10,20}$/, "Enter a valid phone number"),
  password: z.string().min(8, "At least 8 characters").max(72),
  fleetSize: z.coerce.number().int().min(1, "How many vehicles?").max(5000),
  types: z.array(z.string()).max(10),
  yard: z.string().trim().min(5, "Enter the address where vehicles park").max(200),
  city: z.string().min(2, "Pick a city"),
  notes: z.string().max(1000).optional(),
  sms: z.boolean(),
});
type Form = z.input<typeof schema>;

export default function FleetRegister() {
  useSeo({
    title: "Fleet Account Sign-Up | Mike's Mobile Auto Repair",
    description: "Create a fleet account for on-site mobile maintenance and priority repair in Fort Myers and Lehigh Acres.",
    canonical: "https://mikesmautorepair.com/fleet/register",
  });
  const [f, setF] = useState<Form>({ company: "", contact: "", email: "", phone: "", password: "", fleetSize: "" as unknown as number, types: [], yard: "", city: "", notes: "", sms: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const p = schema.safeParse(f);
    if (!p.success) {
      const errs: Record<string, string> = {};
      p.error.issues.forEach((i) => { errs[String(i.path[0])] ??= i.message; });
      setErrors(errs);
      return;
    }
    setErrors({});
    setBusy(true);
    const d = p.data;
    const { data, error } = await supabase.auth.signUp({
      email: d.email,
      password: d.password,
      options: { emailRedirectTo: `${window.location.origin}/portal/fleet`, data: { full_name: d.contact, company_name: d.company } },
    });
    if (error || !data.user) {
      setBusy(false);
      setFormError(error?.message ?? "Couldn't create your account.");
      return;
    }
    if (data.user.identities && data.user.identities.length === 0) {
      setBusy(false);
      setFormError("An account with this email already exists. Sign in instead, or call/text 813-501-7572.");
      return;
    }
    const { error: rpcErr } = await supabase.rpc("submit_fleet_registration", {
      _user_id: data.user.id, _company_name: d.company, _contact_name: d.contact, _phone: d.phone, _email: d.email,
      _fleet_size: d.fleetSize, _vehicle_types: d.types, _yard_address: d.yard, _city: d.city, _notes: d.notes ?? "", _sms_consent: d.sms,
    });
    setBusy(false);
    if (rpcErr) {
      setFormError("Your account was created, but we couldn't save your fleet details. Please call/text 813-501-7572.");
      return;
    }
    setDone(true);
  };

  const err = (k: string) => errors[k] && <p className="text-xs text-destructive mt-1">{errors[k]}</p>;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <section className="pt-28 md:pt-32 pb-16 container mx-auto px-4 max-w-2xl">
        {done ? (
          <Card>
            <CardContent className="py-10 text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-primary mx-auto" />
              <h1 className="text-2xl font-bold">You're registered</h1>
              <p className="text-muted-foreground">Check your email to confirm your account. Mike will reach out within one business day to schedule your fleet audit.</p>
              <Button asChild variant="secondary"><Link to="/fleet">Back to Fleet</Link></Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl"><Truck className="w-6 h-6 text-primary" />Create your fleet account</CardTitle>
              <CardDescription>Tell us about your vehicles. We'll set up your account and schedule a free fleet audit at your yard.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submit} className="space-y-4" noValidate>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div><Label htmlFor="company">Company name</Label><Input id="company" value={f.company} onChange={(e) => set("company", e.target.value)} />{err("company")}</div>
                  <div><Label htmlFor="contact">Your name</Label><Input id="contact" autoComplete="name" value={f.contact} onChange={(e) => set("contact", e.target.value)} />{err("contact")}</div>
                  <div><Label htmlFor="email">Email</Label><Input id="email" type="email" autoComplete="email" value={f.email} onChange={(e) => set("email", e.target.value)} />{err("email")}</div>
                  <div><Label htmlFor="phone">Mobile phone</Label><Input id="phone" type="tel" autoComplete="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} />{err("phone")}</div>
                  <div><Label htmlFor="password">Create a password</Label><Input id="password" type="password" autoComplete="new-password" value={f.password} onChange={(e) => set("password", e.target.value)} />{err("password")}</div>
                  <div><Label htmlFor="size">Number of vehicles</Label><Input id="size" type="number" min={1} value={f.fleetSize as number} onChange={(e) => set("fleetSize", e.target.value as unknown as number)} />{err("fleetSize")}</div>
                </div>
                <div>
                  <Label>Vehicle types</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {VEHICLE_TYPES.map((t) => (
                      <label key={t} className="flex items-center gap-2 text-sm">
                        <Checkbox checked={f.types.includes(t)} onCheckedChange={(v) => set("types", v ? [...f.types, t] : f.types.filter((x) => x !== t))} />{t}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2"><Label htmlFor="yard">Yard / parking address</Label><Input id="yard" autoComplete="street-address" value={f.yard} onChange={(e) => set("yard", e.target.value)} />{err("yard")}</div>
                  <div>
                    <Label>City</Label>
                    <Select value={f.city} onValueChange={(v) => set("city", v)}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>{err("city")}
                  </div>
                </div>
                <div><Label htmlFor="notes">Anything we should know? (optional)</Label><Textarea id="notes" rows={3} value={f.notes} onChange={(e) => set("notes", e.target.value)} /></div>
                <label className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Checkbox className="mt-0.5" checked={f.sms} onCheckedChange={(v) => set("sms", !!v)} />
                  <span>I agree to receive text messages from Mike's Mobile Auto Repair about service, estimates, and invoices. Message frequency varies. Msg & data rates may apply. Reply STOP to opt out, HELP for help. Consent is not a condition of purchase. See our <Link to="/privacy" className="underline">Privacy Policy</Link> and <Link to="/terms" className="underline">Terms</Link>.</span>
                </label>
                {formError && <p className="text-sm text-destructive">{formError}</p>}
                <Button type="submit" size="lg" className="w-full" disabled={busy}>{busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Create fleet account</Button>
                <p className="text-center text-xs text-muted-foreground">Already have an account? <Link to="/login" className="underline">Sign in</Link></p>
              </form>
            </CardContent>
          </Card>
        )}
      </section>
      <Footer />
    </div>
  );
}
