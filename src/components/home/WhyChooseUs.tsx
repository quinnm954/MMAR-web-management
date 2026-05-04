import { Wrench, ShieldCheck, Clock, MapPin, DollarSign, Truck } from "lucide-react";

const points = [
  {
    icon: Wrench,
    title: "ASE-Level Workmanship",
    body: "Real diagnostic equipment, OEM-grade parts, and a technician who's been turning wrenches for years — not a side hustler with a code reader. Every job is test-driven and verified before we leave.",
  },
  {
    icon: DollarSign,
    title: "Transparent, Up-Front Pricing",
    body: "You get a written quote before any wrench turns. No bait-and-switch shop fees, no surprise add-ons, and no diagnostic charge stacked on top of a repair we're already doing.",
  },
  {
    icon: Truck,
    title: "We Come to You",
    body: "Driveway, office parking lot, or apartment complex — we bring the shop to you. Skip the tow truck, skip the rideshare, skip the day off work.",
  },
  {
    icon: Clock,
    title: "Fast Response, 7am–9pm",
    body: "Most appointments are same-day across Lehigh Acres and Fort Myers — a real technician answers, not a call center.",
  },
  {
    icon: ShieldCheck,
    title: "Warrantied Repairs",
    body: "Parts and labor on every covered repair are backed by our standard mobile-service warranty. We document everything in writing.",
  },
  {
    icon: MapPin,
    title: "Locally Owned in Lee County",
    body: "Mike's Mobile Auto Repair LLC lives and works in Lehigh Acres and Fort Myers. We know the neighborhoods, the highways, and the way Florida heat treats your car.",
  },
];

const WhyChooseUs = () => {
  return (
    <section className="py-14 md:py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10 md:mb-14">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-wide mb-3">
            <span className="text-sky">WHY CHOOSE</span>{" "}
            <span className="text-gold">MIKE'S</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Six reasons drivers across Lehigh Acres and Fort Myers call us first.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
          {points.map((p) => (
            <div
              key={p.title}
              className="glass-card rounded-xl p-5 md:p-6 border border-border/40"
            >
              <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <p.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-display text-lg md:text-xl tracking-wide text-foreground mb-2">
                {p.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
