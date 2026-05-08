import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, Car, User, ClipboardCheck, FileSpreadsheet, Receipt, Wrench, Clock, ExternalLink, Paperclip, FileCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "sonner";
import ROAttachments from "./ROAttachments";
import { generateInvoiceForRepairOrder } from "@/lib/repairOrders";

interface Props {
  appointmentId: string | null;
  open: boolean;
  onClose: () => void;
}

export default function RepairOrderDetail({ appointmentId, open, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [appt, setAppt] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [vehicle, setVehicle] = useState<any>(null);
  const [estimates, setEstimates] = useState<any[]>([]);
  const [inspections, setInspections] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [timeEntries, setTimeEntries] = useState<any[]>([]);

  useEffect(() => {
    if (!appointmentId || !open) return;
    let active = true;
    (async () => {
      setLoading(true);
      const { data: a } = await supabase.from("appointments").select("*").eq("id", appointmentId).maybeSingle();
      if (!active) return;
      setAppt(a);
      if (a) {
        const [{ data: c }, { data: v }, { data: est }, { data: insp }, { data: sr }, { data: inv }, { data: te }] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", a.customer_id).maybeSingle(),
          a.vehicle_id ? supabase.from("vehicles").select("*").eq("id", a.vehicle_id).maybeSingle() : Promise.resolve({ data: null }),
          supabase.from("estimates").select("*").eq("appointment_id", a.id).order("created_at", { ascending: false }),
          supabase.from("inspections").select("*").eq("appointment_id", a.id).order("created_at", { ascending: false }),
          supabase.from("service_records").select("*").eq("appointment_id", a.id).order("created_at", { ascending: false }),
          supabase.from("invoices").select("*").in("service_record_id", []).order("created_at", { ascending: false }), // placeholder
          supabase.from("time_entries").select("*").eq("appointment_id", a.id).order("clock_in", { ascending: false }),
        ]);
        if (!active) return;
        setCustomer(c);
        setVehicle(v);
        setEstimates(est || []);
        setInspections(insp || []);
        setServices(sr || []);
        setTimeEntries(te || []);
        // load invoices linked to this appt's service records
        const srIds = (sr || []).map((r: any) => r.id);
        if (srIds.length) {
          const { data: inv2 } = await supabase.from("invoices").select("*").in("service_record_id", srIds);
          setInvoices(inv2 || []);
        } else {
          setInvoices([]);
        }
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [appointmentId, open]);

  const totalLaborMinutes = timeEntries.reduce((s, t) => s + (t.duration_minutes || 0), 0);
  const totalInvoiced = invoices.reduce((s, i) => s + Number(i.total || 0), 0);
  const totalPaid = invoices.reduce((s, i) => s + Number(i.amount_paid || 0), 0);
  const approvedEstimate = estimates.find((e: any) => e.status === 'approved' || e.status === 'partially_approved' || e.status === 'converted');
  const [issuing, setIssuing] = useState(false);

  const reload = async () => {
    if (!appointmentId) return;
    const { data: a } = await supabase.from("appointments").select("*").eq("id", appointmentId).maybeSingle();
    setAppt(a);
    const { data: sr } = await supabase.from("service_records").select("*").eq("appointment_id", appointmentId).order("created_at", { ascending: false });
    setServices(sr || []);
    const srIds = (sr || []).map((r: any) => r.id);
    if (srIds.length) {
      const { data: inv2 } = await supabase.from("invoices").select("*").in("service_record_id", srIds);
      setInvoices(inv2 || []);
    }
  };

  const issueInvoice = async () => {
    if (!appt || !approvedEstimate) return;
    const approvedLines = (approvedEstimate.line_items || []).filter((l: any) => l.status !== 'declined');
    const total = approvedLines.reduce((s: number, l: any) => s + Number(l.amount || (Number(l.quantity) * Number(l.unit_price))), 0);
    setIssuing(true);
    try {
      await generateInvoiceForRepairOrder({
        appointmentId: appt.id,
        customerId: appt.customer_id,
        vehicleId: appt.vehicle_id,
        serviceType: appt.service_type,
        approvedLineItems: approvedLines,
        invoiceTotal: total,
        mileage: vehicle?.current_mileage ?? null,
      });
      toast.success('Invoice issued');
      await reload();
    } catch (e: any) {
      toast.error(e.message || 'Could not issue invoice');
    } finally {
      setIssuing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            Repair Order {appt ? `#${appt.id.slice(0, 8).toUpperCase()}` : ""}
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {!loading && appt && (
          <div className="space-y-4">
            {/* Header summary */}
            <div className="grid md:grid-cols-3 gap-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><User className="h-4 w-4" /> Customer</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <div className="font-medium">{customer?.full_name || "—"}</div>
                  <div className="text-muted-foreground text-xs">{customer?.email}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><Car className="h-4 w-4" /> Vehicle</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  {vehicle ? (
                    <>
                      <div className="font-medium">{vehicle.year} {vehicle.make} {vehicle.model}</div>
                      <div className="text-muted-foreground text-xs">{vehicle.license_plate || vehicle.vin || "—"}</div>
                    </>
                  ) : <div className="text-muted-foreground">No vehicle linked</div>}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Status</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <Badge>{appt.status}</Badge>
                  <div className="text-xs text-muted-foreground">
                    {appt.scheduled_at ? format(new Date(appt.scheduled_at), "MMM d, p") : appt.requested_date ? `Req ${appt.requested_date}` : "Unscheduled"}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Service description */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Service Request</CardTitle></CardHeader>
              <CardContent className="text-sm">
                <div className="font-medium">{appt.service_type}</div>
                {appt.description && <div className="text-muted-foreground mt-1">{appt.description}</div>}
                {appt.technician_notes && (
                  <>
                    <Separator className="my-2" />
                    <div className="text-xs uppercase text-muted-foreground mb-1">Tech notes</div>
                    <div>{appt.technician_notes}</div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Estimates */}
            <Section icon={FileSpreadsheet} title={`Estimates (${estimates.length})`}>
              {estimates.length === 0 && <Empty>No estimates created yet.</Empty>}
              {estimates.map((e) => (
                <Row key={e.id}>
                  <div>
                    <div className="font-medium">{e.estimate_number || e.id.slice(0, 8)}</div>
                    <div className="text-xs text-muted-foreground">{e.line_items?.length || 0} line items · ${Number(e.total).toFixed(2)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={e.status === "approved" ? "default" : "secondary"}>{e.status}</Badge>
                    {e.approval_token && (
                      <Button size="sm" variant="ghost" asChild>
                        <Link to={`/estimate/${e.approval_token}`} target="_blank"><ExternalLink className="h-3 w-3" /></Link>
                      </Button>
                    )}
                  </div>
                </Row>
              ))}
            </Section>

            {/* Inspections */}
            <Section icon={ClipboardCheck} title={`Inspections (${inspections.length})`}>
              {inspections.length === 0 && <Empty>No inspections yet.</Empty>}
              {inspections.map((i) => (
                <Row key={i.id}>
                  <div>
                    <div className="font-medium">DVI {i.id.slice(0, 8)}</div>
                    <div className="text-xs text-muted-foreground">{i.mileage ? `${i.mileage} mi · ` : ""}{format(new Date(i.created_at), "MMM d")}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={i.status === "completed" ? "default" : "secondary"}>{i.status}</Badge>
                    {i.share_token && (
                      <Button size="sm" variant="ghost" asChild>
                        <Link to={`/inspection/${i.share_token}`} target="_blank"><ExternalLink className="h-3 w-3" /></Link>
                      </Button>
                    )}
                  </div>
                </Row>
              ))}
            </Section>

            {/* Service records */}
            <Section icon={Wrench} title={`Service Records (${services.length})`}>
              {services.length === 0 && <Empty>No work logged yet.</Empty>}
              {services.map((s) => (
                <Row key={s.id}>
                  <div>
                    <div className="font-medium">{s.service_type}</div>
                    <div className="text-xs text-muted-foreground">{s.service_date} · {s.mileage_at_service || "—"} mi</div>
                  </div>
                  <div className="text-sm">${Number(s.invoice_total || 0).toFixed(2)}</div>
                </Row>
              ))}
            </Section>

            {/* Time entries */}
            <Section icon={Clock} title={`Labor Time (${(totalLaborMinutes / 60).toFixed(2)} hrs)`}>
              {timeEntries.length === 0 && <Empty>No time clocked.</Empty>}
              {timeEntries.map((t) => (
                <Row key={t.id}>
                  <div className="text-sm">
                    {format(new Date(t.clock_in), "MMM d, p")}
                    {t.clock_out && ` → ${format(new Date(t.clock_out), "p")}`}
                  </div>
                  <div className="text-sm">{t.duration_minutes ? `${t.duration_minutes} min` : "active"}</div>
                </Row>
              ))}
            </Section>

            {/* Invoices */}
            <Section
              icon={Receipt}
              title={`Invoices (${invoices.length}) · $${totalPaid.toFixed(2)} / $${totalInvoiced.toFixed(2)}`}
              action={
                approvedEstimate && invoices.length === 0 ? (
                  <Button size="sm" onClick={issueInvoice} disabled={issuing}>
                    {issuing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <FileCheck className="h-3 w-3 mr-1" />}
                    Issue Invoice
                  </Button>
                ) : null
              }
            >
              {invoices.length === 0 && (
                <Empty>
                  {approvedEstimate
                    ? 'Click "Issue Invoice" to bill the approved estimate lines.'
                    : 'Approve an estimate first to issue an invoice.'}
                </Empty>
              )}
              {invoices.map((i) => (
                <Row key={i.id}>
                  <div>
                    <div className="font-medium">{i.invoice_number || i.id.slice(0, 8)}</div>
                    <div className="text-xs text-muted-foreground">Due {i.due_date || "—"}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={i.status === "paid" ? "default" : "destructive"}>{i.status}</Badge>
                    <span className="text-sm">${Number(i.total).toFixed(2)}</span>
                  </div>
                </Row>
              ))}
            </Section>

            {/* Attachments */}
            <Section icon={Paperclip} title="Documents & Photos">
              <ROAttachments appointmentId={appt.id} />
            </Section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

const Section = ({ icon: Icon, title, action, children }: any) => (
  <Card>
    <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
      <CardTitle className="text-sm flex items-center gap-2"><Icon className="h-4 w-4" /> {title}</CardTitle>
      {action}
    </CardHeader>
    <CardContent className="space-y-1">{children}</CardContent>
  </Card>
);
const Row = ({ children }: any) => (
  <div className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">{children}</div>
);
const Empty = ({ children }: any) => <div className="text-sm text-muted-foreground py-2">{children}</div>;
