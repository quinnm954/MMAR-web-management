import { useEffect, useState, Fragment } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wrench, FileText, Receipt } from "lucide-react";
import RepairOrderDetail from "./RepairOrderDetail";
import DeleteButton from "./DeleteButton";
import { format } from "date-fns";
import { ListControls, inRange, matches, groupHeader, GroupLabel, type Range } from "./ListControls";

const RO_TABS: { key: string; label: string; test: (r: any) => boolean }[] = [
  { key: "active", label: "Active", test: (r) => !["completed", "cancelled"].includes(r.status) },
  { key: "approval", label: "Needs approval", test: (r) => r.board_column === "awaiting_approval" || r.est?.status === "sent" },
  { key: "to_invoice", label: "To invoice", test: (r) => !r.inv && ["approved", "partially_approved", "converted"].includes(r.est?.status) },
  { key: "unpaid", label: "Unpaid", test: (r) => r.inv && r.inv.status !== "paid" && r.inv.status !== "void" },
  { key: "completed", label: "Completed", test: (r) => r.status === "completed" },
  { key: "all", label: "All", test: () => true },
];

const money = (n: any) => `$${Number(n || 0).toFixed(2)}`;

export default function AdminRepairOrders() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("active");
  const [range, setRange] = useState<Range>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data: appts } = await supabase
      .from("appointments")
      .select("id,service_type,status,scheduled_at,requested_date,customer_id,vehicle_id,board_column,priority,created_at")
      .order("created_at", { ascending: false })
      .limit(300);
    const list = appts || [];
    const ids = list.map((a: any) => a.id);
    const customerIds = Array.from(new Set(list.map((a: any) => a.customer_id).filter(Boolean)));
    const vehicleIds = Array.from(new Set(list.map((a: any) => a.vehicle_id).filter(Boolean)));

    const [{ data: customers }, { data: vehicles }, { data: ests }, { data: srs }] = await Promise.all([
      customerIds.length ? supabase.from("profiles").select("id,full_name,email,phone").in("id", customerIds) : Promise.resolve({ data: [] as any[] }),
      vehicleIds.length ? supabase.from("vehicles").select("id,year,make,model,license_plate").in("id", vehicleIds) : Promise.resolve({ data: [] as any[] }),
      ids.length ? supabase.from("estimates").select("id,appointment_id,estimate_number,status,total,created_at").in("appointment_id", ids) : Promise.resolve({ data: [] as any[] }),
      ids.length ? supabase.from("service_records").select("id,appointment_id").in("appointment_id", ids) : Promise.resolve({ data: [] as any[] }),
    ]);
    const srIds = (srs || []).map((s: any) => s.id);
    const [{ data: invA }, { data: invB }] = await Promise.all([
      ids.length ? supabase.from("invoices").select("id,appointment_id,service_record_id,invoice_number,status,total,amount_paid").in("appointment_id", ids) : Promise.resolve({ data: [] as any[] }),
      srIds.length ? supabase.from("invoices").select("id,appointment_id,service_record_id,invoice_number,status,total,amount_paid").in("service_record_id", srIds) : Promise.resolve({ data: [] as any[] }),
    ]);
    const srToAppt = new Map((srs || []).map((s: any) => [s.id, s.appointment_id]));
    const invByAppt = new Map<string, any>();
    [...(invA || []), ...(invB || [])].forEach((i: any) => {
      const a = i.appointment_id || srToAppt.get(i.service_record_id);
      if (a && !invByAppt.has(a)) invByAppt.set(a, i);
    });
    const rank = (s: string) => (["approved", "partially_approved", "converted"].includes(s) ? 0 : s === "declined" ? 2 : 1);
    const estByAppt = new Map<string, any>();
    (ests || []).forEach((e: any) => {
      const cur = estByAppt.get(e.appointment_id);
      if (!cur || rank(e.status) < rank(cur.status)) estByAppt.set(e.appointment_id, e);
    });
    const cmap = new Map((customers || []).map((c: any) => [c.id, c]));
    const vmap = new Map((vehicles || []).map((v: any) => [v.id, v]));
    setRows(list.map((a: any) => ({
      ...a,
      customer: cmap.get(a.customer_id),
      vehicle: vmap.get(a.vehicle_id),
      est: estByAppt.get(a.id),
      inv: invByAppt.get(a.id),
    })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const base = rows.filter((r) => inRange(r.scheduled_at || r.created_at, range) && matches(q,
    r.id, r.service_type, r.customer?.full_name, r.customer?.email, r.customer?.phone,
    r.vehicle?.make, r.vehicle?.model, r.vehicle?.license_plate, r.est?.estimate_number, r.inv?.invoice_number));
  const tabDef = RO_TABS.find((t) => t.key === tab) || RO_TABS[0];
  const shown = base.filter(tabDef.test);
  const dateOf = (r: any) => r.scheduled_at || r.created_at;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Wrench className="h-5 w-5" /> Repair Orders</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <ListControls q={q} setQ={setQ} placeholder="Search RO, customer, vehicle, estimate or invoice #..."
          range={range} setRange={setRange} tab={tab} setTab={setTab}
          tabs={RO_TABS.map((t) => ({ key: t.key, label: t.label, count: base.filter(t.test).length }))} />

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : shown.length === 0 ? (
          <div className="text-center text-muted-foreground py-8 text-sm">No repair orders match.</div>
        ) : (
          <div className="space-y-2">
            {shown.map((r, idx) => {
              const hdr = groupHeader(shown, idx, dateOf);
              const due = r.inv ? Number(r.inv.total) - Number(r.inv.amount_paid || 0) : 0;
              return (
                <Fragment key={r.id}>
                  {hdr && <GroupLabel label={hdr} />}
                  <div className="w-full p-3 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-colors flex items-center gap-2">
                    <button onClick={() => setOpenId(r.id)} className="flex-1 min-w-0 text-left">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs text-muted-foreground">RO#{r.id.slice(0, 8).toUpperCase()}</span>
                            <Badge variant="outline" className="text-xs">{r.status}</Badge>
                            {r.priority && r.priority !== "normal" && <Badge variant="destructive" className="text-xs">{r.priority}</Badge>}
                          </div>
                          <div className="font-medium mt-1 truncate">{r.service_type}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {r.customer?.full_name || "Unknown"} · {r.vehicle ? `${r.vehicle.year} ${r.vehicle.make} ${r.vehicle.model}` : "No vehicle"}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground text-right shrink-0">
                          {r.scheduled_at ? format(new Date(r.scheduled_at), "MMM d, p") : r.requested_date || format(new Date(r.created_at), "MMM d")}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <Badge variant="secondary" className="text-[11px] gap-1 font-normal">
                          <FileText className="h-3 w-3" />
                          {r.est ? `Estimate ${money(r.est.total)} · ${r.est.status.replace("_", " ")}` : "No estimate"}
                        </Badge>
                        <Badge variant={r.inv && due > 0 ? "destructive" : "secondary"} className="text-[11px] gap-1 font-normal">
                          <Receipt className="h-3 w-3" />
                          {r.inv ? (r.inv.status === "paid" ? `Invoice ${money(r.inv.total)} · paid` : `Invoice ${money(r.inv.total)} · ${money(due)} due`) : "No invoice"}
                        </Badge>
                      </div>
                    </button>
                    <DeleteButton
                      table="appointments"
                      id={r.id}
                      size="icon"
                      label="Delete repair order"
                      description="This permanently deletes the repair order and any linked estimates/invoices may be orphaned. This cannot be undone."
                      onDeleted={() => setRows((prev) => prev.filter((x) => x.id !== r.id))}
                    />
                  </div>
                </Fragment>
              );
            })}
          </div>
        )}

        <RepairOrderDetail appointmentId={openId} open={!!openId} onClose={() => { setOpenId(null); load(); }} />
      </CardContent>
    </Card>
  );
}
