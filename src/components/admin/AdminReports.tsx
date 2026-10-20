import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAdminRegion, RegionSwitch, RegionChip } from '@/hooks/useAdminRegion';
import { supabase } from '@/integrations/supabase/client';
import { techHoursForInvoice } from '@/lib/techHours';
import { isReportSale, reportInvoiceRevenue } from '@/lib/reportInvoice';
import { fullYearChart } from '@/lib/reportChart';
import { reportPeriod } from '@/lib/reportPeriod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, RefreshCw, Download, MoreHorizontal, TrendingUp, TrendingDown, Wallet, Receipt, Wrench, Package, ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

type Preset = 'd' | 'w' | 'm' | 'y' | 'custom';
type Granularity = 'day' | 'week' | 'month' | 'year';

const PRESET_DAYS: Record<Exclude<Preset, 'custom'>, number> = { d: 1, w: 7, m: 30, y: 365 };
const PRESET_GRAIN: Record<Exclude<Preset, 'custom'>, Granularity> = { d: 'day', w: 'day', m: 'week', y: 'month' };
const PRESET_LABEL: Record<Preset, string> = { d: 'Today', w: 'This Week', m: 'This Month', y: 'This Year', custom: 'Custom' };
const PREVIOUS_LABEL: Record<Preset, string> = { d: 'Yesterday', w: 'Previous Week', m: 'Previous Month', y: 'Previous Year', custom: 'Custom' };

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
  isRefund: boolean;
  invoice_number: string | null;
  date: string;
  createdAt: string;
  customer: string;
  technician: string;
  paidLaborHours: number;   // billed to customer on the estimate (also drives tech pay)
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

const itemKind = (li: LineItem) => String(li.kind ?? (Number(li.labor_hours ?? 0) > 0 ? 'labor' : 'part')).toLowerCase();

const laborHoursFromInvoice = (items: LineItem[], _fallbackRate: number, _fallbackSubtotal: number) => techHoursForInvoice(items);

