import { ShieldCheck, Star, Truck, Wallet, Wrench } from "lucide-react";

const badges = [
  { icon: Truck, label: "Mobile Service", sub: "We come to you" },
  { icon: Star, label: "5-Star Rated", sub: "Google · Facebook" },
  { icon: Wallet, label: "Up-Front Pricing", sub: "No surprises" },
  { icon: ShieldCheck, label: "Warranty Backed", sub: "Parts & labor" },
  { icon: Wrench, label: "ASE-Level Work", sub: "Pro tools & parts" },
];

const TrustBadges = () => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 my-8">
      {badges.map((b) => (
        <div
          key={b.label}
          className="glass-card rounded-xl p-4 text-center border border-border/40"
        >
          <div className="w-10 h-10 mx-auto rounded-lg bg-primary/10 flex items-center justify-center mb-2">
            <b.icon className="w-5 h-5 text-primary" />
          </div>
          <p className="font-semibold text-sm text-foreground">{b.label}</p>
          <p className="text-xs text-muted-foreground">{b.sub}</p>
        </div>
      ))}
    </div>
  );
};

export default TrustBadges;
