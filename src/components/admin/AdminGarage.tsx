import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Car, Wrench, FileText, ClipboardCheck, Receipt, Trash2 } from 'lucide-react';
import VinDecoder from './VinDecoder';
import DeleteButton from './DeleteButton';
import { toast } from 'sonner';

const TIMELINE_TABLE: Record<string, string> = {
  service: 'service_records',
  inspection: 'inspections',
  estimate: 'estimates',
  invoice: 'invoices',
};

export default function AdminGarage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  const loadVehicles = async () => {
    const { data } = await supabase
      .from('vehicles')
      .select('id, year, make, model, license_plate, current_mileage, owner_id, is_active, profiles:owner_id(full_name, email)')
      .eq('is_active', true)
      .order('updated_at', { ascending: false });
    setVehicles(data ?? []);
  };

  useEffect(() => { loadVehicles(); }, []);

  const loadTimeline = async () => {
    if (!selected) return;
    const [services, inspections, estimates, invoices] = await Promise.all([
      supabase.from('service_records').select('*').eq('vehicle_id', selected),
      supabase.from('inspections').select('*').eq('vehicle_id', selected),
      supabase.from('estimates').select('*').eq('vehicle_id', selected),
      supabase.from('invoices').select('*, service_records!inner(vehicle_id)').eq('service_records.vehicle_id', selected),
    ]);
    const items = [
      ...(services.data ?? []).map(x => ({ type: 'service', date: x.service_date, title: x.service_type, body: x.labor_performed, id: x.id })),
      ...(inspections.data ?? []).map(x => ({ type: 'inspection', date: x.created_at, title: 'Inspection', body: x.summary_notes, id: x.id })),
      ...(estimates.data ?? []).map(x => ({ type: 'estimate', date: x.created_at, title: `Estimate #${x.estimate_number || ''}`, body: `$${x.total} — ${x.status}`, id: x.id })),
      ...(invoices.data ?? []).map(x => ({ type: 'invoice', date: x.created_at, title: `Invoice ${x.invoice_number || ''}`, body: `$${x.total} — ${x.status}`, id: x.id })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setTimeline(items);
  };

  useEffect(() => { loadTimeline(); /* eslint-disable-next-line */ }, [selected]);

  const removeVehicle = async (id: string) => {
    const { error } = await supabase.from('vehicles').update({ is_active: false }).eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Vehicle removed');
    if (selected === id) { setSelected(null); setTimeline([]); }
    loadVehicles();
  };

  const filtered = vehicles.filter(v =>
    !search ||
    `${v.year} ${v.make} ${v.model} ${v.license_plate} ${v.profiles?.full_name} ${v.profiles?.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const icon = (t: string) => ({ service: Wrench, inspection: ClipboardCheck, estimate: FileText, invoice: Receipt } as any)[t] || Car;

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <div className="space-y-2">
        <Input placeholder="Search vehicles..." value={search} onChange={e => setSearch(e.target.value)} />
        <div className="space-y-1 max-h-[600px] overflow-y-auto">
          {filtered.map(v => (
            <Card
              key={v.id}
              className={`cursor-pointer ${selected === v.id ? 'border-primary' : ''}`}
              onClick={() => setSelected(v.id)}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-sm">{v.year} {v.make} {v.model}</div>
                    <div className="text-xs text-muted-foreground truncate">{v.profiles?.full_name || v.profiles?.email}</div>
                    <div className="text-xs">{v.license_plate} • {v.current_mileage?.toLocaleString() || 0} mi</div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive shrink-0" onClick={(e) => e.stopPropagation()} title="Remove vehicle">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove this vehicle?</AlertDialogTitle>
                        <AlertDialogDescription>
                          {v.year} {v.make} {v.model} will be hidden from the active garage. Service history is preserved.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => removeVehicle(v.id)} className="bg-destructive hover:bg-destructive/90">
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <div className="md:col-span-2 space-y-3">
        <VinDecoder onApply={(d) => {
          navigator.clipboard?.writeText(JSON.stringify(d, null, 2));
          toast.success('Copied decoded data to clipboard');
        }} />
        {!selected ? (
          <Card><CardContent className="p-6 text-sm text-muted-foreground">Select a vehicle to view timeline.</CardContent></Card>
        ) : (
          <Card>
            <CardHeader><CardTitle>Vehicle Timeline</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {timeline.length === 0 && <p className="text-sm text-muted-foreground">No history yet.</p>}
              {timeline.map((item, i) => {
                const Icon = icon(item.type);
                return (
                  <div key={i} className="flex gap-3 border-l-2 border-primary/30 pl-3">
                    <Icon className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-semibold text-sm">{item.title}</div>
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-[10px]">{item.type}</Badge>
                          <DeleteButton
                            table={TIMELINE_TABLE[item.type]}
                            id={item.id}
                            size="icon"
                            label={`Delete ${item.type}`}
                            description={`Delete this ${item.type}? This cannot be undone.`}
                            onDeleted={loadTimeline}
                          />
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">{new Date(item.date).toLocaleDateString()}</div>
                      {item.body && <div className="text-sm mt-1">{item.body}</div>}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
