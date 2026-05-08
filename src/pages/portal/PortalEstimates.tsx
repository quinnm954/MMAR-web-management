import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PortalLayout from "@/components/portal/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, ChevronRight } from "lucide-react";

interface Estimate {
  id: string;
  estimate_number: string | null;
  status: string;
  total: number;
  valid_until: string | null;
  created_at: string;
  approval_token: string | null;
  vehicle_id: string | null;
  vehicle?: { year: number | null; make: string | null; model: string | null } | null;
}

const statusColor = (s: string) => {
  if (s === "approved") return "bg-primary/15 text-primary border-primary/30";
  if (s === "declined") return "bg-destructive/15 text-destructive border-destructive/30";
  if (s === "partially_approved") return "bg-accent/15 text-accent-foreground border-accent/30";
  if (s === "sent") return "bg-accent/15 text-accent-foreground border-accent/30";
  return "bg-muted text-muted-foreground border-border";
};

const PortalEstimates = () => {
  const { user } = useAuth();
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("estimates")
      .select("id, estimate_number, status, total, valid_until, created_at, approval_token, vehicle_id, vehicle:vehicles(year, make, model)")
      .eq("customer_id", user.id)
      .neq("status", "draft")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setEstimates((data as unknown as Estimate[]) ?? []);
        setLoading(false);
      });
  }, [user]);

  const needsAction = estimates.filter((e) => e.status === "sent").length;

  return (
    <PortalLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Estimates</h1>
        <p className="text-muted-foreground mt-1">Review and approve work proposed for your vehicle.</p>
      </div>

      {needsAction > 0 && (
        <Card className="border-accent/40 bg-accent/5 mb-6">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">Awaiting your approval</div>
              <div className="text-2xl font-bold">{needsAction}</div>
            </div>
            <p className="text-xs text-muted-foreground max-w-xs text-right">
              Approving turns an estimate into a scheduled repair order.
            </p>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : estimates.length === 0 ? (
        <Card className="border-dashed border-border/50">
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">No estimates yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {estimates.map((e) => {
            const reviewable = e.status === "sent" && e.approval_token;
            return (
              <Card key={e.id} className="border-border/50">
                <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-medium">{e.estimate_number || `EST-${e.id.slice(0, 6)}`}</span>
                      <Badge className={`${statusColor(e.status)} uppercase border text-[10px]`}>{e.status.replace("_", " ")}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {new Date(e.created_at).toLocaleDateString()}
                      {e.valid_until && ` • Valid until ${e.valid_until}`}
                      {e.vehicle && ` • ${[e.vehicle.year, e.vehicle.make, e.vehicle.model].filter(Boolean).join(" ")}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-bold">${Number(e.total).toFixed(2)}</div>
                    </div>
                    {reviewable ? (
                      <Button size="sm" variant="hero" asChild>
                        <Link to={`/estimate/${e.approval_token}`}>
                          Review &amp; Approve <ChevronRight className="h-4 w-4 ml-1" />
                        </Link>
                      </Button>
                    ) : e.approval_token ? (
                      <Button size="sm" variant="outline" asChild>
                        <Link to={`/estimate/${e.approval_token}`}>View</Link>
                      </Button>
                    ) : null}
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

export default PortalEstimates;
