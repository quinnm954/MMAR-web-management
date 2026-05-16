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
import DeleteButton from './DeleteButton';

interface LineItem { description: string; quantity: number; unit_price: number; amount: number; catalog_item_id?: string; labor_hours?: number; kind?: 'part' | 'labor' | 'fee'; unit_cost?: number; }
const PARTS_MARKUP = 1.30; // Imported PDF parts arrive already marked up 30% — divide to recover cost
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
  const [defaultLaborRate, setDefaultLaborRate] = useState<number>(0);
  const [editing, setEditing] = useState<any | null>(null);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<any | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const [e, c, v, ca, s, lr] = await Promise.all([
      supabase.from('estimates').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, full_name, email'),
      supabase.from('vehicles').select('id, owner_id, year, make, model'),
      supabase.from('catalog_items').select('*').eq('is_active', true).order('name'),
      supabase.from('shop_settings').select('*').eq('id', 1).single(),
      supabase.from('labor_rates').select('hourly_rate, is_default').order('is_default', { ascending: false }),
    ]);
    setEstimates(((e.data ?? []) as any[]).map(d => ({ ...d, line_items: d.line_items || [] })) as Estimate[]);
    setCustomers(c.data ?? []);
    setVehicles(v.data ?? []);
    setCatalog(ca.data ?? []);
    setSettings(s.data);
    const def = ((lr.data ?? []) as any[]).find((r) => r.is_default) ?? (lr.data?.[0] as any);
    setDefaultLaborRate(Number(def?.hourly_rate) || 0);
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
      if (error) {
        // Try to surface the function's JSON error message (e.g. AI credits exhausted)
        let serverMsg = '';
        try {
          const ctx: any = (error as any).context;
          if (ctx?.json) serverMsg = (await ctx.json())?.error || '';
          else if (ctx?.text) serverMsg = await ctx.text();
        } catch {}
        throw new Error(serverMsg || error.message || 'PDF import failed');
      }
      if (data?.error) throw new Error(data.error);
      const ex = data?.extracted;
      if (!ex) throw new Error('Nothing extracted');

      let matchedCustomer: any = null;
      if (ex.customer_email) {
        matchedCustomer = customers.find(c => c.email?.toLowerCase() === ex.customer_email.toLowerCase());
      }
      if (!matchedCustomer && ex.customer_name) {
        matchedCustomer = customers.find(c => c.full_name?.toLowerCase() === ex.customer_name.toLowerCase());
      }

      let matchedVehicle: any = null;
      if (matchedCustomer && ex.vehicle_make && ex.vehicle_model) {
        const vs = vehicles.filter(v => v.owner_id === matchedCustomer.id);
        matchedVehicle = vs.find(v =>
          v.make?.toLowerCase() === ex.vehicle_make.toLowerCase() &&
          v.model?.toLowerCase() === ex.vehicle_model.toLowerCase() &&
          (!ex.vehicle_year || v.year === ex.vehicle_year)
        );
      }

      const docLaborRate = Number(ex.labor_rate) || 0;
      const fallbackLaborRate = docLaborRate > 0 ? docLaborRate : defaultLaborRate;
      const LABOR_KEYWORDS = /\b(labor|labour|hours?|hrs?|tech\s*time|shop\s*labor|diagnostic|diag\b)\b/i;

      const lines: LineItem[] = (ex.line_items || []).map((li: any) => {
        let qty = Number(li.quantity) || 0;
        let price = Number(li.unit_price) || 0;
        const lineTotal = Number(li.line_total) || 0;
        let laborHrs = Number(li.labor_hours) || 0;
        const desc = String(li.description || '');
        const looksLikeLabor = LABOR_KEYWORDS.test(desc);

        let kind: 'part' | 'labor' | 'fee';
        if (li.kind === 'labor' || li.kind === 'fee' || li.kind === 'part') {
          kind = li.kind;
        } else {
          kind = laborHrs > 0 || looksLikeLabor ? 'labor' : 'part';
        }

        if (kind === 'labor') {
          // Normalize: quantity = hours, unit_price = hourly rate, labor_hours mirrors qty.
          if (laborHrs <= 0 && qty > 0) laborHrs = qty;
          if (laborHrs <= 0 && lineTotal > 0 && fallbackLaborRate > 0) {
            laborHrs = +(lineTotal / fallbackLaborRate).toFixed(2);
          }
          if (qty <= 0) qty = laborHrs;
          if (price <= 0) {
            if (lineTotal > 0 && qty > 0) price = +(lineTotal / qty).toFixed(2);
            else price = fallbackLaborRate;
          }
          if (qty <= 0 && lineTotal > 0 && price > 0) qty = +(lineTotal / price).toFixed(2);
        } else {
          if (qty <= 0) qty = 1;
          if (price <= 0 && lineTotal > 0 && qty > 0) price = +(lineTotal / qty).toFixed(2);
          laborHrs = 0;
        }

        const amount = +(qty * price).toFixed(2);
        const unit_cost = kind === 'part' ? +(price / PARTS_MARKUP).toFixed(2) : 0;
        return {
          description: desc,
          quantity: qty,
          unit_price: price,
          amount,
          labor_hours: laborHrs,
          kind,
          unit_cost,
        };
      });

      setPreview({ extracted: ex, matchedCustomer, matchedVehicle, lines });
    } catch (e: any) {
      toast.error(e.message || 'Could not parse PDF');
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const confirmImport = async () => {
    if (!preview) return;
    const { extracted: ex, matchedVehicle, lines } = preview;
    let { matchedCustomer } = preview;
    // Only parts are taxable / accrue shop supplies. Labor and fees never do.
    const taxableSubtotal = lines.reduce((s: number, i: LineItem) => (i.kind ?? 'part') === 'part' ? s + i.amount : s, 0);
    const nonTaxableSubtotal = lines.reduce((s: number, i: LineItem) => (i.kind ?? 'part') === 'part' ? s : s + i.amount, 0);
    const subtotal = taxableSubtotal + nonTaxableSubtotal;
    const shop = Math.min(taxableSubtotal * (settings?.shop_supplies_pct ?? 0.05), settings?.shop_supplies_max ?? 50);
    const tax = (taxableSubtotal + shop) * (settings?.tax_rate ?? 0.07);
    const valid_until = settings ? new Date(Date.now() + (settings.estimate_valid_days || 14) * 86400000).toISOString().slice(0, 10) : null;

    // Auto-create customer when no match was found and we have any identifying info.
    let autoCreatedCustomer = false;
    if (!matchedCustomer && (ex.customer_email || ex.customer_name || ex.customer_phone)) {
      try {
        const { data, error } = await supabase.functions.invoke('admin-create-customer', {
          body: {
            full_name: ex.customer_name || '',
            email: ex.customer_email || '',
            phone: ex.customer_phone || '',
          },
        });
        if (error) throw error;
        if (data?.customer_id) {
          matchedCustomer = {
            id: data.customer_id,
            full_name: ex.customer_name || null,
            email: ex.customer_email || null,
          };
          autoCreatedCustomer = true;
          // Refresh local customers list so dropdowns/labels resolve immediately
          setCustomers((prev) => [...prev, matchedCustomer]);
          toast.success(
            data.reused ? 'Linked to existing customer' : 'Created new customer from PDF'
          );
        }
      } catch (e: any) {
        toast.error(e.message || 'Could not auto-create customer — pick one manually');
      }
    }

    const notesParts: string[] = [];
    if (ex.notes) notesParts.push(ex.notes);
    if (!matchedCustomer && ex.customer_name) {
      notesParts.push(`Imported customer: ${ex.customer_name}${ex.customer_email ? ' / ' + ex.customer_email : ''}${ex.customer_phone ? ' / ' + ex.customer_phone : ''}`);
    }
    if (autoCreatedCustomer && ex.customer_phone) {
      notesParts.push(`Customer phone: ${ex.customer_phone}`);
    }
    if (!matchedVehicle && (ex.vehicle_make || ex.vehicle_model)) {
      notesParts.push(`Imported vehicle: ${ex.vehicle_year ?? ''} ${ex.vehicle_make ?? ''} ${ex.vehicle_model ?? ''}${ex.vehicle_vin ? ' VIN ' + ex.vehicle_vin : ''}`.trim());
    }

    setEditing({
      status: 'draft',
      customer_id: matchedCustomer?.id ?? null,
      customer_phone: ex.customer_phone || null,
      vehicle_id: matchedVehicle?.id ?? null,
      line_items: lines,
      subtotal, shop_supplies: shop, tax, total: subtotal + shop + tax,
      notes: notesParts.join('\n') || null,
      valid_until,
    });
    setPreview(null);
    if (!matchedCustomer) toast.info('Pick a customer to save');
  };

  const recalc = (li: LineItem[]) => {
    // Only parts are taxable / accrue shop supplies. Labor and fees never do.
    const taxableSubtotal = li.reduce((s, i) => (i.kind ?? 'part') === 'part' ? s + (Number(i.quantity) * Number(i.unit_price)) : s, 0);
    const nonTaxableSubtotal = li.reduce((s, i) => (i.kind ?? 'part') === 'part' ? s : s + (Number(i.quantity) * Number(i.unit_price)), 0);
    const subtotal = taxableSubtotal + nonTaxableSubtotal;
    const shop = Math.min(taxableSubtotal * (settings?.shop_supplies_pct ?? 0.05), settings?.shop_supplies_max ?? 50);
    const tax = (taxableSubtotal + shop) * (settings?.tax_rate ?? 0.07);
    return { subtotal, shop_supplies: shop, tax, total: subtotal + shop + tax };
  };

  const updateLines = (lines: LineItem[]) => {
    const totals = recalc(lines);
    setEditing((p: any) => ({ ...p, line_items: lines, ...totals }));
  };

  const addLine = (catalogId?: string) => {
    const item = catalog.find(c => c.id === catalogId);
    const kind: 'part' | 'labor' | 'fee' = item?.type === 'labor' ? 'labor' : item?.type === 'fee' ? 'fee' : 'part';
    const line: LineItem = item
      ? { description: item.name, quantity: 1, unit_price: Number(item.unit_price), amount: Number(item.unit_price), catalog_item_id: item.id, labor_hours: Number(item.labor_hours) || 0, unit_cost: Number(item.cost) || 0, kind }
      : { description: '', quantity: 1, unit_price: 0, amount: 0, labor_hours: 0, unit_cost: 0, kind: 'part' };
    updateLines([...(editing.line_items || []), line]);
  };

  const addLaborLine = () => {
    const line: LineItem = { description: 'Labor', quantity: 1, unit_price: defaultLaborRate || 0, amount: defaultLaborRate || 0, labor_hours: 1, kind: 'labor' };
    updateLines([...(editing.line_items || []), line]);
  };

  const addDiagnosisFee = () => {
    const line: LineItem = { description: 'Diagnosis Fee', quantity: 1, unit_price: 0, amount: 0, labor_hours: 0, kind: 'fee' };
    updateLines([...(editing.line_items || []), line]);
  };


  const updateLine = (idx: number, patch: Partial<LineItem>) => {
    const lines = [...editing.line_items];
    lines[idx] = { ...lines[idx], ...patch };
    lines[idx].amount = Number(lines[idx].quantity) * Number(lines[idx].unit_price);
    updateLines(lines);
  };

  const removeLine = (idx: number) => updateLines(editing.line_items.filter((_: any, i: number) => i !== idx));

  const syncPartsToCatalog = async (lines: LineItem[]) => {
    const parts = (lines || []).filter(
      (l) => (l.kind ?? 'part') === 'part' && l.description && l.description.trim().length > 0 && Number(l.unit_price) > 0
    );
    for (const p of parts) {
      const name = p.description.trim();
      const unit_price = Number(p.unit_price) || 0;
      const cost = Number(p.unit_cost) || 0;
      try {
        if (p.catalog_item_id) {
          await supabase.from('catalog_items').update({ unit_price, cost, type: 'part' }).eq('id', p.catalog_item_id);
        } else {
          const { data: existing } = await supabase
            .from('catalog_items').select('id').ilike('name', name).limit(1).maybeSingle();
          if (existing?.id) {
            await supabase.from('catalog_items').update({ unit_price, cost, type: 'part', is_active: true }).eq('id', existing.id);
          } else {
            await supabase.from('catalog_items').insert({ name, type: 'part', unit_price, cost, is_active: true });
          }
        }
      } catch (e) {
        // Non-fatal — keep saving the estimate even if catalog sync fails.
        console.warn('catalog sync failed for', name, e);
      }
    }
  };

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
    await syncPartsToCatalog(editing.line_items || []);
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
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[640px]">
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
                      <DeleteButton table="estimates" id={e.id} size="icon" label="Delete estimate" description={`Delete estimate ${e.estimate_number || ''}? This cannot be undone.`} onDeleted={load} />
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
                    <Button size="sm" variant="outline" onClick={() => addLine()}><Plus className="h-3 w-3 mr-1" /> Part</Button>
                    <Button size="sm" variant="outline" onClick={addLaborLine}><Plus className="h-3 w-3 mr-1" /> Labor</Button>
                    <Button size="sm" variant="outline" onClick={addDiagnosisFee}><Plus className="h-3 w-3 mr-1" /> Diagnosis Fee</Button>
                  </div>
                </div>
                <div className="border rounded overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-28">Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="w-20">Qty</TableHead>
                        <TableHead className="w-20">Hrs</TableHead>
                        <TableHead className="w-28">Unit Price</TableHead>
                        <TableHead className="w-24">Unit Cost</TableHead>
                        <TableHead className="w-24 text-right">Amount</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(editing.line_items || []).map((l: LineItem, i: number) => {
                        const kind = l.kind ?? 'part';
                        return (
                          <TableRow key={i}>
                            <TableCell>
                              <Select value={kind} onValueChange={(v) => updateLine(i, { kind: v as 'part' | 'labor' | 'fee' })}>
                                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="part">Part</SelectItem>
                                  <SelectItem value="labor">Labor</SelectItem>
                                  <SelectItem value="fee">Fee</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Input value={l.description} onChange={e => updateLine(i, { description: e.target.value })} />
                              {kind === 'fee' && <span className="text-[10px] text-muted-foreground ml-1">Flat fee · no tax/shop</span>}
                              {kind === 'labor' && <span className="text-[10px] text-muted-foreground ml-1">Labor · no tax/shop</span>}
                              {kind === 'part' && <span className="text-[10px] text-muted-foreground ml-1">Auto-saved to catalog</span>}
                            </TableCell>
                            <TableCell><Input type="number" step="0.5" value={l.quantity} onChange={e => updateLine(i, { quantity: parseFloat(e.target.value) || 0 })} /></TableCell>
                            <TableCell><Input type="number" step="0.1" value={l.labor_hours ?? 0} onChange={e => updateLine(i, { labor_hours: parseFloat(e.target.value) || 0 })} title="Billable labor hours" disabled={kind === 'part'} /></TableCell>
                            <TableCell><Input type="number" step="0.01" value={l.unit_price} onChange={e => updateLine(i, { unit_price: parseFloat(e.target.value) || 0 })} /></TableCell>
                            <TableCell>
                              <Input type="number" step="0.01" value={l.unit_cost ?? 0} onChange={e => updateLine(i, { unit_cost: parseFloat(e.target.value) || 0 })} disabled={kind !== 'part'} title="Part cost (for margin & catalog)" />
                            </TableCell>
                            <TableCell className="text-right">${l.amount.toFixed(2)}</TableCell>
                            <TableCell><Button size="icon" variant="ghost" onClick={() => removeLine(i)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                          </TableRow>
                        );
                      })}
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

      <Dialog open={!!preview} onOpenChange={o => !o && setPreview(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Confirm Imported Quote</DialogTitle></DialogHeader>
          {preview && (
            <div className="space-y-4 text-sm">
              <div>
                <div className="font-semibold mb-1">Customer</div>
                {preview.matchedCustomer ? (
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-500/15 text-green-600 border-green-500/30" variant="outline">Matched</Badge>
                    <span>{preview.matchedCustomer.full_name || preview.matchedCustomer.email}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Badge className="bg-yellow-500/15 text-yellow-700 border-yellow-500/30" variant="outline">New</Badge>
                    <span className="text-muted-foreground">
                      {preview.extracted.customer_name || '—'}
                      {preview.extracted.customer_email ? ` · ${preview.extracted.customer_email}` : ''}
                      {preview.extracted.customer_phone ? ` · ${preview.extracted.customer_phone}` : ''}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <div className="font-semibold mb-1">Vehicle</div>
                {preview.matchedVehicle ? (
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-500/15 text-green-600 border-green-500/30" variant="outline">Matched</Badge>
                    <span>{preview.matchedVehicle.year} {preview.matchedVehicle.make} {preview.matchedVehicle.model}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Badge className="bg-yellow-500/15 text-yellow-700 border-yellow-500/30" variant="outline">{preview.matchedCustomer ? 'New' : 'Unmatched'}</Badge>
                    <span className="text-muted-foreground">
                      {preview.extracted.vehicle_year ?? ''} {preview.extracted.vehicle_make ?? ''} {preview.extracted.vehicle_model ?? '—'}
                      {preview.extracted.vehicle_vin ? ` · VIN ${preview.extracted.vehicle_vin}` : ''}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <div className="font-semibold mb-1">Line Items ({preview.lines.length})</div>
                <div className="border rounded">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="w-16">Type</TableHead>
                        <TableHead className="w-12 text-right">Qty</TableHead>
                        <TableHead className="w-24 text-right">Cost</TableHead>
                        <TableHead className="w-24 text-right">Unit</TableHead>
                        <TableHead className="w-24 text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preview.lines.map((l: LineItem, i: number) => (
                        <TableRow key={i}>
                          <TableCell>{l.description}</TableCell>
                          <TableCell className="text-xs text-muted-foreground capitalize">{l.kind ?? 'part'}</TableCell>
                          <TableCell className="text-right">{l.quantity}</TableCell>
                          <TableCell className="text-right text-muted-foreground">{l.kind === 'part' && l.unit_cost ? `$${l.unit_cost.toFixed(2)}` : '—'}</TableCell>
                          <TableCell className="text-right">${l.unit_price.toFixed(2)}</TableCell>
                          <TableCell className="text-right">${l.amount.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                      {preview.lines.length === 0 && (
                        <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-4">No items extracted</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                {(() => {
                  const subtotal = preview.lines.reduce((s: number, i: LineItem) => s + i.amount, 0);
                  const partsRevenue = preview.lines.filter((l: LineItem) => l.kind === 'part').reduce((s: number, i: LineItem) => s + i.amount, 0);
                  const partsCost = preview.lines.filter((l: LineItem) => l.kind === 'part').reduce((s: number, i: LineItem) => s + (i.unit_cost ?? 0) * i.quantity, 0);
                  const margin = partsRevenue - partsCost;
                  return (
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div>Subtotal: <span className="text-foreground font-semibold">${subtotal.toFixed(2)}</span></div>
                      <div>Parts revenue: <span className="text-foreground font-semibold">${partsRevenue.toFixed(2)}</span></div>
                      <div>Parts cost (price ÷ 1.30): <span className="text-foreground font-semibold">${partsCost.toFixed(2)}</span></div>
                      <div>Parts gross margin: <span className="text-foreground font-semibold">${margin.toFixed(2)}</span></div>
                    </div>
                  );
                })()}
              </div>

              {preview.extracted.notes && (
                <div>
                  <div className="font-semibold mb-1">Notes</div>
                  <div className="text-muted-foreground whitespace-pre-wrap">{preview.extracted.notes}</div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreview(null)}>Cancel</Button>
            <Button onClick={confirmImport}>Confirm & Open Editor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEstimates;
