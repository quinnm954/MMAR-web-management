import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus, Receipt, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface Customer { id: string; full_name: string | null; email: string | null }
interface Invoice {
  id: string;
  invoice_number: string | null;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  amount_paid: number;
  due_date: string | null;
  paid_at: string | null;
  created_at: string;
  customer_id: string;
  customer?: Customer | null;
}

const STATUSES = ["unpaid", "partial", "paid", "overdue", "void"];
const statusColor = (s: string) => {
  if (s === "paid") return "bg-primary/15 text-primary";
  if (s === "overdue") return "bg-destructive/15 text-destructive";
  if (s === "void") return "bg-muted text-muted-foreground";
  return "bg-accent/15 text-accent-foreground";
};

const AdminInvoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    customer_id: "",
    invoice_number: "",
    subtotal: "",
    tax: "",
    due_date: "",
  });

  const load = async () => {
    setLoading(true);
    const [i, c] = await Promise.all([
      supabase.from("invoices").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, full_name, email").order("full_name"),
    ]);
    const list = (i.data as Invoice[]) ?? [];
    const profs = (c.data as Customer[]) ?? [];
    const byId: Record<string, Customer> = {};
    profs.forEach((p) => { byId[p.id] = p; });
    list.forEach((r) => { r.customer = byId[r.customer_id] ?? null; });
    setInvoices(list);
    setCustomers(profs);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.customer_id || !form.subtotal) return toast.error("Customer and subtotal required");
    const subtotal = parseFloat(form.subtotal);
    const tax = form.tax ? parseFloat(form.tax) : 0;
    setSaving(true);
    const { error } = await supabase.from("invoices").insert({
      customer_id: form.customer_id,
      invoice_number: form.invoice_number || `INV-${Date.now()}`,
      subtotal,
      tax,
      total: subtotal + tax,
      due_date: form.due_date || null,
      status: "unpaid",
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Invoice created");
    setOpen(false);
    setForm({ customer_id: "", invoice_number: "", subtotal: "", tax: "", due_date: "" });
    load();
  };

  const updateStatus = async (id: string, status: string) => {
    const update: Record<string, unknown> = { status };
    if (status === "paid") update.paid_at = new Date().toISOString();
    const { error } = await supabase.from("invoices").update(update).eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const totalDue = invoices.filter((i) => i.status !== "paid" && i.status !== "void").reduce((s, i) => s + (i.total - i.amount_paid), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs text-muted-foreground">{invoices.length} invoices</div>
          <div className="text-sm">Outstanding: <span className="font-bold">${totalDue.toFixed(2)}</span></div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button variant="hero" size="sm"><Plus className="h-4 w-4 mr-1" /> New Invoice</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Invoice</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Customer *</Label>
                <Select value={form.customer_id} onValueChange={(v) => setForm({ ...form, customer_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                  <SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.full_name || c.email}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Invoice Number</Label><Input value={form.invoice_number} onChange={(e) => setForm({ ...form, invoice_number: e.target.value })} placeholder="auto-generated" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Subtotal *</Label><Input type="number" step="0.01" value={form.subtotal} onChange={(e) => setForm({ ...form, subtotal: e.target.value })} /></div>
                <div><Label>Tax</Label><Input type="number" step="0.01" value={form.tax} onChange={(e) => setForm({ ...form, tax: e.target.value })} /></div>
              </div>
              <div><Label>Due Date</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button variant="hero" onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-2">
          {invoices.map((i) => (
            <Card key={i.id} className="border-border/50">
              <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Receipt className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-mono text-sm">{i.invoice_number}</div>
                    <div className="text-xs text-muted-foreground">{i.customer?.full_name || i.customer?.email}</div>
                    <div className="text-[10px] text-muted-foreground">{new Date(i.created_at).toLocaleDateString()}{i.due_date && ` • Due ${i.due_date}`}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-bold">${i.total.toFixed(2)}</div>
                    {i.amount_paid > 0 && <div className="text-xs text-muted-foreground">Paid ${i.amount_paid.toFixed(2)}</div>}
                  </div>
                  <Select value={i.status} onValueChange={(v) => updateStatus(i.id, v)}>
                    <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                  <Badge className={statusColor(i.status)}>{i.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminInvoices;
