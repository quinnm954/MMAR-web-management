import { Link } from "react-router-dom";
import { Phone, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackConversion } from "@/lib/gtag";

const SeoContent = () => {
  const handleClick = () => trackConversion();

  return (
    <section className="py-16 md:py-24 bg-secondary/30">
      <div className="container mx-auto px-4 max-w-4xl">
        <header className="text-center mb-10 md:mb-14">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-wide mb-4">
            <span className="text-sky">YOUR LOCAL</span>{" "}
            <span className="text-gold">MOBILE MECHANIC</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground">
            Serving Lehigh Acres, Fort Myers, Cape Coral and all of Southwest Florida
          </p>
        </header>

        <article className="space-y-8 text-foreground/90 leading-relaxed">
          <div>
            <h3 className="font-display text-2xl md:text-3xl text-sky mb-3">
              Mobile Auto Repair At Your Location
            </h3>
            <p>
              Mike's Mobile Auto Repair brings the full power of a real auto shop
              straight to your home, workplace, or wherever your vehicle decided to
              quit on you. Our service truck is stocked with professional-grade
              tools, OEM-quality parts, and the same diagnostic scanners used by
              dealerships — so we can handle the vast majority of repairs on-site
              in a single visit. Skip the tow bill, the rental car, and the lost
              afternoon in a waiting room. We come to you, in driveways from{" "}
              <Link to="/areas/lehigh-acres" className="text-primary underline-offset-4 hover:underline">
                Lehigh Acres
              </Link>{" "}
              to{" "}
              <Link to="/areas/fort-myers" className="text-primary underline-offset-4 hover:underline">
                Fort Myers
              </Link>{" "}
              to{" "}
              <Link to="/areas/cape-coral" className="text-primary underline-offset-4 hover:underline">
                Cape Coral
              </Link>
              .
            </p>
          </div>

          <div>
            <h3 className="font-display text-2xl md:text-3xl text-sky mb-3">
              Roadside Help When You're Stuck
            </h3>
            <p>
              A dead battery in a parking lot. A flat tire on the shoulder of I-75.
              Keys locked inside. Engine that just won't crank. We've seen it all,
              and we respond fast. Our roadside services include jump starts,
              battery replacements on the spot, flat tire repairs, lockout
              assistance, and minor mechanical fixes that get you back on the road
              without waiting for a tow. If a tow is the right call, we'll tell you
              honestly — and many times we can fix the problem right there so it
              never becomes one.
            </p>
          </div>

          <div>
            <h3 className="font-display text-2xl md:text-3xl text-sky mb-3">
              Computer Diagnostics & Check Engine Light
            </h3>
            <p>
              Modern vehicles speak in trouble codes, and we speak the language.
              Our mobile{" "}
              <Link to="/services/engine" className="text-primary underline-offset-4 hover:underline">
                engine diagnostics
              </Link>{" "}
              cover OBD-II scans, live data analysis, drivability testing, and
              real-world troubleshooting — not just "clearing the code" and hoping
              for the best. Whether it's a stubborn check engine light, a transmission
              that shifts hard, an{" "}
              <Link to="/services/electrical" className="text-primary underline-offset-4 hover:underline">
                electrical gremlin
              </Link>
              , or a misfire that only happens on Tuesdays, we find the root cause and
              quote a repair before any wrench turns.
            </p>
          </div>

          <div>
            <h3 className="font-display text-2xl md:text-3xl text-sky mb-3">
              Emergency & Same-Day Service
            </h3>
            <p>
              Vehicle problems don't wait for business hours, so we don't either.
              Same-day appointments are usually available, and emergency service
              is offered evenings and weekends across Southwest Florida. Common
              urgent calls include{" "}
              <Link to="/services/brakes" className="text-primary underline-offset-4 hover:underline">
                brake repairs
              </Link>
              ,{" "}
              <Link to="/services/ac-heating" className="text-primary underline-offset-4 hover:underline">
                AC failures in summer heat
              </Link>
              ,{" "}
              <Link to="/services/electrical" className="text-primary underline-offset-4 hover:underline">
                dead batteries and alternators
              </Link>
              , and overheating engines. One call to (813) 501-7572 reaches a real
              technician — not a call-center.
            </p>
          </div>

          <div>
            <h3 className="font-display text-2xl md:text-3xl text-sky mb-3">
              Service Areas Across Southwest Florida
            </h3>
            <p>
              We proudly serve homes, businesses, and stranded drivers across the
              region, including:
            </p>
            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
              <li>
                <Link to="/areas/lehigh-acres" className="text-primary underline-offset-4 hover:underline">
                  Lehigh Acres
                </Link>
              </li>
              <li>
                <Link to="/areas/fort-myers" className="text-primary underline-offset-4 hover:underline">
                  Fort Myers
                </Link>
              </li>
              <li>
                <Link to="/areas/cape-coral" className="text-primary underline-offset-4 hover:underline">
                  Cape Coral
                </Link>
              </li>
              <li>Estero</li>
              <li>Bonita Springs</li>
              <li>Naples</li>
              <li>San Carlos Park</li>
              <li>Gateway</li>
              <li>North Fort Myers</li>
            </ul>
            <p className="mt-4">
              Don't see your town? Call us — chances are we cover it. Our goal is
              simple: deliver dealer-quality auto repair with the convenience of a
              mobile service and the honesty of a local shop owner who actually
              answers the phone.
            </p>
          </div>
        </article>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mt-10">
          <Button variant="hero" size="lg" className="min-h-[48px]" asChild>
            <a href="tel:8135017572" onClick={handleClick}>
              <Phone className="mr-2" /> Call (813) 501-7572
            </a>
          </Button>
          <Button variant="heroOutline" size="lg" className="min-h-[48px]" asChild>
            <a href="sms:8135017572" onClick={handleClick}>
              <MessageSquare className="mr-2" /> Text Us
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default SeoContent;
