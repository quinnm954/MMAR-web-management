import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Wallet, ClipboardList, Wrench, Target, Pencil, Check } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell, Legend, Line, ComposedChart } from 'recharts';
import { toast } from 'sonner';

type Inv = {
  id: string; total: number | null; amount_paid: number | null; status: string; created_at: string;
  paid_at: string | null; customer_id: string | null; line_items: any; appointment_id?: string | null;
};
type Est = { id: string; total: number | null; status: string; sent_at: string | null; approved_at: string | null; created_at: string };

const fmt = (n: number) => '$' + (n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmt0 = (n: number) => '$' + Math.round(n || 0).toLocaleString();
const startOf = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const paidDate = (i: Inv) => new Date(i.paid_at || i.created_at);
const OPEN = ['unpaid', 'partial', 'overdue', 'sent'];

const C = {
  primary: 'hsl(var(--primary))',
  accent: 'hsl(var(--accent))',
  muted: 'hsl(var(--muted-foreground))',
  border: 'hsl(var(--border))',
};
const PIE = [C.primary, C.accent, 'hsl(var(--secondary-foreground))'];
const tip = { background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 };
const yFmt = (v: number) => `$${v >= 1000 ? (v / 1000).toFixed(v >= 10000 ? 0 : 1) + 'k' : v}`;

export default function AdminSalesDashboard() {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Inv[]>([]);
  const [estimates, setEstimates] = useState<Est[]>([]);
  const [counts, setCounts] = useState({ customers: 0, memberships: 0, openAppts: 0, doneWeek: 0, doneMonth: 0 });
  const [doneJobs, setDoneJobs] = useState<{ id: string; completed_at: string }[]>([]);
  const [names, setNames] = useState<Map<string, string>>(new Map());
  const [laborCost, setLaborCost] = useState(40);
  const [goal, setGoal] = useState<number | null>(null);
  const [editGoal, setEditGoal] = useState(false);
  const [goalDraft, setGoalDraft] = useState('');

  const now = new Date();
  const todayStart = startOf(now);
  const weekStart = addDays(todayStart, -6);
  const monthStart = startOf(new Date(now.getFullYear(), now.getMonth(), 1));
  const lastMonthStart = startOf(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const yearStart = startOf(new Date(now.getFullYear(), 0, 1));

  useEffect(() => {
    (async () => {
      const since = startOf(new Date(now.getFullYear(), now.getMonth() - 12, 1)).toISOString();
      const mondayish = addDays(todayStart, -6).toISOString();
      const [inv, est, cust, mem, appts, dw, dm, shop] = await Promise.all([
        supabase.from('invoices').select('id,total,amount_paid,status,created_at,paid_at,customer_id,line_items,appointment_id').gte('created_at', since).order('created_at', { ascending: false }).limit(3000),
        supabase.from('estimates').select('id,total,status,sent_at,approved_at,created_at').gte('created_at', addDays(todayStart, -90).toISOString()).limit(2000),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('memberships').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('appointments').select('id', { count: 'exact', head: true }).in('status', ['requested', 'scheduled', 'in_progress']),
        supabase.from('appointments').select('id, completed_at').eq('status', 'completed').gte('completed_at', mondayish < monthStart.toISOString() ? mondayish : monthStart.toISOString()).limit(2000),
        Promise.resolve(null),
        supabase.from('shop_settings').select('labor_cost_per_hour, monthly_revenue_goal').limit(1).maybeSingle(),
      ]);
      const invs = (inv.data ?? []) as Inv[];
      setInvoices(invs);
      setEstimates((est.data ?? []) as Est[]);
      setCounts({ customers: cust.count ?? 0, memberships: mem.count ?? 0, openAppts: appts.count ?? 0, doneWeek: 0, doneMonth: 0 });
      setDoneJobs(((dw as any).data ?? []) as { id: string; completed_at: string }[]);
      const s: any = shop.data;
      if (s?.labor_cost_per_hour) setLaborCost(Number(s.labor_cost_per_hour));
      if (s?.monthly_revenue_goal) setGoal(Number(s.monthly_revenue_goal));
      const ids = Array.from(new Set(invs.filter(i => i.customer_id).map(i => i.customer_id as string)));
      if (ids.length) {
        const { data } = await supabase.from('profiles').select('id, full_name, email').in('id', ids);
        setNames(new Map((data ?? []).map((p: any) => [p.id, p.full_name || p.email || '—'])));
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveGoal = async () => {
    const v = Number(goalDraft.replace(/[^0-9.]/g, ''));
    const val = v > 0 ? v : null;
    const { error } = await supabase.from('shop_settings').update({ monthly_revenue_goal: val } as any).not('id', 'is', null);
    if (error) return toast.error(error.message);
    setGoal(val); setEditGoal(false);
  };

  const paid = useMemo(() => invoices.filter(i => i.status === 'paid'), [invoices]);
  const sumIn = (from: Date, to?: Date) => paid.reduce((s, i) => { const d = paidDate(i); return d >= from && (!to || d < to) ? s + Number(i.total || 0) : s; }, 0);
  const countIn = (from: Date, to?: Date) => paid.filter(i => { const d = paidDate(i); return d >= from && (!to || d < to); }).length;

  const todayRev = sumIn(todayStart);
  const weekRev = sumIn(weekStart);
  const prevWeekRev = sumIn(addDays(weekStart, -7), weekStart);
  const monthRev = sumIn(monthStart);
  // Same point last month, for a fair comparison
  const lastMonthSameDay = new Date(lastMonthStart); lastMonthSameDay.setDate(Math.min(now.getDate() + 1, 31));
  const lastMonthToDate = sumIn(lastMonthStart, lastMonthSameDay > monthStart ? monthStart : lastMonthSameDay);
  const lastMonthRev = sumIn(lastMonthStart, monthStart);
  const ytdRev = sumIn(yearStart);
  const momPct = lastMonthToDate > 0 ? ((monthRev - lastMonthToDate) / lastMonthToDate) * 100 : null;
  const wowPct = prevWeekRev > 0 ? ((weekRev - prevWeekRev) / prevWeekRev) * 100 : null;
  const monthInv = countIn(monthStart);
  const aro = monthInv ? monthRev / monthInv : 0;

  const billedMTD = invoices.filter(i => i.status !== 'void' && i.status !== 'draft' && new Date(i.created_at) >= monthStart).reduce((s, i) => s + Number(i.total || 0), 0);

  // Money owed + aging
  const owed = useMemo(() => {
    const open = invoices.filter(i => OPEN.includes(i.status));
    const b = { a: 0, b: 0, c: 0 };
    let total = 0;
    open.forEach(i => {
      const bal = Math.max(0, Number(i.total || 0) - Number(i.amount_paid || 0));
      total += bal;
      const age = (now.getTime() - new Date(i.created_at).getTime()) / 86400000;
      if (age <= 7) b.a += bal; else if (age <= 30) b.b += bal; else b.c += bal;
    });
    return { count: open.length, total, ...b };
  }, [invoices]);

  const daysToPay = useMemo(() => {
    const xs = paid.filter(i => i.paid_at && paidDate(i) >= addDays(todayStart, -90)).map(i => (new Date(i.paid_at!).getTime() - new Date(i.created_at).getTime()) / 86400000).filter(d => d >= 0);
    return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
  }, [paid]);

  // Pipeline
  const pipe = useMemo(() => {
    const open = estimates.filter(e => ['sent', 'draft'].includes(e.status));
    const sent = estimates.filter(e => e.sent_at || ['sent', 'approved', 'declined', 'converted'].includes(e.status));
    const won = estimates.filter(e => ['approved', 'converted'].includes(e.status));
    return {
      openCount: open.length,
      openValue: open.reduce((s, e) => s + Number(e.total || 0), 0),
      closeRate: sent.length ? (won.length / sent.length) * 100 : null,
      wonValue: won.reduce((s, e) => s + Number(e.total || 0), 0),
    };
  }, [estimates]);

  // Repeat customers share of MTD revenue
  const repeatPct = useMemo(() => {
    const mtd = paid.filter(i => paidDate(i) >= monthStart && i.customer_id);
    if (!mtd.length) return null;
    const before = new Set(paid.filter(i => paidDate(i) < monthStart && i.customer_id).map(i => i.customer_id));
    const tot = mtd.reduce((s, i) => s + Number(i.total || 0), 0);
    const rep = mtd.filter(i => before.has(i.customer_id)).reduce((s, i) => s + Number(i.total || 0), 0);
    return tot ? (rep / tot) * 100 : null;
  }, [paid]);

  // Sales mix + labor margin (MTD)
  const { mix, laborBilled, laborHours } = useMemo(() => {
    const acc = { diagnosis: 0, labor: 0, parts: 0 }; let hrs = 0;
    paid.forEach(inv => {
      if (paidDate(inv) < monthStart) return;
      (Array.isArray(inv.line_items) ? inv.line_items : []).forEach((li: any) => {
        const qty = Number(li.quantity ?? 1), price = Number(li.unit_price ?? 0);
        const amt = Number(li.amount ?? qty * price);
        const k = String(li.kind || 'part').toLowerCase();
        const desc = `${li.name ?? ''} ${li.description ?? ''}`.toLowerCase();
        if (k === 'diagnosis' || k === 'diagnostic' || /diagnos|diag\b|inspection|scan/.test(desc)) acc.diagnosis += amt;
        else if (k === 'labor') { acc.labor += amt; hrs += amt / 125; }
        else if (k === 'part') acc.parts += amt;
      });
    });
    return {
      mix: [{ name: 'Diagnosis', value: Math.round(acc.diagnosis) }, { name: 'Labor', value: Math.round(acc.labor) }, { name: 'Parts', value: Math.round(acc.parts) }].filter(x => x.value > 0),
      laborBilled: acc.labor, laborHours: hrs,
    };
  }, [paid]);
  const jobStats = useMemo(() => {
    const week = doneJobs.filter(j => new Date(j.completed_at) >= weekStart);
    const month = doneJobs.filter(j => new Date(j.completed_at) >= monthStart);
    const ids = new Set(month.map(j => j.id));
    let hrs = 0, rev = 0; const withInv = new Set<string>();
    invoices.forEach(inv => {
      if (!inv.appointment_id || !ids.has(inv.appointment_id) || inv.status === 'void') return;
      withInv.add(inv.appointment_id); rev += Number(inv.total || 0);
      (Array.isArray(inv.line_items) ? inv.line_items : []).forEach((li: any) => {
        if (String(li.kind).toLowerCase() === 'labor') hrs += Number(li.amount ?? Number(li.quantity ?? 1) * Number(li.unit_price ?? 0)) / 125;
      });
    });
    return { week: week.length, month: month.length, hrsPerJob: withInv.size ? hrs / withInv.size : null, revPerJob: withInv.size ? rev / withInv.size : null };
  }, [doneJobs, invoices]);
  const laborCostMTD = laborHours * laborCost;
  const laborMargin = laborBilled > 0 ? ((laborBilled - laborCostMTD) / laborBilled) * 100 : null;

  const daily = useMemo(() => Array.from({ length: 30 }, (_, k) => {
    const i = 29 - k; const d = addDays(todayStart, -i); const n = addDays(d, 1);
    const pd = addDays(d, -30), pn = addDays(n, -30);
    return { date: d.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }), revenue: Math.round(sumIn(d, n)), prior: Math.round(sumIn(pd, pn)) };
  }), [paid]);
  const monthly = useMemo(() => Array.from({ length: 12 }, (_, k) => {
    const i = 11 - k;
    const s = startOf(new Date(now.getFullYear(), now.getMonth() - i, 1));
    const e = startOf(new Date(now.getFullYear(), now.getMonth() - i + 1, 1));
    return { month: s.toLocaleDateString(undefined, { month: 'short' }), revenue: Math.round(sumIn(s, e)) };
  }), [paid]);
  const spark7 = daily.slice(-14);

  const topCustomers = useMemo(() => {
    const cutoff = addDays(todayStart, -90); const m = new Map<string, number>();
    paid.forEach(i => { if (paidDate(i) >= cutoff && i.customer_id) m.set(i.customer_id, (m.get(i.customer_id) || 0) + Number(i.total || 0)); });
    return Array.from(m.entries()).map(([id, total]) => ({ id, total, name: names.get(id) || '—' })).sort((a, b) => b.total - a.total).slice(0, 6);
  }, [paid, names]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">{[0, 1, 2].map(i => <Skeleton key={i} className="h-36" />)}</div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4"><Skeleton className="h-72" /><Skeleton className="h-72" /></div>
      </div>
    );
  }

  const goalPct = goal ? Math.min(100, (monthRev / goal) * 100) : 0;
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const pace = (monthRev / dayOfMonth) * daysInMonth;

  return (
    <div className="space-y-5 font-sans">
      {/* Headline */}
      <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card">
        <CardContent className="p-5 grid gap-5 lg:grid-cols-[1.3fr_1fr]">
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Revenue this month</p>
            <div className="flex flex-wrap items-end gap-3">
              <span className="text-4xl md:text-5xl font-bold tracking-tight tabular-nums">{fmt0(monthRev)}</span>
              <Delta pct={momPct} note={`vs ${fmt0(lastMonthToDate)} same point last month`} />
            </div>
            <p className="text-xs text-muted-foreground">On pace for {fmt0(pace)} · last month finished at {fmt0(lastMonthRev)}</p>
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground"><Target className="h-3.5 w-3.5" />Monthly goal</span>
                {editGoal ? (
                  <span className="flex items-center gap-1">
                    <Input autoFocus value={goalDraft} onChange={e => setGoalDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveGoal()} placeholder="e.g. 10000" className="h-7 w-28 text-xs" inputMode="decimal" />
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={saveGoal} aria-label="Save goal"><Check className="h-4 w-4" /></Button>
                  </span>
                ) : (
                  <button className="flex items-center gap-1 text-foreground hover:text-primary" onClick={() => { setGoalDraft(goal ? String(goal) : ''); setEditGoal(true); }}>
                    {goal ? `${fmt0(monthRev)} of ${fmt0(goal)} (${goalPct.toFixed(0)}%)` : 'Set a goal'} <Pencil className="h-3 w-3" />
                  </button>
                )}
              </div>
              <Progress value={goalPct} className="h-2" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 content-start">
            <Mini label="Today" value={fmt0(todayRev)} />
            <Mini label="Last 7 days" value={fmt0(weekRev)} pct={wowPct} />
            <Mini label="Year to date" value={fmt0(ytdRev)} />
            <div className="col-span-3 h-16 -mx-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={spark7} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                  <defs><linearGradient id="spark" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.primary} stopOpacity={0.5} /><stop offset="100%" stopColor={C.primary} stopOpacity={0} /></linearGradient></defs>
                  <Area type="monotone" dataKey="revenue" stroke={C.primary} fill="url(#spark)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
              <p className="text-[10px] text-muted-foreground text-right">last 14 days</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Collected vs billed (MTD)" value={`${fmt0(monthRev)} / ${fmt0(billedMTD)}`} sub={billedMTD ? `${Math.round((monthRev / billedMTD) * 100)}% collected` : 'Nothing billed yet'} />
        <Stat label="Avg repair order (MTD)" value={fmt0(aro)} sub={`${monthInv} paid invoice${monthInv === 1 ? '' : 's'}`} />
        <Stat label="Repeat customer revenue" value={repeatPct === null ? '—' : `${repeatPct.toFixed(0)}%`} sub="of this month's sales" />
        <Stat label="Labor margin (MTD)" value={laborMargin === null ? '—' : `${laborMargin.toFixed(0)}%`} sub={`${fmt0(laborBilled)} billed · ~${fmt0(laborCostMTD)} tech pay`} />
      </div>

      {/* Groups */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Group icon={Wallet} title="Money owed" href="/admin?tab=invoices">
          <Row k="Unpaid balance" v={`${fmt0(owed.total)}`} strong />
          <Row k="Open invoices" v={String(owed.count)} />
          <Row k="Avg days to get paid" v={daysToPay === null ? '—' : `${daysToPay.toFixed(1)} days`} />
          <div className="pt-2 grid grid-cols-3 gap-1.5 text-center">
            <Age label="0–7 days" v={owed.a} />
            <Age label="8–30 days" v={owed.b} warn />
            <Age label="30+ days" v={owed.c} bad />
          </div>
        </Group>
        <Group icon={ClipboardList} title="Pipeline · 90 days" href="/admin?tab=estimates">
          <Row k="Open estimates" v={`${pipe.openCount} · ${fmt0(pipe.openValue)}`} strong />
          <Row k="Close rate" v={pipe.closeRate === null ? '—' : `${pipe.closeRate.toFixed(0)}%`} />
          <Row k="Value won" v={fmt0(pipe.wonValue)} />
        </Group>
        <Group icon={Wrench} title="Shop">
          <Row k="Jobs done this week" v={String(jobStats.week)} strong />
          <Row k="Jobs done this month" v={`${jobStats.month}${jobStats.revPerJob !== null ? ` · ${fmt0(jobStats.revPerJob)}/job` : ''}`} />
          <Row k="Labor hours per job" v={jobStats.hrsPerJob === null ? '—' : `${jobStats.hrsPerJob.toFixed(1)} hrs`} />
          <Row k="Open appointments" v={String(counts.openAppts)} />
          <Row k="Customers · members" v={`${counts.customers} · ${counts.memberships}`} />
        </Group>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Revenue, last 30 days" note="Dashed line = previous 30 days">
          <ComposedChart data={daily} margin={{ top: 5, right: 8, left: -8, bottom: 0 }}>
            <defs><linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.primary} stopOpacity={0.45} /><stop offset="95%" stopColor={C.primary} stopOpacity={0.02} /></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: C.muted }} interval="preserveStartEnd" tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: C.muted }} tickFormatter={yFmt} tickLine={false} axisLine={false} />
            <Tooltip formatter={(v: any, n: any) => [fmt(Number(v)), n === 'prior' ? 'Previous period' : 'Revenue']} contentStyle={tip} />
            <Area type="monotone" dataKey="revenue" stroke={C.primary} fill="url(#rev)" strokeWidth={2} />
            <Line type="monotone" dataKey="prior" stroke={C.muted} strokeDasharray="4 4" dot={false} strokeWidth={1.5} />
          </ComposedChart>
        </ChartCard>
        <ChartCard title="Revenue, last 12 months">
          <BarChart data={monthly} margin={{ top: 5, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: C.muted }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: C.muted }} tickFormatter={yFmt} tickLine={false} axisLine={false} />
            <Tooltip formatter={(v: any) => fmt(Number(v))} contentStyle={tip} cursor={{ fill: 'hsl(var(--muted) / 0.4)' }} />
            <Bar dataKey="revenue" fill={C.accent} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="font-sans text-base font-semibold tracking-normal">Sales mix, this month</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              {mix.length === 0 ? <p className="text-sm text-muted-foreground text-center pt-12">No paid sales this month yet.</p> : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={mix} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3} stroke="none">
                      {mix.map((_, i) => <Cell key={i} fill={PIE[i % PIE.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => fmt(Number(v))} contentStyle={tip} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="font-sans text-base font-semibold tracking-normal">Top customers, last 90 days</CardTitle></CardHeader>
          <CardContent>
            {topCustomers.length === 0 ? <p className="text-sm text-muted-foreground py-8 text-center">No paid invoices in the last 90 days.</p> : (
              <ul className="space-y-2.5">
                {topCustomers.map((c, i) => (
                  <li key={c.id} className="space-y-1">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="flex items-center gap-2 min-w-0"><span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[11px] font-semibold flex items-center justify-center shrink-0">{i + 1}</span><span className="truncate">{c.name}</span></span>
                      <span className="tabular-nums font-medium">{fmt0(c.total)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary/70 rounded-full" style={{ width: `${(c.total / topCustomers[0].total) * 100}%` }} /></div>
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

function Delta({ pct, note }: { pct: number | null; note?: string }) {
  if (pct === null) return note ? <span className="text-xs text-muted-foreground pb-2">{note}</span> : null;
  const up = pct >= 0;
  return (
    <span className="flex items-center gap-1.5 pb-1.5 text-xs">
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${up ? 'bg-primary/15 text-primary' : 'bg-destructive/15 text-destructive'}`}>
        {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}{up ? '+' : ''}{pct.toFixed(0)}%
      </span>
      {note && <span className="text-muted-foreground">{note}</span>}
    </span>
  );
}

function Mini({ label, value, pct }: { label: string; value: string; pct?: number | null }) {
  return (
    <div className="rounded-lg bg-background/40 border border-border/50 p-2.5 min-w-0">
      <div className="text-[11px] text-muted-foreground truncate">{label}</div>
      <div className="text-lg font-semibold tabular-nums truncate">{value}</div>
      {pct !== undefined && pct !== null && <div className={`text-[10px] ${pct >= 0 ? 'text-primary' : 'text-destructive'}`}>{pct >= 0 ? '▲' : '▼'} {Math.abs(pct).toFixed(0)}% wk/wk</div>}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-lg md:text-xl font-bold mt-1 tabular-nums break-words leading-tight">{value}</div>
        {sub && <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function Group({ icon: Icon, title, href, children }: { icon: any; title: string; href?: string; children: React.ReactNode }) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-4 space-y-1.5">
        <div className="flex items-center justify-between mb-1">
          <span className="flex items-center gap-2 text-sm font-semibold"><span className="w-7 h-7 rounded-md bg-primary/10 text-primary flex items-center justify-center"><Icon className="h-4 w-4" /></span>{title}</span>
          {href && <a href={href} className="text-xs text-primary hover:underline">Open</a>}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className="text-muted-foreground">{k}</span>
      <span className={`tabular-nums ${strong ? 'font-bold text-base' : 'font-medium'}`}>{v}</span>
    </div>
  );
}

function Age({ label, v, warn, bad }: { label: string; v: number; warn?: boolean; bad?: boolean }) {
  const tone = v > 0 && bad ? 'bg-destructive/15 text-destructive' : v > 0 && warn ? 'bg-accent/15 text-accent' : 'bg-muted text-foreground';
  return (
    <div className={`rounded-md px-1.5 py-1.5 ${tone}`}>
      <div className="text-[10px] opacity-80">{label}</div>
      <div className="text-sm font-semibold tabular-nums">{fmt0(v)}</div>
    </div>
  );
}

function ChartCard({ title, note, children }: { title: string; note?: string; children: React.ReactElement }) {
  return (
    <Card>
      <CardHeader className="pb-2 flex-row items-baseline justify-between space-y-0">
        <CardTitle className="font-sans text-base font-semibold tracking-normal">{title}</CardTitle>
        {note && <span className="text-[11px] text-muted-foreground">{note}</span>}
      </CardHeader>
      <CardContent><div className="h-64 w-full"><ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer></div></CardContent>
    </Card>
  );
}
