import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import BrandedDocLayout from "@/components/BrandedDocLayout";
import DocReferences from "@/components/DocReferences";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface LineItem {
  description?: string;
  quantity?: number;
  unit_price?: number;
  amount?: number;
  kind?: string;
}

interface Invoice {
  id: string;
  invoice_number: string | null;
  status: string;
  subtotal: number;
  shop_supplies: number;
  tax: number;
  total: number;
  discount_amount?: number | null;
  discount_value?: number | null;
  discount_type?: string | null;
  discount_reason?: string | null;
  amount_paid: number;
  due_date: string | null;
  paid_at: string | null;
  created_at: string;
  customer_id: string;
  service_record_id: string | null;
  line_items: LineItem[];
}

const statusColor = (s: string) => {
  if (s === "paid") return "bg-primary/15 text-primary border-primary/30";
  if (s === "overdue") return "bg-destructive/15 text-destructive border-destructive/30";
  if (s === "void") return "bg-muted text-muted-foreground border-border";
  return "bg-accent/15 text-accent-foreground border-accent/30";
};

const PortalInvoiceDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [inv, setInv] = useState<Invoice | null>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [vehicle, setVehicle] = useState<any>(null);
  const [payments, setPayments] = useState<Array<{ id: string; amount: number; method: string; reference: string | null; paid_at: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (!user || !id) return;
    (async () => {
      const { data } = await supabase.from("invoices").select("*").eq("id", id).maybeSingle();
      setInv(data as Invoice | null);
      if (data) {
        const { data: c } = await supabase.from("profiles").select("full_name, email").eq("id", data.customer_id).maybeSingle();
        setCustomer(c);
        if (data.service_record_id) {
          const { data: sr } = await supabase.from("service_records").select("vehicle_id").eq("id", data.service_record_id).maybeSingle();
          if (sr?.vehicle_id) {
            const { data: v } = await supabase.from("vehicles").select("year, make, model, license_plate, vin").eq("id", sr.vehicle_id).maybeSingle();
            setVehicle(v);
          }
        }
        const { data: pays } = await supabase
          .from("invoice_payments" as any)
          .select("id, amount, method, reference, paid_at")
          .eq("invoice_id", data.id)
          .order("paid_at", { ascending: true });
        setPayments(((pays as any[]) ?? []) as any);
      }
      setLoading(false);
    })();
  }, [user, id]);


  const pay = async () => {
    if (!inv) return;
    setPaying(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-invoice-checkout", { body: { invoice_id: inv.id } });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
      else throw new Error("No checkout URL returned");
    } catch (e: any) {
      toast.error(e?.message || "Could not start checkout");
      setPaying(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  if (!inv) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Invoice not found</div>;

  const due = Number(inv.total) - Number(inv.amount_paid || 0);
  const lines: LineItem[] = Array.isArray(inv.line_items) ? inv.line_items : [];
  const isPaid = inv.status === "paid";

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-4">
        <Link to="/portal/invoices" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" /> Back to invoices
        </Link>
      </div>
      <BrandedDocLayout
        docType={isPaid ? "RECEIPT" : "INVOICE"}
        docNumber={inv.invoice_number}
        rightMeta={
          <>
            <div>Issued {new Date(inv.created_at).toLocaleDateString()}</div>
            {inv.due_date && !isPaid && <div>Due {inv.due_date}</div>}
            {inv.paid_at && <div>Paid {new Date(inv.paid_at).toLocaleDateString()}</div>}
          </>
        }
      >
        {/* Bill To / Vehicle */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Bill To</div>
            <div className="font-medium">{customer?.full_name || customer?.email || "—"}</div>
            {customer?.email && customer?.full_name && <div className="text-xs text-muted-foreground">{customer.email}</div>}
          </div>
          <div className="sm:text-right">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Status</div>
            <Badge className={`${statusColor(inv.status)} uppercase border`}>{inv.status}</Badge>
            {vehicle && (
              <div className="text-xs text-muted-foreground mt-2">
                {[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ")}
                {vehicle.license_plate && <> · {vehicle.license_plate}</>}
              </div>
            )}
          </div>
        </div>

        {/* Line items */}
        <div className="border border-border rounded-md overflow-hidden">
          <div className="grid grid-cols-12 bg-muted/50 px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            <div className="col-span-7">Description</div>
            <div className="col-span-2 text-right">Qty</div>
            <div className="col-span-3 text-right">Amount</div>
          </div>
          {lines.length === 0 ? (
            <div className="px-3 py-3 text-sm text-muted-foreground">No line items.</div>
          ) : (
            lines.map((l, i) => (
              <div key={i} className="grid grid-cols-12 px-3 py-2 text-sm border-t border-border">
                <div className="col-span-7">
                  {l.description || "Service"}
                  {l.kind && <span className="ml-2 text-[10px] uppercase text-muted-foreground">{l.kind}</span>}
                </div>
                <div className="col-span-2 text-right text-muted-foreground">
                  {l.quantity ?? 1}
                  {l.unit_price != null && <span className="text-[10px]"> × ${Number(l.unit_price).toFixed(2)}</span>}
                </div>
                <div className="col-span-3 text-right font-medium">${Number(l.amount ?? 0).toFixed(2)}</div>
              </div>
            ))
          )}
        </div>

        {/* Totals */}
        <div className="mt-4 ml-auto sm:w-72 space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>${Number(inv.subtotal).toFixed(2)}</span></div>
          {Number(inv.discount_amount ?? 0) > 0 && (
            <div className="flex justify-between text-primary">
              <span>
                Discount{inv.discount_type === 'percent' && inv.discount_value ? ` (${inv.discount_value}%)` : ''}
                {inv.discount_reason && <span className="text-xs text-muted-foreground"> · {inv.discount_reason}</span>}
              </span>
              <span>−${Number(inv.discount_amount).toFixed(2)}</span>
            </div>
          )}
          {Number(inv.shop_supplies) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Shop / disposal fees</span><span>${Number(inv.shop_supplies).toFixed(2)}</span></div>}
          {Number(inv.tax) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>${Number(inv.tax).toFixed(2)}</span></div>}
          <div className="flex justify-between font-bold text-lg pt-2 border-t border-border"><span>Total</span><span>${Number(inv.total).toFixed(2)}</span></div>
          {Number(inv.amount_paid) > 0 && (
            <div className="flex justify-between text-xs text-muted-foreground"><span>Paid</span><span>−${Number(inv.amount_paid).toFixed(2)}</span></div>
          )}
          {!isPaid && (
            <div className="flex justify-between font-bold text-primary pt-1 border-t border-border">
              <span>Amount Due</span><span>${due.toFixed(2)}</span>
            </div>
          )}
        </div>

        {payments.length > 0 && (
          <div className="mt-4 ml-auto sm:w-72 text-xs space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Payment History</div>
            {payments.map((p) => (
              <div key={p.id} className="flex justify-between border-t border-border/60 pt-1">
                <span>{new Date(p.paid_at).toLocaleDateString()} · {p.method}{p.reference ? ` · ${p.reference}` : ""}</span>
                <span className="font-medium">${Number(p.amount).toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}


        {/* Pay / Paid */}
        <div className="mt-6">
          {isPaid ? (
            <div className="flex items-center gap-2 justify-center text-primary font-semibold py-3 border border-primary/30 bg-primary/5 rounded">
              <CheckCircle2 className="h-5 w-5" /> Paid in full — thank you!
            </div>
          ) : due > 0 && inv.status !== "void" ? (
            <Button onClick={pay} disabled={paying} variant="hero" className="w-full" size="lg">
              {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CreditCard className="h-4 w-4 mr-2" /> Pay ${due.toFixed(2)} Securely</>}
            </Button>
          ) : null}
        </div>

        <DocReferences hideFinancing={isPaid} />
      </BrandedDocLayout>
    </>
  );
};

export default PortalInvoiceDetail;