export default function AdminReports() {
  const { region } = useAdminRegion();
  const R = (q: any) => (region === 'all' ? q : q.eq('region_slug', region));
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
  const [memberRows, setMemberRows] = useState<{
    id: string; paid_at: string; kind: string; amount: number; stripeFee: number;
    stripeFeeIsActual: boolean; member: string; plan: string;
  }[]>([]);
  const [defaultRate, setDefaultRate] = useState<number>(35);
  const [preset, setPreset] = useState<Preset>('m');
  const [previous, setPrevious] = useState(false);
  const [customDays, setCustomDays] = useState<number>(30);
  const days = preset === 'custom' ? customDays : PRESET_DAYS[preset];
  const periodLabel = (previous && preset !== 'custom' ? PREVIOUS_LABEL : PRESET_LABEL)[preset];
  const selectedPeriod = reportPeriod(preset, previous, days);
  const granularity: Granularity = preset === 'custom'
    ? (customDays <= 2 ? 'day' : customDays <= 31 ? 'week' : customDays <= 180 ? 'month' : 'year')
    : PRESET_GRAIN[preset];
  const [techFilter, setTechFilter] = useState<string>('all');

  const [syncing, setSyncing] = useState(false);
  const [prevRevenue, setPrevRevenue] = useState(0);

  const load = useCallback(async () => {
      const { start, end, comparisonStart } = reportPeriod(preset, previous, days);
      const since = start.toISOString();
      const until = end.toISOString();
      const prevSince = comparisonStart.toISOString();

      const [inv, completed, members, ests, settings, employeesRes, mpRes, prevInv] = await Promise.all([
        R(supabase
          .from('invoices'))
          .select('id, invoice_number, total, subtotal, status, created_at, paid_at, customer_id, service_record_id, technician_id, line_items, stripe_session_id, stripe_payment_intent_id, stripe_fee, stripe_fee_synced_at')
          .in('status', ['paid', 'refunded'])
          .gte('paid_at', since)
          .lt('paid_at', until)
          .order('paid_at', { ascending: false }),
        R(supabase.from('appointments').select('id', { count: 'exact', head: true })).eq('status', 'completed').gte('completed_at', since).lt('completed_at', until),
        supabase.from('memberships').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        R(supabase.from('estimates').select('id', { count: 'exact', head: true })).eq('status', 'sent'),
        supabase.from('shop_settings').select('labor_cost_per_hour').eq('id', 1).single(),
        supabase.from('employees' as any).select('id, user_id, full_name, hourly_rate, pay_basis').eq('is_active', true),
        supabase
          .from('membership_payments' as any)
          .select('id, paid_at, kind, amount, stripe_fee, stripe_fee_synced_at, customer_id, membership:memberships(plan:membership_plans(name))')
          .eq('status', 'paid')
          .gte('paid_at', since)
          .lt('paid_at', until)
          .order('paid_at', { ascending: false }),
        R(supabase.from('invoices').select('total, status')).in('status', ['paid', 'refunded']).gte('paid_at', prevSince).lt('paid_at', since),
      ]);
      setPrevRevenue(((prevInv.data ?? []) as any[]).reduce((s, i) => s + reportInvoiceRevenue(i), 0));

      const allInvoices = ((inv.data ?? []) as any[]).map((i) => ({ ...i, created_at: i.paid_at || i.created_at })) as InvoiceRow[];
      const paid = allInvoices;
      const revenue = paid.reduce((s, i) => s + reportInvoiceRevenue(i), 0);
      const sales = paid.filter(isReportSale);

      const configuredRate = Number((settings.data as any)?.labor_cost_per_hour);
      const rate = configuredRate > 0 ? configuredRate : 35;
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
      for (const i of sales) {
        const items = Array.isArray(i.line_items) ? i.line_items : [];
        for (const li of items) {
          const kind = itemKind(li);
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

      // Appointments → tech assignment. Paid labor (and tech pay) comes from invoice line items.
      const apptInfo = new Map<string, { tech: string | null }>();
      if (apptIds.length) {
        const { data: apData } = await supabase
          .from('appointments')
          .select('id, assigned_technician_id')
          .in('id', apptIds);
        (apData ?? []).forEach((a: any) => {
          apptInfo.set(a.id, { tech: a.assigned_technician_id });
        });
      }

      const reportTechIds = new Set<string>();
      paid.forEach((inv) => {
        const apptId = inv.service_record_id ? apptByService.get(inv.service_record_id) : undefined;
        const tid = inv.technician_id ?? (apptId ? apptInfo.get(apptId)?.tech : null);
        if (tid) reportTechIds.add(tid);
      });
      const missingProfileTechIds = Array.from(reportTechIds).filter((id) => !empByUser.has(id));
      const { data: techProfiles } = missingProfileTechIds.length
        ? await supabase.from('profiles').select('id, full_name, email').in('id', missingProfileTechIds)
        : { data: [] as any[] };
      const techProfileById = new Map<string, any>((techProfiles ?? []).map((p: any) => [p.id, p]));

      const rows: ProfitRow[] = paid.map((inv) => {
        const isRefund = inv.status === 'refunded';
        const items = !isRefund && Array.isArray(inv.line_items) ? inv.line_items : [];
        const cogs = items.reduce((s, li) => {
          const kind = itemKind(li);
          return kind === 'part' ? s + partCost(li) : s;
        }, 0);
        const apptId = inv.service_record_id ? apptByService.get(inv.service_record_id) : undefined;
        const info = apptId ? apptInfo.get(apptId) : undefined;
        const paidLaborHours = laborHoursFromInvoice(items, rate, Number(inv.subtotal || 0));
        // Prefer the tech assigned directly to the invoice (set when RO completes,
        // editable from Admin → Invoices), and fall back to the appointment.
        const techId = isRefund ? null : inv.technician_id ?? info?.tech ?? null;
        const tech = techId ? empByUser.get(techId) : null;
        const techProfile = techId ? techProfileById.get(techId) : null;
        const techRate = tech?.hourly_rate != null ? Number(tech.hourly_rate) : rate;
        // Pay technicians on PAID labor hours (from the estimate), not clocked time
        const employeeCost = paidLaborHours * techRate;
        const revenueRow = reportInvoiceRevenue(inv);
        const hasStripe = Boolean(inv.stripe_session_id || inv.stripe_payment_intent_id);
        const isPaid = inv.status === 'paid';
        const actualFee = isRefund ? 0 : inv.stripe_fee != null ? Number(inv.stripe_fee) : null;
        const stripeFee = actualFee != null
          ? actualFee
          : estimatedStripeFee(revenueRow, isPaid, hasStripe);
        const grossProfit = revenueRow - cogs;
        const netProfit = grossProfit - employeeCost - stripeFee;
        const cust = customerMap.get(inv.customer_id);
        return {
          id: inv.id,
          isRefund,
          invoice_number: inv.invoice_number,
          date: new Date(inv.created_at).toLocaleDateString(),
          createdAt: inv.created_at,
          customer: cust?.full_name || cust?.email || '—',
          technician: tech?.full_name ?? techProfile?.full_name ?? techProfile?.email ?? (techId ? 'Linked tech missing employee row' : '—'),
          paidLaborHours,
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

      // Membership payments
      const mpData = (mpRes.data ?? []) as any[];
      const memberCustIds = Array.from(new Set(mpData.map((r) => r.customer_id).filter(Boolean)));
      const newCustIds = memberCustIds.filter((id) => !customerMap.has(id));
      if (newCustIds.length) {
        const { data: extra } = await supabase.from('profiles').select('id, full_name, email').in('id', newCustIds);
        (extra ?? []).forEach((p: any) => customerMap.set(p.id, p));
      }
      const mRows = mpData.map((r) => {
        const cust = customerMap.get(r.customer_id);
        const amount = Number(r.amount || 0);
        const actualFee = r.stripe_fee != null ? Number(r.stripe_fee) : null;
        const fee = actualFee != null ? actualFee : estimatedStripeFee(amount, true, true);
        return {
          id: r.id,
          paid_at: r.paid_at,
          kind: r.kind,
          amount,
          stripeFee: fee,
          stripeFeeIsActual: actualFee != null,
          member: cust?.full_name || cust?.email || '—',
          plan: r.membership?.plan?.name || '—',
        };
      });
      setMemberRows(mRows);

      const totalLaborHrs = rows.reduce((s, r) => s + r.paidLaborHours, 0);

      setData({
        revenue30: revenue,
        invoiceCount: sales.length,
        aro: sales.length ? sales.reduce((s, i) => s + reportInvoiceRevenue(i), 0) / sales.length : 0,
        completedJobs: completed.count ?? 0,
        activeMembers: members.count ?? 0,
        pendingEstimates: ests.count ?? 0,
        techHours: Math.round(totalLaborHrs),
        partsRevenue,
        partsCost,
        partsMargin,
        partsMarginPct,
      });
  }, [days, preset, previous, region]);

  useEffect(() => { load(); }, [load]);

  // Keep totals live: reload whenever invoices, payments or jobs change, and on refocus
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    const kick = () => { clearTimeout(t); t = setTimeout(() => load(), 600); };
    const ch = supabase.channel('reports-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, kick)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoice_payments' }, kick)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, kick)
      .subscribe();
    const vis = () => { if (document.visibilityState === 'visible') kick(); };
    document.addEventListener('visibilitychange', vis);
    const iv = setInterval(kick, 60000);
    return () => { supabase.removeChannel(ch); document.removeEventListener('visibilitychange', vis); clearInterval(iv); clearTimeout(t); };
  }, [load]);

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
  const filteredSaleCount = filteredRows.filter((r) => !r.isRefund).length;
  const refundTotal = -filteredRows.filter((r) => r.isRefund).reduce((sum, r) => sum + r.revenue, 0);

  const perfTotals = useMemo(() => {
    const paidH = filteredRows.reduce((s, r) => s + r.paidLaborHours, 0);
    return { paidH };
  }, [filteredRows]);

  const membershipTotals = useMemo(() => {
    return memberRows.reduce(
      (acc, r) => {
        acc.revenue += r.amount;
        acc.stripeFee += r.stripeFee;
        if (r.kind === 'deposit') acc.deposits += r.amount;
        else acc.recurring += r.amount;
        return acc;
      },
      { revenue: 0, stripeFee: 0, deposits: 0, recurring: 0 },
    );
  }, [memberRows]);

  const totals = useMemo(() => {
    const base = filteredRows.reduce(
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
    // Membership revenue (no COGS / employee cost) only included when no tech filter is set
    if (techFilter === 'all') {
      base.revenue += membershipTotals.revenue;
      base.stripeFee += membershipTotals.stripeFee;
      base.grossProfit += membershipTotals.revenue;
      base.netProfit += membershipTotals.revenue - membershipTotals.stripeFee;
    }
    return base;
  }, [filteredRows, membershipTotals, techFilter]);

  // Group rows into time buckets for the summary view
  const bucketKey = (iso: string): { key: string; label: string; sortKey: string } => {
    const d = new Date(iso);
    if (granularity === 'day') {
      const k = d.toISOString().slice(0, 10);
      return { key: k, label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }), sortKey: k };
    }
    if (granularity === 'week') {
      const day = d.getDay();
      const monday = new Date(d);
      monday.setDate(d.getDate() - ((day + 6) % 7));
      monday.setHours(0, 0, 0, 0);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      const k = monday.toISOString().slice(0, 10);
      return {
        key: k,
        label: `${monday.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${sunday.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`,
        sortKey: k,
      };
    }
    if (granularity === 'month') {
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return { key: k, label: d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }), sortKey: k };
    }
    const k = String(d.getFullYear());
    return { key: k, label: k, sortKey: k };
  };

  type SummaryRow = {
    key: string;
    label: string;
    sortKey: string;
    invoices: number;
    paidLaborHours: number;
    revenue: number;
    cogs: number;
    grossProfit: number;
    employeeCost: number;
    stripeFee: number;
    netProfit: number;
  };

  const summaryRows: SummaryRow[] = useMemo(() => {
    const map = new Map<string, SummaryRow>();
    filteredRows.forEach((r) => {
      const iso = r.createdAt;
      const b = bucketKey(iso);
      const cur = map.get(b.key) ?? {
        key: b.key, label: b.label, sortKey: b.sortKey,
        invoices: 0, paidLaborHours: 0, revenue: 0, cogs: 0,
        grossProfit: 0, employeeCost: 0, stripeFee: 0, netProfit: 0,
      };
      cur.invoices += r.isRefund ? 0 : 1;
      cur.paidLaborHours += r.paidLaborHours;
      cur.revenue += r.revenue;
      cur.cogs += r.cogs;
      cur.grossProfit += r.grossProfit;
      cur.employeeCost += r.employeeCost;
      cur.stripeFee += r.stripeFee;
      cur.netProfit += r.netProfit;
      map.set(b.key, cur);
    });
    if (techFilter === 'all') {
      memberRows.forEach((r) => {
        const b = bucketKey(r.paid_at);
        const cur = map.get(b.key) ?? {
          key: b.key, label: b.label, sortKey: b.sortKey,
          invoices: 0, paidLaborHours: 0, revenue: 0, cogs: 0,
          grossProfit: 0, employeeCost: 0, stripeFee: 0, netProfit: 0,
        };
        cur.revenue += r.amount;
        cur.grossProfit += r.amount;
        cur.stripeFee += r.stripeFee;
        cur.netProfit += r.amount - r.stripeFee;
        map.set(b.key, cur);
      });
    }
    return Array.from(map.values()).sort((a, b) => b.sortKey.localeCompare(a.sortKey));
  }, [filteredRows, profitRows, memberRows, techFilter, granularity]);


  const margin = totals.revenue > 0 ? (totals.netProfit / totals.revenue) * 100 : 0;
  const change = prevRevenue > 0 ? ((data.revenue30 - prevRevenue) / prevRevenue) * 100 : null;
  const chartData = preset === 'y'
    ? fullYearChart(selectedPeriod.start.getFullYear(), summaryRows)
    : [...summaryRows].reverse().map((r) => ({ label: r.label, revenue: Math.round(r.revenue), profit: Math.round(r.netProfit) }));
  const exportCsv = () => {
    const head = ['Date', 'Invoice', 'Customer', 'Technician', 'Labor hrs', 'Revenue', 'Parts cost', 'Tech pay', 'Card fee', 'Net profit'];
    const lines = filteredRows.map((r) => [r.date, r.invoice_number ?? '', r.customer, r.technician, r.paidLaborHours.toFixed(2), r.revenue.toFixed(2), r.cogs.toFixed(2), r.employeeCost.toFixed(2), r.stripeFee.toFixed(2), r.netProfit.toFixed(2)]);
    memberRows.forEach((m) => lines.push([new Date(m.paid_at).toLocaleDateString(), 'Membership', m.member, '', '', m.amount.toFixed(2), '0', '0', m.stripeFee.toFixed(2), (m.amount - m.stripeFee).toFixed(2)]));
    const csv = [head, ...lines].map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `mmar-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };
  const share = (v: number) => (totals.revenue > 0 ? Math.min(100, Math.max(0, (v / totals.revenue) * 100)) : 0);
  const money = (v: number) => (Math.abs(v) >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${Math.round(v)}`);
  const neg = (v: number) => (v < 0 ? 'text-destructive' : '');

  return (
    <div className="space-y-5">
      <RegionSwitch />

      {/* Filter bar */}
      <div className="sticky top-0 z-20 -mx-2 px-2 py-2 bg-background/90 backdrop-blur border-b border-border space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <ToggleGroup type="single" value={preset} onValueChange={(v) => v && setPreset(v as Preset)} className="bg-muted rounded-lg p-0.5">
            {(['d', 'w', 'm', 'y', 'custom'] as Preset[]).map((p) => (
              <ToggleGroupItem key={p} value={p} className="h-8 px-3 text-xs data-[state=on]:bg-background data-[state=on]:text-foreground">
                {p === 'custom' ? 'Custom' : p.toUpperCase()}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          {preset !== 'custom' ? (
            <ToggleGroup type="single" value={previous ? 'previous' : 'current'} onValueChange={(v) => v && setPrevious(v === 'previous')} className="bg-muted rounded-lg p-0.5">
              <ToggleGroupItem value="current" className="h-8 px-3 text-xs data-[state=on]:bg-background data-[state=on]:text-foreground">Current</ToggleGroupItem>
              <ToggleGroupItem value="previous" className="h-8 px-3 text-xs data-[state=on]:bg-background data-[state=on]:text-foreground">Previous</ToggleGroupItem>
            </ToggleGroup>
          ) : (
            <div className="flex items-center gap-1">
              <Label className="text-xs text-muted-foreground">Days</Label>
              <Input type="number" value={customDays} onChange={(e) => setCustomDays(Math.max(1, parseInt(e.target.value) || 30))} className="w-20 h-8" />
            </div>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <Select value={techFilter} onValueChange={setTechFilter}>
              <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All technicians</SelectItem>
                {techOptions.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
              </SelectContent>
            </Select>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8" aria-label="More report actions"><MoreHorizontal className="h-4 w-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportCsv}><Download className="h-4 w-4 mr-2" /> Download for my books</DropdownMenuItem>
                <DropdownMenuItem disabled={syncing} onClick={() => syncStripeFees(false)}>
                  {syncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />} Sync Stripe fees
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Headline */}
      <Card className="overflow-hidden">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Revenue · {periodLabel}{preset === 'custom' ? ` · Last ${days} days` : ''}
              </p>
              <p className="font-display text-4xl md:text-5xl mt-1">{fmt(totals.revenue)}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Net profit <span className={`font-semibold text-foreground ${neg(totals.netProfit)}`}>{fmt(totals.netProfit)}</span> · {margin.toFixed(0)}% margin
              </p>
              {refundTotal > 0 && <p className="text-xs text-destructive mt-1">Refunds deducted: {fmt(refundTotal)}</p>}
            </div>
            {change != null && (
              <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${change >= 0 ? 'bg-primary/15 text-primary' : 'bg-destructive/15 text-destructive'}`}>
                {change >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                {Math.abs(change).toFixed(0)}% vs previous
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> Revenue</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-accent" /> Net profit</span>
          </div>
          <div className="h-56 md:h-72 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="profFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="label" interval={preset === 'y' ? 0 : 'preserveEnd'} tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tickFormatter={money} tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={44} />
                <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#revFill)" />
                <Area type="monotone" dataKey="profit" name="Net profit" stroke="hsl(var(--accent))" strokeWidth={2} fill="url(#profFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Grouped stats */}
      <div className="grid gap-4 lg:grid-cols-3">
        <StatGroup title="Money" icon={Wallet}>
          <Stat label="Gross profit" value={fmt(totals.grossProfit)} />
          <Stat label="Net profit" value={fmt(totals.netProfit)} tone={totals.netProfit < 0 ? 'bad' : 'good'} />
          <Stat label="Margin" value={`${margin.toFixed(0)}%`} />
          <Stat label="Memberships" value={fmt(membershipTotals.revenue)} />
        </StatGroup>
        <StatGroup title="Costs" icon={Receipt}>
          <Stat label="Parts" value={fmt(totals.cogs)} bar={share(totals.cogs)} />
          <Stat label="Tech pay" value={fmt(totals.employeeCost)} bar={share(totals.employeeCost)} />
          <Stat label="Card fees" value={fmt(totals.stripeFee)} bar={share(totals.stripeFee)} />
          <Stat label="Parts margin" value={`${data.partsMarginPct.toFixed(0)}%`} />
        </StatGroup>
        <StatGroup title="Work" icon={Wrench}>
          <Stat label="Jobs finished" value={String(data.completedJobs)} />
          <Stat label="Paid invoices" value={String(data.invoiceCount)} />
          <Stat label="Avg repair order" value={fmt(data.aro)} />
          <Stat label={`Labor hrs${techFilter !== 'all' ? ` · ${techFilter}` : ''}`} value={perfTotals.paidH.toFixed(1)} sub={`${filteredSaleCount ? (perfTotals.paidH / filteredSaleCount).toFixed(1) : '0'} per invoice`} />
        </StatGroup>
      </div>

      {/* Detail tabs */}
      <Tabs defaultValue="breakdown" className="w-full">
        <TabsList className="w-full grid grid-cols-4 h-10">
          <TabsTrigger value="breakdown" className="text-xs">Breakdown</TabsTrigger>
          <TabsTrigger value="invoices" className="text-xs">Invoices</TabsTrigger>
          <TabsTrigger value="members" className="text-xs">Members</TabsTrigger>
          <TabsTrigger value="parts" className="text-xs">Parts</TabsTrigger>
        </TabsList>

        <TabsContent value="breakdown" className="space-y-2 mt-3">
          <p className="text-xs text-muted-foreground">Paid sales and completed refunds by {granularity}.</p>
          {summaryRows.length === 0 ? <Empty text="No paid sales or completed refunds in this window." /> : (
            <>
              <div className="md:hidden space-y-2">
                {summaryRows.map((s) => (
                  <MobileRow key={s.key} title={s.label} sub={`${s.invoices} invoice${s.invoices === 1 ? '' : 's'} · ${s.paidLaborHours.toFixed(1)} hrs`} revenue={s.revenue} net={s.netProfit}
                    details={[['Parts', s.cogs], ['Gross profit', s.grossProfit], ['Tech pay', s.employeeCost], ['Card fees', s.stripeFee]]} />
                ))}
              </div>
              <Card className="hidden md:block"><CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Period</TableHead><TableHead className="text-right">Invoices</TableHead><TableHead className="text-right">Labor hrs</TableHead>
                    <TableHead className="text-right">Revenue</TableHead><TableHead className="text-right">Parts</TableHead><TableHead className="text-right">Gross</TableHead>
                    <TableHead className="text-right">Tech pay</TableHead><TableHead className="text-right">Card fees</TableHead><TableHead className="text-right">Net profit</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {summaryRows.map((s) => (
                      <TableRow key={s.key}>
                        <TableCell className="text-xs font-medium">{s.label}</TableCell>
                        <TableCell className="text-right">{s.invoices}</TableCell>
                        <TableCell className="text-right">{s.paidLaborHours.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{fmt(s.revenue)}</TableCell>
                        <TableCell className="text-right">{fmt(s.cogs)}</TableCell>
                        <TableCell className={`text-right ${neg(s.grossProfit)}`}>{fmt(s.grossProfit)}</TableCell>
                        <TableCell className="text-right">{fmt(s.employeeCost)}</TableCell>
                        <TableCell className="text-right">{fmt(s.stripeFee)}</TableCell>
                        <TableCell className={`text-right font-semibold ${s.netProfit < 0 ? 'text-destructive' : 'text-primary'}`}>{fmt(s.netProfit)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent></Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="invoices" className="space-y-2 mt-3">
          <p className="text-xs text-muted-foreground">
            Net profit = revenue − parts − tech pay (paid labor hours × rate, default ${defaultRate.toFixed(2)}/hr) − card fees (actual when synced, else 2.9% + $0.30, marked ~).
          </p>
          {filteredRows.length === 0 ? <Empty text={profitRows.length === 0 ? 'No paid sales or completed refunds in this window.' : 'No invoices for this technician.'} /> : (
            <>
              <div className="md:hidden space-y-2">
                {filteredRows.map((r) => (
                  <MobileRow key={r.id} title={r.customer} sub={`${r.date} · ${r.invoice_number ?? r.id.slice(0, 8)}`} badge={r.isRefund ? 'Refund' : undefined} revenue={r.revenue} net={r.netProfit}
                    details={[['Technician', r.technician], ['Labor hrs', r.paidLaborHours.toFixed(2)], ['Parts', r.cogs], ['Gross profit', r.grossProfit], ['Tech pay', r.employeeCost], [`Card fee${r.stripeFeeIsActual ? '' : ' ~'}`, r.stripeFee]]} />
                ))}
              </div>
              <Card className="hidden md:block"><CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Invoice</TableHead><TableHead>Date</TableHead><TableHead>Customer</TableHead><TableHead>Technician</TableHead>
                    <TableHead className="text-right">Labor hrs</TableHead><TableHead className="text-right">Revenue</TableHead><TableHead className="text-right">Parts</TableHead>
                    <TableHead className="text-right">Gross</TableHead><TableHead className="text-right">Tech pay</TableHead><TableHead className="text-right">Card fees</TableHead><TableHead className="text-right">Net profit</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {filteredRows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-xs">{r.invoice_number ?? r.id.slice(0, 8)}{r.isRefund && <span className="block text-destructive">Refund completed</span>}</TableCell>
                        <TableCell className="text-xs">{r.date}</TableCell>
                        <TableCell className="text-xs">{r.customer}</TableCell>
                        <TableCell className="text-xs">{r.technician}</TableCell>
                        <TableCell className="text-right">{r.paidLaborHours.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{fmt(r.revenue)}</TableCell>
                        <TableCell className="text-right">{fmt(r.cogs)}</TableCell>
                        <TableCell className={`text-right ${neg(r.grossProfit)}`}>{fmt(r.grossProfit)}</TableCell>
                        <TableCell className="text-right">{fmt(r.employeeCost)}</TableCell>
                        <TableCell className="text-right" title={r.stripeFeeIsActual ? 'Actual fee from Stripe' : 'Estimated (not yet synced)'}>
                          {fmt(r.stripeFee)}{!r.stripeFeeIsActual && r.stripeFee > 0 && <span className="text-muted-foreground ml-1">~</span>}
                        </TableCell>
                        <TableCell className={`text-right font-semibold ${r.netProfit < 0 ? 'text-destructive' : 'text-primary'}`}>{fmt(r.netProfit)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent></Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="members" className="space-y-2 mt-3">
          <p className="text-xs text-muted-foreground">One row per membership charge (deposits and monthly).</p>
          {memberRows.length === 0 ? <Empty text="No membership payments in this window." /> : (
            <div className="space-y-2">
              {memberRows.map((r) => (
                <Card key={r.id}><CardContent className="p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{r.member}</p>
                    <p className="text-xs text-muted-foreground">{new Date(r.paid_at).toLocaleDateString()} · {r.plan} · <span className="capitalize">{r.kind}</span></p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-primary">{fmt(r.amount - r.stripeFee)}</p>
                    <p className="text-xs text-muted-foreground">{fmt(r.amount)} − {fmt(r.stripeFee)}{!r.stripeFeeIsActual && r.stripeFee > 0 ? ' ~' : ''}</p>
                  </div>
                </CardContent></Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="parts" className="space-y-3 mt-3">
          <p className="text-xs text-muted-foreground">
            Paid invoices only. Imported PDF quote costs are recovered by dividing the price by 1.30 (30% markup); manual parts count only when a unit cost is set.
          </p>
          <StatGroup title="Parts profitability" icon={Package}>
            <Stat label="Parts revenue" value={fmt(data.partsRevenue)} />
            <Stat label="Parts cost" value={fmt(data.partsCost)} />
            <Stat label="Gross margin" value={fmt(data.partsMargin)} tone="good" />
            <Stat label="Margin %" value={data.partsMarginPct.toFixed(1) + '%'} />
          </StatGroup>
        </TabsContent>
      </Tabs>
    </div>
  );
}

const StatGroup = ({ title, icon: Icon, children }: { title: string; icon: typeof Wallet; children: React.ReactNode }) => (
  <Card>
    <CardContent className="p-4 space-y-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/15 text-primary"><Icon className="h-3.5 w-3.5" /></span>
        {title}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">{children}</div>
    </CardContent>
  </Card>
);

const Stat = ({ label, value, sub, bar, tone }: { label: string; value: string; sub?: string; bar?: number; tone?: 'good' | 'bad' }) => (
  <div className="min-w-0">
    <p className="text-[11px] text-muted-foreground truncate">{label}</p>
    <p className={`text-lg font-semibold leading-tight ${tone === 'good' ? 'text-primary' : tone === 'bad' ? 'text-destructive' : ''}`}>{value}</p>
    {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    {bar != null && (
      <div className="mt-1 h-1 rounded-full bg-muted overflow-hidden"><div className="h-full bg-accent" style={{ width: `${bar}%` }} /></div>
    )}
  </div>
);

const Empty = ({ text }: { text: string }) => (
  <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">{text}</CardContent></Card>
);

const MobileRow = ({ title, sub, badge, revenue, net, details }: { title: string; sub: string; badge?: string; revenue: number; net: number; details: [string, number | string][] }) => {
  const [open, setOpen] = useState(false);
  return (
    <Card>
      <button type="button" className="w-full text-left p-3" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{title}{badge && <span className="ml-2 text-xs text-destructive">{badge}</span>}</p>
            <p className="text-xs text-muted-foreground truncate">{sub}</p>
          </div>
          <div className="text-right shrink-0 flex items-center gap-2">
            <div>
              <p className="text-sm font-semibold">{fmtUsd(revenue)}</p>
              <p className={`text-xs ${net < 0 ? 'text-destructive' : 'text-primary'}`}>net {fmtUsd(net)}</p>
            </div>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
          </div>
        </div>
        {open && (
          <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 gap-2">
            {details.map(([k, v]) => (
              <div key={k}>
                <p className="text-[11px] text-muted-foreground">{k}</p>
                <p className="text-sm">{typeof v === 'number' ? fmtUsd(v) : v}</p>
              </div>
            ))}
          </div>
        )}
      </button>
    </Card>
  );
};
const fmtUsd = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
