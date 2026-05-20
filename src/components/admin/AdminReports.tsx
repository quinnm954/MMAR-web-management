import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, RefreshCw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type LineItem = { quantity?: number; unit_price?: number; unit_cost?: number; amount?: number; kind?: string; labor_hours?: number };

type InvoiceRow = {
  id: string;
  invoice_number: string | null;
  total: number;
  subtotal: number;
  status: string;
  created_at: string;
  customer_id: string;
  service_record_id: string | null;
  technician_id: string | null;
  line_items: LineItem[];
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_fee: number | null;
  stripe_fee_synced_at: string | null;
};

type ProfitRow = {
  id: string;
  invoice_number: string | null;
  date: string;
  customer: string;
  technician: string;
  paidLaborHours: number;   // billed to customer on the estimate
  clockedHours: number;     // actual time clocked by tech (performance)
  varianceHours: number;    // clocked - paid (positive = over paid time)
  revenue: number;
  cogs: number;
  employeeCost: number;
  stripeFee: number;
  stripeFeeIsActual: boolean;
  grossProfit: number;
  netProfit: number;
};

// Estimated fallback when actual Stripe fee hasn't been synced yet (US card: 2.9% + $0.30)
const estimatedStripeFee = (amount: number, paid: boolean, hasStripe: boolean) => {
  if (!paid || !hasStripe || amount <= 0) return 0;
  return amount * 0.029 + 0.3;
};

const itemAmount = (li: LineItem) => {
  const qty = Number(li.quantity ?? 1);
  const price = Number(li.unit_price ?? 0);
  return Number(li.amount ?? qty * price) || 0;
};

const partCost = (li: LineItem) => {
  const qty = Number(li.quantity ?? 1);
  return (Number(li.unit_cost ?? 0) || 0) * qty;
};

const laborHoursFromInvoice = (items: LineItem[], fallbackRate: number, fallbackSubtotal: number) => {
  const hours = items.reduce((sum, li) => {
    const kind = String(li.kind ?? 'part').toLowerCase();
    if (kind !== 'labor' && !(kind !== 'part' && Number(li.labor_hours) > 0)) return sum;
    const explicit = Number(li.labor_hours ?? 0);
    if (explicit > 0) return sum + explicit;
    const qty = Number(li.quantity ?? 0);
    if (qty > 0 && kind === 'labor') return sum + qty;
    const unit = Number(li.unit_price ?? 0);
    const amount = itemAmount(li);
    return sum + (unit > 0 ? amount / unit : 0);
  }, 0);
  return hours > 0 ? hours : (fallbackRate > 0 && fallbackSubtotal > 0 ? fallbackSubtotal / fallbackRate : 0);
};

