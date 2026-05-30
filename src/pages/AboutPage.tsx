import { Link } from "react-router-dom";
import { Calendar, Wrench, MapPin, ShieldCheck, Phone, ArrowRight } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import FloatingCallButton from "@/components/FloatingCallButton";
import InlineCallStrip from "@/components/InlineCallStrip";
import TrustBadges from "@/components/TrustBadges";
import { useSeo } from "@/lib/useSeo";
import About from "@/components/About";

const AboutPage = () => {
  useSeo({
    title: "About MMAR | Mike's Mobile Auto Repair LLC — Our Story",
    description:
      "The story behind Mike's Mobile Auto Repair — how a one-truck mobile mechanic in Lehigh Acres grew into Southwest Florida's most trusted on-site shop, and why we built MMAR Care.",
    canonical: "https://mikesmautorepair.com/about",
    breadcrumbs: [
      { name: "Home", url: "https://mikesmautorepair.com/" },
      { name: "About", url: "https://mikesmautorepair.com/about" },
    ],
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero */}
      <section className="pt-28 md:pt-32 pb-10">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-gold mb-3">
            <Wrench className="w-4 h-4" /> Our Story
          </div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-wide mb-4">
            <span className="text-sky">ABOUT</span>{" "}
            <span className="text-gold">MMAR</span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Honest mobile mechanic service across Lehigh Acres and Fort Myers — built on
            transparent pricing, on-site convenience, and quality work that lasts.
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground mt-4">
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Founded in Southwest Florida
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> Lehigh Acres • Fort Myers • Cape Coral
            </span>
          </div>
        </div>
      </section>

      {/* Long-form story */}
      <article className="container mx-auto px-4 max-w-3xl pb-12">
        <div className="prose prose-invert prose-lg max-w-none">
          <h2 className="font-display text-2xl md:text-3xl text-sky mt-2 mb-4">
            From one truck in a Lehigh Acres driveway
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Mike's Mobile Auto Repair started the way most good shops do — with one mechanic, one
            truck, and a stubborn refusal to charge people for work they didn't need. Mike grew up
            turning wrenches, worked dealership and independent shops for years, and watched too
            many customers walk out frustrated by surprise fees, vague diagnoses, and rental-car
            bills they never planned for. The fix was obvious: bring the shop to the customer, show
            them what's actually wrong, and quote it straight before any work begins.
          </p>

          <h2 className="font-display text-2xl md:text-3xl text-sky mt-10 mb-4">
            Why "mobile" matters in Southwest Florida
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            If you've broken down on Lee Boulevard in August, you already know the math. A tow to
            the nearest shop is $125–$250. A loaner or rideshare for a couple of days adds another
            $100+. Most of the work that strands SWFL drivers — dead batteries, alternator failures,
            no-starts, brake jobs, cooling-system leaks, AC recharges — can be done safely and
            cleanly in your driveway, your office parking lot, or wherever the car gave up. We bring
            the lift, the scan tools, the parts, and the warranty. You skip the tow bill and the
            wasted day.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            We service every neighborhood we can reach in a reasonable drive — including{" "}
            <Link to="/areas/lehigh-acres" className="text-primary hover:underline">Lehigh Acres</Link>,{" "}
            <Link to="/areas/fort-myers" className="text-primary hover:underline">Fort Myers</Link>,{" "}
            <Link to="/areas/cape-coral" className="text-primary hover:underline">Cape Coral</Link>,
            Estero, Bonita Springs, Gateway, and most of Lee County. See the full{" "}
            <Link to="/service-areas" className="text-primary hover:underline">service area map</Link>.
          </p>

          <h2 className="font-display text-2xl md:text-3xl text-sky mt-10 mb-4">
            What we believe about pricing
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Every estimate is itemized — parts, labor, taxes, the actual brand of the part going on
            your car. If a job comes in under
            estimate, you pay the lower number. If we find something else while we're under there,
            we stop, photograph it, and send you a revised estimate before we touch it. You approve
            it on your phone. That's it.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            We also publish honest ranges in our blog because the question we hear most is "what
            should this actually cost?" If you're trying to compare quotes, our{" "}
            <Link to="/blog" className="text-primary hover:underline">blog</Link> is a good place to
            start.
          </p>

          <h2 className="font-display text-2xl md:text-3xl text-sky mt-10 mb-4">
            The work — and the warranty behind it
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            We do everything a brick-and-mortar shop does short of frame work and major collision
            repair: full diagnostics, brakes, batteries, alternators, starters, suspension, oil and
            fluid services, cooling systems, AC, electrical, no-start troubleshooting, and routine
            maintenance. Every job is backed by our{" "}
            <Link to="/warranty-policy" className="text-primary hover:underline">written warranty policy</Link>{" "}
            — Magnuson-Moss compliant, transferable on the parts, and longer than what most chain
            shops offer.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            We're also one of the few mobile operations that carries proper liability insurance and
            a real business license. Ask any mechanic for proof of both before they touch your car —
            the difference shows up the day something goes wrong.
          </p>

          <h2 className="font-display text-2xl md:text-3xl text-sky mt-10 mb-4">
            Why we built Garage Ace (the app)
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            After a few years of running paper invoices and chasing customers down to schedule
            follow-ups, we built our own customer app —{" "}
            <Link to="/why-garage-ace" className="text-primary hover:underline">Garage Ace</Link>.
            It's free for every customer. You can manage every vehicle in your household, request
            appointments, approve estimates, see digital inspection photos, pay invoices, and pull
            up service history any time you need it.
          </p>

          <h2 className="font-display text-2xl md:text-3xl text-sky mt-10 mb-4">
            Why we built MMAR Care (the plan)
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Inside the app, customers can subscribe to{" "}
            <Link to="/mmar-care" className="text-primary hover:underline">MMAR Care</Link> — our
            monthly maintenance plan. It bundles in oil changes, priority scheduling, discounted
            labor, and a transferable warranty, so the predictable parts of car ownership become a
            small monthly bill instead of a surprise $400 invoice every few months. Most members
            cover the plan cost with one or two services a year.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            For households or small businesses with{" "}
            <Link to="/mmar-care#fleet" className="text-primary hover:underline">5+ vehicles</Link>,
            our fleet program adds volume pricing and on-site service so trucks and vans never have
            to leave the yard for routine maintenance.
          </p>

          <h2 className="font-display text-2xl md:text-3xl text-sky mt-10 mb-4">
            What we won't do
          </h2>
          <ul className="text-muted-foreground space-y-2">
            <li>Sell you parts you don't need.</li>
            <li>Quote a number on the phone before we've actually looked at the car.</li>
            <li>Use stop-leak in your AC system. Ever.</li>
            <li>Pretend a problem is fixed when it's only patched.</li>
          </ul>

          <h2 className="font-display text-2xl md:text-3xl text-sky mt-10 mb-4">
            Where we're going
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Southwest Florida is growing fast and the wait times at most shops keep getting longer.
            Our plan is simple: more trucks, better technology, the same standards. Same-day or
            next-day for most jobs, transparent pricing across the board, and a warranty you can
            actually use. If you've had a bad experience with a shop in the past, we'd love the
            chance to change your mind.
          </p>

          <div className="mt-12 rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/15 via-background to-gold/10 p-6 md:p-10 text-center">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-gold mb-3">
              <ShieldCheck className="w-4 h-4" /> Ready When You Are
            </div>
            <h2 className="font-display text-2xl md:text-3xl tracking-wide mb-3">
              <span className="text-sky">Try us</span> <span className="text-gold">once.</span>
            </h2>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto mb-6">
              Most of our customers stay for life. Call or text — we'll quote it straight and come
              to you.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="tel:8135017572"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
              >
                <Phone className="w-4 h-4" /> Call (813) 501-7572
              </a>
              <Link
                to="/why-garage-ace"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-primary/50 text-primary font-semibold hover:bg-primary/10 transition-colors"
              >
                Why You Need The App <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </article>

      {/* Existing About visual block */}
      <About />

      <div className="container mx-auto px-4 max-w-5xl py-8">
        <TrustBadges />
      </div>
      <div className="container mx-auto px-4 max-w-3xl pb-12">
        <InlineCallStrip label="Ready to book a mobile mechanic?" />
      </div>
      <Footer />
      <FloatingCallButton />
    </div>
  );
};

export default AboutPage;
