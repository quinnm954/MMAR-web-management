import { Link } from "react-router-dom";
import { MapPin, ArrowRight } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import FloatingCallButton from "@/components/FloatingCallButton";
import InlineCallStrip from "@/components/InlineCallStrip";
import { cities } from "@/data/cities";
import { useSeo } from "@/lib/useSeo";

const ServiceAreas = () => {
  useSeo({
    title: "Service Areas | Mike's Mobile Auto Repair",
    description:
      "Mobile mechanic service areas across Lehigh Acres and Fort Myers, FL.",
    canonical: "https://mikesmautorepair.com/service-areas",
    breadcrumbs: [
      { name: "Home", url: "https://mikesmautorepair.com/" },
      { name: "Service Areas", url: "https://mikesmautorepair.com/service-areas" },
    ],
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <section className="pt-28 md:pt-32 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-wide mb-4">
            <span className="text-sky">SERVICE</span>{" "}
            <span className="text-gold">AREAS</span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground mb-10 max-w-3xl">
            We bring fully-equipped mobile mechanic service to driveways and workplaces across Lehigh Acres and Fort Myers.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cities.map((c) => (
              <Link
                key={c.slug}
                to={`/areas/${c.slug}`}
                className="glass-card group rounded-xl p-5 border border-border/40 hover:border-primary/60 transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  <h2 className="font-display text-lg md:text-xl tracking-wide text-foreground group-hover:text-primary">
                    {c.name}, {c.state}
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{c.intro}</p>
                <span className="inline-flex items-center gap-1 text-primary text-sm font-semibold">
                  View {c.name} page <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-12">
            <InlineCallStrip label="Not in this list? Call to confirm — we travel." />
          </div>
        </div>
      </section>
      <Footer />
      <FloatingCallButton />
    </div>
  );
};

export default ServiceAreas;
