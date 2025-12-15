import {
  Gauge,
  Droplets,
  Disc,
  Battery,
  Zap,
  Thermometer,
  Wind,
  Settings,
  AlertCircle,
  Car,
  Timer,
  Fuel,
  Cpu,
  Search,
  Truck,
  ClipboardCheck,
} from "lucide-react";

const services = [
  { icon: Gauge, name: "Engine Diagnostics and Repair" },
  { icon: Droplets, name: "Oil and Filter Changes" },
  { icon: Disc, name: "Brake Pad and Rotor Replacement" },
  { icon: Battery, name: "Battery Testing and Replacement" },
  { icon: Zap, name: "Starter and Alternator Repair" },
  { icon: Thermometer, name: "Radiator and Cooling System Services" },
  { icon: Wind, name: "AC and Heating System Repair" },
  { icon: Settings, name: "Transmission Service and Replacement" },
  { icon: AlertCircle, name: "Check Engine Light Troubleshooting" },
  { icon: Car, name: "Suspension and Steering Repair" },
  { icon: Timer, name: "Timing Belt and Chain Replacement" },
  { icon: Fuel, name: "Fuel System Cleaning and Repair" },
  { icon: Cpu, name: "Electrical System Diagnostics" },
  { icon: Search, name: "Pre-Purchase Vehicle Inspections" },
  { icon: Truck, name: "Fleet Maintenance Services" },
  { icon: ClipboardCheck, name: "Mobile Vehicle Safety Inspections" },
];

const Services = () => {
  const handleServiceClick = (serviceName: string) => {
    const subject = encodeURIComponent(`Quote Request: ${serviceName}`);
    const body = encodeURIComponent(
      `Hi, I would like to request a quote for: ${serviceName}\n\nPlease let me know the estimated cost and availability.\n\nThank you!`
    );
    window.location.href = `mailto:mikesmobileautorepairllc@outlook.com?subject=${subject}&body=${body}`;
  };

  return (
    <section id="services" className="py-20 md:py-32 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl tracking-wide mb-6">
            <span className="text-foreground">COMPLETE AUTOMOTIVE</span>{" "}
            <span className="gradient-text">SERVICES</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Click any service below to request a quote instantly via email
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map((service, index) => (
            <button
              key={service.name}
              onClick={() => handleServiceClick(service.name)}
              className="glass-card rounded-xl p-5 text-left hover-lift group transition-all duration-300 hover:border-primary/50 animate-slide-up"
              style={{ animationDelay: `${index * 0.03}s` }}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <service.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  {service.name}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
