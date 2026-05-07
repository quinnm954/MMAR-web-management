import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Phone, Mail, RotateCw } from 'lucide-react';

export default function AdminDeclinedWork() {
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('declined');

  const load = async () => {
    const q = supabase
      .from('service_recommendations')
      .select('*, profiles:customer_id(full_name, email), vehicles:vehicle_id(year, make, model)')
      .order('updated_at', { ascending: false });
    const { data } = filter === 'all' ? await q : await q.eq('status', filter);
    setItems(data ?? []);
  };

  useEffect(() => { load(); }, [filter]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('service_recommendations').update({ status }).eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Updated');
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm">Status:</span>
        {['declined', 'pending', 'followup', 'approved', 'all'].map(s => (
          <Button key={s} size="sm" variant={filter === s ? 'default' : 'outline'} onClick={() => setFilter(s)}>
            {s}
          </Button>
        ))}
      </div>

      <div className="grid gap-3">
        {items.map(rec => (
          <Card key={rec.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex justify-between items-center">
                <span>{rec.recommendation}</span>
                <Badge variant={rec.priority === 'high' ? 'destructive' : 'secondary'}>{rec.priority}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="text-muted-foreground">
                {rec.vehicles?.year} {rec.vehicles?.make} {rec.vehicles?.model} •{' '}
                {rec.profiles?.full_name || rec.profiles?.email}
              </div>
              {rec.estimated_cost && <div>Estimated: ${Number(rec.estimated_cost).toFixed(2)}</div>}
              {rec.due_date && <div className="text-xs">Due: {new Date(rec.due_date).toLocaleDateString()}</div>}
              <div className="flex flex-wrap gap-2 pt-2">
                <Badge variant="outline">{rec.status}</Badge>
                <Select value={rec.status} onValueChange={(v) => updateStatus(rec.id, v)}>
                  <SelectTrigger className="w-40 h-7"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="declined">Declined</SelectItem>
                    <SelectItem value="followup">Follow Up</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                {rec.profiles?.email && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={`mailto:${rec.profiles.email}?subject=Follow-up: ${encodeURIComponent(rec.recommendation)}`}>
                      <Mail className="h-3 w-3 mr-1" /> Email
                    </a>
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => updateStatus(rec.id, 'followup')}>
                  <RotateCw className="h-3 w-3 mr-1" /> Mark Follow-up
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {items.length === 0 && (
          <Card><CardContent className="p-6 text-sm text-muted-foreground text-center">No items.</CardContent></Card>
        )}
      </div>
    </div>
  );
}
