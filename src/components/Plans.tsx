import { Check, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Basic",
    price: "$19.99",
    period: "/month",
    features: [
      "All Synthetic Oil Changes (includes Vehicle Inspection)",
      "Fluid Top-Offs at Time of Service",
      "1 Free Seasonal Readiness Check (Winter or Summer)",
    ],
    highlight: "Perfect for basic routine maintenance with high-quality oil",
    href: "https://buy.stripe.com/28E8wR4Gf64b9Ibc0a8AE0n",
    popular: false,
  },
  {
    name: "Tier 1 – Essential Protection",
    price: "$29.99",
    period: "/month",
    features: [
      "All Synthetic Oil Changes (includes Vehicle Inspection & Fluid Top-Offs)",
      "Emergency Roadside Assistance – up to 2 events/year",
      "2 Free Diagnostic Services per year",
      "10% Off All Additional Repairs",
    ],
    href: "https://buy.stripe.com/eVq4gB1u32RZ8E70hs8AE0h",
    popular: false,
  },
  {
    name: "Tier 2 – Premium Performance",
    price: "$69.99",
    period: "/month",
    features: [
      "Includes All Tier 1 Services",
      "Air Filter & Brake Pads Replacement – both axles, 1 per year",
      "Serpentine Belt Replacement – 1 every 2 years",
      "Differential & Transfer Case Inspection – 2 per year",
      "Cabin Air Filter Replacement – 1 per year",
      "Seasonal Readiness Checks – Winter + Summer",
    ],
    href: "https://buy.stripe.com/dRmdRb1u3csz6vZ8NY8AE0i",
    popular: true,
  },
  {
    name: "Tier 3 – Family Plan",
    price: "$109.99",
    period: "/month",
    features: [
      "Includes All Tier 2 Services",
      "Covers 3 vehicles",
      "Unlimited Diagnostic Services & Priority Scheduling",
      "Maintenance Tracking & Service History Access",
      "15% Off All Additional Repairs",
    ],
    href: "https://buy.stripe.com/5kQ8wRdcLakr2fJfcm8AE0j",
    popular: false,
  },
];

const addOns = [
  "Add a 3rd or 4th vehicle to any plan – $30/month each (starting at)",
  "Premium Brake Upgrades (e.g., Ceramic Pads) – $10/month",
  "Mobile Battery Delivery & Install – $10/month",
];

const Plans = () => {
  return (
    <section id="plans" className="py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl tracking-wide mb-6">
            <span className="text-foreground">MAINTENANCE</span>{" "}
            <span className="gradient-text">PLANS</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Subscribe to a maintenance plan and save on regular service
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`glass-card rounded-2xl p-6 relative hover-lift animate-slide-up ${
                plan.popular ? "ring-2 ring-primary glow-border" : ""
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3" /> Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="font-display text-xl tracking-wide text-foreground mb-3">
                  {plan.name}
                </h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-primary">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              {plan.highlight && (
                <p className="text-xs text-muted-foreground italic mb-6 border-t border-border pt-4">
                  {plan.highlight}
                </p>
              )}

              <Button
                variant={plan.popular ? "hero" : "outline"}
                className="w-full"
                asChild
              >
                <a href={plan.href} target="_blank" rel="noopener noreferrer">
                  Subscribe Now
                </a>
              </Button>
            </div>
          ))}
        </div>

        {/* Fleet Plans */}
        <div className="glass-card rounded-2xl p-8 mb-12 text-center animate-slide-up">
          <h3 className="font-display text-2xl tracking-wide text-foreground mb-4">
            Fleet Plans for Business – Custom Pricing
          </h3>
          <p className="text-muted-foreground max-w-3xl mx-auto mb-6">
            Designed for small business owners & fleet operators with 3 or more
            vehicles. Custom coverage options, priority dispatch, dedicated support,
            monthly billing with itemized service summaries, and streamlined
            scheduling & service history management.
          </p>
          <Button variant="heroOutline" size="lg" asChild>
            <a href="#contact">Contact for Custom Quote</a>
          </Button>
        </div>

        {/* Add-ons */}
        <div className="text-center">
          <h3 className="font-display text-xl tracking-wide text-foreground mb-4">
            Add-On Options
          </h3>
          <div className="flex flex-wrap justify-center gap-4">
            {addOns.map((addon) => (
              <span
                key={addon}
                className="bg-secondary text-secondary-foreground text-sm px-4 py-2 rounded-full"
              >
                {addon}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Plans;
