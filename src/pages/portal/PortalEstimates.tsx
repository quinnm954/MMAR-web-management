import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PortalLayout from "@/components/portal/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Loader2,
  ChevronRight,
  Wrench,
  Receipt,
  CheckCircle2,
  Clock,
  CircleDashed,
} from "lucide-react";

interface Estimate {
  id: string;
  estimate_number: string | null;
  status: string;
  total: number;
  valid_until: string | null;
  created_at: string;
  approval_token: string | null;
  appointment_id: string | null;
  converted_to_invoice_id: string | null;
  vehicle?: { year: number | null; make: string | null; model: string | null } | null;
}
interface Appt {
  id: string;
  service_type: string;
  board_column: string;
  status: string;
  scheduled_at: string | null;
}
interface Invoice {
  id: string;
  invoice_number: string | null;
  status: string;
  total: number;
  amount_paid: number;
  service_record_id: string | null;
}
interface ServiceRec { id: string; appointment_id: string | null }

const estStatusColor = (s: string) => {
  if (s === "approved") return "bg-primary/15 text-primary border-primary/30";
  if (s === "declined") return "bg-destructive/15 text-destructive border-destructive/30";
  if (s === "partially_approved" || s === "sent") return "bg-accent/15 text-accent-foreground border-accent/30";
  return "bg-muted text-muted-foreground border-border";
};

const RO_LABEL: Record<string, string> = {
  inbox: "Awaiting Review",
  scheduled: "Scheduled",
  in_progress: "In Progress",
  awaiting_approval: "Awaiting Approval",
  ready_for_invoice: "Ready to Invoice",
  completed: "Completed",
};

