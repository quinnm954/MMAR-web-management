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

export type Service = { icon: LucideIcon; name: string };
export type Category = {
  id: string;
  title: string;
  icon: LucideIcon;
  description: string;
  services: Service[];
};

export const categories: Category[] = [
  {
    id: "engine",
    title: "Engine & Performance",
    icon: Gauge,
    description:
      "From check-engine-light diagnostics to full tune-ups, our mobile mechanics keep your engine running strong — right in your driveway.",
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
    description:
      "Mobile oil changes and fluid services at your home or office. Conventional, blend, and full synthetic — done right, the first time.",
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
    description:
      "Complete mobile brake service: pads, rotors, calipers, lines, and ABS diagnostics. Stop safely without ever leaving home.",
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
    description:
      "Dead battery, bad alternator, or mystery electrical gremlin? We diagnose and fix on-site with professional scan tools.",
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
    description:
      "Florida heat is no joke. We diagnose, recharge, and repair AC systems on-site so you stay cool every mile.",
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
    description:
      "Overheating? We handle radiators, water pumps, thermostats, and hoses to keep your engine at the right temperature.",
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
    description:
      "Slipping, hard shifts, or a no-go drivetrain? Mobile diagnostics and repairs for transmissions, clutches, CV axles, and more.",
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
    description:
      "Smooth out the ride with mobile shock, strut, control arm, ball joint, and steering repairs done at your location.",
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
    description:
      "Flat tire, TPMS warning, or wheel hub issue? Mobile tire service brings the shop to your driveway.",
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
    description:
      "Fuel pumps, injectors, exhaust leaks, O2 sensors, and catalytic converter diagnostics — all handled on-site.",
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
    description:
      "Pre-purchase inspections, multi-point safety checks, and fleet maintenance plans for businesses across Lehigh Acres and Fort Myers.",
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

export const getCategoryBySlug = (slug: string) =>
  categories.find((c) => c.id === slug);
