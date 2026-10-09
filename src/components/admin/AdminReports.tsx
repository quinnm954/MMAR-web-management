import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { techHoursForInvoice } from '@/lib/techHours';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, RefreshCw, Download } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

type Preset = 'd' | 'w' | 'm' | 'y' | 'custom';
type Granularity = 'day' | 'week' | 'month' | 'year';

const PRESET_DAYS: Record<Exclude<Preset, 'custom'>, number> = { d: 1, w: 7, m: 30, y: 365 };
const PRESET_GRAIN: Record<Exclude<Preset, 'custom'>, Granularity> = { d: 'day', w: 'day', m: 'week', y: 'month' };
const PRESET_LABEL: Record<Preset, string> = { d: 'Today', w: 'This Week', m: 'This Month', y: 'This Year', custom: 'Custom' };

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
  const [customDays, setCustomDays] = useState<number>(30);
  const days = preset === 'custom' ? customDays : PRESET_DAYS[preset];
  const granularity: Granularity = preset === 'custom'
    ? (customDays <= 2 ? 'day' : customDays <= 31 ? 'week' : customDays <= 180 ? 'month' : 'year')
    : PRESET_GRAIN[preset];
  const [techFilter, setTechFilter] = useState<string>('all');

  const [syncing, setSyncing] = useState(false);
  const [prevRevenue, setPrevRevenue] = useState(0);

  const load = useCallback(async () => {
      // Calendar periods so Reports matches the dashboard (today, last 7 days, this month, this year)
      const now = new Date();
      const today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      let start: Date;
      let prevStart: Date;
      if (preset === 'd') { start = today0; prevStart = new Date(today0.getTime() - 86400000); }
      else if (preset === 'w') { start = new Date(today0.getTime() - 6 * 86400000); prevStart = new Date(start.getTime() - 7 * 86400000); }
      else if (preset === 'm') { start = new Date(now.getFullYear(), now.getMonth(), 1); prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1); }
      else if (preset === 'y') { start = new Date(now.getFullYear(), 0, 1); prevStart = new Date(now.getFullYear() - 1, 0, 1); }
      else { start = new Date(Date.now() - days * 86400000); prevStart = new Date(Date.now() - 2 * days * 86400000); }
      const since = start.toISOString();
      const prevSince = prevStart.toISOString();

      const [inv, completed, members, ests, settings, employeesRes, mpRes, prevInv] = await Promise.all([
        supabase
          .from('invoices')
          .select('id, invoice_number, total, subtotal, status, created_at, paid_at, customer_id, service_record_id, technician_id, line_items, stripe_session_id, stripe_payment_intent_id, stripe_fee, stripe_fee_synced_at')
          .eq('status', 'paid')
          .gte('paid_at', since)
          .order('paid_at', { ascending: false }),
        supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('status', 'completed').gte('completed_at', since),
        supabase.from('memberships').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('estimates').select('id', { count: 'exact', head: true }).eq('status', 'sent'),
        supabase.from('shop_settings').select('labor_cost_per_hour').eq('id', 1).single(),
        supabase.from('employees' as any).select('id, user_id, full_name, hourly_rate, pay_basis').eq('is_active', true),
        supabase
          .from('membership_payments' as any)
          .select('id, paid_at, kind, amount, stripe_fee, stripe_fee_synced_at, customer_id, membership:memberships(plan:membership_plans(name))')
          .eq('status', 'paid')
          .gte('paid_at', since)
          .order('paid_at', { ascending: false }),
        supabase.from('invoices').select('total').eq('status', 'paid').gte('paid_at', prevSince).lt('paid_at', since),
      ]);
      setPrevRevenue(((prevInv.data ?? []) as any[]).reduce((s, i) => s + Number(i.total || 0), 0));

      const allInvoices = ((inv.data ?? []) as any[]).map((i) => ({ ...i, created_at: i.paid_at || i.created_at })) as InvoiceRow[];
      const paid = allInvoices;
      const revenue = paid.reduce((s, i) => s + Number(i.total || 0), 0);

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
      for (const i of paid) {
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
        const items = Array.isArray(inv.line_items) ? inv.line_items : [];
        const cogs = items.reduce((s, li) => {
          const kind = itemKind(li);
          return kind === 'part' ? s + partCost(li) : s;
        }, 0);
        const apptId = inv.service_record_id ? apptByService.get(inv.service_record_id) : undefined;
        const info = apptId ? apptInfo.get(apptId) : undefined;
        const paidLaborHours = laborHoursFromInvoice(items, rate, Number(inv.subtotal || 0));
        // Prefer the tech assigned directly to the invoice (set when RO completes,
        // editable from Admin → Invoices), and fall back to the appointment.
        const techId = (inv as any).technician_id ?? info?.tech ?? null;
        const tech = techId ? empByUser.get(techId) : null;
        const techProfile = techId ? techProfileById.get(techId) : null;
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
  }, [days, preset]);

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
      cur.invoices += 1;
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


  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-xl">{PRESET_LABEL[preset]}{preset === 'custom' ? ` · Last ${days} days` : ''}</h2>
          <p className="text-xs text-muted-foreground">
            Grouped by {granularity} · {filteredRows.length} paid invoice{filteredRows.length === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex items-end gap-2 flex-wrap">
          <div>
            <Label className="text-xs">Period</Label>
            <ToggleGroup
              type="single"
              value={preset}
              onValueChange={(v) => v && setPreset(v as Preset)}
              className="h-9"
            >
              <ToggleGroupItem value="d" className="h-9 px-3">D</ToggleGroupItem>
              <ToggleGroupItem value="w" className="h-9 px-3">W</ToggleGroupItem>
              <ToggleGroupItem value="m" className="h-9 px-3">M</ToggleGroupItem>
              <ToggleGroupItem value="y" className="h-9 px-3">Y</ToggleGroupItem>
              <ToggleGroupItem value="custom" className="h-9 px-3">Custom</ToggleGroupItem>
            </ToggleGroup>
          </div>
          {preset === 'custom' && (
            <div>
              <Label className="text-xs">Days</Label>
              <Input
                type="number"
                value={customDays}
                onChange={(e) => setCustomDays(Math.max(1, parseInt(e.target.value) || 30))}
                className="w-24 h-9"
              />
            </div>
          )}
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

      {(() => {
        const change = prevRevenue > 0 ? ((data.revenue30 - prevRevenue) / prevRevenue) * 100 : null;
        const margin = totals.revenue > 0 ? (totals.netProfit / totals.revenue) * 100 : 0;
        const chartData = [...summaryRows].reverse().map((r) => ({ label: r.label, revenue: Math.round(r.revenue), profit: Math.round(r.netProfit) }));
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
        return (
          <>
            <Card className="overflow-hidden">
              <CardContent className="p-5 grid gap-4 md:grid-cols-[1fr_2fr]">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Revenue · {PRESET_LABEL[preset]}</p>
                  <p className="font-display text-4xl mt-1">{fmt(totals.revenue)}</p>
                  {change != null && (
                    <p className={`text-sm mt-1 ${change >= 0 ? 'text-primary' : 'text-destructive'}`}>
                      {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(0)}% vs previous period
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground mt-3">Net profit <span className="text-foreground font-medium">{fmt(totals.netProfit)}</span> · {margin.toFixed(0)}% margin</p>
                  <Button size="sm" variant="outline" className="mt-4" onClick={exportCsv}>
                    <Download className="h-4 w-4 mr-2" /> Download for my books
                  </Button>
                </div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={44} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                      <Area type="monotone" dataKey="revenue" name="Revenue" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" />
                      <Area type="monotone" dataKey="profit" name="Net profit" stroke="hsl(var(--accent))" fill="hsl(var(--accent) / 0.15)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              <KPI label="Parts cost" value={fmt(totals.cogs)} />
              <KPI label="Gross profit" value={fmt(totals.grossProfit)} />
              <KPI label="Tech pay" value={fmt(totals.employeeCost)} />
              <KPI label="Card fees" value={fmt(totals.stripeFee)} />
              <KPI label="Net profit" value={fmt(totals.netProfit)} />
              <KPI label="Profit margin" value={`${margin.toFixed(0)}%`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              <KPI label="Jobs finished" value={String(data.completedJobs)} />
              <KPI label="Paid invoices" value={String(data.invoiceCount)} />
              <KPI label="Avg repair order" value={fmt(data.aro)} />
              <KPI label={`Labor hrs${techFilter !== 'all' ? ` · ${techFilter}` : ''}`} value={perfTotals.paidH.toFixed(1)} />
              <KPI label="Hrs per invoice" value={filteredRows.length ? (perfTotals.paidH / filteredRows.length).toFixed(1) : '0'} />
              <KPI label="Membership revenue" value={fmt(membershipTotals.revenue)} />
            </div>
          </>
        );
      })()}

      <Tabs defaultValue="summary" className="w-full">
        <TabsList>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="detail">Detail</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Totals rolled up by {granularity}. Each row aggregates every paid invoice that landed in that bucket.
          </p>
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right">Invoices</TableHead>
                    <TableHead className="text-right">Labor (hrs)</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">COGS</TableHead>
                    <TableHead className="text-right">Gross Profit</TableHead>
                    <TableHead className="text-right">Employee Cost</TableHead>
                    <TableHead className="text-right">Stripe Fees</TableHead>
                    <TableHead className="text-right">Net Profit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summaryRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-6">
                        No paid invoices in this window.
                      </TableCell>
                    </TableRow>
                  ) : (
                    summaryRows.map((s) => (
                      <TableRow key={s.key}>
                        <TableCell className="text-xs font-medium">{s.label}</TableCell>
                        <TableCell className="text-right">{s.invoices}</TableCell>
                        <TableCell className="text-right">{s.paidLaborHours.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{fmt(s.revenue)}</TableCell>
                        <TableCell className="text-right">{fmt(s.cogs)}</TableCell>
                        <TableCell className={`text-right ${s.grossProfit < 0 ? 'text-destructive' : ''}`}>{fmt(s.grossProfit)}</TableCell>
                        <TableCell className="text-right">{fmt(s.employeeCost)}</TableCell>
                        <TableCell className="text-right">{fmt(s.stripeFee)}</TableCell>
                        <TableCell className={`text-right font-semibold ${s.netProfit < 0 ? 'text-destructive' : 'text-primary'}`}>
                          {fmt(s.netProfit)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detail" className="space-y-2">
          <p className="text-xs text-muted-foreground">
            One row per paid invoice. Gross profit = revenue − cost of goods. Net profit = gross − cost of employees − Stripe fees.
            Employee cost uses the technician's hourly rate from Employees × <strong>paid labor hours</strong> from the estimate
            (default ${defaultRate.toFixed(2)}/hr when no employee record). Stripe fees use the actual amount when synced, else
            an estimate of 2.9% + $0.30.
          </p>
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
                      <TableCell colSpan={11} className="text-center text-muted-foreground py-6">
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

          <h3 className="font-display text-lg pt-4">Membership Payments</h3>
          <p className="text-xs text-muted-foreground -mt-1">
            One row per Stripe charge tied to a membership (deposits + monthly recurring).
          </p>
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Stripe Fee</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {memberRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                        No membership payments in this window.
                      </TableCell>
                    </TableRow>
                  ) : (
                    memberRows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-xs">{new Date(r.paid_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-xs">{r.member}</TableCell>
                        <TableCell className="text-xs">{r.plan}</TableCell>
                        <TableCell className="text-xs capitalize">{r.kind}</TableCell>
                        <TableCell className="text-right">{fmt(r.amount)}</TableCell>
                        <TableCell className="text-right" title={r.stripeFeeIsActual ? 'Actual fee from Stripe' : 'Estimated (not yet synced)'}>
                          {fmt(r.stripeFee)}
                          {!r.stripeFeeIsActual && r.stripeFee > 0 && <span className="text-muted-foreground ml-1">~</span>}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-primary">
                          {fmt(r.amount - r.stripeFee)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
