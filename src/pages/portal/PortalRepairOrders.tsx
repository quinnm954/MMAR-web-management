import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PortalLayout from "@/components/portal/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wrench, Loader2, Car, FileText, Receipt, ClipboardCheck } from "lucide-react";
import { Link } from "react-router-dom";

interface RepairOrder {
  id: string;
  service_type: string;
  status: string;
  board_column: string;
  priority: string;
  scheduled_at: string | null;
  requested_date: string | null;
  description: string | null;
  technician_notes: string | null;
  created_at: string;
  vehicle: { year: number | null; make: string | null; model: string | null } | null;
  technician: { full_name: string | null } | null;
}

interface EstimateRow {
  id: string;
  appointment_id: string | null;
  estimate_number: string | null;
  status: string;
  total: number;
}

interface InvoiceRow {
  id: string;
  service_record_id: string | null;
  invoice_number: string | null;
  status: string;
  total: number;
  amount_paid: number;
}

interface ServiceRecRow {
  id: string;
  appointment_id: string | null;
}

const STATUS_LABEL: Record<string, { label: string; tone: "default" | "secondary" | "outline" | "destructive" }> = {
  inbox: { label: "Awaiting Review", tone: "outline" },
  scheduled: { label: "Scheduled", tone: "secondary" },
  in_progress: { label: "In Progress", tone: "default" },
  awaiting_approval: { label: "Awaiting Your Approval", tone: "destructive" },
  ready_for_invoice: { label: "Ready to Invoice", tone: "secondary" },
  completed: { label: "Completed", tone: "secondary" },
};

const PortalRepairOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<RepairOrder[]>([]);
  const [estimates, setEstimates] = useState<EstimateRow[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [serviceRecs, setServiceRecs] = useState<ServiceRecRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase
        .from("appointments")
        .select(
          "id, service_type, status, board_column, priority, scheduled_at, requested_date, description, technician_notes, created_at, vehicle:vehicles(year, make, model), technician:profiles!appointments_assigned_technician_id_fkey(full_name)"
        )
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false }),
      supabase.from("estimates").select("id, appointment_id, estimate_number, status, total").eq("customer_id", user.id),
      supabase.from("invoices").select("id, service_record_id, invoice_number, status, total, amount_paid").eq("customer_id", user.id),
      supabase.from("service_records").select("id, appointment_id").eq("customer_id", user.id),
    ]).then(([o, e, i, sr]) => {
      setOrders((o.data as unknown as RepairOrder[]) ?? []);
      setEstimates((e.data as EstimateRow[]) ?? []);
      setInvoices((i.data as InvoiceRow[]) ?? []);
      setServiceRecs((sr.data as ServiceRecRow[]) ?? []);
      setLoading(false);
    });
  }, [user]);

  const totals = {
    active: orders.filter((o) => !["completed", "cancelled"].includes(o.status)).length,
    completed: orders.filter((o) => o.status === "completed").length,
    awaiting: orders.filter((o) => o.board_column === "awaiting_approval").length,
    outstanding: invoices.filter((i) => i.status !== "paid").reduce((s, i) => s + (Number(i.total) - Number(i.amount_paid || 0)), 0),
  };

  const findEstimate = (apptId: string) => estimates.find((e) => e.appointment_id === apptId);
  const findInvoice = (apptId: string) => {
    const sr = serviceRecs.find((s) => s.appointment_id === apptId);
    if (!sr) return undefined;
    return invoices.find((inv) => inv.service_record_id === sr.id);
  };

  return (
    <PortalLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">My Repair Orders</h1>
        <p className="text-muted-foreground mt-1">Live status of every job we've done or scheduled for you.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">Active</div>
                <div className="text-2xl font-bold text-primary">{totals.active}</div>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">Completed</div>
                <div className="text-2xl font-bold">{totals.completed}</div>
              </CardContent>
            </Card>
            <Card className="border-destructive/40 bg-destructive/5">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">Needs Approval</div>
                <div className="text-2xl font-bold text-destructive">{totals.awaiting}</div>
              </CardContent>
            </Card>
            <Card className="border-accent/40 bg-accent/5">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">Balance Due</div>
                <div className="text-2xl font-bold text-accent">${totals.outstanding.toFixed(2)}</div>
              </CardContent>
            </Card>
          </div>

          {orders.length === 0 ? (
            <Card className="border-dashed border-border/50">
              <CardContent className="p-12 text-center">
                <Wrench className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground">
                  No repair orders yet.{" "}
                  <Link to="/portal/appointments" className="text-primary underline">
                    Book your first appointment
                  </Link>
                  .
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {orders.map((o) => {
                const est = findEstimate(o.id);
                const inv = findInvoice(o.id);
                const statusInfo = STATUS_LABEL[o.board_column] ?? { label: o.status, tone: "outline" as const };
                return (
                  <Card key={o.id} className="border-border/50">
                    <CardContent className="p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-bold">{o.service_type}</h3>
                            <Badge variant={statusInfo.tone} className="text-xs">{statusInfo.label}</Badge>
                            {o.priority === "urgent" && (
                              <Badge variant="destructive" className="text-xs">Urgent</Badge>
                            )}
                          </div>
                          {o.vehicle && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Car className="h-3 w-3" />
                              {o.vehicle.year} {o.vehicle.make} {o.vehicle.model}
                            </div>
                          )}
                        </div>
                        <div className="text-right text-sm">
                          <div className="font-medium">
                            {o.scheduled_at
                              ? new Date(o.scheduled_at).toLocaleDateString()
                              : o.requested_date || "Unscheduled"}
                          </div>
                          {o.technician?.full_name && (
                            <div className="text-xs text-muted-foreground">Tech: {o.technician.full_name}</div>
                          )}
                        </div>
                      </div>

                      {o.description && (
                        <p className="text-sm text-muted-foreground mb-2">{o.description}</p>
                      )}
                      {o.technician_notes && (
                        <p className="text-sm italic text-muted-foreground mb-2">"{o.technician_notes}"</p>
                      )}

                      <div className="flex flex-wrap gap-2 pt-2 border-t border-border/40 mt-3">
                        {est && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <FileText className="h-3 w-3" />
                            Estimate {est.estimate_number || est.id.slice(0, 6)} · ${Number(est.total).toFixed(2)} · {est.status}
                          </Badge>
                        )}
                        {inv && (
                          <Link to="/portal/invoices">
                            <Badge variant="outline" className="text-xs gap-1 hover:bg-muted cursor-pointer">
                              <Receipt className="h-3 w-3" />
                              Invoice {inv.invoice_number || inv.id.slice(0, 6)} · ${Number(inv.total).toFixed(2)} · {inv.status}
                            </Badge>
                          </Link>
                        )}
                        {!est && !inv && (
                          <Badge variant="outline" className="text-xs gap-1 text-muted-foreground">
                            <ClipboardCheck className="h-3 w-3" />
                            No documents yet
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </PortalLayout>
  );
};

export default PortalRepairOrders;
