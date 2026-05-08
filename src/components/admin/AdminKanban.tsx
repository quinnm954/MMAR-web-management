import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import RepairOrderDetail from './RepairOrderDetail';

const COLUMNS = [
  { id: 'inbox', label: 'New / Inbox', status: 'requested' },
  { id: 'scheduled', label: 'Scheduled', status: 'scheduled' },
  { id: 'in_progress', label: 'In Progress', status: 'in_progress' },
  { id: 'awaiting_approval', label: 'Awaiting Approval', status: 'in_progress' },
  { id: 'ready_for_invoice', label: 'Ready to Invoice', status: 'in_progress' },
  { id: 'completed', label: 'Completed', status: 'completed' },
];

export default function AdminKanban() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [dragId, setDragId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = async () => {
    const { data: appts } = await supabase
      .from('appointments')
      .select('id, service_type, customer_id, vehicle_id, scheduled_at, board_column, priority, status, profiles:customer_id(full_name, email), vehicle:vehicles(year, make, model)')
      .order('sort_order', { ascending: true });
    const ids = (appts ?? []).map((a: any) => a.id);
    let estByAppt: Record<string, any> = {};
    let invByAppt: Record<string, any> = {};
    if (ids.length) {
      const [{ data: ests }, { data: srs }] = await Promise.all([
        supabase.from('estimates').select('id, appointment_id, status, total').in('appointment_id', ids),
        supabase.from('service_records').select('id, appointment_id').in('appointment_id', ids),
      ]);
      (ests ?? []).forEach((e: any) => { estByAppt[e.appointment_id] = e; });
      const srIds = (srs ?? []).map((s: any) => s.id);
      let invs: any[] = [];
      if (srIds.length) {
        const { data } = await supabase.from('invoices').select('id, service_record_id, status, total, amount_paid').in('service_record_id', srIds);
        invs = data ?? [];
      }
      const srToAppt: Record<string, string> = {};
      (srs ?? []).forEach((s: any) => { srToAppt[s.id] = s.appointment_id; });
      invs.forEach((i: any) => {
        const aid = srToAppt[i.service_record_id];
        if (aid) invByAppt[aid] = i;
      });
    }
    setJobs((appts ?? []).map((a: any) => ({ ...a, estimate: estByAppt[a.id], invoice: invByAppt[a.id] })));
  };

  useEffect(() => { load(); }, []);

  const moveTo = async (id: string, colId: string) => {
    const col = COLUMNS.find(c => c.id === colId);
    if (!col) return;
    const patch: any = { board_column: colId, status: col.status };
    const { error } = await supabase.from('appointments').update(patch).eq('id', id);
    if (error) return toast.error(error.message);
    setJobs(j => j.map(x => x.id === id ? { ...x, ...patch } : x));
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {COLUMNS.map(col => {
          const items = jobs.filter(j => (j.board_column || 'inbox') === col.id);
          return (
            <div
              key={col.id}
              className="bg-muted/30 rounded-lg p-2 min-h-[300px]"
              onDragOver={e => e.preventDefault()}
              onDrop={() => dragId && moveTo(dragId, col.id)}
            >
              <div className="font-display text-xs mb-2 px-1 flex justify-between items-center uppercase tracking-wider">
                <span>{col.label}</span>
                <Badge variant="secondary">{items.length}</Badge>
              </div>
              <div className="space-y-2">
                {items.map(job => (
                  <Card
                    key={job.id}
                    draggable
                    onDragStart={() => setDragId(job.id)}
                    onDragEnd={() => setDragId(null)}
                    onClick={() => setOpenId(job.id)}
                    className="cursor-pointer hover:border-primary/50 transition-colors"
                  >
                    <CardContent className="p-2.5 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-muted-foreground">RO#{job.id.slice(0, 6).toUpperCase()}</span>
                        {job.priority && job.priority !== 'normal' && (
                          <Badge variant="destructive" className="text-[9px] py-0 px-1">{job.priority}</Badge>
                        )}
                      </div>
                      <div className="text-sm font-semibold leading-tight">{job.service_type}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {job.profiles?.full_name || job.profiles?.email}
                      </div>
                      {job.vehicle && (
                        <div className="text-[11px] text-muted-foreground truncate">
                          {job.vehicle.year} {job.vehicle.make} {job.vehicle.model}
                        </div>
                      )}
                      {job.scheduled_at && (
                        <div className="text-[11px]">{new Date(job.scheduled_at).toLocaleDateString()}</div>
                      )}
                      <div className="flex flex-wrap gap-1 pt-1">
                        {job.estimate && (
                          <Badge variant="outline" className="text-[9px] py-0 px-1">
                            EST {job.estimate.status} · ${Number(job.estimate.total).toFixed(0)}
                          </Badge>
                        )}
                        {job.invoice && (
                          <Badge variant={job.invoice.status === 'paid' ? 'default' : 'secondary'} className="text-[9px] py-0 px-1">
                            INV {job.invoice.status}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <RepairOrderDetail appointmentId={openId} open={!!openId} onClose={() => { setOpenId(null); load(); }} />
    </>
  );
}
