import { useHomeRegion, AREA_TEXT } from "@/lib/homeRegion";
import { Wrench, ShieldCheck, Clock, MapPin, DollarSign, Truck } from "lucide-react";

const basePoints = [
  {
    icon: Wrench,
    title: "ASE-Level Workmanship",
    body: "Real diagnostic equipment, OEM-grade parts, and a technician who's been turning wrenches for years — not a side hustler with a code reader. Every job is test-driven and verified before we leave.",
  },
  {
    icon: DollarSign,
    title: "Transparent, Up-Front Pricing",
    body: "You get a written quote before any wrench turns. No bait-and-switch shop fees, no surprise add-ons. Diagnosis is a flat $100, and $50 of it is credited to your repair labor.",
  },
  {
    icon: Truck,
    title: "We Come to You",
    body: "Driveway, office parking lot, or apartment complex — we bring the shop to you. Skip the tow truck, skip the rideshare, skip the day off work.",
  },
  {
    icon: Clock,
    title: "Fast Response, Mon–Sat 8am–8pm",
    body: "Most appointments are next-day across Lehigh Acres and Fort Myers — a real technician answers, not a call center.",
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

const sflPoints = basePoints.map((p) =>
  p.icon === Clock
    ? { ...p, body: "Appointments start next-day, Mon–Sat — a real technician answers, not a call center." }
    : p.icon === MapPin
      ? { ...p, title: "Locally Owned in Florida", body: "Mike's Mobile Auto Repair is a Florida-owned business bringing the same service to Broward and Palm Beach. We know how I-95 traffic, salt air and Florida heat treat your car." }
      : p,
);

const WhyChooseUs = () => {
  const region = useHomeRegion();
  const A = AREA_TEXT[region];
  return (
    <section className="py-14 md:py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10 md:mb-14">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-wide mb-3">
            <span className="text-sky">WHY CHOOSE</span>{" "}
            <span className="text-gold">MIKE'S</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Six reasons drivers across {A.areas} call us first.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
          {(region === "sfl" ? sflPoints : basePoints).map((p) => (
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
