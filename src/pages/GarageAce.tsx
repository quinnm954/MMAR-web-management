import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Wrench,
  CalendarCheck,
  ClipboardList,
  Receipt,
  Car,
  MessageSquare,
  CreditCard,
  ShieldCheck,
  Users,
  Smartphone,
  BarChart3,
  Phone,
  LogIn,
} from "lucide-react";
import { useSeo } from "@/lib/useSeo";
import { PLATFORM_BRAND } from "@/lib/brand";
import { useAuth } from "@/hooks/useAuth";


const FEATURES = [
  { icon: ClipboardList, title: "Repair orders & estimates", text: "Build estimates, get digital approvals, convert to ROs and invoices in one flow." },
  { icon: CalendarCheck, title: "Online booking & scheduling", text: "Customers book themselves. Dispatch board keeps techs and bays organized." },
  { icon: Car, title: "Vehicle & customer history", text: "VIN-decoded vehicles, full service history, and household-level customer profiles." },
  { icon: Receipt, title: "Invoicing & payments", text: "Branded invoices, pay-by-link, Stripe + ACH, financing, and QuickBooks export." },
  { icon: MessageSquare, title: "2-way SMS & call tracking", text: "Twilio-powered texting and recorded calls, tied to the customer record." },
  { icon: CreditCard, title: "Memberships & subscriptions", text: "Sell recurring care plans with deposits, included services, and auto-billing." },
  { icon: Smartphone, title: "Customer portal + native app", text: "Branded iOS/Android app: vehicles, estimates, invoices, push notifications." },
  { icon: Users, title: "Tech, advisor & admin roles", text: "Time clock, labor pay, productivity reports, and granular permissions." },
  { icon: BarChart3, title: "Sales & productivity reports", text: "Daily sales, tech labor pay, declined-work follow-up, and live KPI dashboard." },
];

const FOR_WHO = [
  "Independent shops who hate the legacy software they're stuck with",
  "Mobile mechanic operations that need scheduling, dispatch, and invoicing in the field",
  "Specialty shops adding subscription care plans as a recurring-revenue line",
  "Multi-tech garages tired of paper ROs, missed callbacks, and Excel labor sheets",
];

const FAQ = [
  {
    q: "Is Garage Ace ready to use today?",
    a: "Yes — it's the same platform powering MMAR Care in Southwest Florida every day. Repair orders, invoicing, memberships, customer portal, native app — all in production.",
  },
  {
    q: "How does pricing work?",
    a: "We're rolling out shop subscriptions in waves. Reach out and we'll walk you through current pricing, what's included, and onboarding timeline.",
  },
  {
    q: "Can we keep our brand?",
    a: "Yes. The platform shell is Garage Ace, but customer-facing surfaces (portal header, emails, SMS, native app) can be themed for your shop name and colors.",
  },
  {
    q: "What about our existing data?",
    a: "We import customers, vehicles, and service history during onboarding. Talk to us about your current system and we'll map a migration path.",
  },
];

