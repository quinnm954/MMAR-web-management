import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import {
  Check,
  MapPin,
  Clock,
  Wrench,
  ClipboardList,
  Truck,
  Phone,
  MessageSquare,
  Fuel,
  Car,
  Zap,
  ShieldCheck,
} from "lucide-react";

interface Plan {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  monthly_price: number;
  deposit_amount: number;
  total_at_signup: number;
  badge: string | null;
  features: string[];
}

const FEATURES = [
  { icon: MapPin, title: "Mobile Convenience", text: "We come directly to your home, workplace, or roadside location." },
  { icon: ClipboardList, title: "Predictable Maintenance", text: "No surprise maintenance costs or forgotten service intervals." },
  { icon: Clock, title: "Priority Scheduling", text: "Members receive scheduling priority over standard service calls." },
  { icon: Wrench, title: "Professional Vehicle Tracking", text: "Your vehicle history, maintenance, and repairs organized in one place." },
];

const RULES = [
  { q: "Vehicle Eligibility", a: "Membership applies to one VIN and is non-transferable." },
  { q: "Immediate Activation", a: "Benefits activate immediately after payment and signed agreement completion." },
  { q: "Additional Oil Charges", a: "Oil exceeding included quantities billed separately." },
  { q: "Scheduling Policy", a: "Services are by appointment and subject to availability." },
  { q: "Membership Deposit", a: "A non-refundable 3-month deposit is collected to allow immediate activation and protect against abuse or unpaid balances." },
  { q: "Cancellation Policy", a: "Membership may be canceled after the first 3 months. Remaining balances may apply if services rendered exceed payments received." },
];

const FLEET_PHONE = "813-501-7572";
const FLEET_SMS_BODY = encodeURIComponent(
  "Hi MMAR — I'd like a fleet quote. Fleet size: __ vehicles. Mix (cars/SUVs/vans/trucks): __. Fuel types (gas/hybrid/EV/diesel): __. VINs available on request."
);

const VOLUME_TIERS = [
  { range: "5–9 vehicles", discount: "10%" },
  { range: "10–24 vehicles", discount: "15%" },
  { range: "25–49 vehicles", discount: "20%" },
  { range: "50+ vehicles", discount: "Custom" },
];

const PRICING_MATRIX = [
  { type: "Compact / Sedan", icon: Car, oil: "$55 – $85", brakes: "$255 – $360", diag: "$95 – $135" },
  { type: "SUV / Crossover", icon: Car, oil: "$70 – $110", brakes: "$295 – $410", diag: "$110 – $150" },
  { type: "Van / Minivan", icon: Truck, oil: "$80 – $120", brakes: "$310 – $440", diag: "$110 – $160" },
  { type: "Light / Medium Truck", icon: Truck, oil: "$95 – $145", brakes: "$330 – $490", diag: "$120 – $170" },
];

const FUEL_ADJUSTMENTS = [
  { fuel: "Gasoline", icon: Fuel, note: "Baseline pricing", delta: "—" },
  { fuel: "Hybrid", icon: Zap, note: "Specialty oil + HV-safe procedures", delta: "+5–10%" },
  { fuel: "Electric (EV)", icon: Zap, note: "No oil; brake/coolant/HV inspection focus", delta: "Custom" },
  { fuel: "Diesel", icon: Fuel, note: "Higher oil capacity, fuel filters, DEF", delta: "+15–25%" },
];

const FLEET_BENEFITS = [
  { icon: Wrench, title: "On-site service", text: "We come to your yard, lot, or job site — no downtime hauling vehicles to a shop." },
  { icon: Clock, title: "Priority scheduling", text: "Fleet accounts get next-available slots and recurring PM windows." },
  { icon: ShieldCheck, title: "Per-VIN history", text: "Every vehicle gets its own service record, inspection photos, and digital invoices." },
  { icon: Truck, title: "Mixed-fleet ready", text: "Cars, vans, light trucks — gas, hybrid, EV, and diesel all supported." },
];

