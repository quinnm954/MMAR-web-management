import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, TrendingUp, TrendingDown, DollarSign, Receipt, Users, CalendarCheck, CreditCard, AlertCircle } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';

type Inv = {
  id: string;
  total: number | null;
  status: string;
  created_at: string;
  paid_at: string | null;
  customer_id: string | null;
  line_items: any;
};

const fmt = (n: number) =>
  '$' + (n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmt0 = (n: number) =>
  '$' + Math.round(n || 0).toLocaleString();

const startOf = (d: Date) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate()+n); return x; };

const PIE_COLORS = ['hsl(200,80%,60%)','hsl(45,90%,55%)','hsl(260,70%,65%)','hsl(140,60%,50%)','hsl(0,75%,60%)','hsl(30,80%,55%)','hsl(180,60%,50%)','hsl(310,70%,60%)'];

export default function AdminSalesDashboard() {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Inv[]>([]);
  const [counts, setCounts] = useState({
    customers: 0,
    activeMemberships: 0,
    openAppointments: 0,
    unpaidInvoicesCount: 0,
    unpaidInvoicesTotal: 0,
    openEstimates: 0,
    openEstimatesValue: 0,
  });
  const [customerNames, setCustomerNames] = useState<Map<string, string>>(new Map());

  const load = async () => {
    setLoading(true);
    const yearStart = startOf(new Date(new Date().getFullYear(), 0, 1)).toISOString();

    const [invRes, custCount, memCount, openAppts, unpaidInvs, openEstsRes] = await Promise.all([
      supabase
        .from('invoices')
        .select('id,total,status,created_at,paid_at,customer_id,line_items')
        .gte('created_at', yearStart)
        .order('created_at', { ascending: false })
        .limit(2000),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('memberships').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('appointments').select('id', { count: 'exact', head: true }).in('status', ['requested','scheduled','in_progress']),
      supabase.from('invoices').select('total').in('status', ['unpaid','partial','overdue']),
      supabase.from('estimates').select('total,status').in('status', ['sent','draft']),
    ]);

    const invs = (invRes.data ?? []) as Inv[];
    setInvoices(invs);

    const unpaidArr = (unpaidInvs.data ?? []) as any[];
    const openEstsArr = (openEstsRes.data ?? []) as any[];

    setCounts({
      customers: custCount.count ?? 0,
      activeMemberships: memCount.count ?? 0,
      openAppointments: openAppts.count ?? 0,
      unpaidInvoicesCount: unpaidArr.length,
      unpaidInvoicesTotal: unpaidArr.reduce((s, i) => s + Number(i.total || 0), 0),
      openEstimates: openEstsArr.length,
      openEstimatesValue: openEstsArr.reduce((s, e) => s + Number(e.total || 0), 0),
    });

    // Customer names for "top customers"
    const ids = Array.from(new Set(invs.filter(i => i.status === 'paid' && i.customer_id).map(i => i.customer_id as string)));
    if (ids.length) {
      const { data: profs } = await supabase.from('profiles').select('id, full_name, email').in('id', ids);
      setCustomerNames(new Map((profs ?? []).map((p: any) => [p.id, p.full_name || p.email || '—'])));
    } else {
      setCustomerNames(new Map());
    }

    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const now = new Date();
  const todayStart = startOf(now);
  const weekStart = addDays(todayStart, -6); // last 7 days
  const monthStart = startOf(new Date(now.getFullYear(), now.getMonth(), 1));
  const lastMonthStart = startOf(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const lastMonthEnd = startOf(new Date(now.getFullYear(), now.getMonth(), 1));
  const yearStart = startOf(new Date(now.getFullYear(), 0, 1));

  const paid = useMemo(() => invoices.filter(i => i.status === 'paid'), [invoices]);

  const sumIn = (from: Date, to?: Date) =>
    paid.reduce((s, i) => {
      const d = new Date(i.paid_at || i.created_at);
      if (d >= from && (!to || d < to)) return s + Number(i.total || 0);
      return s;
    }, 0);
  const countIn = (from: Date, to?: Date) =>
    paid.reduce((s, i) => {
      const d = new Date(i.paid_at || i.created_at);
      if (d >= from && (!to || d < to)) return s + 1;
      return s;
    }, 0);

  const todayRev = sumIn(todayStart);
  const weekRev = sumIn(weekStart);
  const monthRev = sumIn(monthStart);
  const lastMonthRev = sumIn(lastMonthStart, lastMonthEnd);
  const ytdRev = sumIn(yearStart);

  const monthInv = countIn(monthStart);
  const aroMTD = monthInv ? monthRev / monthInv : 0;

  const momPct = lastMonthRev > 0 ? ((monthRev - lastMonthRev) / lastMonthRev) * 100 : null;

  // Daily series — last 30 days
  const dailySeries = useMemo(() => {
    const days: { date: string; revenue: number; invoices: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = addDays(todayStart, -i);
      const next = addDays(d, 1);
      const rev = paid.reduce((s, inv) => {
        const dt = new Date(inv.paid_at || inv.created_at);
        return dt >= d && dt < next ? s + Number(inv.total || 0) : s;
      }, 0);
      const cnt = paid.reduce((s, inv) => {
        const dt = new Date(inv.paid_at || inv.created_at);
        return dt >= d && dt < next ? s + 1 : s;
      }, 0);
      days.push({
        date: d.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }),
        revenue: Math.round(rev),
        invoices: cnt,
      });
    }
    return days;
  }, [paid]);

  // Monthly series — last 12 months
  const monthlySeries = useMemo(() => {
    const months: { month: string; revenue: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const start = startOf(new Date(now.getFullYear(), now.getMonth() - i, 1));
      const end = startOf(new Date(now.getFullYear(), now.getMonth() - i + 1, 1));
      const rev = paid.reduce((s, inv) => {
        const dt = new Date(inv.paid_at || inv.created_at);
        return dt >= start && dt < end ? s + Number(inv.total || 0) : s;
      }, 0);
      months.push({
        month: start.toLocaleDateString(undefined, { month: 'short' }),
        revenue: Math.round(rev),
      });
    }
    return months;
  }, [paid]);

  // Sales mix — diagnosis vs labor vs parts (this month)
  const mix = useMemo(() => {
    const acc = { diagnosis: 0, labor: 0, parts: 0 };
    paid.forEach(inv => {
      const d = new Date(inv.paid_at || inv.created_at);
      if (d < monthStart) return;
      const items = Array.isArray(inv.line_items) ? inv.line_items : [];
      items.forEach((li: any) => {
        const qty = Number(li.quantity ?? 1);
        const price = Number(li.unit_price ?? 0);
        const amt = Number(li.amount ?? qty * price);
        const k = String(li.kind || 'part').toLowerCase();
        const desc = `${li.name ?? ''} ${li.description ?? ''}`.toLowerCase();
        const isDiagnosis =
          k === 'diagnosis' ||
          k === 'diagnostic' ||
          /diagnos|diag\b|inspection|scan/.test(desc);
        if (isDiagnosis) acc.diagnosis += amt;
        else if (k === 'labor') acc.labor += amt;
        else if (k === 'part') acc.parts += amt;
      });
    });
    return [
      { name: 'Diagnosis', value: Math.round(acc.diagnosis) },
      { name: 'Labor', value: Math.round(acc.labor) },
      { name: 'Parts', value: Math.round(acc.parts) },
    ].filter(x => x.value > 0);
  }, [paid, monthStart]);

  // Top customers — last 90 days
  const topCustomers = useMemo(() => {
    const cutoff = addDays(todayStart, -90);
    const map = new Map<string, number>();
    paid.forEach(inv => {
      const d = new Date(inv.paid_at || inv.created_at);
      if (d < cutoff || !inv.customer_id) return;
      map.set(inv.customer_id, (map.get(inv.customer_id) || 0) + Number(inv.total || 0));
    });
    return Array.from(map.entries())
      .map(([id, total]) => ({ id, total, name: customerNames.get(id) || '—' }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [paid, customerNames]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi icon={DollarSign} label="Revenue Today" value={fmt0(todayRev)} accent />
        <Kpi icon={DollarSign} label="Last 7 Days" value={fmt0(weekRev)} />
        <Kpi
          icon={DollarSign}
          label="Month to Date"
          value={fmt0(monthRev)}
          delta={momPct === null ? undefined : momPct}
          deltaSubtitle={`vs ${fmt0(lastMonthRev)} last month`}
        />
        <Kpi icon={DollarSign} label="Year to Date" value={fmt0(ytdRev)} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi icon={Receipt} label="Paid Invoices (MTD)" value={String(monthInv)} />
        <Kpi icon={TrendingUp} label="Avg Repair Order (MTD)" value={fmt0(aroMTD)} />
        <Kpi icon={AlertCircle} label="Open Estimates" value={`${counts.openEstimates} · ${fmt0(counts.openEstimatesValue)}`} />
        <Kpi icon={Receipt} label="Unpaid Invoices" value={`${counts.unpaidInvoicesCount} · ${fmt0(counts.unpaidInvoicesTotal)}`} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi icon={Users} label="Customers" value={String(counts.customers)} />
        <Kpi icon={CreditCard} label="Active Memberships" value={String(counts.activeMemberships)} accent />
        <Kpi icon={CalendarCheck} label="Open Appointments" value={String(counts.openAppointments)} />
        <Kpi icon={Receipt} label="Unpaid Total" value={fmt0(counts.unpaidInvoicesTotal)} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue · Last 30 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailySeries} margin={{ top: 5, right: 8, left: -8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(200,80%,60%)" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="hsl(200,80%,60%)" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                  <Tooltip formatter={(v: any) => fmt(Number(v))} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(200,80%,60%)" fill="url(#rev)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue · Last 12 Months</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlySeries} margin={{ top: 5, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                  <Tooltip formatter={(v: any) => fmt(Number(v))} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                  <Bar dataKey="revenue" fill="hsl(45,90%,55%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sales Mix · Month to Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              {mix.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center pt-12">No paid sales this month yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={mix} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                      {mix.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => fmt(Number(v))} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Customers · Last 90 Days</CardTitle>
          </CardHeader>
          <CardContent>
            {topCustomers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No paid invoices in the last 90 days.</p>
            ) : (
              <ul className="divide-y divide-border">
                {topCustomers.map((c, i) => (
                  <li key={c.id} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center shrink-0">{i + 1}</span>
                      <span className="text-sm truncate">{c.name}</span>
                    </div>
                    <span className="text-sm font-mono">{fmt(c.total)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  accent,
  delta,
  deltaSubtitle,
}: {
  icon: any;
  label: string;
  value: string;
  accent?: boolean;
  delta?: number;
  deltaSubtitle?: string;
}) {
  const up = (delta ?? 0) >= 0;
  return (
    <Card className={accent ? 'border-primary/30 bg-primary/5' : 'border-border/50'}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground truncate">{label}</div>
            <div className="text-xl font-bold mt-0.5">{value}</div>
            {delta !== undefined && (
              <div className={`text-[11px] mt-1 flex items-center gap-1 ${up ? 'text-green-500' : 'text-destructive'}`}>
                {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {up ? '+' : ''}{delta.toFixed(1)}%
                {deltaSubtitle && <span className="text-muted-foreground ml-1">{deltaSubtitle}</span>}
              </div>
            )}
          </div>
          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${accent ? 'bg-primary/15' : 'bg-muted'}`}>
            <Icon className={`h-4 w-4 ${accent ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
