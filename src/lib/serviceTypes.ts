// Single source of truth for customer-selectable service types.
// Each entry maps 1:1 to an auto-attach checklist template via the
// checklist_templates.service_type_match keyword array.
export const SERVICE_TYPES = [
  "Oil Change",
  "Brake Service",
  "Tire Service / Alignment",
  "Battery / Electrical",
  "Cooling System",
  "Transmission Service",
  "AC Service",
  "Steering & Suspension",
  "Diagnostic",
  "Other",
] as const;

export type ServiceType = (typeof SERVICE_TYPES)[number];
