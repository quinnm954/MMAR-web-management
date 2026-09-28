import { useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  ClipboardList,
  Zap,
  BadgeDollarSign,
  Percent,
  Check,
  CalendarCheck,
} from "lucide-react";

const PHONE = "813-501-7572";
const AUDIT_SMS = encodeURIComponent(
  "Hi Mike's Mobile Auto Repair — I'd like to request a Fleet Audit. Fleet size: __ vehicles. Make/model mix: __. Yard location: __."
);
const CONSULT_SMS = encodeURIComponent(
  "Hi Mike's Mobile Auto Repair — I'd like to schedule a fleet consultation. Fleet size: __ vehicles. Best day/time: __."
);

const INCLUDED = [
  {
    icon: Wrench,
    title: 'Monthly On-Site "Yard Days"',
    text: "We roll up to your location to perform routine maintenance (oil changes, filter replacements, fluid top-offs, wiper and bulb checks) right where your trucks park. Your vehicles never leave your property.",
  },
  {
    icon: ClipboardList,
    title: "Digital Fleet Health Reports",
    text: "Every month, you get a clear, easy-to-read digital report covering every vehicle's tire tread, battery health, and brake wear. No more guessing — know what needs attention before it breaks.",
  },
  {
    icon: Zap,
    title: "VIP Priority Dispatch",
    text: "When an unexpected breakdown happens, your vehicles jump straight to the front of our queue with guaranteed 24-hour response windows.",
  },
  {
    icon: BadgeDollarSign,
    title: "Zero Mobile Diagnostic Fees",
    text: "We waive all mobile dispatch and diagnostic fees for your fleet vehicles — every time we roll up.",
  },
  {
    icon: Percent,
    title: "Preferred Labor Rates",
    text: "Heavy mechanical work (suspension, alternators, water pumps, brakes) is billed at labor rates that beat the average repair shop or mobile mechanic.",
  },
];

const PLAN_COVERS = [
  "Unlimited digital health inspections",
  "Zero dispatch / diagnostic fees",
  "Priority scheduling",
  "Preferred labor rates",
  "On-site maintenance coordination",
];

const FAQ = [
  { q: "What counts as a fleet?", a: "Any business with 5 or more vehicles under one account qualifies for the Fleet Partner Plan." },
  { q: "What does the Fleet Partner Plan include?", a: "Your whole fleet gets unlimited digital health inspections, zero dispatch and diagnostic fees, priority scheduling, preferred labor rates, and on-site maintenance coordination." },
  { q: "How much does the plan cost?", a: "Every fleet is different — vehicle count, make/model mix, and how hard the vehicles work all change the scope. We quote each fleet individually after a quick fleet audit, and our labor rates are more affordable than the average repair shop or mobile mechanic." },
  { q: "Are parts and fluids included?", a: "No — parts and fluids for routine service are billed transparently per job, so you only pay for what each vehicle actually uses." },
  { q: "When do Yard Days happen?", a: "Usually on a Saturday or before your crews dispatch, so your vehicles are never pulled off a job." },
  { q: "Can we mix vehicle types?", a: "Yes. Vans, pickups, cars, and SUVs — gas, hybrid, EV, and diesel — can all be on one fleet account." },
];

