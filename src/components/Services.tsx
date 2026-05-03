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
  Wrench,
  Snowflake,
  CircleDot,
  Lightbulb,
  Gauge as GaugeIcon,
  Sparkles,
  ShieldCheck,
  Power,
  Cog,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import QuoteRequestDialog from "./QuoteRequestDialog";

type Service = { icon: LucideIcon; name: string };
type Category = { id: string; title: string; icon: LucideIcon; services: Service[] };

const categories: Category[] = [
  {
    id: "engine",
    title: "Engine & Performance",
    icon: Gauge,
    services: [
      { icon: Gauge, name: "Engine Diagnostics" },
      { icon: AlertCircle, name: "Check Engine Light Troubleshooting" },
      { icon: Wrench, name: "Engine Tune-Ups" },
      { icon: Timer, name: "Timing Belt Replacement" },
      { icon: Cog, name: "Timing Chain Replacement" },
      { icon: Sparkles, name: "Spark Plug Replacement" },
      { icon: Wind, name: "Air Filter Replacement" },
      { icon: Power, name: "Engine Misfire Repair" },
      { icon: Wrench, name: "Valve Cover Gasket Replacement" },
      { icon: Wrench, name: "Serpentine Belt Replacement" },
    ],
  },
  {
    id: "oil-fluids",
    title: "Oil & Fluids",
    icon: Droplets,
    services: [
      { icon: Droplets, name: "Conventional Oil Change" },
      { icon: Droplets, name: "Synthetic Blend Oil Change" },
      { icon: Droplets, name: "Full Synthetic Oil Change" },
      { icon: Droplets, name: "Oil Filter Replacement" },
      { icon: Droplets, name: "Transmission Fluid Service" },
      { icon: Droplets, name: "Coolant Flush" },
      { icon: Droplets, name: "Brake Fluid Flush" },
      { icon: Droplets, name: "Power Steering Fluid Service" },
      { icon: Droplets, name: "Differential Fluid Service" },
    ],
  },
  {
    id: "brakes",
    title: "Brakes",
    icon: Disc,
    services: [
      { icon: Disc, name: "Brake Pad Replacement" },
      { icon: Disc, name: "Brake Rotor Replacement" },
      { icon: Disc, name: "Brake Caliper Repair & Replacement" },
      { icon: Droplets, name: "Brake Fluid Flush" },
      { icon: Wrench, name: "Brake Line Repair" },
      { icon: AlertCircle, name: "ABS Diagnostics" },
      { icon: Disc, name: "Parking Brake Service" },
    ],
  },
  {
    id: "electrical",
    title: "Electrical & Battery",
    icon: Cpu,
    services: [
      { icon: Battery, name: "Battery Testing" },
      { icon: Battery, name: "Battery Replacement" },
      { icon: Zap, name: "Alternator Replacement" },
      { icon: Zap, name: "Starter Replacement" },
      { icon: Cpu, name: "Electrical System Diagnostics" },
      { icon: Lightbulb, name: "Headlight & Tail Light Replacement" },
      { icon: Wrench, name: "Wiring Repair" },
      { icon: Power, name: "Fuse & Relay Replacement" },
    ],
  },
  {
    id: "ac-heating",
    title: "AC & Heating",
    icon: Snowflake,
    services: [
      { icon: Snowflake, name: "AC Diagnostics" },
      { icon: Snowflake, name: "AC Recharge" },
      { icon: Wrench, name: "AC Compressor Replacement" },
      { icon: Thermometer, name: "Heater Core Repair" },
      { icon: Wind, name: "Blower Motor Replacement" },
      { icon: Thermometer, name: "Cabin Air Filter Replacement" },
    ],
  },
  {
    id: "cooling",
    title: "Cooling System",
    icon: Thermometer,
    services: [
      { icon: Thermometer, name: "Radiator Repair & Replacement" },
      { icon: Droplets, name: "Coolant Flush" },
      { icon: Wrench, name: "Water Pump Replacement" },
      { icon: Thermometer, name: "Thermostat Replacement" },
      { icon: Wrench, name: "Hose Replacement" },
      { icon: AlertCircle, name: "Overheating Diagnostics" },
    ],
  },
  {
    id: "transmission",
    title: "Transmission & Drivetrain",
    icon: Settings,
    services: [
      { icon: Settings, name: "Transmission Diagnostics" },
      { icon: Droplets, name: "Transmission Fluid Service" },
      { icon: Settings, name: "Transmission Replacement" },
      { icon: Cog, name: "Clutch Repair & Replacement" },
      { icon: Cog, name: "CV Axle Replacement" },
      { icon: Cog, name: "Driveshaft Repair" },
      { icon: Wrench, name: "Differential Repair" },
    ],
  },
  {
    id: "suspension",
    title: "Suspension & Steering",
    icon: Car,
    services: [
      { icon: Car, name: "Shock & Strut Replacement" },
      { icon: Wrench, name: "Control Arm Replacement" },
      { icon: Wrench, name: "Ball Joint Replacement" },
      { icon: Wrench, name: "Tie Rod Replacement" },
      { icon: Wrench, name: "Sway Bar Link Replacement" },
      { icon: Settings, name: "Power Steering Repair" },
      { icon: Wrench, name: "Wheel Bearing Replacement" },
    ],
  },
  {
    id: "tires-wheels",
    title: "Tires & Wheels",
    icon: CircleDot,
    services: [
      { icon: CircleDot, name: "Tire Rotation" },
      { icon: CircleDot, name: "Flat Tire Repair" },
      { icon: CircleDot, name: "Tire Pressure (TPMS) Service" },
      { icon: Wrench, name: "Wheel Hub Replacement" },
      { icon: GaugeIcon, name: "Tire Tread Inspection" },
    ],
  },
  {
    id: "fuel-exhaust",
    title: "Fuel & Exhaust",
    icon: Fuel,
    services: [
      { icon: Fuel, name: "Fuel System Cleaning" },
      { icon: Fuel, name: "Fuel Pump Replacement" },
      { icon: Fuel, name: "Fuel Injector Service" },
      { icon: Fuel, name: "Fuel Filter Replacement" },
      { icon: Wrench, name: "Exhaust Leak Repair" },
      { icon: Wrench, name: "Muffler Replacement" },
      { icon: AlertCircle, name: "Oxygen Sensor Replacement" },
      { icon: AlertCircle, name: "Catalytic Converter Diagnostics" },
    ],
  },
  {
    id: "inspections",
    title: "Inspections & Fleet",
    icon: ClipboardCheck,
    services: [
      { icon: Search, name: "Pre-Purchase Vehicle Inspection" },
      { icon: ClipboardCheck, name: "Mobile Safety Inspection" },
      { icon: ShieldCheck, name: "Multi-Point Inspection" },
      { icon: Truck, name: "Fleet Maintenance" },
      { icon: Truck, name: "Fleet Diagnostics" },
      { icon: ClipboardCheck, name: "Scheduled Maintenance Plans" },
    ],
  },
];

