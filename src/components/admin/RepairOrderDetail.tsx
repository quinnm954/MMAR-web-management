import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Car, User, ClipboardCheck, FileSpreadsheet, Receipt, Wrench, Clock, ExternalLink, Paperclip, FileCheck, UserCog, History } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "sonner";
import ROAttachments from "./ROAttachments";
import DeleteButton from "./DeleteButton";
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
  
  const [techs, setTechs] = useState<{ id: string; name: string }[]>([]);
  const [techMap, setTechMap] = useState<Record<string, string>>({});
  const [assignHistory, setAssignHistory] = useState<any[]>([]);
  const [savingTech, setSavingTech] = useState(false);

  useEffect(() => {
    if (!appointmentId || !open) return;
    let active = true;
    (async () => {
      setLoading(true);
      const { data: a } = await supabase.from("appointments").select("*").eq("id", appointmentId).maybeSingle();
      if (!active) return;
      setAppt(a);
      if (a) {
        const [{ data: c }, { data: v }, { data: est }, { data: insp }, { data: sr }, { data: inv }] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", a.customer_id).maybeSingle(),
          a.vehicle_id ? supabase.from("vehicles").select("*").eq("id", a.vehicle_id).maybeSingle() : Promise.resolve({ data: null }),
          supabase.from("estimates").select("*").eq("appointment_id", a.id).order("created_at", { ascending: false }),
          supabase.from("inspections").select("*").eq("appointment_id", a.id).order("created_at", { ascending: false }),
          supabase.from("service_records").select("*").eq("appointment_id", a.id).order("created_at", { ascending: false }),
          supabase.from("invoices").select("*").in("service_record_id", []).order("created_at", { ascending: false }), // placeholder
        ]);
        if (!active) return;
        setCustomer(c);
        setVehicle(v);
        setEstimates(est || []);
        setInspections(insp || []);
        setServices(sr || []);
        // load invoices linked to this appt's service records
        const srIds = (sr || []).map((r: any) => r.id);
        if (srIds.length) {
          const { data: inv2 } = await supabase.from("invoices").select("*").in("service_record_id", srIds);
          setInvoices(inv2 || []);
        } else {
          setInvoices([]);
        }

        // Load technicians (any user with technician role) for the assignment picker
        const { data: techRoles } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("role", "technician");
        const techIds = Array.from(new Set((techRoles || []).map((t: any) => t.user_id)));
        if (techIds.length) {
          const { data: techProfs } = await supabase
            .from("profiles")
            .select("id, full_name, email")
            .in("id", techIds);
          const list = (techProfs || []).map((p: any) => ({ id: p.id, name: p.full_name || p.email || p.id.slice(0, 8) }));
          setTechs(list);
          setTechMap(Object.fromEntries(list.map((t) => [t.id, t.name])));
        } else {
          setTechs([]);
          setTechMap({});
        }

        // Assignment history from audit logs
        const { data: logs } = await supabase
          .from("audit_logs")
          .select("id, actor_email, before_data, after_data, changed_fields, created_at")
          .eq("table_name", "appointments")
          .eq("record_id", a.id)
          .order("created_at", { ascending: false })
          .limit(50);
        const techLogs = (logs || []).filter((l: any) =>
          (l.changed_fields || []).includes("assigned_technician_id") ||
          (!l.before_data && l.after_data?.assigned_technician_id)
        );
        setAssignHistory(techLogs);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [appointmentId, open]);

  const totalLaborMinutes = 0;
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

  const [savingSchedule, setSavingSchedule] = useState(false);
  const [scheduleInput, setScheduleInput] = useState<string>("");
  useEffect(() => {
    if (appt?.scheduled_at) {
      // datetime-local needs YYYY-MM-DDTHH:mm in local time
      const d = new Date(appt.scheduled_at);
      const pad = (n: number) => String(n).padStart(2, "0");
      setScheduleInput(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
    } else if (appt?.requested_date) {
      // pre-fill with customer's requested date at a sensible default time based on window
      const win: string = appt.requested_time_window || "";
      const hour = win.toLowerCase().includes("evening") ? "16:00"
        : win.toLowerCase().includes("afternoon") ? "13:00"
        : "09:00";
      setScheduleInput(`${appt.requested_date}T${hour}`);
    } else {
      setScheduleInput("");
    }
  }, [appt?.scheduled_at, appt?.requested_date, appt?.requested_time_window]);

  const saveSchedule = async () => {
    if (!appt || !scheduleInput) return;
    setSavingSchedule(true);
    const iso = new Date(scheduleInput).toISOString();
    const newStatus = appt.status === "requested" ? "scheduled" : appt.status;
    const newColumn = appt.board_column === "inbox" ? "scheduled" : appt.board_column;
    const { error } = await supabase
      .from("appointments")
      .update({ scheduled_at: iso, status: newStatus, board_column: newColumn })
      .eq("id", appt.id);
    setSavingSchedule(false);
    if (error) return toast.error(error.message);
    toast.success("Repair order scheduled");
    setAppt({ ...appt, scheduled_at: iso, status: newStatus, board_column: newColumn });
  };

  const assignTech = async (techId: string | null) => {
    if (!appt) return;
    setSavingTech(true);
    const { error } = await supabase
      .from("appointments")
      .update({ assigned_technician_id: techId })
      .eq("id", appt.id);
    setSavingTech(false);
    if (error) return toast.error(error.message);
    toast.success(techId ? "Technician assigned" : "Technician unassigned");
    setAppt({ ...appt, assigned_technician_id: techId });
    // refresh history
    const { data: logs } = await supabase
      .from("audit_logs")
      .select("id, actor_email, before_data, after_data, changed_fields, created_at")
      .eq("table_name", "appointments")
      .eq("record_id", appt.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setAssignHistory((logs || []).filter((l: any) => (l.changed_fields || []).includes("assigned_technician_id")));
  };

  const issueInvoice = async () => {
    if (!appt || !approvedEstimate) return;
    // Only include line items the customer actually approved.
    // - If the estimate is fully 'approved' and items have no per-line status, treat all as approved.
    // - For 'partially_approved' (or any item with explicit per-line status), require status === 'approved'.
    const allLines: any[] = approvedEstimate.line_items || [];
    const hasPerLineStatus = allLines.some((l: any) => typeof l?.status === 'string' && l.status.length > 0);
    const approvedLines = hasPerLineStatus
      ? allLines.filter((l: any) => l.status === 'approved')
      : (approvedEstimate.status === 'approved' ? allLines : allLines.filter((l: any) => l.status === 'approved'));
    if (approvedLines.length === 0) {
      toast.error('No approved line items on this estimate to invoice.');
      return;
    }
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
        estimate: approvedEstimate,
      });
      toast.success('Invoice issued');
      await reload();
    } catch (e: any) {
      toast.error(e.message || 'Could not issue invoice');
    } finally {
      setIssuing(false);
    }
  };

  const [applyingHours, setApplyingHours] = useState(false);
  // Pick the estimate that should reflect actual labor: approved first, else most recent.
  const targetEstimate = approvedEstimate || estimates[0];

  const applyLaborToEstimate = async () => {
    if (!targetEstimate) {
      toast.error('No estimate to update');
      return;
    }
    const totalHours = Number((totalLaborMinutes / 60).toFixed(2));
    if (totalHours <= 0) {
      toast.error('No labor time clocked yet');
      return;
    }
    setApplyingHours(true);
    try {
      const lines: any[] = Array.isArray(targetEstimate.line_items) ? [...targetEstimate.line_items] : [];
      const laborIdx = lines
        .map((l, i) => ({ l, i }))
        .filter(({ l }) => l.kind === 'labor' || (Number(l.labor_hours) || 0) > 0);

      if (laborIdx.length === 0) {
        // No labor line — append a new one using the default labor rate from shop_settings.
        const { data: rate } = await supabase
          .from('labor_rates')
          .select('hourly_rate')
          .eq('is_default', true)
          .eq('is_active', true)
          .maybeSingle();
        const hr = Number((rate as any)?.hourly_rate ?? 0);
        lines.push({
          description: 'Labor',
          quantity: totalHours,
          unit_price: hr,
          amount: Number((totalHours * hr).toFixed(2)),
          labor_hours: totalHours,
          kind: 'labor',
        });
      } else if (laborIdx.length === 1) {
        const { l, i } = laborIdx[0];
        const unit = Number(l.unit_price) || 0;
        lines[i] = {
          ...l,
          labor_hours: totalHours,
          quantity: totalHours,
          amount: Number((totalHours * unit).toFixed(2)),
        };
      } else {
        // Distribute proportionally to the existing labor_hours weights.
        const currentTotal = laborIdx.reduce((s, { l }) => s + (Number(l.labor_hours) || 0), 0) || laborIdx.length;
        laborIdx.forEach(({ l, i }) => {
          const weight = (Number(l.labor_hours) || 1) / currentTotal;
          const hrs = Number((totalHours * weight).toFixed(2));
          const unit = Number(l.unit_price) || 0;
          lines[i] = { ...l, labor_hours: hrs, quantity: hrs, amount: Number((hrs * unit).toFixed(2)) };
        });
      }

      const subtotal = lines.reduce((s, l) => s + (Number(l.amount) || 0), 0);
      const { error } = await supabase
        .from('estimates')
        .update({ line_items: lines, subtotal })
        .eq('id', targetEstimate.id);
      if (error) throw error;
      toast.success(`Estimate updated: ${totalHours} hr${totalHours === 1 ? '' : 's'} of labor`);
      // Refresh local estimates state
      const { data: est } = await supabase
        .from('estimates')
        .select('*')
        .eq('appointment_id', appt!.id)
        .order('created_at', { ascending: false });
      setEstimates(est || []);
    } catch (e: any) {
      toast.error(e.message || 'Could not update estimate');
    } finally {
      setApplyingHours(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl w-screen h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:w-auto p-4 sm:p-6 overflow-y-auto rounded-none sm:rounded-lg safe-pt safe-pb">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2 pr-8">
            <span className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              Repair Order {appt ? `#${appt.id.slice(0, 8).toUpperCase()}` : ""}
            </span>
            {appt && (
              <DeleteButton
                table="appointments"
                id={appt.id}
                label="Delete RO"
                description="This permanently deletes the repair order. Linked estimates will be unlinked. This cannot be undone."
                onDeleted={onClose}
              />
            )}
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

            {/* Schedule */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4" /> Schedule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-xs text-muted-foreground">
                  Customer requested:{" "}
                  <span className="text-foreground font-medium">
                    {appt.requested_date ? format(new Date(appt.requested_date + "T00:00:00"), "EEE, MMM d, yyyy") : "No preferred date"}
                  </span>
                  {appt.requested_time_window && <span className="ml-1">· {appt.requested_time_window}</span>}
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1 block">Scheduled date &amp; time</label>
                    <input
                      type="datetime-local"
                      value={scheduleInput}
                      onChange={(e) => setScheduleInput(e.target.value)}
                      className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                  <Button onClick={saveSchedule} disabled={savingSchedule || !scheduleInput}>
                    {savingSchedule ? <Loader2 className="h-4 w-4 animate-spin" /> : appt.scheduled_at ? "Update schedule" : "Schedule RO"}
                  </Button>
                </div>
                {appt.scheduled_at && (
                  <div className="text-xs text-muted-foreground">
                    Currently scheduled for <span className="text-foreground font-medium">{format(new Date(appt.scheduled_at), "EEE, MMM d, yyyy 'at' p")}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Technician assignment */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><UserCog className="h-4 w-4" /> Assigned Technician</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Select
                    value={appt.assigned_technician_id ?? "unassigned"}
                    onValueChange={(v) => assignTech(v === "unassigned" ? null : v)}
                    disabled={savingTech}
                  >
                    <SelectTrigger className="w-full sm:w-[280px]">
                      <SelectValue placeholder="Select technician" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">— Unassigned —</SelectItem>
                      {techs.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {savingTech && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  {appt.assigned_technician_id && (
                    <Badge variant="secondary" className="text-xs">
                      Currently: {techMap[appt.assigned_technician_id] || appt.assigned_technician_id.slice(0, 8)}
                    </Badge>
                  )}
                </div>

                {assignHistory.length > 0 && (
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-1">
                      <History className="h-3 w-3" /> Assignment history
                    </div>
                    <ul className="space-y-1 text-xs">
                      {assignHistory.map((h) => {
                        const before = h.before_data?.assigned_technician_id;
                        const after = h.after_data?.assigned_technician_id;
                        return (
                          <li key={h.id} className="flex items-center justify-between border-b border-border/40 py-1 last:border-0 gap-2">
                            <span>
                              <span className="text-muted-foreground">{before ? (techMap[before] || before.slice(0, 8)) : "—"}</span>
                              {" → "}
                              <span className="font-medium">{after ? (techMap[after] || after.slice(0, 8)) : "—"}</span>
                            </span>
                            <span className="text-muted-foreground text-right">
                              {h.actor_email || "system"} · {format(new Date(h.created_at), "MMM d, p")}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
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
