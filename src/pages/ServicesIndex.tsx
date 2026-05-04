import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import FloatingCallButton from "@/components/FloatingCallButton";
import InlineCallStrip from "@/components/InlineCallStrip";
import { categories } from "@/data/serviceCategories";
import { useSeo } from "@/lib/useSeo";

const featuredLandings = [
  { href: "/mobile-vehicle-diagnostics", title: "Mobile Diagnostics" },
  { href: "/mobile-brake-repair", title: "Mobile Brake Repair" },
  { href: "/mobile-battery-replacement", title: "Mobile Battery Replacement" },
  { href: "/mobile-alternator-repair", title: "Mobile Alternator Repair" },
  { href: "/mobile-starter-repair", title: "Mobile Starter Repair" },
  { href: "/mobile-no-start-diagnostics", title: "Mobile No-Start Diagnostics" },
  { href: "/mobile-oil-change", title: "Mobile Oil Change" },
  { href: "/mobile-engine-diagnostics", title: "Mobile Engine Diagnostics" },
  { href: "/mobile-suspension-steering", title: "Mobile Suspension & Steering" },
];

const ServicesIndex = () => {
  useSeo({
    title: "Mobile Mechanic Services | Mike's Mobile Auto Repair",
    description:
      "All mobile mechanic services offered across Lehigh Acres and Fort Myers — diagnostics, brakes, batteries, alternators, no-start.",
    canonical: "https://mikesmautorepair.com/services",
    breadcrumbs: [
      { name: "Home", url: "https://mikesmautorepair.com/" },
      { name: "Services", url: "https://mikesmautorepair.com/services" },
    ],
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <section className="pt-28 md:pt-32 pb-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-wide mb-4">
            <span className="text-sky">MOBILE MECHANIC</span>{" "}
            <span className="text-gold">SERVICES</span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground mb-10 max-w-3xl">
            Browse every repair we perform on-site across Lehigh Acres and Fort Myers.
            Tap any service for full details, pricing notes, and FAQs.
          </p>

          <h2 className="font-display text-2xl md:text-3xl text-sky mb-4">Popular services</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-12">
            {featuredLandings.map((s) => (
              <li key={s.href}>
                <Link
                  to={s.href}
                  className="glass-card flex items-center justify-between rounded-xl border border-border/40 hover:border-primary/60 px-4 py-3 group transition-all"
                >
                  <span className="font-semibold text-foreground group-hover:text-primary">{s.title}</span>
                  <ArrowRight className="w-4 h-4 text-primary" />
                </Link>
              </li>
            ))}
          </ul>

          <h2 className="font-display text-2xl md:text-3xl text-sky mb-4">All service categories</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((c) => (
              <Link
                key={c.id}
                to={`/services/${c.id}`}
                className="glass-card group rounded-xl p-5 border border-border/40 hover:border-primary/60 transition-all"
              >
                <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <c.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display text-lg tracking-wide text-foreground group-hover:text-primary mb-1">
                  {c.title}
                </h3>
                <p className="text-sm text-muted-foreground">{c.services.length} services</p>
              </Link>
            ))}
          </div>

          <div className="mt-12">
            <InlineCallStrip label="Not sure which service you need? Call us." />
          </div>
        </div>
      </section>
      <Footer />
      <FloatingCallButton />
    </div>
  );
};

export default ServicesIndex;