const Services = () => {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleServiceClick = (serviceName: string) => {
    setSelectedService(serviceName);
    setDialogOpen(true);
  };

  return (
    <section id="services" className="py-16 md:py-20 lg:py-32 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-wide mb-4 md:mb-6">
            <span className="text-sky">COMPLETE AUTOMOTIVE</span>{" "}
            <span className="text-gold">SERVICES</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            Browse by category and tap any service to request a quote instantly via text
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Accordion type="multiple" className="space-y-3">
            {categories.map((category) => (
              <AccordionItem
                key={category.id}
                value={category.id}
                className="glass-card rounded-xl border border-border/50 overflow-hidden"
              >
                <AccordionTrigger className="px-4 md:px-6 py-4 hover:no-underline group">
                  <div className="flex items-center gap-3 md:gap-4 text-left">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
                      <category.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg md:text-xl tracking-wide text-foreground group-hover:text-primary transition-colors">
                        {category.title}
                      </h3>
                      <p className="text-xs md:text-sm text-muted-foreground font-normal">
                        {category.services.length} services
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-3 md:px-4 pb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {category.services.map((service) => (
                      <button
                        key={service.name}
                        onClick={() => handleServiceClick(service.name)}
                        className="flex items-center gap-3 p-3 rounded-lg bg-background/40 hover:bg-primary/10 border border-border/30 hover:border-primary/50 text-left transition-all active:scale-[0.98] min-h-[56px] group"
                      >
                        <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                          <service.icon className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors leading-tight">
                          {service.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default Services;
