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
import { Plus, Pencil, Share2, Trash2, Copy, ExternalLink, Wrench, Upload, Loader2 } from 'lucide-react';
import { useRef } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { shareLink } from '@/lib/share';
import { startRepairOrderFromEstimate } from '@/lib/repairOrders';

interface LineItem { description: string; quantity: number; unit_price: number; amount: number; catalog_item_id?: string; labor_hours?: number; }
interface Estimate {
  id: string;
  customer_id: string;
  vehicle_id: string | null;
  estimate_number: string | null;
  status: string;
  line_items: LineItem[];
  subtotal: number; tax: number; shop_supplies: number; total: number;
  notes: string | null;
  valid_until: string | null;
  approval_token: string;
  appointment_id: string | null;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted', sent: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
  approved: 'bg-green-500/15 text-green-600 border-green-500/30',
  declined: 'bg-red-500/15 text-red-600 border-red-500/30',
  expired: 'bg-yellow-500/15 text-yellow-700 border-yellow-500/30',
  converted: 'bg-purple-500/15 text-purple-600 border-purple-500/30',
};

const AdminEstimates = () => {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<any | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const [e, c, v, ca, s] = await Promise.all([
      supabase.from('estimates').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, full_name, email'),
      supabase.from('vehicles').select('id, owner_id, year, make, model'),
      supabase.from('catalog_items').select('*').eq('is_active', true).order('name'),
      supabase.from('shop_settings').select('*').eq('id', 1).single(),
    ]);
    setEstimates(((e.data ?? []) as any[]).map(d => ({ ...d, line_items: d.line_items || [] })) as Estimate[]);
    setCustomers(c.data ?? []);
    setVehicles(v.data ?? []);
    setCatalog(ca.data ?? []);
    setSettings(s.data);
  };
  useEffect(() => { load(); }, []);

  const customerName = (id: string) => customers.find(c => c.id === id)?.full_name || customers.find(c => c.id === id)?.email || 'Unknown';

  const newEstimate = () => {
    const valid_until = settings ? new Date(Date.now() + (settings.estimate_valid_days || 14) * 86400000).toISOString().slice(0, 10) : null;
    setEditing({ status: 'draft', line_items: [], subtotal: 0, tax: 0, shop_supplies: 0, total: 0, valid_until });
  };

  const importPdf = async (file: File) => {
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) return toast.error('PDF too large (max 15MB)');
    setImporting(true);
    try {
      const buf = await file.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let bin = '';
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      const pdf_base64 = btoa(bin);
      const { data, error } = await supabase.functions.invoke('parse-quote-pdf', {
        body: { pdf_base64, mime_type: file.type || 'application/pdf' },
      });
      if (error) throw error;
      const ex = data?.extracted;
      if (!ex) throw new Error('Nothing extracted');

      // Try to match an existing customer by email (case-insensitive)
      let matchedCustomer: any = null;
      if (ex.customer_email) {
        matchedCustomer = customers.find(c => c.email?.toLowerCase() === ex.customer_email.toLowerCase());
      }
      if (!matchedCustomer && ex.customer_name) {
        matchedCustomer = customers.find(c => c.full_name?.toLowerCase() === ex.customer_name.toLowerCase());
      }

      let matchedVehicle: any = null;
      if (matchedCustomer) {
        const vs = vehicles.filter(v => v.owner_id === matchedCustomer.id);
        if (ex.vehicle_make && ex.vehicle_model) {
          matchedVehicle = vs.find(v =>
            v.make?.toLowerCase() === ex.vehicle_make.toLowerCase() &&
            v.model?.toLowerCase() === ex.vehicle_model.toLowerCase() &&
            (!ex.vehicle_year || v.year === ex.vehicle_year)
          );
        }
      }

      const lines: LineItem[] = (ex.line_items || []).map((li: any) => ({
        description: li.description || '',
        quantity: Number(li.quantity) || 1,
        unit_price: Number(li.unit_price) || 0,
        amount: (Number(li.quantity) || 1) * (Number(li.unit_price) || 0),
        labor_hours: Number(li.labor_hours) || 0,
      }));

      const subtotal = lines.reduce((s, i) => s + i.amount, 0);
      const shop = Math.min(subtotal * (settings?.shop_supplies_pct ?? 0.05), settings?.shop_supplies_max ?? 50);
      const tax = (subtotal + shop) * (settings?.tax_rate ?? 0.07);
      const valid_until = settings ? new Date(Date.now() + (settings.estimate_valid_days || 14) * 86400000).toISOString().slice(0, 10) : null;

      const notesParts: string[] = [];
      if (ex.notes) notesParts.push(ex.notes);
      if (!matchedCustomer && ex.customer_name) {
        notesParts.push(`Imported customer: ${ex.customer_name}${ex.customer_email ? ' / ' + ex.customer_email : ''}${ex.customer_phone ? ' / ' + ex.customer_phone : ''}`);
      }
      if (!matchedVehicle && (ex.vehicle_make || ex.vehicle_model)) {
        notesParts.push(`Imported vehicle: ${ex.vehicle_year ?? ''} ${ex.vehicle_make ?? ''} ${ex.vehicle_model ?? ''}${ex.vehicle_vin ? ' VIN ' + ex.vehicle_vin : ''}`.trim());
      }

      setEditing({
        status: 'draft',
        customer_id: matchedCustomer?.id ?? null,
        vehicle_id: matchedVehicle?.id ?? null,
        line_items: lines,
        subtotal,
        shop_supplies: shop,
        tax,
        total: subtotal + shop + tax,
        notes: notesParts.join('\n') || null,
        valid_until,
      });
      toast.success(matchedCustomer ? 'PDF imported — review and save' : 'PDF imported — pick a customer to save');
    } catch (e: any) {
      toast.error(e.message || 'Could not parse PDF');
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const recalc = (li: LineItem[]) => {
    const subtotal = li.reduce((s, i) => s + (Number(i.quantity) * Number(i.unit_price)), 0);
    const shop = Math.min(subtotal * (settings?.shop_supplies_pct ?? 0.05), settings?.shop_supplies_max ?? 50);
    const tax = (subtotal + shop) * (settings?.tax_rate ?? 0.07);
    return { subtotal, shop_supplies: shop, tax, total: subtotal + shop + tax };
  };

  const updateLines = (lines: LineItem[]) => {
    const totals = recalc(lines);
    setEditing((p: any) => ({ ...p, line_items: lines, ...totals }));
  };

  const addLine = (catalogId?: string) => {
    const item = catalog.find(c => c.id === catalogId);
    const line: LineItem = item
      ? { description: item.name, quantity: 1, unit_price: Number(item.unit_price), amount: Number(item.unit_price), catalog_item_id: item.id, labor_hours: Number(item.labor_hours) || 0 }
      : { description: '', quantity: 1, unit_price: 0, amount: 0, labor_hours: 0 };
    updateLines([...(editing.line_items || []), line]);
  };

  const updateLine = (idx: number, patch: Partial<LineItem>) => {
    const lines = [...editing.line_items];
    lines[idx] = { ...lines[idx], ...patch };
    lines[idx].amount = Number(lines[idx].quantity) * Number(lines[idx].unit_price);
    updateLines(lines);
  };

  const removeLine = (idx: number) => updateLines(editing.line_items.filter((_: any, i: number) => i !== idx));

  const save = async () => {
    if (!editing.customer_id) return toast.error('Select customer');
    if (!editing.id) {
      const num = `EST-${format(new Date(), 'yyyyMMdd')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const { error } = await supabase.from('estimates').insert({ ...editing, estimate_number: num });
      if (error) return toast.error(error.message);
    } else {
      const { id, approval_token, created_at, ...update } = editing;
      const { error } = await supabase.from('estimates').update(update).eq('id', id);
      if (error) return toast.error(error.message);
    }
    toast.success('Saved');
    setEditing(null);
    load();
  };

  const send = async (est: Estimate) => {
    const customer = customers.find(c => c.id === est.customer_id);
    const url = `${window.location.origin}/estimate/${est.approval_token}`;
    await supabase.from('estimates').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', est.id);
    await shareLink({
      url,
      title: `Estimate ${est.estimate_number ?? ''}`.trim(),
      text: `${customer?.full_name || 'Customer'}, here is your estimate from MMAR Care for $${Number(est.total).toFixed(2)}:`,
      copyToastMessage: 'Estimate link copied — share with the customer',
    });
    load();
  };

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/estimate/${token}`);
    toast.success('Link copied');
  };

  const startRO = async (est: Estimate) => {
    try {
      await startRepairOrderFromEstimate(est);
      toast.success('Repair Order started — moved to In Progress');
      load();
    } catch (e: any) {
      toast.error(e.message || 'Could not start Repair Order');
    }
  };

  const customerVehicles = editing?.customer_id ? vehicles.filter(v => v.owner_id === editing.customer_id) : [];

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={e => e.target.files?.[0] && importPdf(e.target.files[0])} />
        <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={importing}>
          {importing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
          Import PDF Quote
        </Button>
        <Button onClick={newEstimate}><Plus className="h-4 w-4 mr-1" /> New Estimate</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Valid Until</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {estimates.map(e => (
                <TableRow key={e.id}>
                  <TableCell className="font-mono text-xs">{e.estimate_number}</TableCell>
                  <TableCell>{customerName(e.customer_id)}</TableCell>
                  <TableCell><Badge variant="outline" className={STATUS_COLORS[e.status]}>{e.status}</Badge></TableCell>
                  <TableCell className="text-right">${Number(e.total).toFixed(2)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{e.valid_until || '—'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => copyLink(e.approval_token)} title="Copy approval link"><Copy className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => window.open(`/estimate/${e.approval_token}`, '_blank')}><ExternalLink className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => send(e)} title="Share"><Share2 className="h-4 w-4" /></Button>
                      {(e.status === 'approved' || e.status === 'partially_approved') && (
                        <Button size="icon" variant="ghost" onClick={() => startRO(e)} title="Start Repair Order"><Wrench className="h-4 w-4 text-primary" /></Button>
                      )}
                      <Button size="icon" variant="ghost" onClick={() => setEditing(e)}><Pencil className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {estimates.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No estimates yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? 'Edit Estimate' : 'New Estimate'}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Customer</Label>
                  <Select value={editing.customer_id ?? ''} onValueChange={v => setEditing({ ...editing, customer_id: v, vehicle_id: null })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.full_name || c.email}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Vehicle</Label>
                  <Select value={editing.vehicle_id ?? ''} onValueChange={v => setEditing({ ...editing, vehicle_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {customerVehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.year} {v.make} {v.model}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Valid Until</Label><Input type="date" value={editing.valid_until ?? ''} onChange={e => setEditing({ ...editing, valid_until: e.target.value })} /></div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Line Items</Label>
                  <div className="flex gap-2">
                    <Select onValueChange={v => addLine(v)}>
                      <SelectTrigger className="w-[200px] h-8"><SelectValue placeholder="+ From catalog" /></SelectTrigger>
                      <SelectContent>
                        {catalog.map(c => <SelectItem key={c.id} value={c.id}>{c.name} (${Number(c.unit_price).toFixed(2)})</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="outline" onClick={() => addLine()}><Plus className="h-3 w-3 mr-1" /> Custom</Button>
                  </div>
                </div>
                <div className="border rounded">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="w-20">Qty</TableHead>
                        <TableHead className="w-20">Hrs</TableHead>
                        <TableHead className="w-28">Unit Price</TableHead>
                        <TableHead className="w-24 text-right">Amount</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(editing.line_items || []).map((l: LineItem, i: number) => (
                        <TableRow key={i}>
                          <TableCell><Input value={l.description} onChange={e => updateLine(i, { description: e.target.value })} /></TableCell>
                          <TableCell><Input type="number" step="0.5" value={l.quantity} onChange={e => updateLine(i, { quantity: parseFloat(e.target.value) || 0 })} /></TableCell>
                          <TableCell><Input type="number" step="0.1" value={l.labor_hours ?? 0} onChange={e => updateLine(i, { labor_hours: parseFloat(e.target.value) || 0 })} title="Billable labor hours" /></TableCell>
                          <TableCell><Input type="number" step="0.01" value={l.unit_price} onChange={e => updateLine(i, { unit_price: parseFloat(e.target.value) || 0 })} /></TableCell>
                          <TableCell className="text-right">${l.amount.toFixed(2)}</TableCell>
                          <TableCell><Button size="icon" variant="ghost" onClick={() => removeLine(i)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div><Label>Notes</Label><Textarea value={editing.notes ?? ''} onChange={e => setEditing({ ...editing, notes: e.target.value })} /></div>

              <div className="border-t pt-3 space-y-1 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>${Number(editing.subtotal).toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Shop Supplies</span><span>${Number(editing.shop_supplies).toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Tax</span><span>${Number(editing.tax).toFixed(2)}</span></div>
                <div className="flex justify-between font-bold text-base"><span>Total</span><span>${Number(editing.total).toFixed(2)}</span></div>
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

export default AdminEstimates;
