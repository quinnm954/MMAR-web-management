import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PortalLayout from "@/components/portal/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Receipt, Loader2, FileText, CreditCard } from "lucide-react";
import { portalStrings } from "@/lib/portalStrings";
import { toast } from "sonner";

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
  pdf_url: string | null;
  created_at: string;
}

const statusColor = (s: string) => {
  if (s === "paid") return "bg-primary/15 text-primary";
  if (s === "unpaid") return "bg-accent/15 text-accent-foreground";
  if (s === "overdue") return "bg-destructive/15 text-destructive";
  return "bg-muted text-muted-foreground";
};

const PortalInvoices = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("invoices")
      .select("*")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setInvoices((data as Invoice[]) ?? []);
        setLoading(false);
      });
  }, [user]);

  const downloadPdf = async (path: string) => {
    const { data } = await supabase.storage.from("signatures").createSignedUrl(path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  const [paying, setPaying] = useState<string | null>(null);
  const payInvoice = async (id: string) => {
    setPaying(id);
    try {
      const { data, error } = await supabase.functions.invoke("create-invoice-checkout", {
        body: { invoice_id: id },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
      else throw new Error("No checkout URL returned");
    } catch (e: any) {
      toast.error(e?.message || "Could not start checkout");
      setPaying(null);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("paid") === "1") toast.success("Payment received — thank you!");
    if (params.get("canceled") === "1") toast.info("Checkout canceled.");
  }, []);

  const totalDue = invoices.filter((i) => i.status !== "paid").reduce((sum, i) => sum + (i.total - i.amount_paid), 0);

  return (
    <PortalLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Invoices</h1>
        <p className="text-muted-foreground mt-1">{portalStrings.account.invoicesSubtitle}</p>
      </div>

      {totalDue > 0 && (
        <Card className="border-accent/40 bg-accent/5 mb-6">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Outstanding balance</div>
              <div className="text-2xl font-bold">${totalDue.toFixed(2)}</div>
            </div>
            <p className="text-xs text-muted-foreground max-w-xs text-right">
              We'll automatically charge your authorized payment method on the next billing date.
            </p>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : invoices.length === 0 ? (
        <Card className="border-dashed border-border/50">
          <CardContent className="p-12 text-center">
            <Receipt className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">No invoices yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {invoices.map((i) => (
            <Card key={i.id} className="border-border/50">
              <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium">{i.invoice_number || `INV-${i.id.slice(0, 8)}`}</span>
                    <Badge className={statusColor(i.status)}>{i.status}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {new Date(i.created_at).toLocaleDateString()}{i.due_date && ` • Due ${i.due_date}`}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-bold">${i.total.toFixed(2)}</div>
                    {i.amount_paid > 0 && i.status !== "paid" && (
                      <div className="text-xs text-muted-foreground">Paid ${i.amount_paid.toFixed(2)}</div>
                    )}
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/portal/invoices/${i.id}`}>View</Link>
                  </Button>
                  {i.status !== "paid" && (
                    <Button size="sm" onClick={() => payInvoice(i.id)} disabled={paying === i.id}>
                      {paying === i.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4 mr-1" />}
                      Pay
                    </Button>
                  )}
                  {i.pdf_url && (
                    <Button size="sm" variant="outline" onClick={() => downloadPdf(i.pdf_url!)}>
                      <FileText className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PortalLayout>
  );
};

export default PortalInvoices;
