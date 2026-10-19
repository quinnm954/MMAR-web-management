import { Link } from "react-router-dom";
import { Phone, MessageCircle, MapPin, ArrowRight, Wrench, Gauge, BatteryCharging, Disc3, ShieldCheck, ClipboardCheck, Building2 } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import FloatingCallButton from "@/components/FloatingCallButton";
import { Button } from "@/components/ui/button";
import { southFloridaCities } from "@/data/citiesSouthFlorida";
import { SOUTH_FLORIDA_WEBSITE_LIVE } from "@/lib/regions";
import { trackConversion } from "@/lib/gtag";
import { useSeo } from "@/lib/useSeo";

const SITE = "https://mikesmautorepair.com";
const URL = `${SITE}/south-florida`;

const SERVICES = [
  { icon: Gauge, title: "Diagnostics", text: "Check-engine, no-start and electrical faults traced with live scan data. $100 visit, $50 credited to the repair labor." },
  { icon: Disc3, title: "Brakes", text: "Pads, rotors and calipers for I-95 and Turnpike stop-and-go, measured to spec — not guessed." },
  { icon: BatteryCharging, title: "Starting & charging", text: "Batteries, starters and alternators tested and replaced in your condo lot, office garage or driveway." },
  { icon: Wrench, title: "Tune-ups & major repairs", text: "Ignition, gaskets, sensors and bigger jobs quoted in writing before any work starts." },
];

const FAQS = [
  { q: "Which areas do you cover in South Florida?", a: "Broward and Palm Beach Counties, including Fort Lauderdale, Hollywood, Pembroke Pines, Coral Springs, Boca Raton, Delray Beach, Boynton Beach and West Palm Beach." },
  { q: "How much does a mobile mechanic cost?", a: "If the problem isn't known yet, a diagnosis visit is $100 and $50 of it is credited toward the repair labor. Repairs are quoted in writing before any work begins, with no trip fee." },
  { q: "Can you come out the same day?", a: "We don't do same-day repairs. Appointments start the next day, Monday–Saturday 8 AM–8 PM, and you'll get the earliest open time." },
  { q: "Can you work in my condo, HOA or office parking lot?", a: "Usually, yes. Many South Florida buildings allow repairs in their lots; check your association's rules and we'll work within them." },
  { q: "How do I pay?", a: "You pay the invoice you receive by text or email — not the technician. Cash isn't accepted." },
];

