// Canonical mileage-based maintenance intervals.
// `name` is also stored verbatim as `service_records.service_type` so the
// reminder edge function can match it back to this list (the function adds
// each lowercase name as one of its keywords).
export interface MaintenanceInterval {
  name: string;
  intervalMiles: number;
  category: "engine" | "brakes" | "tires" | "fluids" | "electrical" | "comfort" | "drivetrain" | "general";
}

export const MAINTENANCE_INTERVALS: MaintenanceInterval[] = [
  { name: "Oil & filter change", intervalMiles: 5000, category: "engine" },
  { name: "Tire rotation", intervalMiles: 7500, category: "tires" },
  { name: "Multi-point inspection", intervalMiles: 10000, category: "general" },
  { name: "Wheel alignment check", intervalMiles: 15000, category: "tires" },
  { name: "Brake inspection", intervalMiles: 15000, category: "brakes" },
  { name: "Cabin air filter", intervalMiles: 20000, category: "comfort" },
  { name: "Battery test", intervalMiles: 25000, category: "electrical" },
  { name: "Fuel system cleaning", intervalMiles: 30000, category: "engine" },
  { name: "Engine air filter", intervalMiles: 30000, category: "engine" },
  { name: "Brake fluid flush", intervalMiles: 30000, category: "brakes" },
  { name: "A/C system performance check", intervalMiles: 30000, category: "comfort" },
  { name: "Brake pads & rotors", intervalMiles: 40000, category: "brakes" },
  { name: "Power steering fluid flush", intervalMiles: 50000, category: "fluids" },
  { name: "Transmission fluid service", intervalMiles: 60000, category: "drivetrain" },
  { name: "Coolant flush", intervalMiles: 60000, category: "fluids" },
  { name: "Spark plug replacement", intervalMiles: 60000, category: "engine" },
  { name: "Differential fluid service", intervalMiles: 60000, category: "drivetrain" },
  { name: "Transfer case fluid (4WD/AWD)", intervalMiles: 60000, category: "drivetrain" },
  { name: "PCV valve replacement", intervalMiles: 60000, category: "engine" },
  { name: "Serpentine belt inspection", intervalMiles: 60000, category: "engine" },
  { name: "Fuel filter replacement", intervalMiles: 60000, category: "engine" },
  { name: "Shocks & struts inspection", intervalMiles: 75000, category: "general" },
  { name: "Timing belt replacement", intervalMiles: 90000, category: "engine" },
  { name: "Oxygen sensor replacement", intervalMiles: 100000, category: "engine" },
];

export const SELF_REPORTED_NOTE = "Self-reported by customer (performed elsewhere)";
