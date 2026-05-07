import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, AlertCircle, Upload, Calculator } from 'lucide-react';
import { toast } from 'sonner';

const parseCsv = (text: string): Record<string, string>[] => {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  return lines.slice(1).map(line => {
    const cells = line.match(/("([^"]|"")*"|[^,]*)(,|$)/g)?.map(c => c.replace(/,$/, '').replace(/^"|"$/g, '').replace(/""/g, '"').trim()) ?? [];
    return Object.fromEntries(headers.map((h, i) => [h, cells[i] ?? '']));
  });
};

interface CatalogItem {
  id: string;
  type: string;
  sku: string | null;
  name: string;
  description: string | null;
  category: string | null;
  unit_price: number;
  cost: number | null;
  labor_hours: number | null;
  track_inventory: boolean;
  on_hand: number | null;
  reorder_point: number | null;
  vendor: string | null;
  is_active: boolean;
}

const blank: Partial<CatalogItem> = {
  type: 'part', name: '', unit_price: 0, cost: 0, track_inventory: false, on_hand: 0, reorder_point: 0, is_active: true,
};

const AdminCatalog = () => {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<CatalogItem> | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('catalog_items').select('*').order('name');
    setItems((data ?? []) as CatalogItem[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing?.name) return toast.error('Name required');
    const payload = { ...editing };
    if (payload.id) {
      const { id, ...update } = payload;
      const { error } = await supabase.from('catalog_items').update(update as any).eq('id', id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from('catalog_items').insert(payload as any);
      if (error) return toast.error(error.message);
    }
    toast.success('Saved');
    setEditing(null);
    load();
  };

  const filtered = items.filter(i => filter === 'all' || i.type === filter);
  const lowStock = items.filter(i => i.track_inventory && (i.on_hand ?? 0) <= (i.reorder_point ?? 0));

  return (
    <div className="space-y-4">
      {lowStock.length > 0 && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <div className="flex-1 text-sm"><strong>{lowStock.length}</strong> items at or below reorder point</div>
          </CardContent>
        </Card>
      )}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2">
          {['all', 'part', 'labor', 'kit', 'fee'].map(t => (
            <Button key={t} size="sm" variant={filter === t ? 'default' : 'outline'} onClick={() => setFilter(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            id="catalog-csv"
            type="file"
            accept=".csv"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const rows = parseCsv(await file.text());
              if (rows.length === 0) return toast.error('No rows found');
              const payload = rows.map(r => ({
                type: r.type || 'part',
                sku: r.sku || null,
                name: r.name,
                description: r.description || null,
                category: r.category || null,
                vendor: r.vendor || null,
                cost: parseFloat(r.cost || '0') || 0,
                unit_price: parseFloat(r.unit_price || r.price || '0') || 0,
                track_inventory: ['true', 'yes', '1'].includes((r.track_inventory || '').toLowerCase()),
                on_hand: parseInt(r.on_hand || '0') || 0,
                reorder_point: parseInt(r.reorder_point || '0') || 0,
                is_active: true,
              })).filter(p => p.name);
              const { error } = await supabase.from('catalog_items').insert(payload as any);
              if (error) return toast.error(error.message);
              toast.success(`Imported ${payload.length} items`);
              (e.target as HTMLInputElement).value = '';
              load();
            }}
          />
          <Button variant="outline" onClick={() => document.getElementById('catalog-csv')?.click()}>
            <Upload className="h-4 w-4 mr-1" /> Import CSV
          </Button>
          <Button onClick={() => setEditing(blank)}><Plus className="h-4 w-4 mr-1" /> New Item</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">On Hand</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(i => {
                const low = i.track_inventory && (i.on_hand ?? 0) <= (i.reorder_point ?? 0);
                return (
                  <TableRow key={i.id}>
                    <TableCell className="font-medium">
                      {i.name}
                      {!i.is_active && <Badge variant="outline" className="ml-2">Inactive</Badge>}
                    </TableCell>
                    <TableCell><Badge variant="outline">{i.type}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{i.sku || '—'}</TableCell>
                    <TableCell className="text-right">${Number(i.unit_price).toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      {i.track_inventory ? (
                        <span className={low ? 'text-yellow-600 font-semibold' : ''}>{i.on_hand}</span>
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => setEditing(i)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!loading && filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No items</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing?.id ? 'Edit Item' : 'New Item'}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label>Name</Label><Input value={editing.name ?? ''} onChange={e => setEditing({ ...editing, name: e.target.value })} /></div>
              <div><Label>Type</Label>
                <Select value={editing.type} onValueChange={v => setEditing({ ...editing, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="part">Part</SelectItem>
                    <SelectItem value="labor">Labor</SelectItem>
                    <SelectItem value="kit">Kit</SelectItem>
                    <SelectItem value="fee">Fee</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>SKU</Label><Input value={editing.sku ?? ''} onChange={e => setEditing({ ...editing, sku: e.target.value })} /></div>
              <div><Label>Category</Label><Input value={editing.category ?? ''} onChange={e => setEditing({ ...editing, category: e.target.value })} /></div>
              <div><Label>Vendor</Label><Input value={editing.vendor ?? ''} onChange={e => setEditing({ ...editing, vendor: e.target.value })} /></div>
              <div><Label>Unit Price ($)</Label><Input type="number" step="0.01" value={editing.unit_price ?? 0} onChange={e => setEditing({ ...editing, unit_price: parseFloat(e.target.value) || 0 })} /></div>
              <div><Label>Cost ($)</Label><Input type="number" step="0.01" value={editing.cost ?? 0} onChange={e => setEditing({ ...editing, cost: parseFloat(e.target.value) || 0 })} /></div>
              <div className="col-span-2 flex flex-wrap gap-2 -mt-1">
                <span className="text-xs text-muted-foreground self-center">Auto-markup from cost:</span>
                {[1.4, 1.5, 1.75, 2.0].map(m => (
                  <Button key={m} type="button" size="sm" variant="outline" onClick={() => setEditing({ ...editing, unit_price: Number(((editing.cost ?? 0) * m).toFixed(2)) })}>
                    <Calculator className="h-3 w-3 mr-1" /> {Math.round((m - 1) * 100)}%
                  </Button>
                ))}
                {(editing.cost ?? 0) > 0 && (editing.unit_price ?? 0) > 0 && (
                  <span className="text-xs self-center text-muted-foreground">
                    Margin: {Math.round((((editing.unit_price ?? 0) - (editing.cost ?? 0)) / (editing.unit_price ?? 1)) * 100)}%
                  </span>
                )}
              </div>
              {editing.type === 'labor' && (
                <div className="col-span-2"><Label>Standard Labor Hours</Label><Input type="number" step="0.1" value={editing.labor_hours ?? 0} onChange={e => setEditing({ ...editing, labor_hours: parseFloat(e.target.value) || 0 })} /></div>
              )}
              <div className="col-span-2"><Label>Description</Label><Input value={editing.description ?? ''} onChange={e => setEditing({ ...editing, description: e.target.value })} /></div>
              <div className="col-span-2 flex items-center gap-3 border-t pt-3">
                <Switch checked={editing.track_inventory ?? false} onCheckedChange={v => setEditing({ ...editing, track_inventory: v })} />
                <Label>Track inventory</Label>
              </div>
              {editing.track_inventory && (
                <>
                  <div><Label>On Hand</Label><Input type="number" value={editing.on_hand ?? 0} onChange={e => setEditing({ ...editing, on_hand: parseInt(e.target.value) || 0 })} /></div>
                  <div><Label>Reorder Point</Label><Input type="number" value={editing.reorder_point ?? 0} onChange={e => setEditing({ ...editing, reorder_point: parseInt(e.target.value) || 0 })} /></div>
                </>
              )}
              <div className="col-span-2 flex items-center gap-3">
                <Switch checked={editing.is_active ?? true} onCheckedChange={v => setEditing({ ...editing, is_active: v })} />
                <Label>Active</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCatalog;
