import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PortalLayout from "@/components/portal/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, Wrench, Phone } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type Rec = {
  id: string;
  label: string;
  description: string | null;
  notes: string | null;
  severity: "needs_service" | "urgent" | "monitor" | "good" | null;
  recommended: boolean;
  recommended_at: string | null;
  price_low: number | null;
  price_high: number | null;
  checklist_id: string;
  checklist_title: string;
  checklist_created_at: string;
  vehicle_label: string | null;
};

const severityRank: Record<string, number> = { urgent: 0, needs_service: 1, monitor: 2 };

const severityBadge = (s: string | null) => {
  const map: Record<string, string> = {
    urgent: "bg-destructive text-destructive-foreground",
    needs_service: "bg-orange-500 text-white",
    monitor: "bg-yellow-500 text-black",
  };
  const labels: Record<string, string> = {
    urgent: "Past due — urgent",
    needs_service: "Due now",
    monitor: "Monitor",
  };
  if (!s || !(s in labels)) return null;
  return <Badge className={map[s]}>{labels[s]}</Badge>;
};

const PortalChecklists = () => {
  const { user } = useAuth();
  const [recs, setRecs] = useState<Rec[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data: lists } = await supabase
        .from("service_checklists")
        .select("id, title, created_at, vehicle_id")
        .eq("customer_id", user.id);
      const listMap = new Map<string, { title: string; created_at: string; vehicle_id: string | null }>();
      const vehicleIds = new Set<string>();
      (lists ?? []).forEach((l: any) => {
        listMap.set(l.id, { title: l.title, created_at: l.created_at, vehicle_id: l.vehicle_id });
        if (l.vehicle_id) vehicleIds.add(l.vehicle_id);
      });

      const vehMap = new Map<string, string>();
      if (vehicleIds.size > 0) {
        const { data: vehs } = await supabase
          .from("vehicles")
          .select("id, year, make, model")
          .in("id", Array.from(vehicleIds));
        (vehs ?? []).forEach((v: any) => vehMap.set(v.id, `${v.year ?? ""} ${v.make ?? ""} ${v.model ?? ""}`.trim()));
      }

      const listIds = Array.from(listMap.keys());
      if (listIds.length === 0) {
        setRecs([]);
        setLoading(false);
        return;
      }
      const { data: items } = await supabase
        .from("service_checklist_items")
        .select("id, label, description, notes, severity, recommended, recommended_at, price_low, price_high, checklist_id")
        .in("checklist_id", listIds);

      const filtered: Rec[] = (items ?? [])
        .filter((it: any) => it.recommended || it.severity === "needs_service" || it.severity === "urgent")
        .map((it: any) => {
          const l = listMap.get(it.checklist_id)!;
          return {
            ...it,
            checklist_title: l.title,
            checklist_created_at: l.created_at,
            vehicle_label: l.vehicle_id ? vehMap.get(l.vehicle_id) ?? null : null,
          };
        })
        .sort((a, b) => {
          const ra = severityRank[a.severity ?? "monitor"] ?? 9;
          const rb = severityRank[b.severity ?? "monitor"] ?? 9;
          if (ra !== rb) return ra - rb;
          return (b.recommended_at ?? b.checklist_created_at).localeCompare(a.recommended_at ?? a.checklist_created_at);
        });

      setRecs(filtered);
      setLoading(false);
    })();
  }, [user]);

  const urgent = recs.filter(r => r.severity === "urgent").length;
  const due = recs.filter(r => r.severity === "needs_service").length;

  return (
    <PortalLayout>
      <div className="mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-primary" /> Service Recommendations
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Items your technician flagged as due now or past due during recent inspections.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : recs.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No outstanding recommendations. Your vehicle is in good shape.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Card><CardContent className="p-4">
              <div className="text-2xl font-bold text-destructive">{urgent}</div>
              <div className="text-xs text-muted-foreground">Past due / urgent</div>
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-500">{due}</div>
              <div className="text-xs text-muted-foreground">Due now</div>
            </CardContent></Card>
          </div>

          <div className="space-y-2">
            {recs.map(r => (
              <Card key={r.id}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="min-w-0">
                      <div className="font-medium">{r.label}</div>
                      {r.vehicle_label && (
                        <div className="text-xs text-muted-foreground">{r.vehicle_label}</div>
                      )}
                    </div>
                    {severityBadge(r.severity)}
                  </div>
                  {r.description && <p className="text-xs text-muted-foreground">{r.description}</p>}
                  {(r.price_low != null || r.price_high != null) && (
                    <div className="rounded border border-border bg-muted/30 p-2">
                      <div className="text-sm font-semibold">
                        Typical local price: {r.price_low != null ? `$${r.price_low}` : "?"}
                        {" – "}
                        {r.price_high != null ? `$${r.price_high}` : "?"}
                      </div>
                      <div className="text-[10px] text-muted-foreground leading-snug mt-0.5">
                        Estimated range from local shops in your area. This is not a quote from us — request an official estimate for our price.
                      </div>
                    </div>
                  )}
                  {r.notes && (
                    <p className="text-xs bg-muted/50 rounded p-2">
                      <span className="font-medium">Tech note: </span>{r.notes}
                    </p>
                  )}
                  <div className="text-[11px] text-muted-foreground">
                    From inspection: <Link to={`/portal/checklists/list/${r.checklist_id}`} className="underline">{r.checklist_title}</Link>
                    {" · "}{new Date(r.recommended_at ?? r.checklist_created_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-4 border-primary/40">
            <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-3 justify-between">
              <div className="text-sm">Ready to take care of these? Book your next visit or call us now.</div>
              <div className="flex gap-2">
                <Button asChild variant="default"><Link to="/portal/appointments"><Wrench className="h-4 w-4 mr-1" />Book service</Link></Button>
                <Button asChild variant="outline"><a href="tel:+18135017572"><Phone className="h-4 w-4 mr-1" />Call</a></Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </PortalLayout>
  );
};

export default PortalChecklists;
