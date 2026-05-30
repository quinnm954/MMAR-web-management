import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PortalLayout from "@/components/portal/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Loader2, Calendar, Car, FileText } from "lucide-react";
import { portalStrings } from "@/lib/portalStrings";

interface Membership {
  id: string;
  status: string;
  start_date: string | null;
  next_billing_date: string | null;
  oil_changes_used: number;
  agreement_pdf_url: string | null;
  agreement_signed_at: string | null;
  cancellation_requested_at: string | null;
  plan: { name: string; tagline: string | null; monthly_price: number; deposit_amount: number; features: string[]; included_oil_changes_yearly: number | null } | null;
  vehicle: { year: number | null; make: string | null; model: string | null; trim: string | null } | null;
}

const statusColor = (s: string) => {
  if (s === "active") return "bg-primary/15 text-primary";
  if (s === "pending") return "bg-accent/15 text-accent-foreground";
  if (s === "cancelled") return "bg-muted text-muted-foreground";
  return "bg-muted text-muted-foreground";
};

const PortalMembership = () => {
  const { user } = useAuth();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("memberships")
      .select("id, status, start_date, next_billing_date, oil_changes_used, agreement_pdf_url, agreement_signed_at, cancellation_requested_at, plan:membership_plans(name, tagline, monthly_price, deposit_amount, features, included_oil_changes_yearly), vehicle:vehicles(year, make, model, trim)")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setMemberships((data as unknown as Membership[]) ?? []);
        setLoading(false);
      });
  }, [user]);

  const downloadPdf = async (path: string) => {
    const { data, error } = await supabase.storage.from("signatures").createSignedUrl(path, 60);
    if (error || !data) return;
    window.open(data.signedUrl, "_blank");
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Request cancellation? An admin will reach out to confirm.")) return;
    await supabase.from("memberships").update({ cancellation_requested_at: new Date().toISOString() }).eq("id", id);
    window.location.reload();
  };

  const openPortal = async () => {
    const { data, error } = await supabase.functions.invoke("customer-portal");
    if (error || !data?.url) {
      alert(error?.message || "Could not open billing portal");
      return;
    }
    window.location.href = data.url;
  };

  return (
    <PortalLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">My Membership</h1>
          <p className="text-muted-foreground mt-1">{portalStrings.product.membershipPageSubtitle}</p>
        </div>
        <Button variant="hero" asChild>
          <Link to="/portal/membership-signup">Add Membership</Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : memberships.length === 0 ? (
        <Card className="border-dashed border-border/50">
          <CardContent className="p-12 text-center">
            <CreditCard className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">No memberships yet.</p>
            <Button variant="hero" asChild><Link to="/mmar-care">View Plans</Link></Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {memberships.map((m) => {
            const v = m.vehicle;
            const yearly = m.plan?.included_oil_changes_yearly ?? null;
            return (
              <Card key={m.id} className="border-border/50">
                <CardContent className="p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold">{m.plan?.name || "Membership"}</h3>
                        <Badge className={statusColor(m.status)}>{m.status}</Badge>
                        {m.cancellation_requested_at && <Badge variant="outline">cancellation requested</Badge>}
                      </div>
                      {m.plan?.tagline && <p className="text-sm text-muted-foreground">{m.plan.tagline}</p>}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">${m.plan?.monthly_price.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">/month</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1"><Car className="h-3 w-3" /> Vehicle</div>
                      <div className="font-medium">{v ? `${v.year} ${v.make} ${v.model}` : "—"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Started</div>
                      <div className="font-medium">{m.start_date || "—"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Next Billing</div>
                      <div className="font-medium">{m.next_billing_date || "—"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Oil Changes Used</div>
                      <div className="font-medium">{m.oil_changes_used}{yearly ? ` / ${yearly}` : ""}</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
                    {m.agreement_pdf_url && (
                      <Button variant="outline" size="sm" onClick={() => downloadPdf(m.agreement_pdf_url!)}>
                        <FileText className="h-4 w-4 mr-1" /> View Agreement
                      </Button>
                    )}
                    {m.status === "active" && (
                      <Button variant="outline" size="sm" onClick={openPortal}>
                        <CreditCard className="h-4 w-4 mr-1" /> Manage Billing
                      </Button>
                    )}
                    {m.status === "active" && !m.cancellation_requested_at && (
                      <Button variant="ghost" size="sm" onClick={() => handleCancel(m.id)}>
                        Request Cancellation
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </PortalLayout>
  );
};

export default PortalMembership;
