import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import FloatingCallButton from "@/components/FloatingCallButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import {
  Check,
  ShieldCheck,
  Clock,
  Wrench,
  Sparkles,
  CalendarCheck,
  CreditCard,
  ArrowRight,
  Phone,
  MessageSquare,
  Smartphone,
} from "lucide-react";
import mmarLogo from "@/assets/mmar-logo.jpeg";

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

const BENEFITS = [
  {
    icon: Wrench,
    title: "Included maintenance",
    text: "Oil changes and routine services are baked into your plan — no per-visit invoice surprise.",
  },
  {
    icon: Clock,
    title: "Priority scheduling",
    text: "Members jump the line. Get on the schedule before walk-in calls and standard service requests.",
  },
  {
    icon: Sparkles,
    title: "Discounted labor & parts",
    text: "Member-only pricing on brakes, batteries, tires, and seasonal work — usually pays for the plan after one or two visits.",
  },
  {
    icon: ShieldCheck,
    title: "Transferable warranty",
    text: "Magnuson-Moss compliant coverage on parts and labor, transferable on resale — a real selling point at trade-in.",
  },
  {
    icon: CalendarCheck,
    title: "Proactive reminders",
    text: "We track your mileage and service intervals so you never miss a fluid change, brake check, or seasonal AC service.",
  },
  {
    icon: CreditCard,
    title: "Predictable monthly billing",
    text: "One small monthly charge instead of an unexpected $400 invoice every few months.",
  },
];

const RULES = [
  { q: "Vehicle Eligibility", a: "Membership applies to one VIN and is non-transferable between vehicles." },
  { q: "Immediate Activation", a: "Benefits activate immediately after payment and signed agreement completion." },
  { q: "Additional Oil Charges", a: "Oil exceeding included quantities is billed separately at member-discounted rates." },
  { q: "Scheduling Policy", a: "Services are by appointment and subject to availability — members get priority windows." },
  { q: "Membership Deposit", a: "A non-refundable 3-month deposit is collected at signup to allow immediate activation and protect against abuse." },
  { q: "Cancellation Policy", a: "Membership may be canceled after the first 3 months. Remaining balances may apply if services rendered exceed payments received." },
];

