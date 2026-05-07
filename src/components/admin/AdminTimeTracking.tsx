import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Play, Square } from 'lucide-react';

export default function AdminTimeTracking() {
  const [entries, setEntries] = useState<any[]>([]);
  const [techs, setTechs] = useState<any[]>([]);
  const [appts, setAppts] = useState<any[]>([]);
  const [techId, setTechId] = useState('');
  const [apptId, setApptId] = useState('');

  const load = async () => {
    const [{ data: e }, { data: t }, { data: a }] = await Promise.all([
      supabase.from('time_entries').select('*').order('clock_in', { ascending: false }).limit(50),
      supabase.from('user_roles').select('user_id, profiles:user_id(full_name, email)').eq('role', 'technician'),
      supabase.from('appointments').select('id, service_type, scheduled_at').order('scheduled_at', { ascending: false }).limit(30),
    ]);
    setEntries(e ?? []);
    setTechs(t ?? []);
    setAppts(a ?? []);
  };

  useEffect(() => { load(); }, []);

  const clockIn = async () => {
    if (!techId || !apptId) return toast.error('Select tech and appointment');
    const { error } = await supabase.from('time_entries').insert({ technician_id: techId, appointment_id: apptId });
    if (error) return toast.error(error.message);
    toast.success('Clocked in');
    load();
  };

  const clockOut = async (id: string, clockIn: string) => {
    const out = new Date();
    const minutes = Math.round((out.getTime() - new Date(clockIn).getTime()) / 60000);
    const { error } = await supabase.from('time_entries').update({ clock_out: out.toISOString(), duration_minutes: minutes }).eq('id', id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Clock In</CardTitle></CardHeader>
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
            <Label>Appointment</Label>
            <Select value={apptId} onValueChange={setApptId}>
              <SelectTrigger><SelectValue placeholder="Select appointment" /></SelectTrigger>
              <SelectContent>
                {appts.map(a => <SelectItem key={a.id} value={a.id}>{a.service_type} — {a.scheduled_at ? new Date(a.scheduled_at).toLocaleDateString() : 'TBD'}</SelectItem>)}
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
            {entries.map(e => (
              <div key={e.id} className="flex items-center justify-between border rounded p-2 text-sm">
                <div>
                  <div>{new Date(e.clock_in).toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">
                    {e.clock_out ? `${e.duration_minutes} min` : 'Active'}
                  </div>
                </div>
                {!e.clock_out && (
                  <Button size="sm" variant="outline" onClick={() => clockOut(e.id, e.clock_in)}>
                    <Square className="mr-1 h-3 w-3" /> Stop
                  </Button>
                )}
              </div>
            ))}
            {entries.length === 0 && <p className="text-sm text-muted-foreground">No entries yet.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
