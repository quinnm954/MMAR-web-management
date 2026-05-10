import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Loader2, Search, Mail, Car, CreditCard, Calendar, FileText, Receipt, Download,
  Plus, Pencil, Trash2,
} from "lucide-react";
import { toast } from "sonner";

interface Customer {
  id: string;
  email: string | null;
  full_name: string | null;
  phone?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  created_at: string;
  vehicle_count: number;
  membership_count: number;
}

const emptyForm = {
  full_name: "", email: "", phone: "",
  address_line1: "", address_line2: "", city: "", state: "FL", postal_code: "",
};

const AdminCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);
  const [details, setDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // add/edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  // delete dialog
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadCustomers = async () => {
    setLoading(true);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email, full_name, phone, address_line1, address_line2, city, state, postal_code, created_at")
      .order("created_at", { ascending: false });

    const ids = (profiles ?? []).map((p) => p.id);
    const [v, m] = await Promise.all([
      ids.length ? supabase.from("vehicles").select("owner_id").in("owner_id", ids).eq("is_active", true) : Promise.resolve({ data: [] as any[] }),
      ids.length ? supabase.from("memberships").select("customer_id, status").in("customer_id", ids) : Promise.resolve({ data: [] as any[] }),
    ]);
    const vCount: Record<string, number> = {};
    const mCount: Record<string, number> = {};
    (v.data ?? []).forEach((r: { owner_id: string }) => { vCount[r.owner_id] = (vCount[r.owner_id] ?? 0) + 1; });
    (m.data ?? []).forEach((r: { customer_id: string; status: string }) => {
      if (r.status === "active" || r.status === "pending") mCount[r.customer_id] = (mCount[r.customer_id] ?? 0) + 1;
    });

    setCustomers((profiles ?? []).map((p) => ({
      ...p,
      vehicle_count: vCount[p.id] ?? 0,
      membership_count: mCount[p.id] ?? 0,
    })));
    setLoading(false);
  };

  useEffect(() => { loadCustomers(); }, []);

  const openCustomer = async (c: Customer) => {
    setSelected(c);
    setDetails(null);
    setDetailsLoading(true);
    const [vehicles, memberships, appts, estimates, invoices] = await Promise.all([
      supabase.from("vehicles").select("*").eq("owner_id", c.id).eq("is_active", true).order("created_at", { ascending: false }),
      supabase.from("memberships").select("*, membership_plans(name)").eq("customer_id", c.id).order("created_at", { ascending: false }),
      supabase.from("appointments").select("*").eq("customer_id", c.id).order("created_at", { ascending: false }).limit(10),
      supabase.from("estimates").select("id, estimate_number, status, total, created_at").eq("customer_id", c.id).order("created_at", { ascending: false }).limit(10),
      supabase.from("invoices").select("id, invoice_number, status, total, created_at").eq("customer_id", c.id).order("created_at", { ascending: false }).limit(10),
    ]);
    setDetails({
      vehicles: vehicles.data ?? [],
      memberships: memberships.data ?? [],
      appointments: appts.data ?? [],
      estimates: estimates.data ?? [],
      invoices: invoices.data ?? [],
    });
    setDetailsLoading(false);
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setEditOpen(true);
  };

  const openEdit = (c: Customer, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditing(c);
    setForm({
      full_name: c.full_name ?? "",
      email: c.email ?? "",
      phone: c.phone ?? "",
      address_line1: c.address_line1 ?? "",
      address_line2: c.address_line2 ?? "",
      city: c.city ?? "",
      state: c.state ?? "FL",
      postal_code: c.postal_code ?? "",
    });
    setEditOpen(true);
  };

  const saveCustomer = async () => {
    if (!form.full_name.trim() && !form.email.trim()) {
      return toast.error("Name or email is required");
    }
    setSaving(true);
    try {
      if (editing) {
        const { error } = await supabase.from("profiles").update({
          full_name: form.full_name.trim() || null,
          email: form.email.trim().toLowerCase() || null,
          phone: form.phone.trim() || null,
          address_line1: form.address_line1.trim() || null,
          address_line2: form.address_line2.trim() || null,
          city: form.city.trim() || null,
          state: form.state.trim().toUpperCase() || null,
          postal_code: form.postal_code.trim() || null,
        }).eq("id", editing.id);
        if (error) throw error;
        toast.success("Customer updated");
      } else {
        const { data, error } = await supabase.functions.invoke("admin-create-customer", {
          body: {
            full_name: form.full_name.trim(),
            email: form.email.trim().toLowerCase(),
            phone: form.phone.trim(),
          },
        });
        if (error) throw error;
        const customerId = (data as any)?.customer_id;
        if (customerId && (form.address_line1 || form.city || form.postal_code)) {
          await supabase.from("profiles").update({
            phone: form.phone.trim() || null,
            address_line1: form.address_line1.trim() || null,
            address_line2: form.address_line2.trim() || null,
            city: form.city.trim() || null,
            state: form.state.trim().toUpperCase() || null,
            postal_code: form.postal_code.trim() || null,
          }).eq("id", customerId);
        }
        toast.success((data as any)?.reused ? "Customer linked" : "Customer created");
      }
      setEditOpen(false);
      loadCustomers();
    } catch (e: any) {
      toast.error(e.message ?? "Could not save customer");
    } finally {
      setSaving(false);
    }
  };

  const deleteCustomer = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { error } = await supabase.functions.invoke("admin-delete-customer", {
        body: { customer_id: deleteTarget.id },
      });
      if (error) throw error;
      toast.success("Customer deleted");
      setDeleteTarget(null);
      if (selected?.id === deleteTarget.id) setSelected(null);
      loadCustomers();
    } catch (e: any) {
      toast.error(e.message ?? "Could not delete");
    } finally {
      setDeleting(false);
    }
  };

  const filtered = customers.filter((c) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return (c.email ?? "").toLowerCase().includes(s) || (c.full_name ?? "").toLowerCase().includes(s);
  });

  const exportMarketingCsv = async () => {
    const { data, error } = await supabase
      .from("customer_marketing_export" as never)
      .select("*");
    if (error || !data) return;
    const rows = data as Array<Record<string, unknown>>;
    if (rows.length === 0) return;
    const headers = [
      "full_name","email","phone","address_line1","address_line2","city","state","postal_code",
      "marketing_opt_in","customer_since","service_count","last_service_date","last_service_type",
      "lifetime_spend","vehicles",
    ];
    const esc = (v: unknown) => {
      if (v === null || v === undefined) return "";
      const s = typeof v === "object" ? JSON.stringify(v) : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `customer-marketing-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by name or email…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
        <Button size="sm" onClick={openAdd} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Add Customer
        </Button>
        <Button variant="outline" size="sm" onClick={exportMarketingCsv} className="gap-1.5">
          <Download className="h-3.5 w-3.5" /> Marketing CSV
        </Button>
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} of {customers.length}</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((c) => (
            <Card
              key={c.id}
              className="border-border/50 cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => openCustomer(c)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold truncate">{c.full_name || "—"}</div>
                    <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {c.email || "(no email)"}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => openEdit(c, e)} title="Edit">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive"
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(c); }}
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Badge variant="secondary">{c.vehicle_count} vehicle{c.vehicle_count === 1 ? "" : "s"}</Badge>
                  <Badge variant="secondary">{c.membership_count} membership{c.membership_count === 1 ? "" : "s"}</Badge>
                </div>
                <div className="text-[10px] text-muted-foreground mt-2">
                  Joined {new Date(c.created_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selected?.full_name || "Customer"}</DialogTitle>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Mail className="h-3 w-3" /> {selected?.email}
            </p>
          </DialogHeader>

          {detailsLoading || !details ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <div className="space-y-5">
              <Section icon={Car} title={`Vehicles (${details.vehicles.length})`}>
                {details.vehicles.length === 0 ? <Empty /> : details.vehicles.map((v: any) => (
                  <Row key={v.id} primary={`${v.year} ${v.make} ${v.model}${v.trim ? ' ' + v.trim : ''}`}
                       secondary={[v.license_plate, v.vin, v.current_mileage ? `${v.current_mileage.toLocaleString()} mi` : null].filter(Boolean).join(' • ')} />
                ))}
              </Section>

              <Section icon={CreditCard} title={`Memberships (${details.memberships.length})`}>
                {details.memberships.length === 0 ? <Empty /> : details.memberships.map((m: any) => (
                  <Row key={m.id}
                       primary={m.membership_plans?.name || 'Membership'}
                       secondary={`${m.status} • Started ${m.start_date || '—'}`}
                       badge={m.status} />
                ))}
              </Section>

              <Section icon={Calendar} title={`Recent Appointments (${details.appointments.length})`}>
                {details.appointments.length === 0 ? <Empty /> : details.appointments.map((a: any) => (
                  <Row key={a.id} primary={a.service_type}
                       secondary={`${a.requested_date || a.scheduled_at?.slice(0, 10) || '—'} • ${a.status}`}
                       badge={a.status} />
                ))}
              </Section>

              <Section icon={FileText} title={`Estimates (${details.estimates.length})`}>
                {details.estimates.length === 0 ? <Empty /> : details.estimates.map((e: any) => (
                  <Row key={e.id} primary={`#${e.estimate_number || e.id.slice(0, 8)}`}
                       secondary={`$${Number(e.total).toFixed(2)} • ${new Date(e.created_at).toLocaleDateString()}`}
                       badge={e.status} />
                ))}
              </Section>

              <Section icon={Receipt} title={`Invoices (${details.invoices.length})`}>
                {details.invoices.length === 0 ? <Empty /> : details.invoices.map((i: any) => (
                  <Row key={i.id} primary={i.invoice_number || i.id.slice(0, 8)}
                       secondary={`$${Number(i.total).toFixed(2)} • ${new Date(i.created_at).toLocaleDateString()}`}
                       badge={i.status} />
                ))}
              </Section>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add / Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Customer" : "Add Customer"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update profile details." : "Creates a profile and (if email is provided) a sign-in account."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Full name</Label>
              <Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Street address</Label>
              <Input value={form.address_line1} onChange={e => setForm({ ...form, address_line1: e.target.value })} />
            </div>
            <div>
              <Label>Apt / Suite</Label>
              <Input value={form.address_line2} onChange={e => setForm({ ...form, address_line2: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2"><Label>City</Label><Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
              <div><Label>State</Label><Input maxLength={2} value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} /></div>
            </div>
            <div>
              <Label>ZIP</Label>
              <Input inputMode="numeric" value={form.postal_code} onChange={e => setForm({ ...form, postal_code: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={saveCustomer} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (editing ? "Save changes" : "Create customer")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && !deleting && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this customer?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes <strong>{deleteTarget?.full_name || deleteTarget?.email}</strong>, their sign-in account, vehicles, and history. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteCustomer} disabled={deleting} className="bg-destructive hover:bg-destructive/90">
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const Section = ({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) => (
  <div>
    <div className="flex items-center gap-2 mb-2 text-sm font-semibold">
      <Icon className="h-4 w-4 text-primary" /> {title}
    </div>
    <div className="space-y-1.5">{children}</div>
  </div>
);

const Row = ({ primary, secondary, badge }: { primary: string; secondary?: string; badge?: string }) => (
  <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-md bg-muted/30 text-sm">
    <div className="min-w-0">
      <div className="font-medium truncate">{primary}</div>
      {secondary && <div className="text-xs text-muted-foreground truncate">{secondary}</div>}
    </div>
    {badge && <Badge variant="outline" className="text-[10px] uppercase shrink-0">{badge}</Badge>}
  </div>
);

const Empty = () => <div className="text-xs text-muted-foreground px-3 py-2">None</div>;

export default AdminCustomers;
