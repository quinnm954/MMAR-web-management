import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Play, Square, Wrench } from 'lucide-react';

export default function AdminTimeTracking() {
  const [entries, setEntries] = useState<any[]>([]);
  const [techs, setTechs] = useState<any[]>([]);
  const [ros, setROs] = useState<any[]>([]);
  const [techId, setTechId] = useState('');
  const [roId, setRoId] = useState('');

  const load = async () => {
    const [{ data: e }, { data: t }, { data: a }] = await Promise.all([
      supabase
        .from('time_entries')
        .select('*, technician:technician_id(id), appointment:appointment_id(id, service_type, customer_id, vehicle_id, profiles:customer_id(full_name), vehicle:vehicles(year, make, model))')
        .order('clock_in', { ascending: false })
        .limit(50),
      supabase.from('user_roles').select('user_id, profiles:user_id(full_name, email)').eq('role', 'technician'),
      supabase
        .from('appointments')
        .select('id, service_type, status, scheduled_at, profiles:customer_id(full_name), vehicle:vehicles(year, make, model)')
        .in('status', ['scheduled', 'in_progress'])
        .order('scheduled_at', { ascending: true }),
    ]);
    setEntries(e ?? []);
    setTechs(t ?? []);
    setROs(a ?? []);
  };

  useEffect(() => { load(); }, []);

  const clockIn = async () => {
    if (!techId || !roId) return toast.error('Select a tech and an active Repair Order');
    const { error } = await supabase.from('time_entries').insert({ technician_id: techId, appointment_id: roId });
    if (error) return toast.error(error.message);
    toast.success('Clocked in');
    load();
  };

  const clockOut = async (id: string, clockIn: string) => {
    const out = new Date();
    const minutes = Math.round((out.getTime() - new Date(clockIn).getTime()) / 60000);
    const { error } = await supabase
      .from('time_entries')
      .update({ clock_out: out.toISOString(), duration_minutes: minutes })
      .eq('id', id);
    if (error) return toast.error(error.message);
    load();
  };

  const fmtRO = (a: any) =>
    `RO#${a.id.slice(0, 6).toUpperCase()} — ${a.service_type}${a.profiles?.full_name ? ` · ${a.profiles.full_name}` : ''}`;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Wrench className="h-4 w-4" /> Clock onto a Repair Order</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-3">
          <div>
            <Label>Technician</Label>
            <Select value={techId} onValueChange={setTechId}>
              <SelectTrigger><SelectValue placeholder="Select tech" /></SelectTrigger>
              <SelectContent>
                {techs.map(t => <SelectItem key={t.user_id} value={t.user_id}>{t.profiles?.full_name || t.profiles?.email}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Repair Order</Label>
            <Select value={roId} onValueChange={setRoId}>
              <SelectTrigger><SelectValue placeholder="Active ROs only" /></SelectTrigger>
              <SelectContent>
                {ros.map(a => <SelectItem key={a.id} value={a.id}>{fmtRO(a)}</SelectItem>)}
                {ros.length === 0 && <div className="px-2 py-1 text-xs text-muted-foreground">No active ROs</div>}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={clockIn} className="w-full"><Play className="mr-2 h-4 w-4" /> Start</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent Time Entries</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {entries.map(e => {
              const a = e.appointment;
              return (
                <div key={e.id} className="flex items-center justify-between border rounded p-2 text-sm gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {a && <Badge variant="outline" className="font-mono text-[10px]">RO#{a.id.slice(0, 6).toUpperCase()}</Badge>}
                      <span className="font-medium truncate">{a?.service_type ?? '—'}</span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {a?.profiles?.full_name}
                      {a?.vehicle && ` · ${a.vehicle.year} ${a.vehicle.make} ${a.vehicle.model}`}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {new Date(e.clock_in).toLocaleString()}
                      {e.clock_out && ` → ${new Date(e.clock_out).toLocaleTimeString()}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">
                      {e.clock_out ? `${(e.duration_minutes / 60).toFixed(2)} h` : <span className="text-primary">Active</span>}
                    </div>
                    {!e.clock_out && (
                      <Button size="sm" variant="outline" onClick={() => clockOut(e.id, e.clock_in)}>
                        <Square className="mr-1 h-3 w-3" /> Stop
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
            {entries.length === 0 && <p className="text-sm text-muted-foreground">No entries yet.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
