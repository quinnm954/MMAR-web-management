import { supabase } from "@/integrations/supabase/client";

export type MasterStatus = "good" | "monitor" | "due_soon" | "urgent" | "unknown";
export type MasterSource = "seed" | "tech_inspection" | "customer_edit" | "admin_edit";

export interface MasterChecklistItem {
  id: string;
  vehicle_id: string;
  customer_id: string;
  category: string;
  label: string;
  description: string | null;
  status: MasterStatus;
  measurement: string | null;
  severity_note: string | null;
  customer_note: string | null;
  price_low: number | null;
  price_high: number | null;
  source_template_id: string | null;
  source_template_item_id: string | null;
  last_checked_at: string | null;
  last_checked_by: string | null;
  last_source: MasterSource;
  is_hidden: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const STATUS_META: Record<MasterStatus, { label: string; tone: string }> = {
  good:     { label: "Good",        tone: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  monitor:  { label: "Monitor",     tone: "bg-sky-500/15 text-sky-300 border-sky-500/30" },
  due_soon: { label: "Due soon",    tone: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  urgent:   { label: "Urgent",      tone: "bg-red-500/15 text-red-300 border-red-500/30" },
  unknown:  { label: "Not checked", tone: "bg-muted text-muted-foreground border-border" },
};

export async function loadVehicleMaster(vehicleId: string) {
  const { data, error } = await supabase
    .from("vehicle_master_checklist_items")
    .select("*")
    .eq("vehicle_id", vehicleId)
    .order("category", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("label", { ascending: true });
  if (error) throw error;
  return (data ?? []) as MasterChecklistItem[];
}

export async function seedVehicleMaster(vehicleId: string) {
  const { data, error } = await supabase.rpc("seed_vehicle_master_checklist", { _vehicle_id: vehicleId });
  if (error) throw error;
  return data as number;
}

export async function updateMasterItem(id: string, patch: Partial<MasterChecklistItem>) {
  const { error } = await supabase
    .from("vehicle_master_checklist_items")
    .update(patch)
    .eq("id", id);
  if (error) throw error;
}

export async function insertMasterItem(row: {
  vehicle_id: string;
  customer_id: string;
  category?: string;
  label: string;
  description?: string | null;
  status?: MasterStatus;
}) {
  const { error } = await supabase
    .from("vehicle_master_checklist_items")
    .insert({
      ...row,
      category: row.category ?? "General",
      status: row.status ?? "unknown",
      last_source: "admin_edit",
      last_checked_at: new Date().toISOString(),
    });
  if (error) throw error;
}

export async function hideMasterItem(id: string, hidden: boolean) {
  await updateMasterItem(id, { is_hidden: hidden });
}

export function groupByCategory(items: MasterChecklistItem[]) {
  const map = new Map<string, MasterChecklistItem[]>();
  for (const it of items) {
    const k = it.category || "General";
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(it);
  }
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
}