export default function AdminReports() {
  const [data, setData] = useState({
    revenue30: 0,
    invoiceCount: 0,
    aro: 0,
    completedJobs: 0,
    activeMembers: 0,
    pendingEstimates: 0,
    techHours: 0,
    partsRevenue: 0,
    partsCost: 0,
    partsMargin: 0,
    partsMarginPct: 0,
  });

  const [profitRows, setProfitRows] = useState<ProfitRow[]>([]);
  const [defaultRate, setDefaultRate] = useState<number>(35);
  const [days, setDays] = useState<number>(30);
  const [techFilter, setTechFilter] = useState<string>('all');

  const [syncing, setSyncing] = useState(false);

  const load = useCallback(async () => {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      const [inv, completed, members, ests, settings, employeesRes] = await Promise.all([
        supabase
          .from('invoices')
          .select('id, invoice_number, total, subtotal, status, created_at, customer_id, service_record_id, technician_id, line_items, stripe_session_id, stripe_payment_intent_id, stripe_fee, stripe_fee_synced_at')
          .gte('created_at', since)
          .order('created_at', { ascending: false }),
        supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('status', 'completed').gte('created_at', since),
        supabase.from('memberships').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('estimates').select('id', { count: 'exact', head: true }).eq('status', 'sent'),
        supabase.from('shop_settings').select('labor_cost_per_hour').eq('id', 1).single(),
        supabase.from('employees' as any).select('id, user_id, full_name, hourly_rate, pay_basis').eq('is_active', true),
      ]);

      const allInvoices = ((inv.data ?? []) as any[]) as InvoiceRow[];
      const paid = allInvoices.filter((i) => i.status === 'paid');
      const revenue = paid.reduce((s, i) => s + Number(i.total || 0), 0);

      const rate = Number((settings.data as any)?.labor_cost_per_hour ?? 35);
      setDefaultRate(rate);

      // Employee map by user_id
      const employees = (employeesRes.data ?? []) as any[];
      // Key by both auth user_id AND employees.id so we resolve the tech regardless
      // of which identifier the appointment/time entry stored.
      const empByUser = new Map<string, any>();
      employees.forEach((e) => {
        if (e.user_id) empByUser.set(e.user_id, e);
        if (e.id) empByUser.set(e.id, e);
      });

      // Parts revenue/cost. Missing `kind` defaults to 'part' (matches invoice trigger),
      // and we count revenue even if unit_cost is 0 so margin reflects reality.
      let partsRevenue = 0;
      let partsCost = 0;
      for (const i of paid) {
        const items = Array.isArray(i.line_items) ? i.line_items : [];
        for (const li of items) {
          const kind = String(li.kind ?? 'part').toLowerCase();
          if (kind !== 'part') continue;
          partsRevenue += itemAmount(li);
          partsCost += partCost(li);
        }
      }
      const partsMargin = partsRevenue - partsCost;
      const partsMarginPct = partsRevenue > 0 ? (partsMargin / partsRevenue) * 100 : 0;

      const customerIds = Array.from(new Set(paid.map((p) => p.customer_id).filter(Boolean)));
      const serviceIds = paid.map((p) => p.service_record_id).filter(Boolean) as string[];

      const [profilesRes, srRes] = await Promise.all([
        customerIds.length
          ? supabase.from('profiles').select('id, full_name, email').in('id', customerIds)
          : Promise.resolve({ data: [] as any[] }),
        serviceIds.length
          ? supabase.from('service_records').select('id, appointment_id').in('id', serviceIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);
      const customerMap = new Map<string, any>((profilesRes.data ?? []).map((p: any) => [p.id, p]));
      const apptByService = new Map<string, string>(
        (srRes.data ?? []).map((r: any) => [r.id, r.appointment_id]),
      );
      const apptIds = Array.from(new Set(Array.from(apptByService.values()).filter(Boolean))) as string[];

      // Appointments → tech assignment and clocked hours. Paid labor comes from invoice line items.
      const apptInfo = new Map<string, { tech: string | null; clockedHours: number }>();
      if (apptIds.length) {
        const [apRes, teRes] = await Promise.all([
          supabase.from('appointments').select('id, assigned_technician_id').in('id', apptIds),
          supabase.from('time_entries').select('appointment_id, duration_minutes, technician_id').in('appointment_id', apptIds),
        ]);
        (apRes.data ?? []).forEach((a: any) => {
          apptInfo.set(a.id, { tech: a.assigned_technician_id, clockedHours: 0 });
        });
        // Sum clocked time per appointment (performance only)
        (teRes.data ?? []).forEach((t: any) => {
          const cur = apptInfo.get(t.appointment_id) ?? { tech: null, clockedHours: 0 };
          cur.clockedHours += Number(t.duration_minutes || 0) / 60;
          // Fall back to clocked tech only if no assigned tech on the RO
          if (!cur.tech) cur.tech = t.technician_id;
          apptInfo.set(t.appointment_id, cur);
        });
      }

      const rows: ProfitRow[] = paid.map((inv) => {
        const items = Array.isArray(inv.line_items) ? inv.line_items : [];
        const cogs = items.reduce((s, li) => {
          const qty = Number(li.quantity ?? 1);
          const cost = Number(li.unit_cost ?? 0);
          return s + qty * cost;
        }, 0);
        const apptId = inv.service_record_id ? apptByService.get(inv.service_record_id) : undefined;
        const info = apptId ? apptInfo.get(apptId) : undefined;
        const paidLaborHours = info?.paidHours ?? 0;
        const clockedHours = info?.clockedHours ?? 0;
        const varianceHours = clockedHours - paidLaborHours;
        // Prefer the tech assigned directly to the invoice (set when RO completes,
        // editable from Admin → Invoices), and fall back to the appointment.
        const techId = (inv as any).technician_id ?? info?.tech ?? null;
        const tech = techId ? empByUser.get(techId) : null;
        const techRate = tech?.hourly_rate != null ? Number(tech.hourly_rate) : rate;
        // Pay technicians on PAID labor hours (from the estimate), not clocked time
        const employeeCost = paidLaborHours * techRate;
        const revenueRow = Number(inv.total || 0);
        const hasStripe = Boolean(inv.stripe_session_id || inv.stripe_payment_intent_id);
        const isPaid = inv.status === 'paid';
        const actualFee = inv.stripe_fee != null ? Number(inv.stripe_fee) : null;
        const stripeFee = actualFee != null
          ? actualFee
          : estimatedStripeFee(revenueRow, isPaid, hasStripe);
        const grossProfit = revenueRow - cogs;
        const netProfit = grossProfit - employeeCost - stripeFee;
        const cust = customerMap.get(inv.customer_id);
        return {
          id: inv.id,
          invoice_number: inv.invoice_number,
          date: new Date(inv.created_at).toLocaleDateString(),
          customer: cust?.full_name || cust?.email || '—',
          technician: tech?.full_name ?? (techId ? 'Unassigned employee' : '—'),
          paidLaborHours,
          clockedHours,
          varianceHours,
          revenue: revenueRow,
          cogs,
          employeeCost,
          stripeFee,
          stripeFeeIsActual: actualFee != null,
          grossProfit,
          netProfit,
        };
      });
      setProfitRows(rows);

      const totalLaborHrs = rows.reduce((s, r) => s + r.paidLaborHours, 0);

      setData({
        revenue30: revenue,
        invoiceCount: paid.length,
        aro: paid.length ? revenue / paid.length : 0,
        completedJobs: completed.count ?? 0,
        activeMembers: members.count ?? 0,
        pendingEstimates: ests.count ?? 0,
        techHours: Math.round(totalLaborHrs),
        partsRevenue,
        partsCost,
        partsMargin,
        partsMarginPct,
      });
  }, [days]);

  useEffect(() => { load(); }, [load]);

  const syncStripeFees = async (force = false) => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-stripe-fees', {
        body: { days: Math.max(days, 90), force },
      });
      if (error) throw error;
      const d = data as { synced: number; skipped: number; scanned: number };
      toast.success(`Synced ${d.synced} of ${d.scanned} invoices${d.skipped ? ` (${d.skipped} skipped)` : ''}`);
      await load();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to sync Stripe fees');
    } finally {
      setSyncing(false);
    }
  };

  const fmt = (n: number) =>
    '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const techOptions = useMemo(() => {
    const set = new Set<string>();
    profitRows.forEach((r) => { if (r.technician && r.technician !== '—') set.add(r.technician); });
    return Array.from(set).sort();
  }, [profitRows]);

  const filteredRows = useMemo(
    () => (techFilter === 'all' ? profitRows : profitRows.filter((r) => r.technician === techFilter)),
    [profitRows, techFilter],
  );

  const perfTotals = useMemo(() => {
    const paidH = filteredRows.reduce((s, r) => s + r.paidLaborHours, 0);
    const clockedH = filteredRows.reduce((s, r) => s + r.clockedHours, 0);
    return { paidH, clockedH, variance: clockedH - paidH };
  }, [filteredRows]);

  const totals = useMemo(() => {
    return filteredRows.reduce(
      (acc, r) => {
        acc.revenue += r.revenue;
        acc.cogs += r.cogs;
        acc.employeeCost += r.employeeCost;
        acc.stripeFee += r.stripeFee;
        acc.grossProfit += r.grossProfit;
        acc.netProfit += r.netProfit;
        return acc;
      },
      { revenue: 0, cogs: 0, employeeCost: 0, stripeFee: 0, grossProfit: 0, netProfit: 0 },
    );
  }, [filteredRows]);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <h2 className="font-display text-xl">Last {days} Days</h2>
        <div className="flex items-end gap-2">
          <div>
            <Label className="text-xs">Window (days)</Label>
            <Input
              type="number"
              value={days}
              onChange={(e) => setDays(Math.max(1, parseInt(e.target.value) || 30))}
              className="w-24 h-9"
            />
          </div>
          <div>
            <Label className="text-xs">Technician</Label>
            <Select value={techFilter} onValueChange={setTechFilter}>
              <SelectTrigger className="w-48 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All technicians</SelectItem>
                {techOptions.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={syncing}
            onClick={() => syncStripeFees(false)}
            title="Pull actual Stripe processing fees for paid invoices"
          >
            {syncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Sync Stripe fees
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label="Revenue" value={fmt(data.revenue30)} />
        <KPI label="Avg Repair Order" value={fmt(data.aro)} />
        <KPI label="Paid Invoices" value={String(data.invoiceCount)} />
        <KPI label="Completed Jobs" value={String(data.completedJobs)} />
        <KPI label="Active Memberships" value={String(data.activeMembers)} />
        <KPI label="Pending Estimates" value={String(data.pendingEstimates)} />
        <KPI label="Billable Labor Hrs" value={String(data.techHours)} />
      </div>

      <h2 className="font-display text-xl pt-2">Profit by Invoice (paid)</h2>
      <p className="text-xs text-muted-foreground -mt-2">
        Gross profit = gross revenue − cost of goods. Net profit = gross profit − cost of employees − Stripe fees.
        Technician is taken from the repair order assignment and carried through to the paid invoice. Employee cost
        uses each technician's per-employee hourly rate from the Employees tab × <strong>paid labor hours</strong>{' '}
        (from the estimate) — not clocked time. Default rate ${defaultRate.toFixed(2)}/hr is used when no employee
        record exists. Clocked hours and the variance column are for performance tracking only: positive variance
        means the tech ran <strong>over paid labor time</strong>; negative means <strong>under paid labor time</strong>.
        Stripe fees use the actual amount Stripe charged per payment when synced; otherwise an estimate of
        2.9% + $0.30 is used as a fallback.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <KPI label="Gross Revenue" value={fmt(totals.revenue)} />
        <KPI label="Cost of Goods" value={fmt(totals.cogs)} />
        <KPI label="Gross Profit" value={fmt(totals.grossProfit)} />
        <KPI label="Cost of Employees" value={fmt(totals.employeeCost)} />
        <KPI label="Stripe Fees" value={fmt(totals.stripeFee)} />
        <KPI label="Net Profit" value={fmt(totals.netProfit)} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <KPI label={`Paid Labor Hrs${techFilter !== 'all' ? ` · ${techFilter}` : ''}`} value={perfTotals.paidH.toFixed(2)} />
        <KPI label="Clocked Hrs" value={perfTotals.clockedH.toFixed(2)} />
        <KPI
          label={perfTotals.variance > 0 ? 'Over Paid Time' : perfTotals.variance < 0 ? 'Under Paid Time' : 'On Target'}
          value={`${perfTotals.variance > 0 ? '+' : ''}${perfTotals.variance.toFixed(2)} hrs`}
        />
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Technician</TableHead>
                <TableHead className="text-right">Paid Labor (hrs)</TableHead>
                <TableHead className="text-right">Clocked (hrs)</TableHead>
                <TableHead className="text-right">Variance</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">COGS</TableHead>
                <TableHead className="text-right">Gross Profit</TableHead>
                <TableHead className="text-right">Employee Cost</TableHead>
                <TableHead className="text-right">Stripe Fees</TableHead>
                <TableHead className="text-right">Net Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={13} className="text-center text-muted-foreground py-6">
                    {profitRows.length === 0 ? 'No paid invoices in this window.' : 'No invoices for this technician.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.invoice_number ?? r.id.slice(0, 8)}</TableCell>
                    <TableCell className="text-xs">{r.date}</TableCell>
                    <TableCell className="text-xs">{r.customer}</TableCell>
                    <TableCell className="text-xs">{r.technician}</TableCell>
                    <TableCell className="text-right">{r.paidLaborHours.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{r.clockedHours.toFixed(2)}</TableCell>
                    <TableCell className={`text-right font-medium ${r.varianceHours > 0 ? 'text-destructive' : r.varianceHours < 0 ? 'text-primary' : 'text-muted-foreground'}`} title={r.varianceHours > 0 ? 'Tech took longer than billed (over paid time)' : r.varianceHours < 0 ? 'Tech finished faster than billed (under paid time)' : 'On target'}>
                      {r.varianceHours > 0 ? '+' : ''}{r.varianceHours.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">{fmt(r.revenue)}</TableCell>
                    <TableCell className="text-right">{fmt(r.cogs)}</TableCell>
                    <TableCell className={`text-right ${r.grossProfit < 0 ? 'text-destructive' : ''}`}>
                      {fmt(r.grossProfit)}
                    </TableCell>
                    <TableCell className="text-right">{fmt(r.employeeCost)}</TableCell>
                    <TableCell className="text-right" title={r.stripeFeeIsActual ? 'Actual fee from Stripe' : 'Estimated (not yet synced)'}>
                      {fmt(r.stripeFee)}
                      {!r.stripeFeeIsActual && r.stripeFee > 0 && <span className="text-muted-foreground ml-1">~</span>}
                    </TableCell>
                    <TableCell className={`text-right font-semibold ${r.netProfit < 0 ? 'text-destructive' : 'text-primary'}`}>
                      {fmt(r.netProfit)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <h2 className="font-display text-xl pt-2">Parts Profitability (paid invoices)</h2>
      <p className="text-xs text-muted-foreground -mt-2">
        Cost is recovered from imported PDF quotes by dividing the marked-up price by 1.30 (30% markup). Manually entered
        parts contribute only when a unit cost is set.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label="Parts Revenue" value={fmt(data.partsRevenue)} />
        <KPI label="Parts Cost" value={fmt(data.partsCost)} />
        <KPI label="Parts Gross Margin" value={fmt(data.partsMargin)} />
        <KPI label="Parts Margin %" value={data.partsMarginPct.toFixed(1) + '%'} />
      </div>
    </div>
  );
}

const KPI = ({ label, value }: { label: string; value: string }) => (
  <Card>
    <CardHeader className="pb-1">
      <CardTitle className="text-xs text-muted-foreground font-normal">{label}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);