const MmarCare = () => {
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    document.title = "MMAR Care Maintenance Plans | Mike's Mobile Auto Repair";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        "content",
        "MMAR Care is the monthly maintenance plan from Mike's Mobile Auto Repair. Included oil changes, priority scheduling, discounted labor, and a transferable warranty for drivers in Fort Myers & Lehigh Acres."
      );
    }
    supabase
      .from("membership_plans")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => setPlans((data as Plan[]) ?? []));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="pt-20 lg:pt-24">
        {/* Hero */}
        <section className="relative px-4 py-12 lg:py-20 overflow-hidden">
          <div
            className="absolute inset-0 bg-gradient-to-br from-primary/15 via-background to-accent/10"
            aria-hidden
          />
          <div className="container mx-auto max-w-4xl relative text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <img src={mmarLogo} alt="MMAR" className="h-12 w-auto rounded shadow-md" />
              <Badge variant="outline" className="border-accent/40 text-accent">
                MMAR Care Maintenance Plans
              </Badge>
            </div>
            <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl tracking-wide mb-5">
              <span className="text-sky">Maintenance you</span>{" "}
              <span className="text-gold">never have to think about.</span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-7">
              MMAR Care is our monthly maintenance subscription. Included oil changes, priority
              scheduling, member-only discounts, and a transferable warranty — designed for busy
              drivers across Fort Myers, Lehigh Acres, and Cape Coral.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="hero" size="lg" asChild>
                <a href="#plans">
                  View plans <ArrowRight className="w-4 h-4 ml-1" />
                </a>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/login?tab=signup">Create account & subscribe</Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-5">
              Already a member?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Open the Garage Ace app
              </Link>
            </p>
          </div>
        </section>

        {/* What is MMAR Care */}
        <section className="px-4 py-14">
          <div className="container mx-auto max-w-3xl">
            <Card className="border-primary/30 bg-card/40">
              <CardContent className="p-6 md:p-10">
                <Badge variant="outline" className="mb-3 border-primary/30 text-primary">
                  What is MMAR Care?
                </Badge>
                <h2 className="font-display text-2xl md:text-3xl mb-3">
                  <span className="text-foreground">A</span>{" "}
                  <span className="text-gold">subscription</span>{" "}
                  <span className="text-foreground">for vehicle maintenance.</span>
                </h2>
                <p className="text-muted-foreground mb-3">
                  MMAR Care is a monthly plan that covers your routine maintenance and gives you
                  member-only benefits at Mike's Mobile Auto Repair. You pay a small monthly fee,
                  we cover the predictable stuff, and you get priority access whenever something
                  unexpected comes up.
                </p>
                <p className="text-muted-foreground">
                  Your plan lives inside the free{" "}
                  <Link to="/why-garage-ace" className="text-primary hover:underline font-medium">
                    Garage Ace app
                  </Link>{" "}
                  — that's where you manage vehicles, see service history, approve estimates, and
                  schedule your included services.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Benefits */}
        <section className="px-4 py-14 bg-card/30 border-y border-border/50">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-10">
              <h2 className="font-display text-2xl md:text-4xl mb-3">
                <span className="text-sky">Why MMAR Care members</span>{" "}
                <span className="text-gold">stay with us.</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Predictable cost. Real priority. Coverage that actually applies to the work your car
                needs.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {BENEFITS.map(({ icon: Icon, title, text }) => (
                <Card
                  key={title}
                  className="border-border/60 hover:border-accent/40 transition-colors"
                >
                  <CardContent className="p-5">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-3">
                      <Icon className="w-5 h-5 text-accent" />
                    </div>
                    <h3 className="font-semibold mb-1">{title}</h3>
                    <p className="text-sm text-muted-foreground">{text}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Plans */}
        <section id="plans" className="px-4 py-14">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-10">
              <h2 className="font-display text-2xl md:text-4xl mb-3">
                <span className="text-foreground">Pick the plan that fits</span>{" "}
                <span className="text-sky">your driving life.</span>
              </h2>
              <p className="text-muted-foreground">
                One VIN per plan. Cancel after the first 3 months.
              </p>
            </div>
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
                    {plan.tagline && (
                      <p className="text-sm text-muted-foreground">{plan.tagline}</p>
                    )}
                    <div className="pt-3">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold">${plan.monthly_price}</span>
                        <span className="text-muted-foreground">/mo</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-2 space-y-0.5">
                        <div>Deposit: ${plan.deposit_amount.toFixed(2)} (non-refundable)</div>
                        <div className="font-semibold text-foreground">
                          Due at signup: ${plan.total_at_signup.toFixed(2)}
                        </div>
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
                      <Link to={`/portal/membership-signup?plan=${plan.slug}`}>
                        Choose {plan.name}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            <p className="text-xs text-center text-muted-foreground mt-8 max-w-2xl mx-auto">
              Additional charges may apply for oil above included quantity, specialty oils,
              specialty filters, oversized vehicles, and diesel vehicles. Fleet pricing (5+
              vehicles) available — see{" "}
              <Link to="/mmar-care#fleet" className="text-primary hover:underline">
                fleet plans
              </Link>
              .
            </p>
          </div>
        </section>

        {/* Where to manage it */}
        <section className="px-4 py-14 bg-card/30 border-y border-border/50">
          <div className="container mx-auto max-w-3xl">
            <Card className="border-primary/40 bg-gradient-to-br from-primary/10 via-card to-accent/10">
              <CardContent className="p-6 md:p-10 text-center">
                <Smartphone className="w-10 h-10 text-primary mx-auto mb-4" />
                <h2 className="font-display text-2xl md:text-3xl mb-3">
                  <span className="text-foreground">You manage MMAR Care</span>{" "}
                  <span className="text-sky">inside the free Garage Ace app.</span>
                </h2>
                <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                  Schedule included services, see what's used and what's remaining, view inspection
                  photos, and update billing — all from your phone.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button variant="hero" asChild>
                    <Link to="/why-garage-ace">
                      What's the app? <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/login">Sign in to the app</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Membership rules */}
        <section className="px-4 py-14">
          <div className="container mx-auto max-w-3xl">
            <h2 className="font-display text-2xl md:text-3xl text-center mb-8">
              <span className="text-sky">Membership details</span>
            </h2>
            <Accordion type="single" collapsible className="space-y-2">
              {RULES.map((r, i) => (
                <AccordionItem
                  key={i}
                  value={`r${i}`}
                  className="border border-border rounded-lg px-4"
                >
                  <AccordionTrigger className="hover:no-underline font-medium">
                    {r.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{r.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 py-14 md:py-20">
          <div className="container mx-auto max-w-3xl">
            <div className="rounded-2xl border border-accent/40 bg-gradient-to-br from-accent/10 via-background to-primary/10 p-8 md:p-12 text-center">
              <h2 className="font-display text-2xl md:text-4xl mb-3">
                <span className="text-gold">Ready to lock in</span>{" "}
                <span className="text-foreground">predictable car care?</span>
              </h2>
              <p className="text-muted-foreground mb-6">
                Create your free account, pick a plan, and we'll handle the rest.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" variant="hero" asChild>
                  <a href="#plans">View plans</a>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="tel:8135017572">
                    <Phone className="w-4 h-4 mr-1" /> Call (813) 501-7572
                  </a>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="sms:8135017572">
                    <MessageSquare className="w-4 h-4 mr-1" /> Text us
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <FloatingCallButton />
    </div>
  );
};

export default MmarCare;
