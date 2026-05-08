import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type LineItem = { quantity?: number; unit_price?: number; unit_cost?: number; amount?: number; kind?: string };

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

  useEffect(() => {
    (async () => {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const [inv, completed, members, ests, hours] = await Promise.all([
        supabase.from('invoices').select('total, status, line_items').gte('created_at', since),
        supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('status', 'completed').gte('created_at', since),
        supabase.from('memberships').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('estimates').select('id', { count: 'exact', head: true }).eq('status', 'sent'),
        supabase.from('time_entries').select('duration_minutes').gte('clock_in', since),
      ]);
      const paid = (inv.data ?? []).filter((i: any) => i.status === 'paid');
      const revenue = paid.reduce((s, i: any) => s + Number(i.total || 0), 0);
      const totalMin = (hours.data ?? []).reduce((s, e) => s + (e.duration_minutes || 0), 0);

      // Parts cost & margin from paid invoice line_items (only lines tagged kind=part with unit_cost)
      let partsRevenue = 0;
      let partsCost = 0;
      for (const i of paid as any[]) {
        const items: LineItem[] = Array.isArray(i.line_items) ? i.line_items : [];
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

      setData({
        revenue30: revenue,
        invoiceCount: paid.length,
        aro: paid.length ? revenue / paid.length : 0,
        completedJobs: completed.count ?? 0,
        activeMembers: members.count ?? 0,
        pendingEstimates: ests.count ?? 0,
        techHours: Math.round(totalMin / 60),
        partsRevenue,
        partsCost,
        partsMargin,
        partsMarginPct,
      });
    })();
  }, []);

  const fmt = (n: number) => '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl">Last 30 Days</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label="Revenue" value={fmt(data.revenue30)} />
        <KPI label="Avg Repair Order" value={fmt(data.aro)} />
        <KPI label="Paid Invoices" value={String(data.invoiceCount)} />
        <KPI label="Completed Jobs" value={String(data.completedJobs)} />
        <KPI label="Active Memberships" value={String(data.activeMembers)} />
        <KPI label="Pending Estimates" value={String(data.pendingEstimates)} />
        <KPI label="Tech Hours" value={String(data.techHours)} />
      </div>

      <h2 className="font-display text-xl pt-2">Parts Profitability (paid invoices, 30d)</h2>
      <p className="text-xs text-muted-foreground -mt-2">
        Cost is recovered from imported PDF quotes by dividing the marked-up price by 1.30 (30% markup).
        Manually entered parts contribute only when a unit cost is set.
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
    <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground font-normal">{label}</CardTitle></CardHeader>
    <CardContent><div className="text-2xl font-bold">{value}</div></CardContent>
  </Card>
);
