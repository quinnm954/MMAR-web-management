import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Copy, ExternalLink, Trash2, Camera, Share2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { shareLink } from '@/lib/share';

const DEFAULT_TEMPLATE = [
  { category: 'Under Hood', items: ['Engine oil level', 'Coolant level', 'Brake fluid', 'Power steering fluid', 'Battery & terminals', 'Belts & hoses', 'Air filter'] },
  { category: 'Brakes', items: ['Front pads', 'Rear pads', 'Front rotors', 'Rear rotors', 'Brake lines'] },
  { category: 'Tires', items: ['LF tread depth', 'RF tread depth', 'LR tread depth', 'RR tread depth', 'Tire pressure'] },
  { category: 'Lights', items: ['Headlights', 'Tail lights', 'Brake lights', 'Turn signals'] },
  { category: 'Underneath', items: ['CV axles / boots', 'Suspension', 'Exhaust', 'Steering components'] },
];

interface Inspection {
  id: string; customer_id: string; vehicle_id: string;
  status: string; share_token: string; mileage: number | null;
  summary_notes: string | null; created_at: string;
}
interface InspectionItem {
  id?: string; inspection_id?: string;
  category: string; item_name: string; status: 'green' | 'yellow' | 'red' | 'na';
  notes: string | null; photo_urls: string[]; sort_order: number;
}

const STATUS_DOT: Record<string, string> = {
  green: 'bg-green-500', yellow: 'bg-yellow-500', red: 'bg-red-500', na: 'bg-muted',
};

