import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PortalLayout from "@/components/portal/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck, Loader2 } from "lucide-react";

interface Inspection {
  id: string;
  status: string;
  mileage: number | null;
  share_token: string | null;
  summary_notes: string | null;
  completed_at: string | null;
  created_at: string;
  vehicle: { year: number | null; make: string | null; model: string | null } | null;
}

const statusVariant: Record<string, "default" | "secondary" | "outline"> = {
  completed: "default",
  sent: "default",
  in_progress: "secondary",
};

const PortalInspections = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("inspections")
      .select(
        "id, status, mileage, share_token, summary_notes, completed_at, created_at, vehicle:vehicles(year, make, model)",
      )
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setItems((data as unknown as Inspection[]) ?? []);
        setLoading(false);
      });
  }, [user]);

  return (
    <PortalLayout>
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Inspections</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No inspections yet. After your next service we'll post the full digital inspection here.
            </CardContent>
          </Card>
        ) : (
          items.map((insp) => {
            const v = insp.vehicle;
            const vehicleLabel = v ? `${v.year ?? ""} ${v.make ?? ""} ${v.model ?? ""}`.trim() : "Vehicle";
            const date = new Date(insp.completed_at ?? insp.created_at).toLocaleDateString();
            const body = (
              <Card className="hover:bg-muted/40 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">{vehicleLabel}</CardTitle>
                    <Badge variant={statusVariant[insp.status] ?? "outline"} className="capitalize">
                      {insp.status.replace("_", " ")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-1">
                  <div>{date}{insp.mileage ? ` · ${insp.mileage.toLocaleString()} mi` : ""}</div>
                  {insp.summary_notes && (
                    <div className="line-clamp-2 text-foreground/80">{insp.summary_notes}</div>
                  )}
                </CardContent>
              </Card>
            );
            return insp.share_token ? (
              <Link key={insp.id} to={`/inspection/${insp.share_token}`}>{body}</Link>
            ) : (
              <div key={insp.id}>{body}</div>
            );
          })
        )}
      </div>
    </PortalLayout>
  );
};

export default PortalInspections;
