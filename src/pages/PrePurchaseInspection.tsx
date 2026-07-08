import { Link } from "react-router-dom";
import { Check, Car, Gauge, Wrench, ClipboardCheck, ShieldCheck, MapPin, Phone } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import FloatingCallButton from "@/components/FloatingCallButton";
import RequestQuoteCTA from "@/components/RequestQuoteCTA";
import { Button } from "@/components/ui/button";
import { useSeo } from "@/lib/useSeo";
import { useEffect } from "react";
import { trackConversion } from "@/lib/gtag";

const SITE = "https://mikesmautorepair.com";
const URL = `${SITE}/services/pre-purchase-inspection`;

const CHECKLIST = [
  { icon: Gauge, title: "Computer diagnostics", body: "Full OBD-II scan for stored, pending, and permanent codes across engine, transmission, ABS, SRS, and body modules." },
  { icon: Wrench, title: "Fluid analysis", body: "Engine oil, coolant, brake, power steering, and transmission fluid checked for level, color, and contamination." },
  { icon: Car, title: "Brakes, tires & suspension", body: "Pad thickness, rotor wear, tire tread depth, uneven wear patterns, ball joints, tie rods, and shocks." },
  { icon: ShieldCheck, title: "Frame, leaks & rust", body: "Undercarriage inspection for prior collision damage, active fluid leaks, and rust — critical on Florida coastal vehicles." },
  { icon: ClipboardCheck, title: "Interior & electrical", body: "Every warning light, window, lock, HVAC mode, wiper, horn, and infotainment function verified." },
  { icon: Car, title: "Road test", body: "Cold-start behavior, shift quality, brake feel, alignment pull, and highway-speed vibration on a real drive cycle." },
];

const PrePurchaseInspection = () => {
  useSeo({
    title: "Pre-Purchase Car Inspection in Fort Myers | Mobile Mechanic",
    description:
      "Buying a used car in Fort Myers or Lehigh Acres? Our mobile mechanic inspects it at the seller's location — diagnostics, fluids, brakes, and a road test. Call (813) 501-7572.",
    canonical: URL,
  });

  useEffect(() => {
    const id = "ld-pre-purchase-inspection";
    document.getElementById(id)?.remove();
    const ld = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Service",
          name: "Pre-Purchase Vehicle Inspection",
          serviceType: "Pre-Purchase Car Inspection",
          url: URL,
          areaServed: [
            { "@type": "City", name: "Fort Myers, FL" },
            { "@type": "City", name: "Lehigh Acres, FL" },
            { "@type": "City", name: "Cape Coral, FL" },
            { "@type": "City", name: "Naples, FL" },
            { "@type": "City", name: "Bonita Springs, FL" },
          ],
          provider: {
            "@type": "AutoRepair",
            "@id": `${SITE}#business`,
            name: "Mike's Mobile Auto Repair",
            telephone: "+18135017572",
            url: SITE,
          },
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
            { "@type": "ListItem", position: 2, name: "Services", item: `${SITE}/services` },
            { "@type": "ListItem", position: 3, name: "Pre-Purchase Inspection", item: URL },
          ],
        },
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "How much is a pre-purchase car inspection in Fort Myers?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Mobile pre-purchase inspections in Fort Myers and Lehigh Acres start around $149 and vary by vehicle type. Call (813) 501-7572 for an exact quote for your vehicle.",
              },
            },
            {
              "@type": "Question",
              name: "Do you come to the seller's location?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Yes. We inspect the car wherever it is — private seller's driveway, used-car lot, or dealership — across Lee and Collier counties.",
              },
            },
            {
              "@type": "Question",
              name: "How long does an inspection take?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Most inspections take 60–90 minutes on-site, including a road test. You'll get a written report the same day.",
              },
            },
          ],
        },
      ],
    };
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.id = id;
    s.text = JSON.stringify(ld);
    document.head.appendChild(s);
    return () => s.remove();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <section className="relative pt-24 md:pt-32 pb-12 md:pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <p className="text-sm text-muted-foreground mb-3">
            <Link to="/services" className="hover:text-primary underline underline-offset-4">Services</Link>
            <span className="mx-2">/</span>
            <span>Pre-Purchase Inspection</span>
          </p>
          <h1 className="font-display text-4xl md:text-6xl tracking-wide mb-4">
            <span className="text-sky">PRE-PURCHASE CAR INSPECTION</span>
            <br />
            <span className="text-gold">IN FORT MYERS &amp; LEHIGH ACRES</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mb-8">
            Thinking about buying a used car? Before you hand over a check, let a certified mobile mechanic
            drive to the seller and give it a full inspection — computer diagnostics, fluids, brakes,
            suspension, and a real road test. You get a written report the same day.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-2xl">
            <Button variant="hero" size="lg" className="w-full sm:w-auto min-h-[52px] bg-white text-primary hover:bg-white/90 border-2 border-white" asChild>
              <a href="tel:8135017572" onClick={() => trackConversion("phone_call")}>
                <Phone className="mr-2" /> Call (813) 501-7572
              </a>
            </Button>
            <RequestQuoteCTA
              defaultService="Pre-Purchase Vehicle Inspection"
              label="Request an inspection quote"
              className="w-full sm:w-auto min-h-[52px]"
            />
          </div>
          <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>We come to the seller anywhere in Lee &amp; Collier County — no need to bring the car to a shop.</span>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 bg-card/40">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="font-display text-3xl md:text-4xl tracking-wide mb-8 text-center">
            <span className="text-sky">WHAT&apos;S INCLUDED</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {CHECKLIST.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-lg border border-border bg-background p-5 flex gap-4">
                <div className="shrink-0 rounded-md bg-primary/10 p-2 h-fit">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">{title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="font-display text-3xl md:text-4xl tracking-wide mb-6 text-center">
            <span className="text-gold">WHY MOBILE BEATS A SHOP INSPECTION</span>
          </h2>
          <ul className="space-y-4">
            {[
              "The seller doesn't need to trust you with the keys — we meet them at the car.",
              "You skip the tow or long test drive to an unfamiliar shop.",
              "We inspect private-seller cars, dealer lots, and auction pickups the same way.",
              "You get an honest, written report from a technician who has no stake in the sale.",
            ].map((line) => (
              <li key={line} className="flex gap-3">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-12 md:py-16 bg-card/40">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 className="font-display text-3xl md:text-4xl tracking-wide mb-4">
            <span className="text-sky">READY TO BOOK?</span>
          </h2>
          <p className="text-muted-foreground mb-8">
            Send us the listing or the seller&apos;s address and we&apos;ll get a mobile inspection on the calendar.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="hero" size="lg" className="min-h-[52px] bg-white text-primary hover:bg-white/90 border-2 border-white" asChild>
              <a href="tel:8135017572" onClick={() => trackConversion("phone_call")}>
                <Phone className="mr-2" /> Call now
              </a>
            </Button>
            <RequestQuoteCTA
              defaultService="Pre-Purchase Vehicle Inspection"
              label="Text us the listing"
              className="min-h-[52px]"
            />
          </div>
        </div>
      </section>

      <Footer />
      <FloatingCallButton />
    </div>
  );
};

export default PrePurchaseInspection;