const FLEET_FAQ = [
  { q: "What counts as a fleet?", a: "Any account with 5 or more vehicles under one billing entity qualifies for fleet pricing." },
  { q: "How is my final price set?", a: "We quote per VIN. Once you share VINs we decode year/make/model/engine/fuel and apply the volume discount tier and any fuel-type adjustment." },
  { q: "Do you use RepairPal pricing?", a: "We reference RepairPal national price ranges as a sanity check for fairness, but your actual quote is built from VIN-specific labor times and local parts pricing." },
  { q: "Can we mix fuel types?", a: "Yes. A single fleet account can combine gas, hybrid, EV, and diesel vehicles. Each VIN is priced individually." },
  { q: "Do you offer recurring PM contracts?", a: "Yes — monthly or quarterly preventive maintenance plans are available with locked-in rates for the contract term." },
  { q: "Invoicing and payment terms?", a: "Net-15 or Net-30 available for approved fleet accounts. Consolidated monthly statements included." },
];

const Memberships = () => {
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    supabase
      .from("membership_plans")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => setPlans((data as Plan[]) ?? []));
  }, []);

  useEffect(() => {
    document.title = "Mobile Mechanic Maintenance Plans | Mike's Mobile Auto Repair";
    const metaDesc = document.querySelector('meta[name="description"]');
    const desc = "Join MMAR's mobile maintenance membership plans in Fort Myers and Lehigh Acres Florida. Mobile oil changes, inspections, memberships, and recurring vehicle maintenance.";
    if (metaDesc) metaDesc.setAttribute("content", desc);
  }, []);

  return (
    <>
      <div className="min-h-screen bg-background">
        <Navigation />

        {/* Hero */}
        <section className="relative pt-24 lg:pt-32 pb-16 lg:pb-24 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5" aria-hidden />
          <div className="container mx-auto max-w-5xl text-center relative">
            <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
              MMAR Care Memberships
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Stress-Free Vehicle Maintenance{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Delivered To You
              </span>
            </h1>
            <p className="text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Mobile oil changes, inspections, memberships, and professional vehicle management designed
              for busy drivers in Fort Myers & Lehigh Acres.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="hero" size="lg" asChild>
                <a href="#plans">View Membership Plans</a>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/portal/membership-signup">Become A Member</Link>
              </Button>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-8 text-sm">
              {["Mobile Service", "Priority Scheduling", "Local Trusted Mechanic", "Fort Myers & Lehigh Acres"].map((b) => (
                <Badge key={b} variant="secondary">{b}</Badge>
              ))}
            </div>
          </div>
        </section>

        {/* Why MMAR */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl lg:text-4xl font-bold text-center mb-12">Why MMAR Members Stay With Us</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <Card key={title} className="border-border/50 hover:border-primary/40 transition-colors">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">{title}</h3>
                    <p className="text-sm text-muted-foreground">{text}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Plans */}
        <section id="plans" className="py-16 px-4 bg-card/30">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl lg:text-4xl font-bold text-center mb-3">Membership Plans</h2>
            <p className="text-center text-muted-foreground mb-12">Choose the plan that fits your driving life.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <Card
                  key={plan.id}
                  className={`relative flex flex-col ${
                    plan.badge ? "border-accent shadow-lg shadow-accent/20 md:scale-105" : "border-border/50"
                  }`}
                >
                  {plan.badge && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground">
                      {plan.badge}
                    </Badge>
                  )}
                  <CardHeader>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    {plan.tagline && <p className="text-sm text-muted-foreground">{plan.tagline}</p>}
                    <div className="pt-3">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold">${plan.monthly_price}</span>
                        <span className="text-muted-foreground">/mo</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-2 space-y-0.5">
                        <div>Deposit: ${plan.deposit_amount.toFixed(2)} (non-refundable)</div>
                        <div className="font-semibold text-foreground">Due at signup: ${plan.total_at_signup.toFixed(2)}</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <ul className="space-y-2 mb-6 flex-1">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      variant={plan.badge ? "hero" : "outline"}
                      className="w-full"
                      asChild
                    >
                      <Link to={`/portal/membership-signup?plan=${plan.slug}`}>Choose {plan.name}</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <p className="text-xs text-center text-muted-foreground mt-8 max-w-2xl mx-auto">
              Additional charges may apply for oil above included quantity, specialty oils, specialty filters,
              oversized vehicles, and diesel vehicles.
            </p>
          </div>
        </section>

        {/* Rules */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-3xl">
            <h2 className="text-3xl font-bold text-center mb-8">Membership Details</h2>
            <Accordion type="single" collapsible className="space-y-2">
              {RULES.map((r, i) => (
                <AccordionItem key={i} value={`r${i}`} className="border border-border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline font-medium">{r.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{r.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default Memberships;