const PortalEstimates = () => {
  const { user } = useAuth();
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [appts, setAppts] = useState<Appt[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [serviceRecs, setServiceRecs] = useState<ServiceRec[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase
        .from("estimates")
        .select("id, estimate_number, status, total, valid_until, created_at, approval_token, appointment_id, converted_to_invoice_id, vehicle:vehicles(year, make, model)")
        .eq("customer_id", user.id)
        .neq("status", "draft")
        .order("created_at", { ascending: false }),
      supabase.from("appointments").select("id, service_type, board_column, status, scheduled_at").eq("customer_id", user.id),
      supabase.from("invoices").select("id, invoice_number, status, total, amount_paid, service_record_id").eq("customer_id", user.id),
      supabase.from("service_records").select("id, appointment_id").eq("customer_id", user.id),
    ]).then(([e, a, i, sr]) => {
      setEstimates((e.data as unknown as Estimate[]) ?? []);
      setAppts((a.data as Appt[]) ?? []);
      setInvoices((i.data as Invoice[]) ?? []);
      setServiceRecs((sr.data as ServiceRec[]) ?? []);
      setLoading(false);
    });
  }, [user]);

  const findInvoiceForEstimate = (e: Estimate): Invoice | undefined => {
    if (e.converted_to_invoice_id) {
      return invoices.find((inv) => inv.id === e.converted_to_invoice_id);
    }
    if (!e.appointment_id) return undefined;
    const sr = serviceRecs.find((s) => s.appointment_id === e.appointment_id);
    if (!sr) return undefined;
    return invoices.find((inv) => inv.service_record_id === sr.id);
  };

  const needsAction = estimates.filter((e) => e.status === "sent").length;

  return (
    <PortalLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Estimates</h1>
        <p className="text-muted-foreground mt-1">Track each estimate from approval through repair and invoice.</p>
      </div>

      {needsAction > 0 && (
        <Card className="border-accent/40 bg-accent/5 mb-6">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">Awaiting your approval</div>
              <div className="text-2xl font-bold">{needsAction}</div>
            </div>
            <p className="text-xs text-muted-foreground max-w-xs text-right">
              Approving an estimate creates a repair order on our schedule.
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
        <div className="space-y-3">
          {estimates.map((e) => {
            const reviewable = e.status === "sent" && e.approval_token;
            const ro = e.appointment_id ? appts.find((a) => a.id === e.appointment_id) : undefined;
            const inv = findInvoiceForEstimate(e);
            const approvedFamily = ["approved", "partially_approved"].includes(e.status);
            const due = inv ? Number(inv.total) - Number(inv.amount_paid || 0) : 0;

            return (
              <Card key={e.id} className="border-border/50">
                <CardContent className="p-4 space-y-3">
                  {/* Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-medium">{e.estimate_number || `EST-${e.id.slice(0, 6)}`}</span>
                        <Badge className={`${estStatusColor(e.status)} uppercase border text-[10px]`}>{e.status.replace("_", " ")}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {new Date(e.created_at).toLocaleDateString()}
                        {e.valid_until && ` • Valid until ${e.valid_until}`}
                        {e.vehicle && ` • ${[e.vehicle.year, e.vehicle.make, e.vehicle.model].filter(Boolean).join(" ")}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right"><div className="font-bold">${Number(e.total).toFixed(2)}</div></div>
                      {reviewable ? (
                        <Button size="sm" variant="hero" asChild>
                          <Link to={`/estimate/${e.approval_token}`}>Review &amp; Approve <ChevronRight className="h-4 w-4 ml-1" /></Link>
                        </Button>
                      ) : approvedFamily && e.approval_token ? (
                        <Button size="sm" variant="outline" asChild>
                          <Link to={`/estimate/${e.approval_token}?edit=1`}>Change / Decline Items</Link>
                        </Button>
                      ) : e.approval_token ? (
                        <Button size="sm" variant="outline" asChild>
                          <Link to={`/estimate/${e.approval_token}`}>View</Link>
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  {/* Pipeline */}
                  <div className="grid sm:grid-cols-3 gap-2 pt-2 border-t border-border/40">
                    {/* Step 1: Estimate */}
                    <Step
                      icon={<FileText className="h-4 w-4" />}
                      title="Estimate"
                      state={e.status === "sent" ? "current" : approvedFamily || e.status === "declined" ? "done" : "current"}
                      detail={
                        e.status === "sent" ? "Awaiting your approval" :
                        e.status === "approved" ? "Approved" :
                        e.status === "partially_approved" ? "Partially approved" :
                        e.status === "declined" ? "Declined" : e.status
                      }
                    />
                    {/* Step 2: Repair Order */}
                    <Step
                      icon={<Wrench className="h-4 w-4" />}
                      title="Repair Order"
                      state={!approvedFamily ? "pending" : !ro ? "current" : ro.board_column === "completed" ? "done" : "current"}
                      detail={
                        !approvedFamily ? "Approve to schedule" :
                        !ro ? "Awaiting scheduling" :
                        `${RO_LABEL[ro.board_column] || ro.status}${ro.scheduled_at ? ` · ${new Date(ro.scheduled_at).toLocaleDateString()}` : ""}`
                      }
                      action={ro ? <Link to="/portal/repair-orders" className="text-[11px] text-primary hover:underline">View</Link> : null}
                    />
                    {/* Step 3: Invoice */}
                    <Step
                      icon={<Receipt className="h-4 w-4" />}
                      title="Invoice"
                      state={!inv ? (approvedFamily ? "pending" : "pending") : inv.status === "paid" ? "done" : "current"}
                      detail={
                        !inv ? (approvedFamily ? "Generated when work completes" : "—") :
                        inv.status === "paid" ? "Paid in full" :
                        `${inv.invoice_number || `INV-${inv.id.slice(0, 6)}`} · $${due.toFixed(2)} due`
                      }
                      action={inv ? <Link to={`/portal/invoices/${inv.id}`} className="text-[11px] text-primary hover:underline">{inv.status === "paid" ? "View receipt" : "Pay / view"}</Link> : null}
                    />
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

const Step = ({
  icon, title, state, detail, action,
}: {
  icon: React.ReactNode;
  title: string;
  state: "done" | "current" | "pending";
  detail: string;
  action?: React.ReactNode;
}) => {
  const indicator =
    state === "done" ? <CheckCircle2 className="h-4 w-4 text-primary" /> :
    state === "current" ? <Clock className="h-4 w-4 text-accent" /> :
    <CircleDashed className="h-4 w-4 text-muted-foreground/50" />;
  const tone =
    state === "done" ? "border-primary/30 bg-primary/5" :
    state === "current" ? "border-accent/30 bg-accent/5" :
    "border-border bg-muted/20";
  return (
    <div className={`rounded-md border ${tone} p-2.5`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {icon} {title}
        </div>
        {indicator}
      </div>
      <div className="mt-1 text-xs">{detail}</div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
};

export default PortalEstimates;
