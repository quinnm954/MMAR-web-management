import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Phone, Mail, Truck } from 'lucide-react';
import { dialInApp } from '@/components/admin/Softphone';

type Fleet = {
  id: string; user_id: string; company_name: string; contact_name: string; phone: string; email: string;
  fleet_size: number; vehicle_types: string[]; yard_address: string; city: string; notes: string | null;
  sms_consent: boolean; status: string; created_at: string;
};
const STATUSES = ['pending', 'audit_scheduled', 'active', 'paused', 'closed'];
const LABEL: Record<string, string> = { pending: 'New', audit_scheduled: 'Audit scheduled', active: 'Active', paused: 'Paused', closed: 'Closed' };

export default function AdminFleetAccounts() {
  const [rows, setRows] = useState<Fleet[]>([]);
  const [counts, setCounts] = useState<Record<string, { vehicles: number; plans: number }>>({});
  const [q, setQ] = useState('');

  const load = async () => {
    const { data } = await supabase.from('fleet_accounts').select('*').order('created_at', { ascending: false });
    const list = (data as Fleet[]) || [];
    setRows(list);
    const ids = list.map((f) => f.user_id);
    if (!ids.length) return;
    const [v, m] = await Promise.all([
      supabase.from('vehicles').select('owner_id').in('owner_id', ids).eq('is_active', true),
      supabase.from('memberships').select('customer_id').in('customer_id', ids).eq('status', 'active'),
    ]);
    const c: Record<string, { vehicles: number; plans: number }> = {};
    ids.forEach((id) => (c[id] = { vehicles: 0, plans: 0 }));
    v.data?.forEach((r) => c[r.owner_id].vehicles++);
    m.data?.forEach((r) => c[r.customer_id].plans++);
    setCounts(c);
  };
  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('fleet_accounts').update({ status }).eq('id', id);
    if (error) return toast.error(error.message);
    setRows((r) => r.map((x) => (x.id === id ? { ...x, status } : x)));
  };

  const shown = rows.filter((f) => !q || `${f.company_name} ${f.contact_name} ${f.email} ${f.city}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <Card className="flex max-h-[65vh] min-h-[320px] flex-col overflow-hidden md:max-h-[calc(100dvh-220px)] md:min-h-0">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2"><Truck className="h-5 w-5" />Fleet accounts ({rows.length})</CardTitle>
          <CardDescription>Businesses that signed up at /fleet/register.</CardDescription>
        </div>
        <Input className="max-w-xs" placeholder="Search company, contact, city" value={q} onChange={(e) => setQ(e.target.value)} />
      </CardHeader>
      <CardContent className="flex-1 min-h-0 divide-y overflow-y-auto p-0">
        {shown.length === 0 && <p className="p-6 text-sm text-muted-foreground">No fleet sign-ups yet.</p>}
        {shown.map((f) => (
          <div key={f.id} className="p-4 grid gap-3 md:grid-cols-[2fr_1.2fr_1fr_auto] md:items-center">
            <div>
              <div className="font-semibold">{f.company_name}</div>
              <div className="text-xs text-muted-foreground">{f.contact_name} · {f.yard_address}, {f.city}</div>
              {f.vehicle_types.length > 0 && <div className="text-xs text-muted-foreground">{f.vehicle_types.join(', ')}</div>}
              {f.notes && <div className="text-xs mt-1 italic">"{f.notes}"</div>}
            </div>
            <div className="text-sm">
              <div>{f.fleet_size} vehicles stated</div>
              <div className="text-xs text-muted-foreground">{counts[f.user_id]?.vehicles ?? 0} added · {counts[f.user_id]?.plans ?? 0} on a plan</div>
              <div className="text-xs text-muted-foreground">Joined {new Date(f.created_at).toLocaleDateString()}{f.sms_consent ? ' · texts OK' : ''}</div>
            </div>
            <Select value={f.status} onValueChange={(v) => setStatus(f.id, v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{LABEL[s]}</SelectItem>)}</SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => dialInApp(f.phone)} aria-label="Call"><Phone className="h-4 w-4" /></Button>
              <Button size="sm" variant="outline" asChild aria-label="Email"><a href={`mailto:${f.email}`}><Mail className="h-4 w-4" /></a></Button>
              {f.status === 'pending' && <Badge>New</Badge>}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
