import { Link } from "react-router-dom";
import {
  Stethoscope,
  Disc,
  BatteryCharging,
  Zap,
  KeyRound,
  Droplet,
  ArrowRight,
} from "lucide-react";

const featured = [
  { href: "/vehicle-diagnostics", icon: Stethoscope, title: "Diagnostics", desc: "On-site scan, code reading, and root-cause testing." },
  { href: "/brake-repair", icon: Disc, title: "Brake Repair", desc: "Pads, rotors, calipers, fluid — done in your driveway." },
  { href: "/battery-replacement", icon: BatteryCharging, title: "Battery Replacement", desc: "Fresh battery delivered and installed on-site." },
  { href: "/alternator-repair", icon: Zap, title: "Alternator Repair", desc: "Charging-system tests and same-day swaps." },
  { href: "/no-start-diagnostics", icon: KeyRound, title: "No-Start Diagnosis", desc: "We find why it won't start — and usually fix it on the spot." },
  { href: "/oil-change", icon: Droplet, title: "Mobile Oil Change", desc: "Full-service oil and filter change at your location." },
];

const FeaturedServices = () => {
  return (
    <section className="py-14 md:py-20 bg-secondary/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-wide mb-3">
            <span className="text-sky">FEATURED</span>{" "}
            <span className="text-gold">SERVICES</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            The mobile repairs we get called for most across Lehigh Acres and Fort Myers.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
          {featured.map((s) => (
            <Link
              key={s.href}
              to={s.href}
              className="glass-card group rounded-xl p-5 md:p-6 border border-border/40 hover:border-primary/60 transition-all"
            >
              <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <s.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-display text-lg md:text-xl tracking-wide text-foreground group-hover:text-primary transition-colors mb-1.5">
                {s.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">{s.desc}</p>
              <span className="inline-flex items-center gap-1 text-primary text-sm font-semibold">
                Learn more <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link
            to="/services"
            className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
          >
            View all services <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedServices;
