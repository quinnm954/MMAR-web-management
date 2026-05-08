import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  line_items: LineItem[];
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
};

type ProfitRow = {
  id: string;
  invoice_number: string | null;
  date: string;
  customer: string;
  technician: string;
  laborHours: number;
  revenue: number;
  cogs: number;
  employeeCost: number;
  stripeFee: number;
  grossProfit: number;
  netProfit: number;
};

// Stripe US standard card fee: 2.9% + $0.30 per successful charge
const stripeFeeFor = (amount: number, paid: boolean, hasStripe: boolean) => {
  if (!paid || !hasStripe || amount <= 0) return 0;
  return amount * 0.029 + 0.3;
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

  useEffect(() => {
    (async () => {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      const [inv, completed, members, ests, settings, employeesRes] = await Promise.all([
        supabase
          .from('invoices')
          .select('id, invoice_number, total, subtotal, status, created_at, customer_id, service_record_id, line_items, stripe_session_id, stripe_payment_intent_id')
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
      const empByUser = new Map<string, any>();
      employees.forEach((e) => { if (e.user_id) empByUser.set(e.user_id, e); });

      // Parts revenue/cost
      let partsRevenue = 0;
      let partsCost = 0;
      for (const i of paid) {
        const items = Array.isArray(i.line_items) ? i.line_items : [];
        for (const li of items) {
          if (li.kind !== 'part') continue;
          const qty = Number(li.quantity ?? 1);
          const price = Number(li.unit_price ?? 0);
          const cost = Number(li.unit_cost ?? 0);
          if (cost > 0) {
            partsRevenue += qty * price;
            partsCost += qty * cost;
          }
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

      // Appointments → tech assignment + estimate labor hours
      const apptInfo = new Map<string, { tech: string | null; laborHours: number }>();
      if (apptIds.length) {
        const [apRes, estRes, teRes] = await Promise.all([
          supabase.from('appointments').select('id, assigned_technician_id').in('id', apptIds),
          supabase.from('estimates').select('appointment_id, line_items').in('appointment_id', apptIds),
          supabase.from('time_entries').select('appointment_id, duration_minutes, technician_id').in('appointment_id', apptIds),
        ]);
        (apRes.data ?? []).forEach((a: any) => {
          apptInfo.set(a.id, { tech: a.assigned_technician_id, laborHours: 0 });
        });
        // Sum labor_hours from estimates per appointment
        (estRes.data ?? []).forEach((e: any) => {
          const items = Array.isArray(e.line_items) ? e.line_items : [];
          const hrs = items.reduce((s: number, li: any) => s + (Number(li.labor_hours) || 0), 0);
          const cur = apptInfo.get(e.appointment_id) ?? { tech: null, laborHours: 0 };
          cur.laborHours += hrs;
          apptInfo.set(e.appointment_id, cur);
        });
        // Fallback to clock time when estimate has no labor_hours
        const clockByAppt = new Map<string, { minutes: number; tech: string | null }>();
        (teRes.data ?? []).forEach((t: any) => {
          const cur = clockByAppt.get(t.appointment_id) ?? { minutes: 0, tech: null };
          cur.minutes += Number(t.duration_minutes || 0);
          if (!cur.tech) cur.tech = t.technician_id;
          clockByAppt.set(t.appointment_id, cur);
        });
        clockByAppt.forEach((v, k) => {
          const cur = apptInfo.get(k) ?? { tech: null, laborHours: 0 };
          if (cur.laborHours === 0) cur.laborHours = v.minutes / 60;
          if (!cur.tech) cur.tech = v.tech;
          apptInfo.set(k, cur);
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
        const laborHours = info?.laborHours ?? 0;
        const tech = info?.tech ? empByUser.get(info.tech) : null;
        const techRate = tech?.hourly_rate != null ? Number(tech.hourly_rate) : rate;
        const employeeCost = laborHours * techRate;
        const revenueRow = Number(inv.total || 0);
        const hasStripe = Boolean(inv.stripe_session_id || inv.stripe_payment_intent_id);
        const stripeFee = stripeFeeFor(revenueRow, inv.status === 'paid', hasStripe);
        const grossProfit = revenueRow - cogs;
        const netProfit = grossProfit - employeeCost - stripeFee;
        const cust = customerMap.get(inv.customer_id);
        return {
          id: inv.id,
          invoice_number: inv.invoice_number,
          date: new Date(inv.created_at).toLocaleDateString(),
          customer: cust?.full_name || cust?.email || '—',
          technician: tech?.full_name ?? (info?.tech ? 'Unassigned employee' : '—'),
          laborHours,
          revenue: revenueRow,
          cogs,
          employeeCost,
          stripeFee,
          grossProfit,
          netProfit,
        };
      });
      setProfitRows(rows);

      const totalLaborHrs = rows.reduce((s, r) => s + r.laborHours, 0);

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
    })();
  }, [days]);

  const fmt = (n: number) =>
    '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const totals = useMemo(() => {
    return profitRows.reduce(
      (acc, r) => {
        acc.revenue += r.revenue;
        acc.cogs += r.cogs;
        acc.employeeCost += r.employeeCost;
        acc.grossProfit += r.grossProfit;
        acc.netProfit += r.netProfit;
        return acc;
      },
      { revenue: 0, cogs: 0, employeeCost: 0, grossProfit: 0, netProfit: 0 },
    );
  }, [profitRows]);

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
        Gross profit = gross revenue − cost of goods. Net profit = gross profit − cost of employees. Employee cost uses each
        technician's per-employee hourly rate from the Employees tab × labor hours billed on the estimate. Falls back to
        clock time and the default rate (${defaultRate.toFixed(2)}/hr) when no employee record exists.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KPI label="Gross Revenue" value={fmt(totals.revenue)} />
        <KPI label="Cost of Goods" value={fmt(totals.cogs)} />
        <KPI label="Gross Profit" value={fmt(totals.grossProfit)} />
        <KPI label="Cost of Employees" value={fmt(totals.employeeCost)} />
        <KPI label="Net Profit" value={fmt(totals.netProfit)} />
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
                <TableHead className="text-right">Labor (hrs)</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">COGS</TableHead>
                <TableHead className="text-right">Employee Cost</TableHead>
                <TableHead className="text-right">Gross Profit</TableHead>
                <TableHead className="text-right">Net Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profitRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground py-6">
                    No paid invoices in this window.
                  </TableCell>
                </TableRow>
              ) : (
                profitRows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.invoice_number ?? r.id.slice(0, 8)}</TableCell>
                    <TableCell className="text-xs">{r.date}</TableCell>
                    <TableCell className="text-xs">{r.customer}</TableCell>
                    <TableCell className="text-xs">{r.technician}</TableCell>
                    <TableCell className="text-right">{r.laborHours.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{fmt(r.revenue)}</TableCell>
                    <TableCell className="text-right">{fmt(r.cogs)}</TableCell>
                    <TableCell className="text-right">{fmt(r.employeeCost)}</TableCell>
                    <TableCell className={`text-right ${r.grossProfit < 0 ? 'text-destructive' : ''}`}>
                      {fmt(r.grossProfit)}
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
