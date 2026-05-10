import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Phone, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackConversion } from "@/lib/gtag";
import InlineCallStrip from "./InlineCallStrip";

const faqs = [
  {
    q: "What areas do you service?",
    a: "We serve Lehigh Acres and Fort Myers and surrounding neighborhoods. Call (813) 501-7572 if you're not sure we cover your address.",
  },
  {
    q: "Are you really mobile? You come to my house?",
    a: "Yes — every job. Our service truck arrives at your driveway or parking lot with the tools, scanners, and parts to handle most repairs on the spot.",
  },
  {
    q: "Do you offer same-day service?",
    a: "Same-day appointments are usually available across Lehigh Acres and Fort Myers, including evenings and weekends whenever possible.",
  },
  {
    q: "How is pricing handled?",
    a: "All work is quoted up front before any wrench turns. No surprise add-ons, no hidden fees, no shop dispatch markup.",
  },
  {
    q: "Do you warranty your work?",
    a: "Yes — parts and labor are backed by our standard mobile-service warranty. Specifics depend on the repair and the part manufacturer.",
  },
  {
    q: "What's the easiest way to get a quote?",
    a: "Call or text (813) 501-7572 with your year/make/model and a description of the issue. Most quotes go out the same day.",
  },
  {
    q: "Do you handle fleet vehicles?",
    a: "Yes — recurring fleet maintenance is available for businesses across Lee County.",
  },
  {
    q: "Do you accept walk-up payments at the truck?",
    a: "We accept all major cards, Apple/Google Pay, and cash on completion. Financing is also available for larger repairs.",
  },
];

