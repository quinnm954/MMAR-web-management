import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Car, Wrench, FileText, ClipboardCheck, Receipt, Trash2, Plus, Loader2 } from 'lucide-react';
import VinDecoder from './VinDecoder';
import DeleteButton from './DeleteButton';
import { toast } from 'sonner';

const TIMELINE_TABLE: Record<string, string> = {
  service: 'service_records',
  inspection: 'inspections',
  estimate: 'estimates',
  invoice: 'invoices',
};

interface CustomerOpt { id: string; full_name: string | null; email: string | null; }

const blankVehicle = { owner_id: '', year: '', make: '', model: '', trim: '', vin: '', license_plate: '', current_mileage: '', color: '' };

export default function AdminGarage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState<CustomerOpt[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ ...blankVehicle });
  const [saving, setSaving] = useState(false);

  const loadVehicles = async () => {
    const { data } = await supabase
      .from('vehicles')
      .select('id, year, make, model, license_plate, current_mileage, owner_id, is_active, profiles:owner_id(full_name, email)')
      .eq('is_active', true)
      .order('updated_at', { ascending: false });
    setVehicles(data ?? []);
  };

  const loadCustomers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .order('full_name', { ascending: true });
    setCustomers(data ?? []);
  };

  useEffect(() => { loadVehicles(); loadCustomers(); }, []);

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

  const addVehicle = async () => {
    if (!form.owner_id) return toast.error('Select a customer');
    if (!form.year || !form.make || !form.model) return toast.error('Year, make, and model are required');
    setSaving(true);
    const { error } = await supabase.from('vehicles').insert({
      owner_id: form.owner_id,
      year: Number(form.year),
      make: form.make.trim(),
      model: form.model.trim(),
      trim: form.trim.trim() || null,
      vin: form.vin.trim() || null,
      license_plate: form.license_plate.trim() || null,
      current_mileage: form.current_mileage ? Number(form.current_mileage) : null,
      color: form.color.trim() || null,
      is_active: true,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success('Vehicle added');
    setAddOpen(false);
    setForm({ ...blankVehicle });
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
        <div className="flex gap-2">
          <Input placeholder="Search vehicles..." value={search} onChange={e => setSearch(e.target.value)} />
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="default" className="shrink-0">
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Vehicle</DialogTitle>
                <DialogDescription>Assign a vehicle to a customer.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Customer</Label>
                  <Select value={form.owner_id} onValueChange={(v) => setForm({ ...form, owner_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {customers.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.full_name || '—'} {c.email ? `· ${c.email}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div><Label>Year</Label><Input value={form.year} onChange={e => setForm({ ...form, year: e.target.value.replace(/\D/g, '').slice(0, 4) })} /></div>
                  <div><Label>Make</Label><Input value={form.make} onChange={e => setForm({ ...form, make: e.target.value })} /></div>
                  <div><Label>Model</Label><Input value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Trim</Label><Input value={form.trim} onChange={e => setForm({ ...form, trim: e.target.value })} /></div>
                  <div><Label>Color</Label><Input value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>License plate</Label><Input value={form.license_plate} onChange={e => setForm({ ...form, license_plate: e.target.value })} /></div>
                  <div><Label>Mileage</Label><Input inputMode="numeric" value={form.current_mileage} onChange={e => setForm({ ...form, current_mileage: e.target.value.replace(/\D/g, '') })} /></div>
                </div>
                <div><Label>VIN</Label><Input value={form.vin} onChange={e => setForm({ ...form, vin: e.target.value.toUpperCase() })} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                <Button onClick={addVehicle} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Vehicle'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
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
