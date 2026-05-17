import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, GripVertical, Loader2, FileText, ListChecks, ArrowUp, ArrowDown, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { auditServiceTypeTemplates, type ServiceTemplateAudit } from "@/lib/auditServiceTypeTemplates";

type Template = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  plan_id: string | null;
  customer_visible: boolean;
  is_active: boolean;
  created_at: string;
  service_type_match: string[] | null;
  auto_attach: boolean;
  focus_area: string | null;
};

type TemplateItem = {
  id: string;
  template_id: string;
  label: string;
  description: string | null;
  sort_order: number;
  required: boolean;
  price_low: number | null;
  price_high: number | null;
};

type Checklist = {
  id: string;
  title: string;
  status: string;
  customer_id: string;
  vehicle_id: string | null;
  assigned_technician_id: string | null;
  appointment_id: string | null;
  template_id: string | null;
  customer_visible: boolean;
  created_at: string;
  completed_at: string | null;
};

type Item = {
  id: string;
  checklist_id: string;
  label: string;
  description: string | null;
  sort_order: number;
  required: boolean;
  status: string;
  notes: string | null;
  completed_at: string | null;
};

const CATEGORIES = ["oil_change", "brake_job", "inspection", "membership", "maintenance", "custom"];
const STATUSES = ["open", "in_progress", "completed"];

const AdminChecklists = () => {
  return (
    <Tabs defaultValue="templates" className="space-y-4">
      <TabsList>
        <TabsTrigger value="templates"><FileText className="h-4 w-4 mr-1" /> Templates</TabsTrigger>
        <TabsTrigger value="active"><ListChecks className="h-4 w-4 mr-1" /> Active checklists</TabsTrigger>
      </TabsList>
      <TabsContent value="templates"><TemplatesPanel /></TabsContent>
      <TabsContent value="active"><ChecklistsPanel /></TabsContent>
    </Tabs>
  );
};

const TemplatesPanel = () => {
  const [rows, setRows] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<{ id: string; name: string }[]>([]);
  const [editor, setEditor] = useState<Template | null>(null);
  const [audit, setAudit] = useState<ServiceTemplateAudit | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: tpls }, { data: pl }, auditResult] = await Promise.all([
      supabase.from("checklist_templates").select("*").order("created_at", { ascending: false }),
      supabase.from("membership_plans").select("id, name").order("sort_order"),
      auditServiceTypeTemplates().catch((e) => { console.error("audit failed", e); return null; }),
    ]);
    setRows((tpls as any) ?? []);
    setPlans((pl as any) ?? []);
    setAudit(auditResult);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    const { data, error } = await supabase.from("checklist_templates").insert({
      name: "Untitled template",
      category: "custom",
    }).select().single();
    if (error) return toast.error(error.message);
    setEditor(data as any);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this template? Existing instances are kept.")) return;
    const { error } = await supabase.from("checklist_templates").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  return (
    <div className="space-y-3">
      {audit && (
        audit.ok ? (
          <div className="flex items-start gap-2 rounded border border-green-600/40 bg-green-600/10 p-3 text-xs">
            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
            <div>
              <div className="font-medium text-foreground">All service types map to a checklist template.</div>
              <div className="text-muted-foreground mt-0.5">
                {audit.mapping.filter(m => m.templateName).length} mapped · {audit.mapping.filter(m => !m.templateName).length} intentionally unmapped (Diagnostic / Other).
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2 rounded border border-destructive/50 bg-destructive/10 p-3 text-xs">
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="font-medium text-foreground">Checklist coverage problems detected</div>
              <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                {audit.issues.map((i, idx) =>
                  i.kind === "missing" ? (
                    <li key={idx}><span className="text-foreground">{i.serviceType}</span> — no auto-attach template. Create one or add a matching keyword.</li>
                  ) : (
                    <li key={idx}><span className="text-foreground">{i.serviceType}</span> — matches multiple templates: {i.templates.join(", ")}. Narrow the keywords.</li>
                  )
                )}
              </ul>
            </div>
          </div>
        )
      )}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Checklist templates</h3>
        <Button size="sm" onClick={create}><Plus className="h-4 w-4 mr-1" /> New template</Button>
      </div>
      {loading ? <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin" /></div> : (
        <Card><CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Name</TableHead><TableHead>Category</TableHead>
              <TableHead>Plan</TableHead><TableHead>Visible</TableHead>
              <TableHead>Active</TableHead><TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No templates yet.</TableCell></TableRow>
              ) : rows.map(t => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell><Badge variant="secondary">{t.category}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{plans.find(p => p.id === t.plan_id)?.name ?? "—"}</TableCell>
                  <TableCell>{t.customer_visible ? "Yes" : "No"}</TableCell>
                  <TableCell>{t.is_active ? "Yes" : "No"}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="sm" variant="ghost" onClick={() => setEditor(t)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(t.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent></Card>
      )}
      {editor && <TemplateEditor template={editor} plans={plans} onClose={() => { setEditor(null); load(); }} />}
    </div>
  );
};

