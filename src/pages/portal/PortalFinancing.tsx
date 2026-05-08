import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PortalLayout from "@/components/portal/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Loader2, FileText } from "lucide-react";
import { format } from "date-fns";

const fmt = (n: number | null | undefined) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(n || 0));

const statusVariant = (s: string) =>
  s === "signed" ? "default" : s === "pending" ? "secondary" : "outline";

const PortalFinancing = () => {
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from("financing_contracts")
        .select("*")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });
      setContracts(data || []);
      setLoading(false);
    })();
  }, []);

  return (
    <PortalLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-primary" /> In-House Financing
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your financing contracts. Approved estimates can be financed at 25% APR over 12 months
          (100% parts + 50% labor down).
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : contracts.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground space-y-3">
            <FileText className="h-8 w-8 mx-auto opacity-40" />
            <p>You don't have any financing contracts yet.</p>
            <p className="text-xs">After approving an estimate, you can request financing from the estimate page.</p>
            <Button asChild variant="outline" size="sm">
              <Link to="/portal/estimates">View my estimates</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {contracts.map((c) => (
            <Card key={c.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-base">
                    Contract · {format(new Date(c.created_at), "MMM d, yyyy")}
                  </CardTitle>
                  <Badge variant={statusVariant(c.status)} className="uppercase text-[10px]">{c.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="grid sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <div className="text-muted-foreground">Total service</div>
                    <div className="font-medium">{fmt(c.total_service_price)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Down payment</div>
                    <div className="font-medium">{fmt(c.down_payment)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Monthly payment</div>
                    <div className="font-medium">{fmt(c.monthly_payment)} × 12</div>
                  </div>
                </div>
                {c.vehicle_info && (
                  <div className="text-xs text-muted-foreground">Vehicle: {c.vehicle_info}</div>
                )}
                {c.first_payment_date && (
                  <div className="text-xs text-muted-foreground">
                    First payment due: {format(new Date(c.first_payment_date + "T00:00:00"), "MMM d, yyyy")}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PortalLayout>
  );
};

export default PortalFinancing;
