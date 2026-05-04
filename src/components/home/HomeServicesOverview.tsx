import { Link } from "react-router-dom";

const HomeServicesOverview = () => {
  return (
    <section className="py-14 md:py-20 bg-secondary/20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10 md:mb-12">
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-wide mb-3">
              <span className="text-sky">MOBILE AUTO REPAIR</span>{" "}
              <span className="text-gold">LEHIGH ACRES &amp; FORT MYERS</span>
            </h2>
            <p className="text-base md:text-lg text-muted-foreground">
              Honest, on-site auto repair across Lehigh Acres and Fort Myers.
            </p>
          </div>

          <article className="space-y-5 text-foreground/90 leading-relaxed text-base md:text-lg">
            <p>
              Mike's Mobile Auto Repair brings ASE-level service straight to your driveway or office anywhere in Lehigh Acres and Fort Myers. Instead of waiting half a day at a brick-and-mortar shop in Fort Myers or paying for a tow out of Lehigh Acres, we roll up with the diagnostic tools, quality parts, and experience to handle most repairs in a single visit. A real technician answers the phone — never a call center.
            </p>
            <p>
              Our most-called services include{" "}
              <Link to="/brake-repair" className="text-primary hover:underline">brake repair</Link>{" "}
              (pads, rotors, calipers, and brake fluid),{" "}
              <Link to="/alternator-repair" className="text-primary hover:underline">alternator repair</Link>,{" "}
              <Link to="/battery-replacement" className="text-primary hover:underline">car battery delivery and installation</Link>,{" "}
              <Link to="/vehicle-diagnostics" className="text-primary hover:underline">check-engine-light diagnostics</Link>, and full{" "}
              <Link to="/no-start-diagnostics" className="text-primary hover:underline">no-start diagnostics</Link>. Most jobs are completed in 60 to 120 minutes on site, and pricing is quoted up front before any work begins.
            </p>
            <p>
              Florida heat is hard on vehicles. Batteries that would last five years up north barely make two or three down here. Brakes wear faster in stop-and-go traffic on Lee Boulevard, US-41, and Daniels Parkway. Cooling systems get pushed to their limits every summer. Routine{" "}
              <Link to="/services/oil-fluids" className="text-primary hover:underline">maintenance</Link>{" "}
              like mobile oil changes, fluid flushes, and multi-point inspections is the cheapest insurance against the kind of breakdown that strands you in 95° heat.
            </p>
            <p>
              When something does go wrong, our mobile service responds across Lee County — usually within an hour. Dead battery in an office lot in Fort Myers? On-site replacement in 30 minutes. Brakes went metal-on-metal on the way home in Fort Myers? We bring the parts and fix it in your driveway. No-start in a Lehigh Acres garage? We diagnose, replace the failed component, and verify the repair before we leave.
            </p>
            <p>
              We service vehicles in every Lehigh Acres ZIP (33936, 33971, 33972, 33973, 33974, 33976), and every Fort Myers ZIP (33901, 33907, 33908, 33912, 33913, 33916, 33919, 33966). Local fleets and multi-vehicle households get on-site maintenance with no shop downtime — see our{" "}
              <Link to="/service-areas" className="text-primary hover:underline">full service area map</Link>.
            </p>
            <p>
              Ready to book? Tap{" "}
              <a href="tel:8135017572" className="text-gold font-semibold hover:underline">(813) 501-7572</a>{" "}
              for same-day mobile mechanic service, or browse all of our{" "}
              <Link to="/services" className="text-primary hover:underline">repair services</Link>{" "}
              and{" "}
              <Link to="/blog" className="text-primary hover:underline">Lehigh Acres and Fort Myers auto-repair guides</Link>.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
};

export default HomeServicesOverview;
