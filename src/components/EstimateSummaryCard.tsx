import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Loader2 } from "lucide-react";

interface LineItem {
  description?: string;
  quantity?: number;
  unit_price?: number;
  amount?: number;
  status?: string;
}

interface EstimateData {
  id: string;
  estimate_number?: string | null;
  status?: string | null;
  total?: number | null;
  subtotal?: number | null;
  tax?: number | null;
  shop_supplies?: number | null;
  line_items?: LineItem[] | null;
  notes?: string | null;
  customer?: { full_name?: string | null; email?: string | null } | null;
  vehicle?: {
    year?: number | null;
    make?: string | null;
    model?: string | null;
    license_plate?: string | null;
    vin?: string | null;
  } | null;
}

const fmt = (n: number | null | undefined) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(n || 0));

/**
 * Reads `?estimate=<id>` or `?token=<token>` from the URL and renders a
 * compact estimate summary. Returns null if no params or the estimate
 * can't be loaded (e.g. visitor isn't the owner and no token provided).
 */
const EstimateSummaryCard = ({ className = "" }: { className?: string }) => {
  const [params] = useSearchParams();
  const estimateId = params.get("estimate");
  const token = params.get("token");
  const [data, setData] = useState<EstimateData | null>(null);
  const [loading, setLoading] = useState(false);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    if (!estimateId && !token) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErrored(false);
      try {
        if (token) {
          const { data: rpc, error } = await supabase.rpc("get_estimate_by_token", { _token: token });
          if (error || !rpc) throw error || new Error("not found");
          const payload = rpc as any;
          if (!cancelled) {
            setData({
              id: payload.estimate?.id,
              estimate_number: payload.estimate?.estimate_number,
              status: payload.estimate?.status,
              total: payload.estimate?.total,
              subtotal: payload.estimate?.subtotal,
              tax: payload.estimate?.tax,
              shop_supplies: payload.estimate?.shop_supplies,
              line_items: payload.estimate?.line_items,
              notes: payload.estimate?.notes,
              customer: payload.customer,
              vehicle: payload.vehicle,
            });
          }
        } else if (estimateId) {
          const { data: est, error } = await supabase
            .from("estimates")
            .select("id, estimate_number, status, total, subtotal, tax, shop_supplies, line_items, notes, customer_id, vehicle_id")
            .eq("id", estimateId)
            .maybeSingle();
          if (error || !est) throw error || new Error("not found");
          const [{ data: profile }, { data: vehicle }] = await Promise.all([
            supabase.from("profiles").select("full_name, email").eq("id", est.customer_id).maybeSingle(),
            est.vehicle_id
              ? supabase
                  .from("vehicles")
                  .select("year, make, model, license_plate, vin")
                  .eq("id", est.vehicle_id)
                  .maybeSingle()
              : Promise.resolve({ data: null as any }),
          ]);
          if (!cancelled) {
            setData({
              id: est.id,
              estimate_number: est.estimate_number,
              status: est.status,
              total: est.total,
              subtotal: est.subtotal,
              tax: est.tax,
              shop_supplies: est.shop_supplies,
              line_items: est.line_items as any,
              notes: est.notes,
              customer: profile,
              vehicle: vehicle as any,
            });
          }
        }
      } catch {
        if (!cancelled) setErrored(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [estimateId, token]);

  if (!estimateId && !token) return null;

  if (loading) {
    return (
      <Card className={`border-primary/30 ${className}`}>
        <CardContent className="py-6 flex items-center justify-center text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading estimate…
        </CardContent>
      </Card>
    );
  }

  if (errored || !data) {
    return (
      <Card className={`border-border/60 ${className}`}>
        <CardContent className="py-4 text-sm text-muted-foreground text-center">
          Couldn't load the linked estimate. You can still review this document.
        </CardContent>
      </Card>
    );
  }

  const items = Array.isArray(data.line_items) ? data.line_items : [];
  const vehicleStr = data.vehicle
    ? [data.vehicle.year, data.vehicle.make, data.vehicle.model].filter(Boolean).join(" ")
    : null;

  return (
    <Card className={`border-primary/30 print:break-inside-avoid ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" />
              Estimate Summary
              {data.estimate_number && (
                <span className="text-sm font-normal text-muted-foreground">
                  #{data.estimate_number}
                </span>
              )}
            </CardTitle>
            {(data.customer?.full_name || vehicleStr) && (
              <p className="text-sm text-muted-foreground mt-1">
                {[data.customer?.full_name, vehicleStr].filter(Boolean).join(" · ")}
                {data.vehicle?.license_plate ? ` · Plate ${data.vehicle.license_plate}` : ""}
              </p>
            )}
          </div>
          {data.status && (
            <Badge variant="outline" className="capitalize">
              {data.status.replace(/_/g, " ")}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length > 0 && (
          <div className="rounded-md border border-border/60 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Item</th>
                  <th className="text-right px-3 py-2 font-medium w-16">Qty</th>
                  <th className="text-right px-3 py-2 font-medium w-24">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((li, i) => (
                  <tr
                    key={i}
                    className={`border-t border-border/60 ${
                      li.status === "declined" ? "text-muted-foreground line-through" : ""
                    }`}
                  >
                    <td className="px-3 py-2">{li.description || "Service"}</td>
                    <td className="px-3 py-2 text-right">{li.quantity ?? 1}</td>
                    <td className="px-3 py-2 text-right">
                      {fmt(li.amount ?? (Number(li.unit_price || 0) * Number(li.quantity || 1)))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col items-end gap-0.5 text-sm">
          {data.subtotal != null && (
            <div className="text-muted-foreground">Subtotal: {fmt(data.subtotal)}</div>
          )}
          {data.shop_supplies != null && Number(data.shop_supplies) > 0 && (
            <div className="text-muted-foreground">Shop supplies: {fmt(data.shop_supplies)}</div>
          )}
          {data.tax != null && Number(data.tax) > 0 && (
            <div className="text-muted-foreground">Tax: {fmt(data.tax)}</div>
          )}
          <div className="font-bold text-base">Total: {fmt(data.total)}</div>
        </div>

        {data.notes && (
          <p className="text-xs text-muted-foreground border-t border-border/60 pt-2 whitespace-pre-wrap">
            {data.notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default EstimateSummaryCard;
