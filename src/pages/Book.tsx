import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import FloatingCallButton from "@/components/FloatingCallButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CalendarCheck, Phone, MapPin, Car } from "lucide-react";

const SOURCES = ["google", "in_app", "phone", "sms", "walk_in", "other"] as const;
type Source = (typeof SOURCES)[number];

const schema = z.object({
  name: z.string().trim().min(2, "Your name is required").max(80),
  phone: z.string().trim().min(10, "Enter a valid phone number").max(20),
  email: z.string().trim().email("Enter a valid email").max(120).optional().or(z.literal("")),
  service_type: z.string().trim().min(2, "Select or describe a service").max(80),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  service_address: z.string().trim().max(200).optional().or(z.literal("")),
  vehicle_info: z.string().trim().max(120).optional().or(z.literal("")),
  requested_date: z.string().trim().max(20).optional().or(z.literal("")),
  requested_time_window: z.string().trim().max(40).optional().or(z.literal("")),
});

type FormState = z.infer<typeof schema>;

const empty: FormState = {
  name: "",
  phone: "",
  email: "",
  service_type: "",
  description: "",
  service_address: "",
  vehicle_info: "",
  requested_date: "",
  requested_time_window: "",
};

const SERVICE_OPTIONS = [
  "Oil & filter change",
  "Brake service",
  "Tire rotation",
  "Battery replacement",
  "Diagnostic / Check engine",
  "AC service",
  "Other (describe below)",
];

const TIME_WINDOWS = ["Morning (8am – 12pm)", "Afternoon (12pm – 5pm)", "Evening (5pm – 8pm)"];

const Book = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const sourceParam = (params.get("source") || "").toLowerCase() as Source;
  const source: Source = (SOURCES as readonly string[]).includes(sourceParam) ? sourceParam : "google";
  const [form, setForm] = useState<FormState>(empty);
  const [busy, setBusy] = useState(false);

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    document.title = "Book Mobile Auto Service | MMAR Care";
  }, []);

  const sourceLabel = useMemo(
    () =>
      ({
        google: "Google",
        in_app: "Web",
        phone: "Phone",
        sms: "SMS",
        walk_in: "Walk-in",
        other: "Other",
      } as Record<Source, string>)[source],
    [source],
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setBusy(true);
    const v = parsed.data;
    const { data, error } = await supabase.rpc("submit_booking_request", {
      _name: v.name,
      _phone: v.phone,
      _email: v.email || null,
      _service_type: v.service_type,
      _description: v.description || null,
      _service_address: v.service_address || null,
      _vehicle_info: v.vehicle_info || null,
      _requested_date: v.requested_date || null,
      _requested_time_window: v.requested_time_window || null,
      _source: source,
    });
    setBusy(false);
    if (error || !data) {
      toast.error(error?.message ?? "Could not submit your request. Please call us.");
      return;
    }
    const token = (data as { token?: string })?.token;
    if (!token) {
      toast.error("Submitted, but couldn't load your confirmation page. We'll text you shortly.");
      return;
    }
    toast.success("Request received! We'll review and text you to confirm your day & time.");
    navigate(`/appointments/${token}`, { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-24 pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-6">
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
              <CalendarCheck className="h-3.5 w-3.5" /> via {sourceLabel}
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold mt-3">Request Mobile Auto Service</h1>
            <p className="text-muted-foreground mt-2">
              Pick your preferred day &amp; time and we'll text you to confirm. Nothing is locked in
              until our team verifies availability — or call{" "}
              <a className="text-primary font-medium" href="tel:8135017572">813-501-7572</a>.
            </p>
          </div>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Request your appointment</CardTitle>
              <CardDescription>
                Takes about a minute. No account required. We'll review and confirm — usually within a few hours.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="name">Your name</Label>
                    <Input id="name" value={form.name} onChange={set("name")} required />
                  </div>
                  <div>
                    <Label htmlFor="phone"><Phone className="inline h-3.5 w-3.5 mr-1" />Mobile</Label>
                    <Input id="phone" type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} required />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email (optional)</Label>
                  <Input id="email" type="email" autoComplete="email" value={form.email} onChange={set("email")} />
                </div>

                <div>
                  <Label htmlFor="service_type">Service needed</Label>
                  <Select value={form.service_type} onValueChange={(v) => setForm((f) => ({ ...f, service_type: v }))}>
                    <SelectTrigger id="service_type"><SelectValue placeholder="Choose a service" /></SelectTrigger>
                    <SelectContent>
                      {SERVICE_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">Describe the issue (optional)</Label>
                  <Textarea id="description" rows={3} value={form.description} onChange={set("description")} placeholder="Squeaky brakes, oil light on, etc." />
                </div>

                <div>
                  <Label htmlFor="vehicle_info"><Car className="inline h-3.5 w-3.5 mr-1" />Vehicle (year / make / model)</Label>
                  <Input id="vehicle_info" placeholder="2018 Toyota Camry" value={form.vehicle_info} onChange={set("vehicle_info")} />
                </div>

                <div>
                  <Label htmlFor="service_address"><MapPin className="inline h-3.5 w-3.5 mr-1" />Service address</Label>
                  <Input id="service_address" placeholder="Where the vehicle will be" value={form.service_address} onChange={set("service_address")} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="requested_date">Preferred date</Label>
                    <Input id="requested_date" type="date" value={form.requested_date} onChange={set("requested_date")} />
                  </div>
                  <div>
                    <Label htmlFor="requested_time_window">Time window</Label>
                    <Select value={form.requested_time_window} onValueChange={(v) => setForm((f) => ({ ...f, requested_time_window: v }))}>
                      <SelectTrigger id="requested_time_window"><SelectValue placeholder="Anytime" /></SelectTrigger>
                      <SelectContent>
                        {TIME_WINDOWS.map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button type="submit" variant="hero" className="w-full" disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Request appointment"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  By submitting, you agree to receive a text from us to confirm. Standard rates may apply.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
      <FloatingCallButton />
    </div>
  );
};

export default Book;