const SeoContent = () => {
  const handleCall = () => trackConversion("phone_call");
  const handleText = () => trackConversion("text_click");

  // Inject FAQPage JSON-LD schema for the homepage FAQ
  useEffect(() => {
    const id = "ld-home-faq";
    document.getElementById(id)?.remove();
    const ld = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    };
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.id = id;
    s.text = JSON.stringify(ld);
    document.head.appendChild(s);
    return () => s.remove();
  }, []);

  return (
    <section className="py-16 md:py-24 bg-secondary/30">
      <div className="container mx-auto px-4 max-w-4xl">
        <header className="text-center mb-10 md:mb-14">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-wide mb-4">
            <span className="text-sky">YOUR LOCAL</span>{" "}
            <span className="text-gold">MOBILE MECHANIC</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground">
            Serving Lehigh Acres and Fort Myers
          </p>
        </header>

        <article className="space-y-10 text-foreground/90 leading-relaxed">
          <div>
            <p>
              Mike's Mobile Auto Repair is the trusted{" "}
              <strong>mobile mechanic</strong> serving Lehigh Acres and Fort Myers from
              Lehigh Acres west to Fort Myers. We bring the full power of a real auto shop straight to
              your home, workplace, or wherever your vehicle decided to quit on
              you. Our service truck is stocked with professional-grade tools,
              quality parts, and the same diagnostic scanners used by
              dealerships — so the vast majority of repairs get done in a
              single on-site visit. Skip the tow bill, the rental car, and the
              wasted afternoon in a waiting room.
            </p>
          </div>

          {/* H2: Mobile Brake Repair */}
          <div>
            <h3 className="font-display text-2xl md:text-3xl text-sky mb-3">
              Mobile Brake Repair
            </h3>
            <p>
              Squealing, grinding, soft pedal, or pulsation when you stop?
              Brakes are the single most common reason Lehigh Acres and Fort Myers drivers end up
              dealing with a tow and a long shop wait. We cut both out of the
              equation. Our{" "}
              <Link to="/mobile-brake-repair" className="text-primary underline-offset-4 hover:underline">
                mobile brake repair
              </Link>{" "}
              service handles pads, rotors, calipers, lines, fluid flushes, and
              ABS diagnostics right in your driveway. Most pad-and-rotor jobs
              are completed in 60–90 minutes per axle, every wheel is torqued
              to manufacturer spec, and the new pads are properly bedded so you
              get a quiet, confident pedal from the very first stop. Ask about
              brake repair in{" "}
              <Link to="/mobile-brake-repair-lehigh-acres" className="text-primary underline-offset-4 hover:underline">Lehigh Acres</Link> or{" "}
              <Link to="/areas/fort-myers" className="text-primary underline-offset-4 hover:underline">Fort Myers</Link>.
            </p>
          </div>

          <InlineCallStrip />

          {/* H2: Alternator & Starter Repair */}
          <div>
            <h3 className="font-display text-2xl md:text-3xl text-sky mb-3">
              Alternator & Starter Repair
            </h3>
            <p>
              Battery light on, dim headlights, or a no-start after a jump?
              That's an alternator problem. Single loud click with full dash
              lights and no crank? That's a starter. We diagnose both with
              real charging-system testers — never just throw parts at it — and
              install quality replacements on the spot.{" "}
              <Link to="/mobile-alternator-repair" className="text-primary underline-offset-4 hover:underline">
                Mobile alternator repair
              </Link>{" "}
              and{" "}
              <Link to="/mobile-starter-repair" className="text-primary underline-offset-4 hover:underline">
                mobile starter repair
              </Link>{" "}
              are two of our most-requested services across Lee County. Most replacements take 60–120 minutes in a driveway or
              parking lot.
            </p>
          </div>

          {/* H2: Battery Replacement */}
          <div>
            <h3 className="font-display text-2xl md:text-3xl text-sky mb-3">
              Battery Replacement
            </h3>
            <p>
              Florida heat is brutal on car batteries. Most last only 2–3 years
              here before they start failing. When yours finally gives up, you
              don't need a ride to the parts store and a wrestling match with
              corroded terminals — we deliver and install fresh, quality
              batteries anywhere in Lehigh Acres and Fort Myers with{" "}
              <Link to="/mobile-battery-replacement" className="text-primary underline-offset-4 hover:underline">
                mobile battery replacement
              </Link>
              . Every install includes a free charging-system test (so we don't
              hand you a new battery if your alternator is the real culprit),
              terminal cleaning, and old-battery recycling at no extra charge.
              Same-day service is the norm anywhere in our service area.
            </p>
          </div>

          {/* H2: Vehicle Diagnostics */}
          <div>
            <h3 className="font-display text-2xl md:text-3xl text-sky mb-3">
              Vehicle Diagnostics
            </h3>
            <p>
              Modern vehicles speak in trouble codes — and we speak the
              language. Most parts-store "free scans" just read codes and clear
              them; that's not real diagnostics. Our{" "}
              <Link to="/mobile-vehicle-diagnostics" className="text-primary underline-offset-4 hover:underline">
                mobile car diagnostics
              </Link>{" "}
              cover full OBD-II scans, freeze-frame data, live sensor analysis,
              fuel-trim review, misfire counts, and real drivability testing —
              not guesswork. We diagnose check-engine lights, hard shifts,
              intermittent stalls, AC faults, ABS warnings, and{" "}
              <Link to="/mobile-no-start-diagnostics" className="text-primary underline-offset-4 hover:underline">
                no-start diagnostics
              </Link>{" "}
              from the comfort of your driveway. If we can fix it on the spot
              we will; if it needs follow-up parts we'll quote it transparently.
            </p>
          </div>

          <InlineCallStrip />

          {/* H2: Why Choose MMAR */}
          <div>
            <h3 className="font-display text-2xl md:text-3xl text-sky mb-3">
              Why Choose Mike's Mobile Auto Repair
            </h3>
            <p>
              We're a local, owner-operated mobile repair business — not a
              franchise, not a call center, not a national chain that bounces
              you between shops. When you call us, a real technician answers.
              When we quote you, the price is the price. When we finish, your
              wheels are torqued to spec, your fluids are topped off, and your
              repair is backed by our standard parts-and-labor warranty.
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
              <li>✅ Mobile service — we come to you</li>
              <li>✅ Up-front, transparent pricing</li>
              <li>✅ Real diagnostics, not guess-and-replace</li>
              <li>✅ Same-day appointments usually available</li>
              <li>✅ Parts &amp; labor warranty on every job</li>
              <li>✅ 5-star rated on Google, Facebook, Yelp, Nextdoor</li>
              <li>✅ Financing available for larger repairs</li>
            </ul>
          </div>

          {/* H2: Areas We Service */}
          <div>
            <h3 className="font-display text-2xl md:text-3xl text-sky mb-3">
              Areas We Service
            </h3>
            <p>
              We proudly serve homes, businesses, and stranded drivers across
              Lehigh Acres and Fort Myers:
            </p>
            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
              <li><Link to="/areas/lehigh-acres" className="text-primary underline-offset-4 hover:underline">Lehigh Acres</Link></li>
              <li><Link to="/areas/fort-myers" className="text-primary underline-offset-4 hover:underline">Fort Myers</Link></li>
              <li>San Carlos Park</li>
              <li>Gateway</li>
              <li>North Fort Myers</li>
            </ul>
            <p className="mt-4">
              Don't see your town? Call us — chances are we cover it. Our goal
              is simple: deliver dealer-quality auto repair with the convenience
              of a mobile service and the honesty of a local shop owner who
              actually answers the phone.
            </p>
          </div>

          {/* H2: FAQ */}
          <div>
            <h3 className="font-display text-2xl md:text-3xl text-sky mb-4">
              Frequently Asked Questions
            </h3>
            <div className="space-y-3">
              {faqs.map((f) => (
                <details key={f.q} className="glass-card rounded-xl p-5 border border-border/40 group">
                  <summary className="font-semibold text-foreground cursor-pointer list-none flex items-center justify-between gap-3">
                    <span>{f.q}</span>
                    <span className="text-primary group-open:rotate-45 transition-transform text-2xl leading-none">+</span>
                  </summary>
                  <p className="text-muted-foreground text-sm md:text-base mt-3">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </article>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mt-10">
          <Button variant="hero" size="lg" className="min-h-[48px]" asChild>
            <a href="tel:8135017572" onClick={handleCall}>
              <Phone className="mr-2" /> Call (813) 501-7572
            </a>
          </Button>
          <Button variant="heroOutline" size="lg" className="min-h-[48px]" asChild>
            <a href="sms:8135017572" onClick={handleText}>
              <MessageSquare className="mr-2" /> Text Us
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default SeoContent;
