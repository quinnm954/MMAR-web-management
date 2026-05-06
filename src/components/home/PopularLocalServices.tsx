import { Link } from "react-router-dom";
import { Wrench, ArrowRight } from "lucide-react";

type Item = { slug: string; label: string };

const FORT_MYERS: Item[] = [
  { slug: "mobile-mechanic-fort-myers-fl", label: "Mobile Mechanic" },
  { slug: "brake-repair-fort-myers-fl", label: "Brake Repair" },
  { slug: "alternator-repair-fort-myers", label: "Alternator Repair" },
  { slug: "battery-replacement-fort-myers-fl", label: "Battery Replacement" },
  { slug: "ac-repair-fort-myers-fl", label: "AC Repair" },
  { slug: "engine-diagnostics-fort-myers-fl", label: "Engine Diagnostics" },
  { slug: "oil-change-fort-myers-fl", label: "Oil Change" },
];

const LEHIGH: Item[] = [
  { slug: "mobile-mechanic-lehigh-acres-fl", label: "Mobile Mechanic" },
  { slug: "brake-repair-lehigh-acres-fl", label: "Brake Repair" },
  { slug: "alternator-repair-lehigh-acres-fl", label: "Alternator Repair" },
  { slug: "battery-replacement-lehigh-acres-fl", label: "Battery Replacement" },
  { slug: "ac-repair-lehigh-acres-fl", label: "AC Repair" },
  { slug: "engine-diagnostics-lehigh-acres-fl", label: "Engine Diagnostics" },
  { slug: "oil-change-lehigh-acres-fl", label: "Oil Change" },
];

const Column = ({ city, items }: { city: string; items: Item[] }) => (
  <div className="glass-card rounded-2xl p-6 md:p-8 border border-border/40">
    <h3 className="font-display text-xl md:text-2xl tracking-wide mb-4">
      <span className="text-sky">{city.toUpperCase()}</span>{" "}
      <span className="text-gold">SERVICES</span>
    </h3>
    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {items.map((it) => (
        <li key={it.slug}>
          <Link
            to={`/${it.slug}`}
            className="group flex items-center gap-2 rounded-lg px-3 py-2 border border-border/40 hover:border-primary/60 hover:bg-primary/5 transition-all"
          >
            <Wrench className="w-4 h-4 text-primary shrink-0" />
            <span className="text-sm md:text-base text-foreground group-hover:text-primary transition-colors flex-1">
              {it.label} in {city}
            </span>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all" />
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

const PopularLocalServices = () => {
  return (
    <section className="py-14 md:py-20 bg-gradient-to-b from-background via-secondary/10 to-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-wide mb-3">
            <span className="text-sky">POPULAR</span>{" "}
            <span className="text-gold">LOCAL SERVICES</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Same-day mobile auto repair across Fort Myers and Lehigh Acres.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-5 md:gap-6 max-w-5xl mx-auto">
          <Column city="Fort Myers" items={FORT_MYERS} />
          <Column city="Lehigh Acres" items={LEHIGH} />
        </div>
      </div>
    </section>
  );
};

export default PopularLocalServices;