const AdminInspections = () => {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [items, setItems] = useState<InspectionItem[]>([]);

  const load = async () => {
    const [i, c, v] = await Promise.all([
      supabase.from('inspections').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, full_name, email'),
      supabase.from('vehicles').select('id, owner_id, year, make, model'),
    ]);
    setInspections((i.data ?? []) as Inspection[]);
    setCustomers(c.data ?? []);
    setVehicles(v.data ?? []);
  };
  useEffect(() => { load(); }, []);

  const customerName = (id: string) => customers.find(c => c.id === id)?.full_name || customers.find(c => c.id === id)?.email || 'Unknown';
  const vehicleLabel = (id: string) => { const v = vehicles.find(x => x.id === id); return v ? `${v.year} ${v.make} ${v.model}` : 'Vehicle'; };

  const newInspection = () => {
    setEditing({ status: 'in_progress' });
    const seed: InspectionItem[] = [];
    let order = 0;
    for (const cat of DEFAULT_TEMPLATE) {
      for (const name of cat.items) {
        seed.push({ category: cat.category, item_name: name, status: 'na', notes: null, photo_urls: [], sort_order: order++ });
      }
    }
    setItems(seed);
  };

  const openExisting = async (insp: Inspection) => {
    setEditing(insp);
    const { data } = await supabase.from('inspection_items').select('*').eq('inspection_id', insp.id).order('sort_order');
    setItems((data ?? []).map((d: any) => ({ ...d, photo_urls: d.photo_urls || [] })));
  };

  const updateItem = (idx: number, patch: Partial<InspectionItem>) => {
    const next = [...items]; next[idx] = { ...next[idx], ...patch }; setItems(next);
  };

  const uploadPhoto = async (idx: number, file: File) => {
    const path = `${editing.id || 'tmp'}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('inspection-photos').upload(path, file);
    if (error) return toast.error(error.message);
    const { data } = supabase.storage.from('inspection-photos').getPublicUrl(path);
    updateItem(idx, { photo_urls: [...items[idx].photo_urls, data.publicUrl] });
  };

  const save = async () => {
    if (!editing.customer_id || !editing.vehicle_id) return toast.error('Select customer & vehicle');
    let inspId = editing.id;
    if (!inspId) {
      const { data, error } = await supabase.from('inspections').insert({
        customer_id: editing.customer_id, vehicle_id: editing.vehicle_id,
        mileage: editing.mileage, summary_notes: editing.summary_notes, status: editing.status,
      }).select().single();
      if (error) return toast.error(error.message);
      inspId = data.id;
    } else {
      const { id, share_token, created_at, ...up } = editing;
      await supabase.from('inspections').update(up).eq('id', id);
      await supabase.from('inspection_items').delete().eq('inspection_id', id);
    }
    const rows = items.map(it => ({
      inspection_id: inspId, category: it.category, item_name: it.item_name,
      status: it.status, notes: it.notes, photo_urls: it.photo_urls, sort_order: it.sort_order,
    }));
    if (rows.length) await supabase.from('inspection_items').insert(rows);
    toast.success('Saved');
    setEditing(null); setItems([]);
    load();
  };

  const send = async (insp: Inspection) => {
    const customer = customers.find(c => c.id === insp.customer_id);
    const url = `${window.location.origin}/inspection/${insp.share_token}`;
    await supabase.from('inspections').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', insp.id);
    await shareLink({
      url,
      title: `Inspection report — ${vehicleLabel(insp.vehicle_id)}`,
      text: `${customer?.full_name || 'Customer'}, here is your inspection report from MMAR Care:`,
      copyToastMessage: 'Inspection link copied — share with the customer',
    });
    load();
  };

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/inspection/${token}`);
    toast.success('Link copied');
  };

  const createEstimateFromInspection = async (insp: Inspection) => {
    const { data: itemRows } = await supabase
      .from('inspection_items')
      .select('*')
      .eq('inspection_id', insp.id)
      .in('status', ['red', 'yellow']);

    if (!itemRows || itemRows.length === 0) {
      toast.error('No declined or recommended items found on this inspection');
      return;
    }

    const lineItems = itemRows.map((it: any) => ({
      description: `${it.category} — ${it.item_name}${it.notes ? ` (${it.notes})` : ''}`,
      priority: it.status === 'red' ? 'urgent' : 'recommended',
      quantity: 1,
      unit_price: 0,
      amount: 0,
    }));

    const estNumber = `EST-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${insp.id.slice(0, 6)}`;
    const validUntil = new Date(); validUntil.setDate(validUntil.getDate() + 30);

    const { error } = await supabase.from('estimates').insert({
      customer_id: insp.customer_id,
      vehicle_id: insp.vehicle_id,
      estimate_number: estNumber,
      status: 'draft',
      line_items: lineItems,
      subtotal: 0,
      tax: 0,
      shop_supplies: 0,
      total: 0,
      valid_until: validUntil.toISOString().slice(0, 10),
      notes: `Auto-generated from inspection on ${new Date(insp.created_at).toLocaleDateString()}. Add pricing before sending.`,
    });

    if (error) return toast.error(error.message);
    toast.success(`Draft estimate created with ${lineItems.length} item${lineItems.length === 1 ? '' : 's'} — open Estimates tab to add pricing`);
  };

  const customerVehicles = editing?.customer_id ? vehicles.filter(v => v.owner_id === editing.customer_id) : [];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={newInspection}><Plus className="h-4 w-4 mr-1" /> New Inspection</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Mileage</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inspections.map(i => (
                <TableRow key={i.id}>
                  <TableCell>{customerName(i.customer_id)}</TableCell>
                  <TableCell className="text-sm">{vehicleLabel(i.vehicle_id)}</TableCell>
                  <TableCell><Badge variant="outline">{i.status}</Badge></TableCell>
                  <TableCell className="text-xs">{i.mileage?.toLocaleString() || '—'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" title="Copy link" onClick={() => copyLink(i.share_token)}><Copy className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" title="Open" onClick={() => window.open(`/inspection/${i.share_token}`, '_blank')}><ExternalLink className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" title="Share" onClick={() => send(i)}><Share2 className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" title="Create estimate from declined work" onClick={() => createEstimateFromInspection(i)}><FileText className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => openExisting(i)}>Edit</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {inspections.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No inspections yet</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={o => { if (!o) { setEditing(null); setItems([]); } }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? 'Edit Inspection' : 'New Inspection'}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Customer</Label>
                  <Select value={editing.customer_id ?? ''} onValueChange={v => setEditing({ ...editing, customer_id: v, vehicle_id: null })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.full_name || c.email}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Vehicle</Label>
                  <Select value={editing.vehicle_id ?? ''} onValueChange={v => setEditing({ ...editing, vehicle_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{customerVehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.year} {v.make} {v.model}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Mileage</Label><Input type="number" value={editing.mileage ?? ''} onChange={e => setEditing({ ...editing, mileage: parseInt(e.target.value) || null })} /></div>
              </div>

              {Object.entries(items.reduce((acc, it, idx) => {
                (acc[it.category] ||= []).push({ ...it, _idx: idx } as any);
                return acc;
              }, {} as Record<string, any[]>)).map(([cat, group]) => (
                <div key={cat} className="space-y-2">
                  <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">{cat}</h4>
                  {group.map((it: any) => (
                    <div key={it._idx} className="border rounded p-3 space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="flex-1 text-sm font-medium">{it.item_name}</span>
                        <div className="flex gap-1">
                          {(['green', 'yellow', 'red', 'na'] as const).map(s => (
                            <button key={s} onClick={() => updateItem(it._idx, { status: s })}
                              className={`w-6 h-6 rounded-full border-2 ${it.status === s ? 'border-foreground' : 'border-transparent'} ${STATUS_DOT[s]}`} />
                          ))}
                        </div>
                      </div>
                      {(it.status === 'yellow' || it.status === 'red') && (
                        <>
                          <Textarea placeholder="Notes" rows={2} value={it.notes ?? ''} onChange={e => updateItem(it._idx, { notes: e.target.value })} />
                          <div className="flex gap-2 items-center flex-wrap">
                            {it.photo_urls.map((url: string, pi: number) => (
                              <div key={pi} className="relative">
                                <img src={url} className="w-16 h-16 rounded object-cover border" />
                                <button onClick={() => updateItem(it._idx, { photo_urls: it.photo_urls.filter((_: any, x: number) => x !== pi) })} className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5">
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                            <label className="cursor-pointer flex items-center gap-1 text-xs border rounded px-2 py-1 hover:bg-muted">
                              <Camera className="h-3 w-3" /> Photo
                              <input type="file" accept="image/*" capture="environment" className="hidden"
                                onChange={e => { const f = e.target.files?.[0]; if (f) uploadPhoto(it._idx, f); }} />
                            </label>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ))}

              <div><Label>Summary Notes</Label><Textarea value={editing.summary_notes ?? ''} onChange={e => setEditing({ ...editing, summary_notes: e.target.value })} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditing(null); setItems([]); }}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminInspections;
