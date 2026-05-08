import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Link as LinkIcon, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import DeleteButton from "@/components/admin/DeleteButton";

interface Row {
  id: string;
  status: string;
  start_date: string | null;
  next_billing_date: string | null;
  oil_changes_used: number;
  cancellation_requested_at: string | null;
  customer_id: string;
  deposit_paid: boolean;
  customer: { full_name: string | null; email: string | null } | null;
  plan: { name: string; monthly_price: number; stripe_price_id: string | null } | null;
  vehicle: { year: number | null; make: string | null; model: string | null } | null;
}

const STATUSES = ["pending", "active", "paused", "cancelled"];

const statusColor = (s: string) => {
  if (s === "active") return "bg-primary/15 text-primary";
  if (s === "pending") return "bg-accent/15 text-accent-foreground";
  if (s === "cancelled") return "bg-muted text-muted-foreground";
  return "bg-muted text-muted-foreground";
};

const AdminMemberships = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkBusy, setLinkBusy] = useState<string | null>(null);

  const generateLink = async (
    membershipId: string,
    kind: "membership_deposit" | "membership_subscription",
    sendSms: boolean,
  ) => {
    const key = `${membershipId}:${kind}:${sendSms}`;
    setLinkBusy(key);
    try {
      const { data, error } = await supabase.functions.invoke("create-payment-link", {
        body: { kind, reference_id: membershipId, send_sms: sendSms },
      });
      if (error || (data as any)?.error) throw new Error(error?.message || (data as any)?.error);
      const url = (data as any).url as string;
      if (sendSms) {
        toast.success("Payment link texted to customer");
      } else {
        await navigator.clipboard.writeText(url).catch(() => {});
        window.prompt("Copy payment link:", url);
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to generate link");
    } finally {
      setLinkBusy(null);
    }
  };

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("memberships")
      .select("id, status, start_date, next_billing_date, oil_changes_used, cancellation_requested_at, customer_id, deposit_paid, plan:membership_plans(name, monthly_price, stripe_price_id), vehicle:vehicles(year, make, model)")
      .order("created_at", { ascending: false });

    const list = (data as unknown as Row[]) ?? [];
    const ids = Array.from(new Set(list.map((r) => r.customer_id)));
    const { data: profs } = await supabase.from("profiles").select("id, full_name, email").in("id", ids);
    const byId: Record<string, { full_name: string | null; email: string | null }> = {};
    (profs ?? []).forEach((p) => { byId[p.id] = { full_name: p.full_name, email: p.email }; });
    list.forEach((r) => { r.customer = byId[r.customer_id] ?? null; });
    setRows(list);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const update: Record<string, unknown> = { status };
    if (status === "cancelled") update.cancelled_at = new Date().toISOString();
    const { error } = await supabase.from("memberships").update(update).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Updated");
    load();
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-3">
      <div className="text-xs text-muted-foreground">{rows.length} memberships</div>
      {rows.map((r) => (
        <Card key={r.id} className="border-border/50">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
              <div className="md:col-span-2">
                <div className="font-semibold">{r.customer?.full_name || r.customer?.email || "—"}</div>
                <div className="text-xs text-muted-foreground truncate">{r.customer?.email}</div>
                {r.vehicle && <div className="text-xs mt-1">{r.vehicle.year} {r.vehicle.make} {r.vehicle.model}</div>}
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Plan</div>
                <div className="font-medium">{r.plan?.name}</div>
                <div className="text-xs">${r.plan?.monthly_price.toFixed(2)}/mo</div>
              </div>
              <div className="text-xs">
                <div>Next bill: <span className="font-medium">{r.next_billing_date || "—"}</span></div>
                <div>Oil used: <span className="font-medium">{r.oil_changes_used}</span></div>
                {r.cancellation_requested_at && <Badge variant="outline" className="mt-1">cancel requested</Badge>}
              </div>
              <div className="flex flex-col gap-2">
                <Badge className={statusColor(r.status)}>{r.status}</Badge>
                <Select value={r.status} onValueChange={(v) => updateStatus(r.id, v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-1">
                  {!r.deposit_paid && (
                    <>
                      <Button size="sm" variant="outline" className="h-7 text-xs" disabled={!!linkBusy?.startsWith(r.id)} onClick={() => generateLink(r.id, "membership_deposit", false)}>
                        <LinkIcon className="h-3 w-3 mr-1" />Deposit
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2" title="Text deposit link" disabled={!!linkBusy?.startsWith(r.id)} onClick={() => generateLink(r.id, "membership_deposit", true)}>
                        <MessageSquare className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                  {r.plan?.stripe_price_id && (
                    <Button size="sm" variant="outline" className="h-7 text-xs" disabled={!!linkBusy?.startsWith(r.id)} onClick={() => generateLink(r.id, "membership_subscription", false)}>
                      <LinkIcon className="h-3 w-3 mr-1" />Subscribe
                    </Button>
                  )}
                  <DeleteButton
                    table="memberships"
                    id={r.id}
                    description="Delete this membership? Active Stripe subscriptions must be cancelled separately."
                    onDeleted={load}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminMemberships;
