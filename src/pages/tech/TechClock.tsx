import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import TechLayout from "@/components/tech/TechLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Play, Square, DollarSign, Wrench } from "lucide-react";
import { toast } from "sonner";

interface Shift {
  id: string;
  clock_in: string;
  clock_out: string | null;
  duration_minutes: number | null;
  notes: string | null;
}

const fmtDuration = (mins: number | null) => {
  if (mins == null) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
};

/** Technicians: read-only labor pay summary (no clock-in). */
const TechnicianPaySummary = ({ userId }: { userId: string }) => {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<{ invoice: any; record: any }[]>([]);
  const [laborRate, setLaborRate] = useState(35);
  const [hourlyRate, setHourlyRate] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: settings }, { data: emp }, { data: appts }] = await Promise.all([
        supabase.from("shop_settings").select("labor_cost_per_hour").eq("id", 1).maybeSingle(),
        supabase.from("employees").select("hourly_rate").eq("user_id", userId).maybeSingle(),
        supabase.from("appointments").select("id").eq("assigned_technician_id", userId),
      ]);
      if (settings?.labor_cost_per_hour) setLaborRate(Number(settings.labor_cost_per_hour));
      if (emp?.hourly_rate != null) setHourlyRate(Number(emp.hourly_rate));

      const apptIds = (appts ?? []).map((a: any) => a.id);
      if (!apptIds.length) { setRows([]); setLoading(false); return; }
      const { data: srs } = await supabase
        .from("service_records")
        .select("id, service_date, service_type, invoice_total, appointment_id")
        .in("appointment_id", apptIds);
      const srIds = (srs ?? []).map((s: any) => s.id);
      const { data: invs } = srIds.length
        ? await supabase.from("invoices").select("id, total, subtotal, status, paid_at, service_record_id").in("service_record_id", srIds).eq("status", "paid")
        : { data: [] as any[] };

      const srById = new Map((srs ?? []).map((s: any) => [s.id, s]));
      const list = (invs ?? []).map((inv: any) => ({
        invoice: inv,
        record: srById.get(inv.service_record_id),
      })).sort((a, b) => new Date(b.invoice.paid_at || 0).getTime() - new Date(a.invoice.paid_at || 0).getTime());
      setRows(list);
      setLoading(false);
    })();
  }, [userId]);

  const totals = rows.reduce(
    (acc, { invoice }) => {
      const subtotal = Number(invoice.subtotal || 0);
      const hours = laborRate > 0 ? subtotal / laborRate : 0;
      acc.subtotal += subtotal;
      acc.hours += hours;
      acc.pay += hourlyRate ? hours * hourlyRate : 0;
      return acc;
    },
    { subtotal: 0, hours: 0, pay: 0 }
  );

  return (
    <div className="space-y-4 max-w-2xl">
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4 flex items-start gap-3">
          <Wrench className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">No clock-in needed.</p>
            <p className="text-muted-foreground">Your pay is based on labor time on paid invoices for jobs assigned to you.</p>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="h-4 w-4" /> Labor Pay Summary</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 rounded-lg border border-border/50">
                  <div className="text-2xl font-bold">{totals.hours.toFixed(1)}</div>
                  <div className="text-[10px] uppercase text-muted-foreground tracking-wide">Billable Hours</div>
                </div>
                <div className="p-3 rounded-lg border border-border/50">
                  <div className="text-2xl font-bold">${totals.subtotal.toFixed(0)}</div>
                  <div className="text-[10px] uppercase text-muted-foreground tracking-wide">Invoice Subtotals</div>
                </div>
                <div className="p-3 rounded-lg border border-primary/40 bg-primary/5">
                  <div className="text-2xl font-bold text-primary">{hourlyRate ? `$${totals.pay.toFixed(0)}` : "—"}</div>
                  <div className="text-[10px] uppercase text-muted-foreground tracking-wide">Estimated Pay</div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Hours estimated as invoice subtotal ÷ shop labor rate (${laborRate}/hr).
                {hourlyRate ? ` Pay = hours × your rate ($${hourlyRate}/hr).` : " Set your hourly rate in Employees to see pay."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Recent Paid Invoices</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {rows.length === 0 && <p className="text-sm text-muted-foreground">No paid invoices yet.</p>}
              {rows.map(({ invoice, record }) => {
                const subtotal = Number(invoice.subtotal || 0);
                const hours = laborRate > 0 ? subtotal / laborRate : 0;
                return (
                  <div key={invoice.id} className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{record?.service_type ?? "Job"}</div>
                      <div className="text-xs text-muted-foreground">
                        Paid {invoice.paid_at ? new Date(invoice.paid_at).toLocaleDateString() : "—"} · ${subtotal.toFixed(2)} subtotal
                      </div>
                    </div>
                    <Badge variant="secondary">{hours.toFixed(2)} h</Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

/** Non-technician staff: shift clock in/out (no RO). */
const ShiftClock = ({ userId }: { userId: string }) => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [active, setActive] = useState<Shift | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("employee_shifts")
      .select("*").eq("user_id", userId)
      .order("clock_in", { ascending: false }).limit(20);
    const list = (data ?? []) as Shift[];
    setShifts(list);
    setActive(list.find((s) => !s.clock_out) ?? null);
    setLoading(false);
  };

  useEffect(() => { load(); }, [userId]);

  const clockIn = async () => {
    setBusy(true);
    const { error } = await supabase.from("employee_shifts").insert({
      user_id: userId,
      clock_in: new Date().toISOString(),
      notes: notes || null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Clocked in");
    setNotes("");
    load();
  };

  const clockOut = async () => {
    if (!active) return;
    setBusy(true);
    const out = new Date();
    const minutes = Math.max(0, Math.round((out.getTime() - new Date(active.clock_in).getTime()) / 60000));
    const { error } = await supabase.from("employee_shifts").update({
      clock_out: out.toISOString(),
      duration_minutes: minutes,
      notes: notes || active.notes,
    }).eq("id", active.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Clocked out");
    setNotes("");
    load();
  };

  return loading ? (
    <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
  ) : (
    <div className="space-y-4 max-w-2xl">
      <Card>
        <CardHeader><CardTitle>{active ? "On Shift" : "Start Shift"}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {active ? (
            <>
              <div className="text-sm">Started <strong>{new Date(active.clock_in).toLocaleString()}</strong></div>
              <div>
                <Label>Notes</Label>
                <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything to record about this shift?" />
              </div>
              <Button variant="hero" onClick={clockOut} disabled={busy} className="w-full">
                <Square className="h-4 w-4 mr-1" /> Clock Out
              </Button>
            </>
          ) : (
            <>
              <div>
                <Label>Notes (optional)</Label>
                <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <Button variant="hero" onClick={clockIn} disabled={busy} className="w-full">
                <Play className="h-4 w-4 mr-1" /> Clock In
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent Shifts</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {shifts.length === 0 && <p className="text-sm text-muted-foreground">No shifts yet.</p>}
          {shifts.map((s) => (
            <div key={s.id} className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0">
              <div>
                <div className="text-sm font-medium">{new Date(s.clock_in).toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">
                  {s.clock_out ? `→ ${new Date(s.clock_out).toLocaleTimeString()}` : "In progress"}
                </div>
              </div>
              {s.clock_out
                ? <Badge variant="secondary">{fmtDuration(s.duration_minutes)}</Badge>
                : <Badge className="bg-primary/15 text-primary">Active</Badge>}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

const TechClock = () => {
  const { user, roles, isLoading } = useAuth();
  const isTechnician = roles.includes("technician");

  return (
    <TechLayout>
      {isLoading || !user ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : isTechnician ? (
        <TechnicianPaySummary userId={user.id} />
      ) : (
        <ShiftClock userId={user.id} />
      )}
    </TechLayout>
  );
};

export default TechClock;
