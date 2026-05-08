import { useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Truck,
  Phone,
  MessageSquare,
  Wrench,
  ShieldCheck,
  Clock,
  Fuel,
  Car,
  Zap,
  Check,
} from "lucide-react";

const PHONE = "813-501-7572";
const SMS_BODY = encodeURIComponent(
  "Hi MMAR — I'd like a fleet quote. Fleet size: __ vehicles. Mix (cars/SUVs/vans/trucks): __. Fuel types (gas/hybrid/EV/diesel): __. VINs available on request."
);

// Volume discount tiers (single 5+ plan with scaling discount)
const VOLUME_TIERS = [
  { range: "5–9 vehicles", discount: "10%" },
  { range: "10–24 vehicles", discount: "15%" },
  { range: "25–49 vehicles", discount: "20%" },
  { range: "50+ vehicles", discount: "Custom" },
];

// RepairPal-style typical service ranges (informational only — actual price by VIN)
// Source guidance: RepairPal national average price ranges for common services.
const PRICING_MATRIX = [
  {
    type: "Compact / Sedan",
    icon: Car,
    oil: "$55 – $85",
    brakes: "$255 – $360",
    diag: "$95 – $135",
  },
  {
    type: "SUV / Crossover",
    icon: Car,
    oil: "$70 – $110",
    brakes: "$295 – $410",
    diag: "$110 – $150",
  },
  {
    type: "Van / Minivan",
    icon: Truck,
    oil: "$80 – $120",
    brakes: "$310 – $440",
    diag: "$110 – $160",
  },
  {
    type: "Light / Medium Truck",
    icon: Truck,
    oil: "$95 – $145",
    brakes: "$330 – $490",
    diag: "$120 – $170",
  },
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

const FAQ = [
  { q: "What counts as a fleet?", a: "Any account with 5 or more vehicles under one billing entity qualifies for fleet pricing." },
  { q: "How is my final price set?", a: "We quote per VIN. Once you share VINs we decode year/make/model/engine/fuel and apply the volume discount tier and any fuel-type adjustment." },
  { q: "Do you use RepairPal pricing?", a: "We reference RepairPal national price ranges as a sanity check for fairness, but your actual quote is built from VIN-specific labor times and local parts pricing." },
  { q: "Can we mix fuel types?", a: "Yes. A single fleet account can combine gas, hybrid, EV, and diesel vehicles. Each VIN is priced individually." },
  { q: "Do you offer recurring PM contracts?", a: "Yes — monthly or quarterly preventive maintenance plans are available with locked-in rates for the contract term." },
  { q: "Invoicing and payment terms?", a: "Net-15 or Net-30 available for approved fleet accounts. Consolidated monthly statements included." },
];

const Fleet = () => {
  useEffect(() => {
    document.title = "Fleet Maintenance Plans (5+ Vehicles) | MMAR";
    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("name", name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };
    setMeta(
      "description",
      "Mobile fleet maintenance for 5+ vehicles in SW Florida. Volume discounts, per-VIN pricing for cars, SUVs, vans, trucks across gas, hybrid, EV, and diesel."
    );
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <div className="container mx-auto px-4 py-16 md:py-24 relative">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-4">
              <Truck className="w-3.5 h-3.5 mr-1.5" />
              Fleet Plans • 5+ Vehicles
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Mobile fleet maintenance, priced per VIN.
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              One account for your whole fleet. Volume discounts that scale with vehicle count, fair pricing
              benchmarked to RepairPal ranges, and final quotes built from each VIN's actual labor times and
              fuel type.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-primary text-primary-foreground">
                <a href={`sms:${PHONE}?&body=${SMS_BODY}`}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Text for fleet quote
                </a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href={`tel:${PHONE}`}>
                  <Phone className="w-4 h-4 mr-2" />
                  Call {PHONE}
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Volume tiers */}
      <section className="container mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-2">Volume discount tiers</h2>
          <p className="text-muted-foreground">One plan. Discount scales automatically with your fleet size.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {VOLUME_TIERS.map((t) => (
            <Card key={t.range} className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-muted-foreground font-medium">{t.range}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-accent">{t.discount}</div>
                <div className="text-xs text-muted-foreground mt-1">off standard labor rate</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing matrix */}
      <section className="container mx-auto px-4 py-14 border-t border-border/50">
        <div className="max-w-3xl mb-8">
          <h2 className="text-3xl font-bold mb-2">Reference pricing by vehicle type</h2>
          <p className="text-muted-foreground">
            Typical service ranges below are benchmarked against RepairPal national averages for fairness.
            Your actual fleet quote is computed from each VIN — these are reference ranges only.
          </p>
        </div>
        <div className="rounded-lg border border-border/60 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle Type</TableHead>
                <TableHead>Oil & Filter</TableHead>
                <TableHead>Front Brake Job</TableHead>
                <TableHead>Diagnostic</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PRICING_MATRIX.map((row) => {
                const Icon = row.icon;
                return (
                  <TableRow key={row.type}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-primary" />
                        {row.type}
                      </div>
                    </TableCell>
                    <TableCell>{row.oil}</TableCell>
                    <TableCell>{row.brakes}</TableCell>
                    <TableCell>{row.diag}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-3">Fuel-type adjustments</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {FUEL_ADJUSTMENTS.map((f) => {
              const Icon = f.icon;
              return (
                <Card key={f.fuel} className="border-border/60">
                  <CardContent className="pt-5">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-4 h-4 text-accent" />
                      <span className="font-semibold">{f.fuel}</span>
                      <Badge variant="outline" className="ml-auto text-xs">{f.delta}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{f.note}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Adjustments stack with your volume tier discount. Final per-VIN price confirmed before any work begins.
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="container mx-auto px-4 py-14 border-t border-border/50">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-2">Why fleets choose MMAR</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {FLEET_BENEFITS.map((b) => {
            const Icon = b.icon;
            return (
              <Card key={b.title} className="border-border/60">
                <CardContent className="pt-6">
                  <Icon className="w-8 h-8 text-primary mb-3" />
                  <h3 className="font-semibold mb-1">{b.title}</h3>
                  <p className="text-sm text-muted-foreground">{b.text}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="container mx-auto px-4 py-14 border-t border-border/50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-6 text-center">How fleet quotes work</h2>
          <ol className="space-y-4">
            {[
              "Text or call us with your fleet size and vehicle mix.",
              "Send VINs (CSV, list, or photo of registrations) — we decode year/make/model/engine/fuel.",
              "We build a per-VIN quote with the volume discount tier and any fuel-type adjustment applied.",
              "You approve, we schedule recurring on-site PM and on-demand repairs at your locations.",
            ].map((step, i) => (
              <li key={i} className="flex gap-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  {i + 1}
                </div>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-4 py-14 border-t border-border/50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-6 text-center">Fleet FAQ</h2>
          <Accordion type="single" collapsible className="w-full">
            {FAQ.map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-14">
        <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-accent/10">
          <CardContent className="py-10 text-center">
            <h2 className="text-3xl font-bold mb-2">Ready for a fleet quote?</h2>
            <p className="text-muted-foreground mb-6">
              Send your VINs — we'll return a per-vehicle price sheet within one business day.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button asChild size="lg">
                <a href={`sms:${PHONE}?&body=${SMS_BODY}`}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Text fleet quote
                </a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href={`tel:${PHONE}`}>
                  <Phone className="w-4 h-4 mr-2" />
                  Call {PHONE}
                </a>
              </Button>
            </div>
            <div className="flex items-center justify-center gap-2 mt-6 text-sm text-muted-foreground">
              <Check className="w-4 h-4 text-accent" /> No obligation • SW Florida service area
            </div>
          </CardContent>
        </Card>
      </section>

      <Footer />
    </div>
  );
};

export default Fleet;
