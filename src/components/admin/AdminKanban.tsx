import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const COLUMNS = [
  { id: 'inbox', label: 'Inbox' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'awaiting_approval', label: 'Awaiting Approval' },
  { id: 'completed', label: 'Completed' },
];

export default function AdminKanban() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [dragId, setDragId] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from('appointments')
      .select('id, service_type, description, customer_id, scheduled_at, board_column, priority, status, profiles:customer_id(full_name, email)')
      .order('sort_order', { ascending: true });
    setJobs(data ?? []);
  };

  useEffect(() => { load(); }, []);

  const moveTo = async (id: string, col: string) => {
    const { error } = await supabase.from('appointments').update({ board_column: col }).eq('id', id);
    if (error) return toast.error(error.message);
    setJobs(j => j.map(x => x.id === id ? { ...x, board_column: col } : x));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
      {COLUMNS.map(col => (
        <div
          key={col.id}
          className="bg-muted/30 rounded-lg p-2 min-h-[300px]"
          onDragOver={e => e.preventDefault()}
          onDrop={() => dragId && moveTo(dragId, col.id)}
        >
          <div className="font-display text-sm mb-2 px-1 flex justify-between items-center">
            <span>{col.label}</span>
            <Badge variant="secondary">{jobs.filter(j => (j.board_column || 'inbox') === col.id).length}</Badge>
          </div>
          <div className="space-y-2">
            {jobs.filter(j => (j.board_column || 'inbox') === col.id).map(job => (
              <Card
                key={job.id}
                draggable
                onDragStart={() => setDragId(job.id)}
                onDragEnd={() => setDragId(null)}
                className="cursor-grab active:cursor-grabbing"
              >
                <CardContent className="p-3 space-y-1">
                  <div className="text-sm font-semibold">{job.service_type}</div>
                  <div className="text-xs text-muted-foreground">{job.profiles?.full_name || job.profiles?.email}</div>
                  {job.scheduled_at && <div className="text-xs">{new Date(job.scheduled_at).toLocaleString()}</div>}
                  {job.priority !== 'normal' && <Badge variant="destructive" className="text-[10px]">{job.priority}</Badge>}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
