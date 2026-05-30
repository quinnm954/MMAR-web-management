import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import FloatingCallButton from "@/components/FloatingCallButton";
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
  Car,
  CalendarCheck,
  ClipboardList,
  Camera,
  Receipt,
  Bell,
  Phone,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Smartphone,
} from "lucide-react";
import { useSeo } from "@/lib/useSeo";

const PHONE = "8135017572";
const PHONE_PRETTY = "(813) 501-7572";

const PROBLEMS = [
  "Receipts crumpled in the glove box",
  "Forgetting when your last oil change was",
  "Phone tag for quotes and approvals",
  "Paper inspection sheets that disappear",
  "Two cars in the household, two service histories, zero organization",
];

const FEATURES = [
  {
    icon: Car,
    title: "Every vehicle in one place",
    text: "Add each car, truck, or van in your household. Service history, mileage, warranty, and recommended maintenance — all on one screen.",
  },
  {
    icon: CalendarCheck,
    title: "Book without phone tag",
    text: "Request an appointment in 30 seconds. Pick a time window that works. We confirm by text.",
  },
  {
    icon: ClipboardList,
    title: "Approve estimates from your phone",
    text: "See itemized parts and labor before any wrench turns. Tap to approve — no callbacks, no surprise charges.",
  },
  {
    icon: Camera,
    title: "Digital inspections with photos",
    text: "See exactly what your tech sees: photos of brake pads, leaks, worn belts. No more 'just trust me.'",
  },
  {
    icon: Receipt,
    title: "Pay and pull receipts anytime",
    text: "Pay invoices online, see receipts, and pull your full service history any time — perfect for resale or trade-in.",
  },
  {
    icon: Bell,
    title: "Reminders that actually help",
    text: "Get a heads-up before your oil change is due, your battery is aging, or your warranty is about to expire.",
  },
];

const FAQ = [
  {
    q: "Do I have to pay for the app?",
    a: "No. The app is free for every customer of Mike's Mobile Auto Repair. You only pay for services you book. MMAR Care is an optional monthly maintenance plan you can subscribe to inside the app if you want included services and discounts — but the app itself is always free.",
  },
  {
    q: "Do I need to download anything?",
    a: "No. It works in any web browser on your phone, tablet, or computer. If you want a one-tap shortcut, you can install the native app from the App Store or Google Play, but it's optional.",
  },
  {
    q: "What's the difference between the app and MMAR Care?",
    a: "The app is the tool. MMAR Care is the optional monthly maintenance plan. Think of the app as your garage on your phone, and MMAR Care as a subscription that bundles in oil changes, priority scheduling, and discounts.",
  },
  {
    q: "Is my information safe?",
    a: "Yes. Your account is private to you. We never sell your data. Payment processing runs through Stripe, the same processor used by millions of legitimate businesses.",
  },
  {
    q: "Can my spouse or family share access?",
    a: "Yes. Add every vehicle in your household to one account, and we can also link family members so you both see service history and approve estimates.",
  },
  {
    q: "What if I just want to call?",
    a: "Always an option. The shop number is on every page — call or text any time. The app just makes the in-between easier.",
  },
];

