import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus, Wrench } from "lucide-react";
import { toast } from "sonner";
import DeleteButton from "@/components/admin/DeleteButton";

interface Customer { id: string; full_name: string | null; email: string | null }
interface Vehicle { id: string; owner_id: string; year: number | null; make: string | null; model: string | null }
interface Record_ {
  id: string;
  service_date: string;
  service_type: string;
  mileage_at_service: number | null;
  labor_performed: string | null;
  technician_notes: string | null;
  invoice_total: number | null;
  customer_id: string;
  customer?: { full_name: string | null; email: string | null } | null;
  vehicle: { year: number | null; make: string | null; model: string | null } | null;
}

const AdminServiceRecords = () => {
  const [records, setRecords] = useState<Record_[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    customer_id: "",
    vehicle_id: "",
    service_date: new Date().toISOString().slice(0, 10),
    service_type: "",
    mileage_at_service: "",
    labor_performed: "",
    technician_notes: "",
    invoice_total: "",
  });

  const load = async () => {
    setLoading(true);
    const [r, c, v] = await Promise.all([
      supabase
        .from("service_records")
        .select("id, service_date, service_type, mileage_at_service, labor_performed, technician_notes, invoice_total, customer_id, vehicle:vehicles(year, make, model)")
        .order("service_date", { ascending: false }),
      supabase.from("profiles").select("id, full_name, email").order("full_name"),
      supabase.from("vehicles").select("id, owner_id, year, make, model").eq("is_active", true),
    ]);
    const list = (r.data as unknown as Record_[]) ?? [];
    const profs = (c.data as Customer[]) ?? [];
    const byId: Record<string, Customer> = {};
    profs.forEach((p) => { byId[p.id] = p; });
    list.forEach((rec) => { rec.customer = byId[rec.customer_id] ?? null; });
    setRecords(list);
    setCustomers(profs);
    setVehicles((v.data as Vehicle[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.customer_id || !form.vehicle_id || !form.service_type) return toast.error("Customer, vehicle, and service type are required");
    setSaving(true);
    const { data: inserted, error } = await supabase.from("service_records").insert({
      customer_id: form.customer_id,
      vehicle_id: form.vehicle_id,
      service_date: form.service_date,
      service_type: form.service_type,
      mileage_at_service: form.mileage_at_service ? parseInt(form.mileage_at_service) : null,
      labor_performed: form.labor_performed || null,
      technician_notes: form.technician_notes || null,
      invoice_total: form.invoice_total ? parseFloat(form.invoice_total) : null,
    }).select("id").single();
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Service record logged");

    // Customer info for emails
    const customer = customers.find((c) => c.id === form.customer_id);
    const vehicle = vehicles.find((v) => v.id === form.vehicle_id);
    const vehicleStr = vehicle ? `${vehicle.year ?? ""} ${vehicle.make ?? ""} ${vehicle.model ?? ""}`.trim() : undefined;

    if (customer?.email && inserted?.id) {
      const { sendNotification } = await import("@/lib/notify");
      // Service completed email
      sendNotification({
        templateName: "service-completed",
        recipientEmail: customer.email,
        idempotencyKey: `service-done-${inserted.id}`,
        templateData: {
          customerName: customer.full_name || undefined,
          serviceType: form.service_type,
          vehicle: vehicleStr,
          notes: form.technician_notes || undefined,
        },
      });

      // Invoice issued email — invoice was auto-created by DB trigger
      if (form.invoice_total && parseFloat(form.invoice_total) > 0) {
        const { data: inv } = await supabase
          .from("invoices")
          .select("id, invoice_number, total, due_date")
          .eq("service_record_id", inserted.id)
          .maybeSingle();
        if (inv) {
          sendNotification({
            templateName: "invoice-issued",
            recipientEmail: customer.email,
            idempotencyKey: `invoice-issued-${inv.id}`,
            templateData: {
              customerName: customer.full_name || undefined,
              invoiceNumber: inv.invoice_number,
              total: `$${Number(inv.total).toFixed(2)}`,
              dueDate: inv.due_date,
              invoiceUrl: `${window.location.origin}/portal/invoices`,
            },
          });
        }
      }
    }

    setOpen(false);
    setForm({ customer_id: "", vehicle_id: "", service_date: new Date().toISOString().slice(0, 10), service_type: "", mileage_at_service: "", labor_performed: "", technician_notes: "", invoice_total: "" });
    load();
  };

  const customerVehicles = vehicles.filter((v) => v.owner_id === form.customer_id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">{records.length} records</div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" size="sm"><Plus className="h-4 w-4 mr-1" /> Log Service</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Log Service Record</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Customer *</Label>
                <Select value={form.customer_id} onValueChange={(v) => setForm({ ...form, customer_id: v, vehicle_id: "" })}>
                  <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.full_name || c.email}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Vehicle *</Label>
                <Select value={form.vehicle_id} onValueChange={(v) => setForm({ ...form, vehicle_id: v })} disabled={!form.customer_id}>
                  <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                  <SelectContent>
                    {customerVehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.year} {v.make} {v.model}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Service Date</Label><Input type="date" value={form.service_date} onChange={(e) => setForm({ ...form, service_date: e.target.value })} /></div>
                <div><Label>Mileage</Label><Input type="number" value={form.mileage_at_service} onChange={(e) => setForm({ ...form, mileage_at_service: e.target.value })} /></div>
              </div>
              <div><Label>Service Type *</Label><Input value={form.service_type} onChange={(e) => setForm({ ...form, service_type: e.target.value })} placeholder="Oil Change, Brake Pads, etc." /></div>
              <div><Label>Labor Performed</Label><Textarea rows={2} value={form.labor_performed} onChange={(e) => setForm({ ...form, labor_performed: e.target.value })} /></div>
              <div><Label>Technician Notes</Label><Textarea rows={2} value={form.technician_notes} onChange={(e) => setForm({ ...form, technician_notes: e.target.value })} /></div>
              <div><Label>Invoice Total ($)</Label><Input type="number" step="0.01" value={form.invoice_total} onChange={(e) => setForm({ ...form, invoice_total: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button variant="hero" onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Record"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-2">
          {records.map((r) => (
            <Card key={r.id} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                  <div>
                    <div className="flex items-center gap-2 font-bold"><Wrench className="h-4 w-4 text-primary" /> {r.service_type}</div>
                    <div className="text-xs text-muted-foreground">{r.customer?.full_name || r.customer?.email}</div>
                    {r.vehicle && <div className="text-xs">{r.vehicle.year} {r.vehicle.make} {r.vehicle.model}</div>}
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-medium">{r.service_date}</div>
                    {r.mileage_at_service != null && <div className="text-xs text-muted-foreground">{r.mileage_at_service.toLocaleString()} mi</div>}
                  </div>
                </div>
                {r.labor_performed && <p className="text-sm mt-2">{r.labor_performed}</p>}
                {r.technician_notes && <p className="text-xs italic text-muted-foreground mt-1">"{r.technician_notes}"</p>}
                {r.invoice_total != null && <Badge variant="secondary" className="mt-2">${r.invoice_total.toFixed(2)}</Badge>}
                <div className="flex justify-end mt-2">
                  <DeleteButton table="service_records" id={r.id} onDeleted={load} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminServiceRecords;
