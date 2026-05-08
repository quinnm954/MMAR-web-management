import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus, Receipt, MessageSquare, Link2, Share2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { shareLink } from "@/lib/share";
import DeleteButton from "@/components/admin/DeleteButton";

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
  service_record_id: string | null;
  customer?: Customer | null;
  technician_name?: string | null;
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
  const [repliesByInvoice, setRepliesByInvoice] = useState<Record<string, Array<{ id: string; body: string; created_at: string; phone: string }>>>({});
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

    // Load inbound SMS replies linked to these invoices
    const ids = list.map((l) => l.id);
    if (ids.length) {
      const { data: msgs } = await supabase
        .from("sms_messages")
        .select("id, body, created_at, invoice_id, thread_id, direction, sms_threads:thread_id(phone)")
        .in("invoice_id", ids)
        .eq("direction", "inbound")
        .order("created_at", { ascending: false });
      const map: Record<string, any[]> = {};
      (msgs ?? []).forEach((m: any) => {
        if (!m.invoice_id) return;
        (map[m.invoice_id] = map[m.invoice_id] || []).push({
          id: m.id, body: m.body, created_at: m.created_at, phone: m.sms_threads?.phone || "",
        });
      });
      setRepliesByInvoice(map);
    } else {
      setRepliesByInvoice({});
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("invoices-sms")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "sms_messages" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

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

  const [textingId, setTextingId] = useState<string | null>(null);

  const sharePaymentLink = async (invoice: Invoice) => {
    setTextingId(invoice.id);
    const { data, error } = await supabase.functions.invoke("send-invoice-payment-link", { body: { invoice_id: invoice.id, copy_only: true } });
    setTextingId(null);
    const respErr = (data as any)?.error || error?.message;
    if (respErr) return toast.error(respErr);
    const url = (data as any)?.url;
    if (!url) return toast.error("No link returned");
    await shareLink({
      url,
      title: `Invoice ${invoice.invoice_number ?? ''}`.trim(),
      text: `${invoice.customer?.full_name || 'Customer'}, here is your invoice from MMAR Care for $${(invoice.total - invoice.amount_paid).toFixed(2)}:`,
      copyToastMessage: 'Payment link copied — share with the customer',
    });
  };

  const [copyingId, setCopyingId] = useState<string | null>(null);
  const copyPaymentLink = async (invoiceId: string) => {
    setCopyingId(invoiceId);
    const { data, error } = await supabase.functions.invoke("send-invoice-payment-link", { body: { invoice_id: invoiceId, copy_only: true } });
    setCopyingId(null);
    const respErr = (data as any)?.error || error?.message;
    if (respErr) return toast.error(respErr);
    const url = (data as any)?.url;
    if (!url) return toast.error("No link returned");
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Payment link copied");
    } catch {
      window.prompt("Copy payment link:", url);
    }
  };

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
          {invoices.map((i) => {
            const replies = repliesByInvoice[i.id] || [];
            return (
            <Card key={i.id} className="border-border/50">
              <CardContent className="p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
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
                    <Button size="sm" variant="outline" onClick={() => window.open(`/portal/invoices/${i.id}`, "_blank")} title="Open invoice page">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    {i.status !== "paid" && i.status !== "void" && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => sharePaymentLink(i)} disabled={textingId === i.id} title="Share payment link">
                          {textingId === i.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Share2 className="h-3 w-3 mr-1" />}
                          Share
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => copyPaymentLink(i.id)} disabled={copyingId === i.id} title="Copy payment link to clipboard">
                          {copyingId === i.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Link2 className="h-3 w-3 mr-1" />}
                          Copy Link
                        </Button>
                      </>
                    )}
                    <Select value={i.status} onValueChange={(v) => updateStatus(i.id, v)}>
                      <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                    <Badge className={statusColor(i.status)}>{i.status}</Badge>
                    <DeleteButton
                      table="invoices"
                      id={i.id}
                      size="icon"
                      description={`Delete invoice ${i.invoice_number ?? ""}? This will not refund any payments.`}
                      onDeleted={load}
                    />
                  </div>
                </div>
                {replies.length > 0 && (
                  <div className="rounded-md border border-border/50 bg-muted/30 p-2 space-y-1">
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-primary">
                      <MessageSquare className="h-3 w-3" /> {replies.length} customer {replies.length === 1 ? "reply" : "replies"}
                    </div>
                    {replies.slice(0, 3).map((r) => (
                      <div key={r.id} className="text-xs">
                        <span className="text-muted-foreground">{new Date(r.created_at).toLocaleString()} · {r.phone}: </span>
                        <span>{r.body}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminInvoices;