const WhyGarageAce = () => {
  useSeo({
    title: "Why Do I Need This App? | Garage Ace by Mike's Mobile Auto Repair",
    description:
      "Garage Ace is the free customer app from Mike's Mobile Auto Repair. Track vehicles, approve estimates from your phone, see inspection photos, pay invoices, and manage your MMAR Care plan — all in one place.",
    canonical: "https://mikesmautorepair.com/why-garage-ace",
    breadcrumbs: [
      { name: "Home", url: "https://mikesmautorepair.com/" },
      { name: "Why Garage Ace", url: "https://mikesmautorepair.com/why-garage-ace" },
    ],
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="pt-24 md:pt-28">
        {/* Hero */}
        <section className="relative px-4 py-12 md:py-20 overflow-hidden">
          <div
            className="absolute inset-0 bg-gradient-to-br from-primary/15 via-background to-accent/10"
            aria-hidden
          />
          <div className="container mx-auto max-w-3xl text-center relative">
            <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
              <Smartphone className="w-3.5 h-3.5 mr-1" /> The free app from Mike's Mobile Auto Repair
            </Badge>
            <h1 className="font-display text-3xl sm:text-4xl md:text-6xl tracking-wide mb-5">
              <span className="text-sky">Your car,</span>{" "}
              <span className="text-gold">your phone,</span>{" "}
              <span className="text-foreground">your peace of mind.</span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-7">
              Garage Ace is the free customer app we built so you never have to dig through
              receipts, play phone tag, or guess when your last service was again.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" variant="hero" asChild>
                <Link to="/login?tab=signup">
                  Create your free account <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href={`tel:${PHONE}`}>
                  <Phone className="w-4 h-4 mr-1" /> Call {PHONE_PRETTY}
                </a>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              No credit card. No download required. Works on any phone.
            </p>
          </div>
        </section>

        {/* The problem */}
        <section className="px-4 py-14">
          <div className="container mx-auto max-w-3xl">
            <h2 className="font-display text-2xl md:text-4xl text-center mb-3">
              <span className="text-sky">If you own a car,</span>{" "}
              <span className="text-foreground">you know this story.</span>
            </h2>
            <p className="text-center text-muted-foreground mb-8">
              We built Garage Ace to fix the parts of car ownership that have always been a mess.
            </p>
            <ul className="grid gap-3 max-w-xl mx-auto">
              {PROBLEMS.map((p) => (
                <li
                  key={p}
                  className="flex items-start gap-3 p-4 rounded-lg border border-border/60 bg-card/40"
                >
                  <span className="w-2 h-2 rounded-full bg-destructive/70 mt-2 shrink-0" />
                  <span className="text-foreground">{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* What it does */}
        <section className="px-4 py-14 bg-card/30 border-y border-border/50">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-10">
              <Badge variant="outline" className="mb-3 border-accent/40 text-accent">
                What the app actually does
              </Badge>
              <h2 className="font-display text-2xl md:text-4xl">
                <span className="text-gold">Six things</span>{" "}
                <span className="text-foreground">that make car ownership painless.</span>
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <Card
                  key={title}
                  className="border-border/60 hover:border-primary/40 transition-colors"
                >
                  <CardContent className="p-5">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-1">{title}</h3>
                    <p className="text-sm text-muted-foreground">{text}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Where MMAR Care fits */}
        <section className="px-4 py-14">
          <div className="container mx-auto max-w-3xl">
            <Card className="border-accent/40 bg-gradient-to-br from-accent/10 via-card to-primary/10">
              <CardContent className="p-6 md:p-10">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-accent" />
                  <Badge className="bg-accent text-accent-foreground">Optional</Badge>
                </div>
                <h2 className="font-display text-2xl md:text-3xl mb-3">
                  <span className="text-foreground">Where</span>{" "}
                  <span className="text-gold">MMAR Care</span>{" "}
                  <span className="text-foreground">fits in</span>
                </h2>
                <p className="text-muted-foreground mb-4">
                  <strong className="text-foreground">MMAR Care is not the app.</strong> MMAR Care
                  is our optional monthly maintenance plan you can subscribe to inside the app. It
                  bundles in oil changes, priority scheduling, discounted labor, and a transferable
                  warranty.
                </p>
                <p className="text-muted-foreground mb-6">
                  Think of it this way: the app is your garage on your phone — free, forever. MMAR
                  Care is a subscription you can turn on when you want predictable, included
                  service.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" asChild>
                    <Link to="/mmar-care">
                      Learn about MMAR Care <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/mmar-care">See plans & pricing</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* FAQ */}
        <section className="px-4 py-14 bg-card/30 border-t border-border/50">
          <div className="container mx-auto max-w-3xl">
            <h2 className="font-display text-2xl md:text-4xl text-center mb-3">
              <span className="text-sky">Common questions</span>
            </h2>
            <p className="text-center text-muted-foreground mb-8">
              Short answers to what most customers ask first.
            </p>
            <Accordion type="single" collapsible className="space-y-2">
              {FAQ.map((item, i) => (
                <AccordionItem
                  key={i}
                  value={`f${i}`}
                  className="border border-border rounded-lg px-4 bg-background/40"
                >
                  <AccordionTrigger className="hover:no-underline font-medium text-left">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-4 py-14 md:py-20">
          <div className="container mx-auto max-w-3xl">
            <div className="rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/15 via-background to-accent/10 p-8 md:p-12 text-center">
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-gold mb-3">
                <ShieldCheck className="w-4 h-4" /> 30-second sign-up
              </div>
              <h2 className="font-display text-2xl md:text-4xl mb-3">
                <span className="text-sky">Get it set up</span>{" "}
                <span className="text-gold">in under a minute.</span>
              </h2>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                Create your free account, add your vehicles, and the next time something goes wrong
                with your car, everything's already in one place.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" variant="hero" asChild>
                  <Link to="/login?tab=signup">
                    Create free account <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href={`sms:${PHONE}`}>
                    <MessageSquare className="w-4 h-4 mr-1" /> Text us instead
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

export default WhyGarageAce;
