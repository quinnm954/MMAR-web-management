import { Link } from "react-router-dom";
import { MapPin, ArrowRight } from "lucide-react";

const cities = [
  { slug: "lehigh-acres", name: "Lehigh Acres" },
  { slug: "fort-myers", name: "Fort Myers" },
];

const ServiceAreasPreview = () => {
  return (
    <section className="py-14 md:py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-wide mb-3">
            <span className="text-sky">SERVICE</span>{" "}
            <span className="text-gold">AREAS</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Mobile mechanic service across Lehigh Acres and Fort Myers.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4 max-w-3xl mx-auto">
          {cities.map((c) => (
            <Link
              key={c.slug}
              to={`/areas/${c.slug}`}
              className="glass-card group rounded-xl p-4 border border-border/40 hover:border-primary/60 flex items-center gap-3 transition-all"
            >
              <MapPin className="w-5 h-5 text-primary shrink-0" />
              <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                {c.name}
              </span>
            </Link>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link
            to="/service-areas"
            className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
          >
            See all service areas <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ServiceAreasPreview;