const GarageAce = () => {
  const canonical = "https://shop-flow-home.lovable.app/garage-ace";
  const navigate = useNavigate();
  const { user, isAdmin, isStaff, isLoading } = useAuth();

  // Auto-route signed-in users to their portal based on role
  useEffect(() => {
    if (isLoading || !user) return;
    if (isAdmin) navigate("/admin/dashboard", { replace: true });
    else if (isStaff) navigate("/tech", { replace: true });
    else navigate("/portal/dashboard", { replace: true });
  }, [user, isAdmin, isStaff, isLoading, navigate]);


  useSeo({
    title: "Garage Ace — Shop Management Software & Admin/Staff Login",
    description:
      "Garage Ace is modern shop-management software for auto repair shops: repair orders, estimates, invoicing, online booking, memberships, and a branded customer app. Admin and staff sign-in only.",
    canonical,
    breadcrumbs: [
      { name: "Home", url: "https://shop-flow-home.lovable.app/" },
      { name: "Garage Ace", url: canonical },
    ],
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: PLATFORM_BRAND.name,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web, iOS, Android",
      description:
        "Shop-management software for independent auto repair shops and mobile mechanics. Repair orders, estimates, invoicing, online booking, memberships, and branded customer portal.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD", availability: "https://schema.org/PreOrder" },
    },
  });

  const demoMessage = encodeURIComponent(
    "Hi — I run an auto repair shop and want to learn more about Garage Ace. Shop name: __. Location: __. # of techs: __."
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero */}
      <section className="relative pt-28 md:pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background pointer-events-none" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-primary mb-4 bg-primary/10 px-3 py-1.5 rounded-full">
              <Wrench className="h-4 w-4" /> {PLATFORM_BRAND.name}
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-5">
              Run your shop like the <span className="text-primary">pros</span>,{" "}
              <span className="text-accent">without the legacy software tax.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Garage Ace is the modern operating system for independent auto repair shops and mobile
              mechanics. Repair orders, estimates, invoicing, online booking, memberships, and a branded
              customer app — built by a working mechanic, for working mechanics.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="hero" size="lg" asChild>
                <a href={`sms:8135017572?&body=${demoMessage}`}>
                  <MessageSquare className="h-5 w-5 mr-2" /> Request a demo
                </a>
              </Button>
              <Button variant="heroOutline" size="lg" asChild>
                <a href="tel:8135017572">
                  <Phone className="h-5 w-5 mr-2" /> Call (813) 501-7572
                </a>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Currently in production with MMAR Care in Fort Myers · Onboarding new shops in waves.
            </p>
          </div>
        </div>
      </section>

      {/* Sign in (single entry, role auto-detected) */}
      <section id="signin" className="py-12 md:py-16 border-y border-border bg-card/30">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary mb-3 bg-primary/10 px-3 py-1 rounded-full">
            <LogIn className="h-3.5 w-3.5" /> One sign-in for everyone
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            Sign in to Garage Ace
          </h2>
          <p className="text-muted-foreground mb-6">
            Use the same sign-in whether you're a customer, technician, advisor, or admin —
            we'll automatically send you to the right place based on your account.
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-left max-w-2xl mx-auto mb-8">
            <li className="flex items-start gap-2 p-3 rounded-lg border border-border/60 bg-card/50">
              <Users className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span><strong>Customers</strong> → your vehicle portal</span>
            </li>
            <li className="flex items-start gap-2 p-3 rounded-lg border border-border/60 bg-card/50">
              <Wrench className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span><strong>Techs & advisors</strong> → tech app</span>
            </li>
            <li className="flex items-start gap-2 p-3 rounded-lg border border-border/60 bg-card/50">
              <ShieldCheck className="h-4 w-4 text-accent mt-0.5 shrink-0" />
              <span><strong>Admins</strong> → admin dashboard</span>
            </li>
          </ul>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button variant="hero" size="lg" asChild>
              <Link to="/login">
                <LogIn className="h-5 w-5 mr-2" /> Sign in
              </Link>
            </Button>
            <Button variant="heroOutline" size="lg" asChild>
              <Link to="/why-garage-ace">New here? Why the app?</Link>
            </Button>
          </div>
        </div>
      </section>


      {/* Features */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Everything a shop runs on, in one app.</h2>
            <p className="text-muted-foreground">
              No more bouncing between scheduling software, an invoicing tool, a texting app, a
              membership platform, and a paper RO clipboard. Garage Ace is the whole stack.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <Card key={f.title} className="border-border/60 hover:border-primary/40 transition-colors">
                <CardContent className="p-5">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="py-16 md:py-20 bg-card/30 border-y border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Built for shops, not enterprise.</h2>
              <p className="text-muted-foreground mb-6">
                Garage Ace started inside a real mobile mechanic shop because nothing on the market did
                what we needed without a five-figure setup fee and a sales rep on retainer. If any of
                this sounds like you, we should talk.
              </p>
              <ul className="space-y-3">
                {FOR_WHO.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <ShieldCheck className="h-5 w-5 text-accent mt-0.5 shrink-0" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
              <CardContent className="p-6 md:p-8">
                <div className="text-sm font-semibold text-primary mb-2">Proven in the field</div>
                <h3 className="text-2xl font-bold mb-4">Powering MMAR Care every day.</h3>
                <p className="text-muted-foreground mb-4">
                  The same platform you'd license is the one running Mike's Mobile Auto Repair right
                  now — booking jobs, sending invoices, managing memberships, and serving customers
                  through a branded native app.
                </p>
                <Button variant="outline" asChild>
                  <Link to="/mmar-care">See it in action on MMAR Care →</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">Common questions</h2>
          <div className="space-y-4">
            {FAQ.map((f) => (
              <Card key={f.q} className="border-border/60">
                <CardContent className="p-5">
                  <h3 className="font-semibold mb-1.5">{f.q}</h3>
                  <p className="text-sm text-muted-foreground">{f.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-primary/15 via-background to-accent/10 border-t border-border">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to see it run your shop?</h2>
          <p className="text-muted-foreground mb-6">
            Text or call to set up a 20-minute walkthrough. We'll show you the admin, the tech app, and
            the customer portal — and answer pricing.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="hero" size="lg" asChild>
              <a href={`sms:8135017572?&body=${demoMessage}`}>
                <MessageSquare className="h-5 w-5 mr-2" /> Text for a demo
              </a>
            </Button>
            <Button variant="heroOutline" size="lg" asChild>
              <a href="tel:8135017572">
                <Phone className="h-5 w-5 mr-2" /> Call (813) 501-7572
              </a>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default GarageAce;
