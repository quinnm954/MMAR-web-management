import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus, Receipt, MessageSquare, Link2, Share2, ExternalLink, Tag, DollarSign, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { shareLink } from "@/lib/share";
import DeleteButton from "@/components/admin/DeleteButton";

interface Customer { id: string; full_name: string | null; email: string | null }
interface Employee { id: string; user_id: string | null; full_name: string | null }
interface Invoice {
  id: string;
  invoice_number: string | null;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  amount_paid: number;
  discount_type?: string | null;
  discount_value?: number | null;
  discount_amount?: number | null;
  discount_reason?: string | null;
  due_date: string | null;
  paid_at: string | null;
  created_at: string;
  customer_id: string;
  service_record_id: string | null;
  technician_id?: string | null;
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
  const [employees, setEmployees] = useState<Employee[]>([]);
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
    discount_type: "amount" as "amount" | "percent",
    discount_value: "",
    discount_reason: "",
  });
  const [discountEditing, setDiscountEditing] = useState<string | null>(null);
  const [discountForm, setDiscountForm] = useState({ type: "amount" as "amount" | "percent", value: "", reason: "" });
  const [savingDiscount, setSavingDiscount] = useState(false);

  // Split payments
  type Payment = { id: string; invoice_id: string; amount: number; method: string; reference: string | null; notes: string | null; paid_at: string };
  const [paymentsByInvoice, setPaymentsByInvoice] = useState<Record<string, Payment[]>>({});
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [paymentForm, setPaymentForm] = useState({ amount: "", method: "cash", reference: "", notes: "", paid_at: "" });
  const [savingPayment, setSavingPayment] = useState(false);


  const load = async () => {
    setLoading(true);
    const [i, c, e] = await Promise.all([
      supabase.from("invoices").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, full_name, email").order("full_name"),
      supabase.from("employees" as any).select("id, user_id, full_name").eq("is_active", true).order("full_name"),
    ]);
    const list = (i.data as Invoice[]) ?? [];
    const profs = (c.data as Customer[]) ?? [];
    const emps = ((e.data as any[]) ?? []) as Employee[];
    const byId: Record<string, Customer> = {};
    profs.forEach((p) => { byId[p.id] = p; });
    list.forEach((r) => { r.customer = byId[r.customer_id] ?? null; });

    // Build technician name lookup keyed by both auth user_id and employees.id
    const techNameById = new Map<string, string>();
    emps.forEach((emp) => {
      const name = emp.full_name || "";
      if (emp.user_id) techNameById.set(emp.user_id, name);
      if (emp.id) techNameById.set(emp.id, name);
    });

    // Walk service_record → appointment for invoices that don't already have a tech assigned
    const srIds = list.filter((l) => !l.technician_id && l.service_record_id).map((l) => l.service_record_id) as string[];
    const techByAppt = new Map<string, string | null>();
    const apptByService = new Map<string, string>();
    if (srIds.length) {
      const { data: srs } = await supabase.from("service_records").select("id, appointment_id").in("id", srIds);
      (srs ?? []).forEach((s: any) => { if (s.appointment_id) apptByService.set(s.id, s.appointment_id); });
      const apptIds = Array.from(new Set(Array.from(apptByService.values()))) as string[];
      if (apptIds.length) {
        const { data: appts } = await supabase
          .from("appointments")
          .select("id, assigned_technician_id")
          .in("id", apptIds);
        (appts ?? []).forEach((a: any) => techByAppt.set(a.id, a.assigned_technician_id));
      }
    }
    // Resolve any missing names from profiles (auth users not yet linked to an employee row)
    const unknownIds = new Set<string>();
    list.forEach((r) => {
      const tid = r.technician_id ?? (r.service_record_id ? techByAppt.get(apptByService.get(r.service_record_id) ?? "") : null);
      if (tid && !techNameById.has(tid)) unknownIds.add(tid);
    });
    if (unknownIds.size) {
      const { data: profs2 } = await supabase.from("profiles").select("id, full_name, email").in("id", Array.from(unknownIds));
      (profs2 ?? []).forEach((p: any) => techNameById.set(p.id, p.full_name || p.email || ""));
    }
    list.forEach((r) => {
      const tid = r.technician_id ?? (r.service_record_id ? techByAppt.get(apptByService.get(r.service_record_id) ?? "") : null) ?? null;
      r.technician_name = tid ? (techNameById.get(tid) || null) : null;
    });

    setInvoices(list);
    setCustomers(profs);
    setEmployees(emps);

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

    // Load split payments per invoice
    if (ids.length) {
      const { data: pays } = await supabase
        .from("invoice_payments" as any)
        .select("id, invoice_id, amount, method, reference, notes, paid_at")
        .in("invoice_id", ids)
        .order("paid_at", { ascending: true });
      const pmap: Record<string, Payment[]> = {};
      ((pays as any[]) ?? []).forEach((p) => {
        (pmap[p.invoice_id] = pmap[p.invoice_id] || []).push(p as Payment);
      });
      setPaymentsByInvoice(pmap);
    } else {
      setPaymentsByInvoice({});
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
    const discount_value = form.discount_value ? parseFloat(form.discount_value) : 0;
    setSaving(true);
    const { error } = await supabase.from("invoices").insert({
      customer_id: form.customer_id,
      invoice_number: form.invoice_number || `INV-${Date.now()}`,
      subtotal,
      tax,
      total: subtotal + tax,
      due_date: form.due_date || null,
      status: "unpaid",
      discount_type: form.discount_type,
      discount_value,
      discount_reason: form.discount_reason || null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Invoice created");
    setOpen(false);
    setForm({ customer_id: "", invoice_number: "", subtotal: "", tax: "", due_date: "", discount_type: "amount", discount_value: "", discount_reason: "" });
    load();
  };

  const openDiscount = (inv: Invoice) => {
    setDiscountEditing(inv.id);
    setDiscountForm({
      type: (inv.discount_type as "amount" | "percent") || "amount",
      value: inv.discount_value ? String(inv.discount_value) : "",
      reason: inv.discount_reason || "",
    });
  };

  const saveDiscount = async () => {
    if (!discountEditing) return;
    setSavingDiscount(true);
    const { error } = await supabase
      .from("invoices")
      .update({
        discount_type: discountForm.type,
        discount_value: discountForm.value ? parseFloat(discountForm.value) : 0,
        discount_reason: discountForm.reason || null,
        // Reset shop_supplies/tax to 0 so trigger recomputes them based on new discounted subtotal
        shop_supplies: 0,
        tax: 0,
      })
      .eq("id", discountEditing);
    setSavingDiscount(false);
    if (error) return toast.error(error.message);
    toast.success("Discount applied");
    setDiscountEditing(null);
    load();
  };

  const updateStatus = async (id: string, status: string) => {
    const inv = invoices.find((x) => x.id === id);
    const wasPaid = inv?.status === "paid";
    const update: Record<string, unknown> = { status };
    if (status === "paid") {
      update.paid_at = new Date().toISOString();
      if (inv && (!inv.amount_paid || inv.amount_paid < inv.total)) {
        update.amount_paid = inv.total;
      }
    }
    const { error } = await supabase.from("invoices").update(update).eq("id", id);
    if (error) return toast.error(error.message);

    // Send paid receipt email when transitioning to paid
    if (status === "paid" && !wasPaid) {
      try {
        const { error: mailErr } = await supabase.functions.invoke("send-invoice-paid-receipt", {
          body: { invoice_id: id },
        });
        if (mailErr) console.warn("receipt email error", mailErr);
        else toast.success("Paid receipt emailed to customer");
      } catch (e) {
        console.warn("receipt email failed", e);
      }
    }

    load();
  };

  const updateTech = async (id: string, techId: string) => {
    const value = techId === "__none__" ? null : techId;
    const { error } = await supabase.from("invoices").update({ technician_id: value } as any).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(value ? "Technician assigned" : "Technician cleared");
    load();
  };

  const openPayment = (inv: Invoice) => {
    const due = Math.max(Number(inv.total || 0) - Number(inv.amount_paid || 0), 0);
    setPayingInvoice(inv);
    setPaymentForm({
      amount: due > 0 ? due.toFixed(2) : "",
      method: "cash",
      reference: "",
      notes: "",
      paid_at: new Date().toISOString().slice(0, 10),
    });
  };

  const savePayment = async () => {
    if (!payingInvoice) return;
    const amt = parseFloat(paymentForm.amount);
    if (!amt || amt <= 0) return toast.error("Enter a payment amount");
    setSavingPayment(true);
    const { error } = await supabase.from("invoice_payments" as any).insert({
      invoice_id: payingInvoice.id,
      amount: amt,
      method: paymentForm.method,
      reference: paymentForm.reference || null,
      notes: paymentForm.notes || null,
      paid_at: paymentForm.paid_at ? new Date(paymentForm.paid_at).toISOString() : new Date().toISOString(),
    });
    setSavingPayment(false);
    if (error) return toast.error(error.message);
    toast.success(`Recorded $${amt.toFixed(2)} payment`);
    setPayingInvoice(null);
    load();
  };

  const deletePayment = async (pid: string) => {
    if (!confirm("Remove this payment?")) return;
    const { error } = await supabase.from("invoice_payments" as any).delete().eq("id", pid);
    if (error) return toast.error(error.message);
    toast.success("Payment removed");
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
                <div><Label>Tax (auto if blank)</Label><Input type="number" step="0.01" value={form.tax} onChange={(e) => setForm({ ...form, tax: e.target.value })} /></div>
              </div>
              <div className="rounded-md border border-border/50 p-3 space-y-2 bg-muted/20">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Discount (optional)</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Select value={form.discount_type} onValueChange={(v) => setForm({ ...form, discount_type: v as "amount" | "percent" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="amount">$ Amount</SelectItem>
                      <SelectItem value="percent">% Percent</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder={form.discount_type === "percent" ? "e.g. 10" : "e.g. 25.00"}
                    value={form.discount_value}
                    onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                  />
                </div>
                <Input
                  placeholder="Reason (e.g. loyalty, promo)"
                  value={form.discount_reason}
                  onChange={(e) => setForm({ ...form, discount_reason: e.target.value })}
                />
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
                <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Receipt className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <div className="font-mono text-sm">{i.invoice_number}</div>
                      <div className="text-xs text-muted-foreground">{i.customer?.full_name || i.customer?.email}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {new Date(i.created_at).toLocaleDateString()}{i.due_date && ` • Due ${i.due_date}`}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="text-[10px] text-muted-foreground">Tech:</span>
                        <Select
                          value={i.technician_id ?? "__none__"}
                          onValueChange={(v) => updateTech(i.id, v)}
                        >
                          <SelectTrigger className="h-7 w-44 text-xs">
                            <SelectValue placeholder="Unassigned" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">Unassigned</SelectItem>
                            {employees.map((emp) => {
                              const val = emp.user_id || emp.id;
                              return (
                                <SelectItem key={emp.id} value={val}>
                                  {emp.full_name || "Unnamed"}
                                </SelectItem>
                              );
                            })}
                            {/* Show the current assignment even if it's not in the active employee list */}
                            {i.technician_id &&
                              !employees.some((emp) => (emp.user_id || emp.id) === i.technician_id) && (
                                <SelectItem value={i.technician_id}>
                                  {i.technician_name || "Linked user"}
                                </SelectItem>
                              )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <div className="text-right ml-auto sm:ml-0">
                      <div className="font-bold">${i.total.toFixed(2)}</div>
                      {(i.discount_amount ?? 0) > 0 && (
                        <div className="text-xs text-primary">
                          −${Number(i.discount_amount).toFixed(2)} discount
                          {i.discount_type === "percent" && i.discount_value ? ` (${i.discount_value}%)` : ""}
                        </div>
                      )}
                      {i.amount_paid > 0 && <div className="text-xs text-muted-foreground">Paid ${i.amount_paid.toFixed(2)}</div>}
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => openDiscount(i)} title="Edit discount">
                      <Tag className="h-3 w-3 mr-1" />
                      Discount
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => window.open(`/portal/invoices/${i.id}`, "_blank")} title="Open invoice page">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    {i.status !== "paid" && i.status !== "void" && (
                      <>
                        <Button size="sm" variant="hero" onClick={() => openPayment(i)} title="Record a payment (cash, card, check, Zelle, split, etc.)">
                          <DollarSign className="h-3 w-3 mr-1" />
                          Record Payment
                        </Button>
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
                    {i.status === "paid" && (i.amount_paid ?? 0) < i.total && (
                      <Button size="sm" variant="outline" onClick={() => openPayment(i)} title="Add another payment">
                        <DollarSign className="h-3 w-3 mr-1" />
                        Add Payment
                      </Button>
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
                {(paymentsByInvoice[i.id]?.length ?? 0) > 0 && (
                  <div className="rounded-md border border-border/50 bg-muted/20 p-2 space-y-1">
                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                      Payments ({paymentsByInvoice[i.id].length})
                    </div>
                    {paymentsByInvoice[i.id].map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-xs">
                        <div>
                          <span className="font-semibold">${Number(p.amount).toFixed(2)}</span>
                          <span className="text-muted-foreground"> · {p.method}</span>
                          {p.reference && <span className="text-muted-foreground"> · {p.reference}</span>}
                          <span className="text-muted-foreground"> · {new Date(p.paid_at).toLocaleDateString()}</span>
                          {p.notes && <div className="text-[10px] text-muted-foreground italic">{p.notes}</div>}
                        </div>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => deletePayment(p.id)} title="Remove payment">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
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

      <Dialog open={!!discountEditing} onOpenChange={(o) => !o && setDiscountEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Apply Discount</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={discountForm.type} onValueChange={(v) => setDiscountForm({ ...discountForm, type: v as "amount" | "percent" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="amount">$ Amount</SelectItem>
                    <SelectItem value="percent">% Percent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Value</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder={discountForm.type === "percent" ? "e.g. 20" : "e.g. 50.00"}
                  value={discountForm.value}
                  onChange={(e) => setDiscountForm({ ...discountForm, value: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Reason</Label>
              <Input
                placeholder="e.g. loyalty, mileage reminder promo"
                value={discountForm.reason}
                onChange={(e) => setDiscountForm({ ...discountForm, reason: e.target.value })}
              />
            </div>
            <p className="text-xs text-muted-foreground">Tax and shop supplies will be recalculated against the discounted subtotal.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDiscountEditing(null)}>Cancel</Button>
            <Button variant="hero" onClick={saveDiscount} disabled={savingDiscount}>
              {savingDiscount ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!payingInvoice} onOpenChange={(o) => !o && setPayingInvoice(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment{payingInvoice ? ` · ${payingInvoice.invoice_number ?? ""}` : ""}</DialogTitle>
          </DialogHeader>
          {payingInvoice && (
            <div className="space-y-3">
              <div className="rounded-md bg-muted/30 p-2 text-xs flex justify-between">
                <span>Total ${Number(payingInvoice.total).toFixed(2)}</span>
                <span>Paid ${Number(payingInvoice.amount_paid || 0).toFixed(2)}</span>
                <span className="font-semibold">Remaining ${Math.max(Number(payingInvoice.total) - Number(payingInvoice.amount_paid || 0), 0).toFixed(2)}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Amount *</Label>
                  <Input type="number" step="0.01" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} />
                </div>
                <div>
                  <Label>Method *</Label>
                  <Select value={paymentForm.method} onValueChange={(v) => setPaymentForm({ ...paymentForm, method: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card (in person)</SelectItem>
                      <SelectItem value="stripe">Stripe (online)</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                      <SelectItem value="zelle">Zelle</SelectItem>
                      <SelectItem value="venmo">Venmo</SelectItem>
                      <SelectItem value="cashapp">Cash App</SelectItem>
                      <SelectItem value="financing">Financing</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Date</Label>
                  <Input type="date" value={paymentForm.paid_at} onChange={(e) => setPaymentForm({ ...paymentForm, paid_at: e.target.value })} />
                </div>
                <div>
                  <Label>Reference (check #, last 4, etc.)</Label>
                  <Input value={paymentForm.reference} onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Input value={paymentForm.notes} onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} placeholder="e.g. split payment 1 of 2" />
              </div>
              <p className="text-xs text-muted-foreground">
                Add multiple payments to record split-pay across methods. The invoice status updates automatically (unpaid → partial → paid).
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayingInvoice(null)}>Cancel</Button>
            <Button variant="hero" onClick={savePayment} disabled={savingPayment}>
              {savingPayment ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>

  );
};

export default AdminInvoices;
