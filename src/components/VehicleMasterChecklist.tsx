import { useEffect, useState } from "react";
import {
  loadVehicleMaster,
  seedVehicleMaster,
  updateMasterItem,
  insertMasterItem,
  hideMasterItem,
  groupByCategory,
  STATUS_META,
  type MasterChecklistItem,
  type MasterStatus,
} from "@/lib/vehicleMasterChecklist";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw, Plus, EyeOff, Eye, Save } from "lucide-react";

interface Props {
  vehicleId: string;
  /** Admin/staff get edit-all powers; customers only edit status/note/measurement. */
  mode: "admin" | "customer";
  customerId?: string;
}

const STATUS_OPTIONS: MasterStatus[] = ["good", "monitor", "due_soon", "urgent", "unknown"];

const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—";

const VehicleMasterChecklist = ({ vehicleId, mode, customerId }: Props) => {
  const { toast } = useToast();
  const [items, setItems] = useState<MasterChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, Partial<MasterChecklistItem>>>({});
  const [newLabel, setNewLabel] = useState("");
  const [newCategory, setNewCategory] = useState("General");

  const isAdmin = mode === "admin";

  const reload = async () => {
    setLoading(true);
    try {
      const rows = await loadVehicleMaster(vehicleId);
      setItems(rows);
      setDrafts({});
    } catch (e: any) {
      toast({ title: "Failed to load", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [vehicleId]);

  // Auto-seed on first view if empty
  useEffect(() => {
    if (!loading && items.length === 0) {
      (async () => {
        try {
          const n = await seedVehicleMaster(vehicleId);
          if (n > 0) await reload();
        } catch {/* ignore */}
      })();
    }
    // eslint-disable-next-line
  }, [loading]);

  const setDraft = (id: string, patch: Partial<MasterChecklistItem>) =>
    setDrafts(d => ({ ...d, [id]: { ...d[id], ...patch } }));

  const saveItem = async (item: MasterChecklistItem) => {
    const patch = drafts[item.id];
    if (!patch) return;
    setBusy(true);
    try {
      await updateMasterItem(item.id, patch);
      toast({ title: "Saved" });
      await reload();
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const reseed = async () => {
    setBusy(true);
    try {
      const n = await seedVehicleMaster(vehicleId);
      toast({ title: `Added ${n} item${n === 1 ? "" : "s"}` });
      await reload();
    } catch (e: any) {
      toast({ title: "Re-seed failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const addRow = async () => {
    if (!newLabel.trim() || !customerId) return;
    setBusy(true);
    try {
      await insertMasterItem({
        vehicle_id: vehicleId,
        customer_id: customerId,
        category: newCategory.trim() || "General",
        label: newLabel.trim(),
        status: "unknown",
      });
      setNewLabel("");
      await reload();
    } catch (e: any) {
      toast({ title: "Add failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const toggleHidden = async (it: MasterChecklistItem) => {
    setBusy(true);
    try {
      await hideMasterItem(it.id, !it.is_hidden);
      await reload();
    } finally {
      setBusy(false);
    }
  };

  const visible = items.filter(i => showHidden || !i.is_hidden);
  const grouped = groupByCategory(visible);

  if (loading) {
    return <div className="flex items-center gap-2 text-sm text-muted-foreground p-6"><Loader2 className="h-4 w-4 animate-spin" /> Loading vehicle health…</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm text-muted-foreground">
          {visible.length} item{visible.length === 1 ? "" : "s"} • updated whenever your tech completes an inspection
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowHidden(s => !s)}>
            {showHidden ? <><EyeOff className="h-4 w-4 mr-1" /> Hide hidden</> : <><Eye className="h-4 w-4 mr-1" /> Show hidden</>}
          </Button>
          {isAdmin && (
            <Button variant="outline" size="sm" onClick={reseed} disabled={busy}>
              <RefreshCw className={`h-4 w-4 mr-1 ${busy ? "animate-spin" : ""}`} /> Sync templates
            </Button>
          )}
        </div>
      </div>

      {grouped.length === 0 && (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">
          No items yet. {isAdmin ? "Click Sync templates to seed from your inspection templates." : "Your master checklist will populate after your first inspection."}
        </CardContent></Card>
      )}

      {grouped.map(([cat, rows]) => (
        <Card key={cat}>
          <CardHeader className="pb-3"><CardTitle className="text-base">{cat}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {rows.map(item => {
              const d = drafts[item.id] ?? {};
              const cur = { ...item, ...d };
              const meta = STATUS_META[cur.status];
              const dirty = Object.keys(d).length > 0;
              return (
                <div key={item.id} className={`rounded-lg border p-3 ${item.is_hidden ? "opacity-50" : ""}`}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">{item.label}</div>
                      {item.description && <div className="text-xs text-muted-foreground">{item.description}</div>}
                      <div className="text-[11px] text-muted-foreground mt-1">
                        Last: {fmtDate(item.last_checked_at)} • Source: {item.last_source.replace("_", " ")}
                        {item.price_low != null && item.price_high != null && (
                          <> • Est. ${item.price_low}–${item.price_high}</>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className={meta.tone}>{meta.label}</Badge>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-2 mt-3">
                    <Select value={cur.status} onValueChange={(v) => setDraft(item.id, { status: v as MasterStatus })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map(s => (
                          <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Measurement (e.g. 4mm)"
                      value={cur.measurement ?? ""}
                      onChange={(e) => setDraft(item.id, { measurement: e.target.value })}
                    />
                    <Input
                      placeholder={isAdmin ? "Tech / admin note" : "Your note (e.g. replaced at other shop)"}
                      value={(isAdmin ? cur.severity_note : cur.customer_note) ?? ""}
                      onChange={(e) => setDraft(item.id, isAdmin ? { severity_note: e.target.value } : { customer_note: e.target.value })}
                    />
                  </div>
                  {isAdmin && (
                    <Textarea
                      className="mt-2"
                      placeholder="Customer note (visible to customer)"
                      value={cur.customer_note ?? ""}
                      onChange={(e) => setDraft(item.id, { customer_note: e.target.value })}
                    />
                  )}
                  {!isAdmin && cur.severity_note && (
                    <div className="text-xs mt-2 p-2 rounded bg-muted">Tech note: {cur.severity_note}</div>
                  )}

                  <div className="flex items-center justify-end gap-2 mt-2">
                    {isAdmin && (
                      <Button variant="ghost" size="sm" onClick={() => toggleHidden(item)} disabled={busy}>
                        {item.is_hidden ? "Unhide" : "Hide"}
                      </Button>
                    )}
                    <Button size="sm" disabled={!dirty || busy} onClick={() => saveItem(item)}>
                      <Save className="h-4 w-4 mr-1" /> Save
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}

      {isAdmin && customerId && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Add custom item</CardTitle></CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-2">
              <Input placeholder="Label" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} />
              <Input placeholder="Category" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
              <Button onClick={addRow} disabled={!newLabel.trim() || busy}>
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VehicleMasterChecklist;