const TemplateEditor = ({ template, plans, onClose }: { template: Template; plans: { id: string; name: string }[]; onClose: () => void }) => {
  const [form, setForm] = useState<Template>(template);
  const [items, setItems] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLabel, setNewLabel] = useState("");

  const loadItems = async () => {
    setLoading(true);
    const { data } = await supabase.from("checklist_template_items").select("*").eq("template_id", template.id).order("sort_order");
    setItems((data as any) ?? []);
    setLoading(false);
  };
  useEffect(() => { loadItems(); }, [template.id]);

  const saveTemplate = async () => {
    const { error } = await supabase.from("checklist_templates").update({
      name: form.name, description: form.description, category: form.category,
      plan_id: form.plan_id, customer_visible: form.customer_visible, is_active: form.is_active,
      auto_attach: form.auto_attach, focus_area: form.focus_area,
      service_type_match: form.service_type_match ?? [],
    }).eq("id", form.id);
    if (error) return toast.error(error.message);
    toast.success("Saved");
  };

  const addItem = async () => {
    if (!newLabel.trim()) return;
    const next = (items[items.length - 1]?.sort_order ?? -1) + 1;
    const { error } = await supabase.from("checklist_template_items").insert({
      template_id: template.id, label: newLabel.trim(), sort_order: next,
    });
    if (error) return toast.error(error.message);
    setNewLabel("");
    loadItems();
  };

  const updateItem = async (id: string, patch: Partial<TemplateItem>) => {
    const { error } = await supabase.from("checklist_template_items").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    loadItems();
  };

  const removeItem = async (id: string) => {
    await supabase.from("checklist_template_items").delete().eq("id", id);
    loadItems();
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= items.length) return;
    const a = items[idx], b = items[swapIdx];
    await Promise.all([
      supabase.from("checklist_template_items").update({ sort_order: b.sort_order }).eq("id", a.id),
      supabase.from("checklist_template_items").update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);
    loadItems();
  };

  return (
    <Sheet open onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader><SheetTitle>Edit template</SheetTitle></SheetHeader>
        <div className="space-y-4 mt-4">
          <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>Description</Label><Textarea rows={2} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Linked plan</Label>
              <Select value={form.plan_id ?? "none"} onValueChange={(v) => setForm({ ...form, plan_id: v === "none" ? null : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {plans.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between rounded border p-2">
            <div><Label>Customer visible</Label><p className="text-xs text-muted-foreground">Show this checklist in customer portal</p></div>
            <Switch checked={form.customer_visible} onCheckedChange={(v) => setForm({ ...form, customer_visible: v })} />
          </div>
          <div className="flex items-center justify-between rounded border p-2">
            <div><Label>Active</Label><p className="text-xs text-muted-foreground">Available to spawn new checklists from</p></div>
            <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
          </div>
          <div className="flex items-center justify-between rounded border p-2">
            <div><Label>Auto-attach to matching jobs</Label><p className="text-xs text-muted-foreground">Spawn this checklist when an appointment's service type matches a keyword below</p></div>
            <Switch checked={form.auto_attach} onCheckedChange={(v) => setForm({ ...form, auto_attach: v })} />
          </div>
          <div>
            <Label>Service type keywords</Label>
            <Input
              value={(form.service_type_match ?? []).join(", ")}
              onChange={(e) => setForm({ ...form, service_type_match: e.target.value.split(",").map(s => s.trim().toLowerCase()).filter(Boolean) })}
              placeholder="e.g. brake, brakes, pad, rotor"
            />
            <p className="text-xs text-muted-foreground mt-1">Comma-separated. Matches if any keyword appears in the appointment's service type (case-insensitive).</p>
          </div>
          <div>
            <Label>Focus area (optional)</Label>
            <Input value={form.focus_area ?? ""} onChange={(e) => setForm({ ...form, focus_area: e.target.value })} placeholder="e.g. Suspension + wheel area" />
          </div>
          <Button onClick={saveTemplate} className="w-full">Save details</Button>

          <div className="pt-4 border-t">
            <h4 className="font-semibold mb-2">Items</h4>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <div className="space-y-2">
                {items.map((it, idx) => (
                  <div key={it.id} className="flex flex-col gap-2 border rounded p-2">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                      <Input value={it.label} onChange={(e) => setItems(items.map(x => x.id === it.id ? { ...x, label: e.target.value } : x))} onBlur={(e) => e.target.value !== template.name && updateItem(it.id, { label: e.target.value })} className="h-8" />
                      <div className="flex items-center gap-1 text-xs">
                        <Switch checked={it.required} onCheckedChange={(v) => updateItem(it.id, { required: v })} /> req
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => move(idx, -1)}><ArrowUp className="h-3 w-3" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => move(idx, 1)}><ArrowDown className="h-3 w-3" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => removeItem(it.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                    <div className="flex items-center gap-2 pl-6">
                      <span className="text-[11px] text-muted-foreground shrink-0">Local price range $</span>
                      <Input type="number" step="1" placeholder="low" value={it.price_low ?? ""} className="h-7 w-20"
                        onChange={(e) => setItems(items.map(x => x.id === it.id ? { ...x, price_low: e.target.value === "" ? null : Number(e.target.value) } : x))}
                        onBlur={(e) => updateItem(it.id, { price_low: e.target.value === "" ? null : Number(e.target.value) })} />
                      <span className="text-xs text-muted-foreground">–</span>
                      <Input type="number" step="1" placeholder="high" value={it.price_high ?? ""} className="h-7 w-20"
                        onChange={(e) => setItems(items.map(x => x.id === it.id ? { ...x, price_high: e.target.value === "" ? null : Number(e.target.value) } : x))}
                        onBlur={(e) => updateItem(it.id, { price_high: e.target.value === "" ? null : Number(e.target.value) })} />
                    </div>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input placeholder="New item label" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addItem()} />
                  <Button onClick={addItem}><Plus className="h-4 w-4" /></Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

const ChecklistsPanel = () => {
  const [rows, setRows] = useState<Checklist[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [customers, setCustomers] = useState<Record<string, { full_name: string | null; email: string | null }>>({});
  const [techs, setTechs] = useState<{ id: string; full_name: string | null; email: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [active, setActive] = useState<Checklist | null>(null);
  const [newOpen, setNewOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("service_checklists").select("*").order("created_at", { ascending: false }).limit(500);
    const list = (data as any) ?? [];
    setRows(list);
    const ids = Array.from(new Set(list.map((r: Checklist) => r.customer_id))) as string[];
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name, email").in("id", ids);
      const map: any = {};
      (profs ?? []).forEach((p: any) => { map[p.id] = { full_name: p.full_name, email: p.email }; });
      setCustomers(map);
    }
    const [{ data: tpls }, { data: roleRows }] = await Promise.all([
      supabase.from("checklist_templates").select("*").eq("is_active", true),
      supabase.from("user_roles").select("user_id").eq("role", "technician"),
    ]);
    setTemplates((tpls as any) ?? []);
    const tIds = Array.from(new Set((roleRows ?? []).map((r: any) => r.user_id))) as string[];
    if (tIds.length) {
      const { data: tp } = await supabase.from("profiles").select("id, full_name, email").in("id", tIds);
      setTechs((tp as any) ?? []);
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => statusFilter === "all" ? rows : rows.filter(r => r.status === statusFilter), [rows, statusFilter]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-semibold">Active checklists</h3>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => setNewOpen(true)}><Plus className="h-4 w-4 mr-1" /> New checklist</Button>
        </div>
      </div>
      {loading ? <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin" /></div> : (
        <Card><CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Title</TableHead><TableHead>Customer</TableHead>
              <TableHead>Technician</TableHead><TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">No checklists.</TableCell></TableRow>
              ) : filtered.map(r => {
                const c = customers[r.customer_id];
                const t = techs.find(x => x.id === r.assigned_technician_id);
                return (
                  <TableRow key={r.id} onClick={() => setActive(r)} className="cursor-pointer">
                    <TableCell className="font-medium">{r.title}</TableCell>
                    <TableCell>{c?.full_name || c?.email || "—"}</TableCell>
                    <TableCell>{t?.full_name || t?.email || "Unassigned"}</TableCell>
                    <TableCell><Badge variant={r.status === "completed" ? "secondary" : "default"}>{r.status}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent></Card>
      )}
      {active && <ChecklistDrawer checklist={active} techs={techs} onClose={() => { setActive(null); load(); }} />}
      {newOpen && <NewChecklistDialog templates={templates} techs={techs} onClose={() => { setNewOpen(false); load(); }} />}
    </div>
  );
};

const NewChecklistDialog = ({ templates, techs, onClose }: { templates: Template[]; techs: { id: string; full_name: string | null; email: string | null }[]; onClose: () => void }) => {
  const [templateId, setTemplateId] = useState<string>("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customers, setCustomers] = useState<{ id: string; full_name: string | null; email: string | null }[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [techId, setTechId] = useState<string>("none");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (customerSearch.trim().length < 2) return setCustomers([]);
      const q = `%${customerSearch.trim()}%`;
      const { data } = await supabase.from("profiles").select("id, full_name, email").or(`full_name.ilike.${q},email.ilike.${q}`).limit(10);
      setCustomers((data as any) ?? []);
    }, 250);
    return () => clearTimeout(t);
  }, [customerSearch]);

  const submit = async () => {
    if (!templateId || !customerId) return toast.error("Template and customer required");
    setSaving(true);
    const { error } = await supabase.rpc("create_checklist_from_template", {
      _template_id: templateId,
      _customer_id: customerId,
      _assigned_technician_id: techId === "none" ? null : techId,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Checklist created");
    onClose();
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>New checklist</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Template</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger><SelectValue placeholder="Pick a template" /></SelectTrigger>
              <SelectContent>{templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Customer</Label>
            <Input placeholder="Search by name or email" value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} />
            {customers.length > 0 && (
              <div className="border rounded mt-1 max-h-40 overflow-y-auto">
                {customers.map(c => (
                  <button key={c.id} onClick={() => { setCustomerId(c.id); setCustomerSearch(c.full_name || c.email || ""); setCustomers([]); }} className={`w-full text-left px-2 py-1 hover:bg-muted text-sm ${customerId === c.id ? "bg-muted" : ""}`}>
                    {c.full_name || "(no name)"} <span className="text-xs text-muted-foreground">{c.email}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div><Label>Assign technician (optional)</Label>
            <Select value={techId} onValueChange={setTechId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Unassigned —</SelectItem>
                {techs.map(t => <SelectItem key={t.id} value={t.id}>{t.full_name || t.email}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const ChecklistDrawer = ({ checklist, techs, onClose }: { checklist: Checklist; techs: { id: string; full_name: string | null; email: string | null }[]; onClose: () => void }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [form, setForm] = useState<Checklist>(checklist);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("service_checklist_items").select("*").eq("checklist_id", checklist.id).order("sort_order");
    setItems((data as any) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [checklist.id]);

  const saveMeta = async (patch: Partial<Checklist>) => {
    setForm({ ...form, ...patch });
    const { error } = await supabase.from("service_checklists").update(patch).eq("id", checklist.id);
    if (error) toast.error(error.message);
  };

  const setItemStatus = async (id: string, status: string) => {
    const completed = status === "done" ? { completed_at: new Date().toISOString() } : { completed_at: null };
    const { error } = await supabase.from("service_checklist_items").update({ status, ...completed }).eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const setItemNotes = async (id: string, notes: string) => {
    await supabase.from("service_checklist_items").update({ notes }).eq("id", id);
  };

  const markComplete = async () => {
    await saveMeta({ status: "completed", completed_at: new Date().toISOString() as any });
    toast.success("Marked complete");
  };

  return (
    <Sheet open onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader><SheetTitle>{form.title}</SheetTitle></SheetHeader>
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => saveMeta({ status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Technician</Label>
              <Select value={form.assigned_technician_id ?? "none"} onValueChange={(v) => saveMeta({ assigned_technician_id: v === "none" ? null : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Unassigned —</SelectItem>
                  {techs.map(t => <SelectItem key={t.id} value={t.id}>{t.full_name || t.email}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Items</h4>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <div className="space-y-2">
                {items.map(it => (
                  <div key={it.id} className="border rounded p-2 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium flex-1">{it.label} {it.required && <Badge variant="outline" className="ml-1 text-[10px]">required</Badge>}</span>
                      <Select value={it.status} onValueChange={(v) => setItemStatus(it.id, v)}>
                        <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="done">Done</SelectItem>
                          <SelectItem value="na">N/A</SelectItem>
                          <SelectItem value="issue">Issue</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Input placeholder="Notes" defaultValue={it.notes ?? ""} onBlur={(e) => e.target.value !== (it.notes ?? "") && setItemNotes(it.id, e.target.value)} className="h-8 text-xs" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button onClick={markComplete} className="w-full" disabled={form.status === "completed"}>Mark checklist complete</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AdminChecklists;
