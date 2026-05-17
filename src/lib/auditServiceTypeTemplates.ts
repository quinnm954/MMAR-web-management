import { supabase } from "@/integrations/supabase/client";
import { SERVICE_TYPES } from "@/lib/serviceTypes";

// Service types that intentionally have no auto-attach template.
// Tech picks a checklist manually for these.
export const SERVICE_TYPES_WITHOUT_TEMPLATE = new Set<string>(["Diagnostic", "Other"]);

export type ServiceTemplateIssue =
  | { kind: "missing"; serviceType: string }
  | { kind: "duplicate"; serviceType: string; templates: string[] };

export type ServiceTemplateAudit = {
  ok: boolean;
  issues: ServiceTemplateIssue[];
  mapping: { serviceType: string; templateName: string | null }[];
};

/**
 * Audits that each SERVICE_TYPES entry maps to exactly one active
 * auto-attach checklist template (using the same case-insensitive
 * keyword-contained-in-service-type logic as the DB trigger).
 */
export async function auditServiceTypeTemplates(): Promise<ServiceTemplateAudit> {
  const { data, error } = await supabase
    .from("checklist_templates")
    .select("name, service_type_match, auto_attach, is_active");

  if (error) throw error;

  const templates = (data ?? []).filter(
    (t: any) => t.auto_attach && t.is_active && Array.isArray(t.service_type_match),
  );

  const issues: ServiceTemplateIssue[] = [];
  const mapping: ServiceTemplateAudit["mapping"] = [];

  for (const svc of SERVICE_TYPES) {
    if (SERVICE_TYPES_WITHOUT_TEMPLATE.has(svc)) {
      mapping.push({ serviceType: svc, templateName: null });
      continue;
    }
    const lowered = svc.toLowerCase();
    const matches = templates.filter((t: any) =>
      (t.service_type_match as string[]).some((kw) =>
        kw && lowered.includes(kw.toLowerCase()),
      ),
    );

    if (matches.length === 0) {
      issues.push({ kind: "missing", serviceType: svc });
      mapping.push({ serviceType: svc, templateName: null });
    } else if (matches.length > 1) {
      issues.push({
        kind: "duplicate",
        serviceType: svc,
        templates: matches.map((m: any) => m.name),
      });
      mapping.push({ serviceType: svc, templateName: matches.map((m: any) => m.name).join(", ") });
    } else {
      mapping.push({ serviceType: svc, templateName: (matches[0] as any).name });
    }
  }

  return { ok: issues.length === 0, issues, mapping };
}