const Fleet = () => {
  useEffect(() => {
    document.title = "Fleet Partner Plan (5+ Vehicles) | Mike's Mobile Auto Repair";
    let el = document.querySelector('meta[name="description"]');
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute("name", "description");
      document.head.appendChild(el);
    }
    el.setAttribute(
      "content",
      "Mobile fleet maintenance in Southwest Florida for trades, contractors, and delivery businesses with 5+ vehicles. Monthly on-site Yard Days, priority dispatch, and labor rates that beat the average shop."
    );

    const ldId = "ld-fleet-faq";
    document.getElementById(ldId)?.remove();
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = ldId;
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
    document.head.appendChild(script);
    return () => script.remove();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <div className="container mx-auto px-4 pt-28 pb-16 md:pt-32 md:pb-24 relative">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-4">
              <Truck className="w-3.5 h-3.5 mr-1.5" />
              Fleet Partner Plan • 5+ Vehicles
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Stop Sending Your Work Vans to the Shop.{" "}
              <span className="text-accent">We Bring the Shop to Your Yard.</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Tailored mobile maintenance and priority fleet care for local trades, contractors, and delivery
              businesses with 5 or more vehicles in Southwest Florida. Eliminate downtime, keep your drivers
              working, and let us manage your maintenance calendar.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <a href="/fleet/register">
                  <Truck className="w-4 h-4 mr-2" />
                  Create Fleet Account
                </a>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <a href={`sms:${PHONE}?&body=${AUDIT_SMS}`}>
                  <ClipboardList className="w-4 h-4 mr-2" />
                  Request a Fleet Audit
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Problem / ROI */}
      <section className="container mx-auto px-4 py-14">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">A Van in a Shop Waiting Room Makes $0.</h2>
          <p className="text-muted-foreground mb-4">
            Every time you pull a vehicle off a job to deal with an oil change, a brake job, or a check-engine
            light, you lose money on labor, scramble to reschedule customers, and deal with administrative
            headaches.
          </p>
          <p className="text-muted-foreground">
            Our <span className="text-foreground font-semibold">Dedicated Fleet Partner Plan</span> flips the
            script. We come directly to your yard or shop — usually on a Saturday or before your crews dispatch —
            to handle routine service and catch failing parts before they strand your drivers on the highway.
          </p>
        </div>
      </section>

      {/* Video */}
      <section className="container mx-auto px-4 pb-14">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-lg border border-border/60 bg-card shadow-lg">
          <video
            className="block h-auto w-full"
            controls
            playsInline
            preload="metadata"
            aria-label="Mike's Mobile Auto Repair fleet service overview"
          >
            <source src="/videos/mmar-fleet-overview.mp4" type="video/mp4" />
            Your browser does not support this video.
          </video>
        </div>
      </section>

      {/* What's included */}
      <section className="container mx-auto px-4 py-14 border-t border-border/50">
        <div className="text-center mb-10 max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-2">What's Included</h2>
          <p className="text-muted-foreground">
            Designed specifically for fleets of 5+ vehicles to act as your outsourced fleet maintenance department.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {INCLUDED.map((b) => {
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

      {/* Fleet value */}
      <section className="container mx-auto px-4 py-14 border-t border-border/50">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Built Around Uptime</h2>
          <p className="text-muted-foreground">
            One plan that keeps every vehicle in your yard serviced, tracked, and on the road.
          </p>
        </div>
        <Card className="max-w-xl mx-auto border-accent/40">
          <CardContent className="py-8">
            <h3 className="text-2xl font-bold text-center mb-1">The Fleet Partner Plan</h3>
            <p className="text-center text-sm text-muted-foreground mb-6">Minimum requirement: 5 vehicles</p>
            <div className="mb-6 rounded-lg border border-accent/30 bg-accent/5 p-4 text-center">
              <p className="text-sm font-semibold text-accent mb-1">
                Affordable labor, better than the average shop
              </p>
              <p className="text-sm text-muted-foreground">
                No hourly surprises and no upsell pressure — just labor rates that beat the typical repair shop
                or mobile mechanic, agreed before any wrench turns.
              </p>
            </div>
            <ul className="space-y-2 mb-6">
              {PLAN_COVERS.map((c) => (
                <li key={c} className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-accent shrink-0" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground mb-6">
              Note: Cost of specific parts and fluids for routine service is billed transparently per job.
            </p>
            <Button asChild size="lg" className="w-full">
              <a href="/fleet/register">
                <Truck className="w-4 h-4 mr-2" />
                Create Fleet Account
              </a>
            </Button>
            <p className="text-center text-xs text-muted-foreground mt-3">
              Every fleet is quoted individually — vehicle count, make/model mix, and how hard the vehicles work.
            </p>
          </CardContent>
        </Card>
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
            <h2 className="text-3xl font-bold mb-2">Ready to Keep Your Fleet on the Road?</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Let's talk about your vehicle count, make/model mix, and how we can set up a custom maintenance
              schedule for your yard.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button asChild size="lg" variant="outline">
                <a href={`tel:${PHONE}`}>
                  <Phone className="w-4 h-4 mr-2" />
                  Call or Text Us Directly
                </a>
              </Button>
              <Button asChild size="lg">
                <a href={`sms:${PHONE}?&body=${CONSULT_SMS}`}>
                  <CalendarCheck className="w-4 h-4 mr-2" />
                  Schedule Your Fleet Consultation
                </a>
              </Button>
            </div>
            <div className="flex items-center justify-center gap-2 mt-6 text-sm text-muted-foreground">
              <MessageSquare className="w-4 h-4 text-accent" /> {PHONE} • Southwest Florida service area
            </div>
          </CardContent>
        </Card>
      </section>

      <Footer />
    </div>
  );
};

export default Fleet;
