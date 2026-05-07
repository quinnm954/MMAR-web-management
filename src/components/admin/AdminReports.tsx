import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminReports() {
  const [data, setData] = useState({
    revenue30: 0,
    invoiceCount: 0,
    aro: 0,
    completedJobs: 0,
    activeMembers: 0,
    pendingEstimates: 0,
    techHours: 0,
  });

  useEffect(() => {
    (async () => {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const [inv, completed, members, ests, hours] = await Promise.all([
        supabase.from('invoices').select('total, status').gte('created_at', since),
        supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('status', 'completed').gte('created_at', since),
        supabase.from('memberships').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('estimates').select('id', { count: 'exact', head: true }).eq('status', 'sent'),
        supabase.from('time_entries').select('duration_minutes').gte('clock_in', since),
      ]);
      const paid = (inv.data ?? []).filter(i => i.status === 'paid');
      const revenue = paid.reduce((s, i) => s + Number(i.total || 0), 0);
      const totalMin = (hours.data ?? []).reduce((s, e) => s + (e.duration_minutes || 0), 0);
      setData({
        revenue30: revenue,
        invoiceCount: paid.length,
        aro: paid.length ? revenue / paid.length : 0,
        completedJobs: completed.count ?? 0,
        activeMembers: members.count ?? 0,
        pendingEstimates: ests.count ?? 0,
        techHours: Math.round(totalMin / 60),
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
    </div>
  );
}

const KPI = ({ label, value }: { label: string; value: string }) => (
  <Card>
    <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground font-normal">{label}</CardTitle></CardHeader>
    <CardContent><div className="text-2xl font-bold">{value}</div></CardContent>
  </Card>
);