const SouthFlorida = () => {
  useSeo({
    title: "Mobile Mechanic in Broward & Palm Beach | Mike's Mobile Auto Repair",
    description: "Mobile mechanic for Broward and Palm Beach Counties, FL. Diagnostics, brakes, batteries and repairs at your home or work. Call (813) 501-7572.",
    canonical: URL,
    // Kept out of Google until the South Florida region launches.
    noindex: !SOUTH_FLORIDA_WEBSITE_LIVE,
    breadcrumbs: [
      { name: "Home", url: `${SITE}/` },
      { name: "South Florida", url: URL },
    ],
    jsonLd: SOUTH_FLORIDA_WEBSITE_LIVE
      ? [
          {
            "@context": "https://schema.org",
            "@type": "AutoRepair",
            "@id": `${URL}#business`,
            name: "Mike's Mobile Auto Repair — South Florida",
            url: URL,
            telephone: "+18135017572",
            priceRange: "$$",
            parentOrganization: { "@id": `${SITE}/#business` },
            areaServed: [
              { "@type": "AdministrativeArea", name: "Broward County, FL" },
              { "@type": "AdministrativeArea", name: "Palm Beach County, FL" },
              ...southFloridaCities.map((c) => ({ "@type": "City", name: `${c.name}, FL` })),
            ],
            openingHoursSpecification: [{
              "@type": "OpeningHoursSpecification",
              dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
              opens: "08:00",
              closes: "20:00",
            }],
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
          },
        ]
      : undefined,
  });

  const broward = southFloridaCities.filter((c) => c.intro.includes("Broward"));
  const palm = southFloridaCities.filter((c) => c.intro.includes("Palm Beach County"));

  const CityCard = ({ slug, name }: { slug: string; name: string }) =>
    SOUTH_FLORIDA_WEBSITE_LIVE ? (
      <Link to={`/areas/${slug}`} className="glass-card group rounded-xl p-4 border border-border/40 hover:border-primary/60 flex items-center gap-3 transition-all">
        <MapPin className="w-5 h-5 text-primary shrink-0" />
        <span className="font-semibold text-foreground group-hover:text-primary">{name}</span>
      </Link>
    ) : (
      <div className="glass-card rounded-xl p-4 border border-border/40 flex items-center gap-3">
        <MapPin className="w-5 h-5 text-primary shrink-0" />
        <span className="font-semibold text-foreground">{name}</span>
      </div>
    );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <section className="pt-28 md:pt-36 pb-14 md:pb-20 bg-gradient-to-b from-secondary/30 via-background to-background">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-gold mb-4">
            <MapPin className="w-4 h-4" /> Broward & Palm Beach Counties
          </p>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl tracking-wide mb-5">
            <span className="text-sky">MOBILE MECHANIC</span>{" "}
            <span className="text-gold">SOUTH FLORIDA</span>
          </h1>
          <p id="speakable-summary" className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Dealer-level diagnostics and quality parts brought to your driveway, condo lot or workplace — from Fort Lauderdale to West Palm Beach. Next-day appointments, written quotes before any work.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="hero" size="lg" className="min-h-[52px]" asChild>
              <a href="tel:8135017572" onClick={() => trackConversion("phone_call")}>
                <Phone className="w-5 h-5 mr-2" /> Call (813) 501-7572
              </a>
            </Button>
            <Button variant="heroOutline" size="lg" className="min-h-[52px]" asChild>
              <a href="sms:8135017572" onClick={() => trackConversion("text_click")}>
                <MessageCircle className="w-5 h-5 mr-2" /> Text for Quote
              </a>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: ClipboardCheck, t: "$100 diagnosis", d: "$50 credited to repair labor" },
              { icon: ShieldCheck, t: "Written warranty", d: "Quoted in writing first" },
              { icon: Building2, t: "We come to you", d: "Home, condo or office lot" },
            ].map(({ icon: Icon, t, d }) => (
              <div key={t} className="glass-card rounded-xl p-5 border border-border/40 flex items-start gap-3">
                <Icon className="w-6 h-6 text-gold shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">{t}</p>
                  <p className="text-sm text-muted-foreground">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="font-display text-3xl md:text-4xl tracking-wide text-center mb-8">
            <span className="text-sky">WHAT WE</span> <span className="text-gold">FIX</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SERVICES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="glass-card rounded-xl p-6 border border-border/40">
                <Icon className="w-7 h-7 text-primary mb-3" />
                <h3 className="font-display text-xl tracking-wide text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-4xl space-y-4 text-muted-foreground">
          <h2 className="font-display text-3xl md:text-4xl tracking-wide text-center mb-6">
            <span className="text-sky">BUILT FOR</span> <span className="text-gold">EAST COAST DRIVING</span>
          </h2>
          <p>Daily miles on I-95, Florida's Turnpike and the Sawgrass Expressway mean hard braking and long idle in traffic. We size brake parts and cooling repairs for that workload instead of the brochure numbers.</p>
          <p>Salt air from the Intracoastal to A1A eats brake hardware and electrical connectors. We use stainless hardware and seal every connector we open so the repair lasts.</p>
          <p>Most South Florida customers live in condos, HOAs or work in office parks. We bring the shop to the lot and keep the space clean.</p>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="font-display text-3xl md:text-4xl tracking-wide text-center mb-8">
            <span className="text-sky">SERVICE</span> <span className="text-gold">AREAS</span>
          </h2>
          <h3 className="font-semibold text-foreground mb-3">Broward County</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {broward.map((c) => <CityCard key={c.slug} slug={c.slug} name={c.name} />)}
          </div>
          <h3 className="font-semibold text-foreground mb-3">Palm Beach County</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {palm.map((c) => <CityCard key={c.slug} slug={c.slug} name={c.name} />)}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="font-display text-3xl md:text-4xl tracking-wide text-center mb-8">
            <span className="text-sky">COMMON</span> <span className="text-gold">QUESTIONS</span>
          </h2>
          <div className="space-y-3">
            {FAQS.map((f) => (
              <details key={f.q} className="glass-card rounded-xl p-5 border border-border/40">
                <summary className="font-semibold text-foreground cursor-pointer">{f.q}</summary>
                <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center glass-card rounded-2xl p-8 md:p-12 border border-primary/20">
            <h2 className="font-display text-3xl sm:text-4xl tracking-wide mb-4">
              <span className="text-sky">BOOK YOUR</span> <span className="text-gold">MOBILE MECHANIC</span>
            </h2>
            <p className="text-muted-foreground mb-7">Next-day service across Broward and Palm Beach.</p>
            <Button variant="hero" size="lg" className="min-h-[52px]" asChild>
              <a href="tel:8135017572" onClick={() => trackConversion("phone_call")}>
                <Phone className="w-5 h-5 mr-2" /> Call (813) 501-7572
              </a>
            </Button>
          </div>
          <p className="text-center text-sm text-muted-foreground mt-8">
            In Lee County? <Link to="/" className="text-primary hover:underline inline-flex items-center gap-1">Fort Myers & Lehigh Acres <ArrowRight className="w-3 h-3" /></Link>
          </p>
        </div>
      </section>

      <Footer />
      <FloatingCallButton />
    </div>
  );
};

export default SouthFlorida;
