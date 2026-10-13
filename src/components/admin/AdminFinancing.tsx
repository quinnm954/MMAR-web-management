import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format, addDays, addMonths } from 'date-fns';
import { ArrowLeft, CreditCard, FileText, Upload, Trash2, Plus, Copy, MessageSquare, RefreshCw, Search } from 'lucide-react';

type Contract = Record<string, any> & { id: string; client_name: string; status: string; customer_id: string | null };
type Payment = { id: string; contract_id: string; seq: number; label: string | null; due_date: string; amount: number; status: string; failure_reason: string | null; paid_at: string | null; note: string | null };
type Doc = { id: string; contract_id: string; file_path: string; file_name: string; created_at: string };

const money = (n: number | null | undefined) => `$${Number(n || 0).toFixed(2)}`;
const today = () => format(new Date(), 'yyyy-MM-dd');
const PAID = ['paid'];

function summarize(c: Contract, pays: Payment[]) {
  const total = pays.reduce((s, p) => s + Number(p.amount), 0);
  const paid = pays.filter(p => PAID.includes(p.status)).reduce((s, p) => s + Number(p.amount), 0);
  const open = pays.filter(p => !PAID.includes(p.status) && p.status !== 'skipped').sort((a, b) => a.due_date.localeCompare(b.due_date));
  const next = open[0];
  const late = open.filter(p => p.due_date < today() || p.status === 'failed').length;
  let status = c.status === 'cancelled' ? 'Cancelled' : c.status === 'paid_off' || (pays.length && !open.length) ? 'Paid off' : late ? 'Behind' : 'Active';
  return { total, paid, balance: Math.max(0, total - paid), next, late, status };
}

const statusBadge = (s: string) => {
  const v = s === 'Behind' ? 'destructive' : s === 'Paid off' ? 'secondary' : s === 'Cancelled' ? 'outline' : 'default';
  return <Badge variant={v as any}>{s}</Badge>;
};
const payBadge = (p: Payment) => {
  if (p.status === 'paid') return <Badge variant="secondary">Paid</Badge>;
  if (p.status === 'failed') return <Badge variant="destructive">Failed</Badge>;
  if (p.status === 'processing') return <Badge variant="outline">Processing</Badge>;
  if (p.status === 'skipped') return <Badge variant="outline">Skipped</Badge>;
  if (p.due_date < today()) return <Badge variant="destructive">Late</Badge>;
  return <Badge>Due</Badge>;
};

export default function AdminFinancing() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { full_name: string | null; phone: string | null; email: string | null }>>({});
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: cs }, { data: ps }, { data: ds }] = await Promise.all([
      supabase.from('financing_contracts').select('*').order('created_at', { ascending: false }),
      supabase.from('financing_payments').select('*').order('seq'),
      supabase.from('financing_documents').select('*').order('created_at', { ascending: false }),
    ]);
    setContracts((cs ?? []) as Contract[]);
    setPayments((ps ?? []) as Payment[]);
    setDocs((ds ?? []) as Doc[]);
    const ids = [...new Set((cs ?? []).map((c: any) => c.customer_id).filter(Boolean))];
    if (ids.length) {
      const { data: pr } = await supabase.from('profiles').select('id,full_name,phone,email').in('id', ids);
      setProfiles(Object.fromEntries((pr ?? []).map((p: any) => [p.id, p])));
    }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const rows = useMemo(() => contracts.map(c => ({ c, s: summarize(c, payments.filter(p => p.contract_id === c.id)) }))
    .filter(({ c, s }) => (filter === 'all' || s.status === filter) && (!q || `${c.client_name} ${c.vehicle_info || ''} ${c.service_description || ''}`.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => (b.s.status === 'Behind' ? 1 : 0) - (a.s.status === 'Behind' ? 1 : 0)), [contracts, payments, q, filter]);

  const open = contracts.find(c => c.id === openId);
  if (open) return <ContractDetail c={open} payments={payments.filter(p => p.contract_id === open.id)} docs={docs.filter(d => d.contract_id === open.id)} profile={open.customer_id ? profiles[open.customer_id] : undefined} onBack={() => setOpenId(null)} reload={load} />;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
        <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" />Financing</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}><RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />Refresh</Button>
          <Button size="sm" onClick={() => setNewOpen(true)}><Plus className="h-4 w-4 mr-1" />New</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[180px]"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search customer or vehicle" className="pl-8" /></div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>{['all', 'Active', 'Behind', 'Paid off', 'Cancelled'].map(v => <SelectItem key={v} value={v}>{v === 'all' ? 'All' : v}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {rows.length === 0 ? <p className="text-center text-sm text-muted-foreground py-10">{loading ? 'Loading…' : 'No financing arrangements.'}</p> : rows.map(({ c, s }) => (
          <button key={c.id} onClick={() => setOpenId(c.id)} className={`w-full text-left border rounded-lg p-3 hover:bg-muted/50 ${s.status === 'Behind' ? 'border-destructive/60 bg-destructive/5' : 'border-border'}`}>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="font-semibold">{c.client_name}</span>{statusBadge(s.status)}
            </div>
            <p className="text-sm text-muted-foreground truncate">{[c.vehicle_info, c.service_description].filter(Boolean).join(' · ')}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 text-sm">
              <span><span className="text-muted-foreground block text-xs">Total</span>{money(s.total)}</span>
              <span><span className="text-muted-foreground block text-xs">Paid</span>{money(s.paid)}</span>
              <span><span className="text-muted-foreground block text-xs">Balance</span>{money(s.balance)}</span>
              <span><span className="text-muted-foreground block text-xs">Next</span>{s.next ? `${money(s.next.amount)} · ${format(new Date(s.next.due_date + 'T12:00'), 'MMM d')}` : '—'}</span>
            </div>
          </button>
        ))}
      </CardContent>
      <NewArrangement open={newOpen} onOpenChange={setNewOpen} onCreated={id => { load().then(() => setOpenId(id)); }} />
    </Card>
  );
}

function ContractDetail({ c, payments, docs, profile, onBack, reload }: { c: Contract; payments: Payment[]; docs: Doc[]; profile?: { full_name: string | null; phone: string | null; email: string | null }; onBack: () => void; reload: () => Promise<void> }) {
  const s = summarize(c, payments);
  const [busy, setBusy] = useState<string | null>(null);
  const [resched, setResched] = useState<Payment | null>(null);
  const [newDate, setNewDate] = useState('');
  const phone = profile?.phone || (String(c.client_contact || '').match(/[\d()+\-\s]{10,}/)?.[0] ?? '').trim();
  const link = `${window.location.origin}/portal/financing`;

  const charge = async (p: Payment) => {
    if (!window.confirm(`Charge ${money(p.amount)} to the card on file now?`)) return;
    setBusy(p.id);
    const { data, error } = await supabase.functions.invoke('financing-ach', { body: { action: 'run', payment_id: p.id } });
    setBusy(null);
    if (error || data?.error) return toast.error(data?.error || error?.message || 'Charge failed');
    toast.success(`Payment ${data?.status || 'sent'}`);
    reload();
  };
  const update = async (p: Payment, patch: Partial<Payment>, msg: string) => {
    const { error } = await supabase.from('financing_payments').update(patch as any).eq('id', p.id);
    if (error) return toast.error(error.message);
    toast.success(msg); reload();
  };
  const markPaid = (p: Payment) => {
    const how = window.prompt('How was it paid? (e.g. cash, Cash App, Zelle)', 'cash');
    if (how === null) return;
    update(p, { status: 'paid', paid_at: new Date().toISOString(), note: `Paid manually: ${how}` }, 'Marked paid');
  };
  const addNote = (p: Payment) => {
    const n = window.prompt('Note for this payment', p.note || '');
    if (n !== null) update(p, { note: n || null }, 'Note saved');
  };
  const setContractStatus = async (status: string) => {
    if (!window.confirm(status === 'cancelled' ? 'Cancel this arrangement? Remaining payments will not be charged.' : 'Mark this arrangement paid off?')) return;
    const { error } = await supabase.from('financing_contracts').update({ status }).eq('id', c.id);
    if (error) return toast.error(error.message);
    if (status === 'cancelled') await supabase.from('financing_payments').update({ status: 'skipped' }).eq('contract_id', c.id).in('status', ['scheduled', 'pending', 'due', 'failed']);
    toast.success('Updated'); reload();
  };
  const sendLink = async () => {
    if (!phone) return toast.error('No phone number on file');
    const body = `Hi ${c.client_name.split(' ')[0]}, here's your MMAR payment page to see your schedule and card on file: ${link}`;
    const key = phone.replace(/\D/g, '').slice(-10);
    const e164 = `+1${key}`;
    const { data: existing } = await supabase.from('sms_threads').select('id,phone').ilike('phone', `%${key}`).limit(1);
    let threadId = existing?.[0]?.id as string | undefined;
    if (!threadId) {
      const { data: t, error: te } = await supabase.from('sms_threads').insert({ phone: e164, customer_id: c.customer_id }).select('id').single();
      if (te || !t) return toast.error(te?.message || 'Could not start text');
      threadId = t.id;
    }
    const { data, error } = await supabase.functions.invoke('send-sms', { body: { thread_id: threadId, to: existing?.[0]?.phone || e164, body } });
    if (error || data?.error) return toast.error(data?.error || error?.message || 'Text failed');
    toast.success('Link texted');
  };
  const upload = async (file: File) => {
    const path = `${c.id}/${Date.now()}-${file.name.replace(/[^\w.\-]/g, '_')}`;
    const { error } = await supabase.storage.from('financing-docs').upload(path, file);
    if (error) return toast.error(error.message);
    const { data: auth } = await supabase.auth.getUser();
    await supabase.from('financing_documents').insert({ contract_id: c.id, file_path: path, file_name: file.name, uploaded_by: auth.user?.id });
    toast.success('Uploaded'); reload();
  };
  const openDoc = async (d: Doc) => {
    const w = window.open('', '_blank');
    const { data, error } = await supabase.storage.from('financing-docs').createSignedUrl(d.file_path, 600);
    if (error || !data) { w?.close(); return toast.error(error?.message || 'Could not open'); }
    if (w) w.location.href = data.signedUrl; else window.location.href = data.signedUrl;
  };
  const removeDoc = async (d: Doc) => {
    if (!window.confirm(`Remove ${d.file_name}?`)) return;
    await supabase.storage.from('financing-docs').remove([d.file_path]);
    await supabase.from('financing_documents').delete().eq('id', d.id);
    reload();
  };
  const initials = ['initial_terms', 'initial_security_interest', 'initial_default_consequences', 'initial_info_accuracy', 'initial_received_copy'].map(k => c[k]).filter(Boolean);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-1" />Financing</Button>
        <h2 className="text-xl font-bold">{c.client_name}</h2>{statusBadge(s.status)}
      </div>

      <Card><CardContent className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        {[['Service price', c.total_service_price], ['Down payment', c.down_payment], ['Principal', c.principal], ['Interest', c.interest], ['Total financed', c.total_financed], ['Paid so far', s.paid], ['Balance', s.balance]].map(([l, v]) => (
          <div key={l as string}><p className="text-xs text-muted-foreground">{l}</p><p className="font-semibold">{money(v as number)}</p></div>
        ))}
        <div><p className="text-xs text-muted-foreground">Card on file</p><p className="font-semibold">{c.stripe_payment_method_id ? `•••• ${c.bank_last4 || ''}` : 'None'}</p></div>
        <div className="col-span-2 sm:col-span-4 text-muted-foreground">{[c.vehicle_info, c.service_description].filter(Boolean).join(' · ')}{c.client_contact ? ` · ${c.client_contact}` : ''}</div>
        <div className="col-span-2 sm:col-span-4 flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(link).then(() => toast.success('Link copied'), () => toast.error('Copy failed')); }}><Copy className="h-4 w-4 mr-1" />Copy payment link</Button>
          <Button size="sm" variant="outline" onClick={sendLink}><MessageSquare className="h-4 w-4 mr-1" />Text link</Button>
          {s.status !== 'Paid off' && s.status !== 'Cancelled' && <>
            <Button size="sm" variant="outline" onClick={() => setContractStatus('paid_off')}>Mark paid off</Button>
            <Button size="sm" variant="destructive" onClick={() => setContractStatus('cancelled')}>Cancel arrangement</Button>
          </>}
        </div>
      </CardContent></Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" />Signed documents</CardTitle>
          <Button size="sm" variant="outline" asChild><label className="cursor-pointer"><Upload className="h-4 w-4 mr-1" />Upload<input type="file" accept="application/pdf,image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ''; }} /></label></Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {(c.client_signed_at || c.client_signature_url) && (
            <div className="border rounded-lg p-3 text-sm space-y-2">
              <p className="font-medium">In-app agreement</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div><p className="text-xs text-muted-foreground">Customer signed {c.client_signed_at ? format(new Date(c.client_signed_at), 'MMM d, yyyy h:mm a') : ''}</p>{c.client_signature_url && <img src={c.client_signature_url} alt="Customer signature" className="h-16 bg-muted rounded" />}</div>
                <div><p className="text-xs text-muted-foreground">Shop signed {c.provider_signed_at ? format(new Date(c.provider_signed_at), 'MMM d, yyyy h:mm a') : '—'}</p>{c.provider_signature_url && <img src={c.provider_signature_url} alt="Shop signature" className="h-16 bg-muted rounded" />}</div>
              </div>
              {initials.length > 0 && <p className="text-xs text-muted-foreground">Initials: {initials.join(', ')}</p>}
            </div>
          )}
          {docs.length === 0 && !c.client_signed_at && <p className="text-sm text-muted-foreground">No documents yet. Upload the signed agreement PDF.</p>}
          {docs.map(d => (
            <div key={d.id} className="flex items-center justify-between gap-2 border rounded-lg p-2.5">
              <button onClick={() => openDoc(d)} className="flex items-center gap-2 min-w-0 text-left text-sm"><FileText className="h-4 w-4 shrink-0 text-primary" /><span className="truncate">{d.file_name}</span><span className="text-xs text-muted-foreground shrink-0">{format(new Date(d.created_at), 'MMM d')}</span></button>
              <Button size="icon" variant="ghost" onClick={() => removeDoc(d)} aria-label="Remove"><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Payment schedule</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {payments.length === 0 && <p className="text-sm text-muted-foreground">No payments scheduled.</p>}
          {payments.map(p => (
            <div key={p.id} className="border rounded-lg p-3 text-sm">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-medium">{p.label || `Payment ${p.seq}`} · {format(new Date(p.due_date + 'T12:00'), 'EEE, MMM d, yyyy')}</span>
                <span className="flex items-center gap-2"><span className="font-semibold">{money(p.amount)}</span>{payBadge(p)}</span>
              </div>
              {(p.failure_reason || p.note || p.paid_at) && <p className="text-xs text-muted-foreground mt-1">{[p.paid_at && `Paid ${format(new Date(p.paid_at), 'MMM d')}`, p.failure_reason, p.note].filter(Boolean).join(' · ')}</p>}
              {p.status !== 'paid' && p.status !== 'processing' && (
                <div className="flex gap-2 flex-wrap mt-2">
                  {p.status !== 'skipped' && <Button size="sm" onClick={() => charge(p)} disabled={busy === p.id || !c.stripe_payment_method_id}>{busy === p.id ? 'Charging…' : 'Charge now'}</Button>}
                  <Button size="sm" variant="outline" onClick={() => markPaid(p)}>Mark paid</Button>
                  <Button size="sm" variant="outline" onClick={() => { setResched(p); setNewDate(p.due_date); }}>Reschedule</Button>
                  {p.status !== 'skipped' ? <Button size="sm" variant="ghost" onClick={() => update(p, { status: 'skipped' }, 'Skipped')}>Skip</Button> : <Button size="sm" variant="ghost" onClick={() => update(p, { status: 'scheduled' }, 'Restored')}>Restore</Button>}
                  <Button size="sm" variant="ghost" onClick={() => addNote(p)}>Note</Button>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={!!resched} onOpenChange={o => !o && setResched(null)}>
        <DialogContent><DialogHeader><DialogTitle>Reschedule payment</DialogTitle></DialogHeader>
          <Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} />
          <Button onClick={() => { if (resched && newDate) update(resched, { due_date: newDate, status: resched.status === 'failed' ? 'scheduled' : resched.status }, 'Rescheduled'); setResched(null); }}>Save</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NewArrangement({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; onCreated: (id: string) => void }) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [invoiceId, setInvoiceId] = useState('');
  const [down, setDown] = useState('50');
  const [rate, setRate] = useState('10');
  const [count, setCount] = useState('13');
  const [freq, setFreq] = useState<'weekly' | 'biweekly' | 'monthly'>('weekly');
  const [first, setFirst] = useState(format(addDays(new Date(), 7), 'yyyy-MM-dd'));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data } = await supabase.from('invoices').select('*').neq('status', 'paid').order('created_at', { ascending: false }).limit(100);
      const ids = [...new Set((data ?? []).map((i: any) => i.customer_id).filter(Boolean))];
      const { data: pr } = ids.length ? await supabase.from('profiles').select('id,full_name,phone,email,address_line1,city,state').in('id', ids) : { data: [] as any[] };
      const pm = Object.fromEntries((pr ?? []).map((p: any) => [p.id, p]));
      setInvoices((data ?? []).map((i: any) => ({ ...i, profile: pm[i.customer_id] })));
    })();
  }, [open]);

  const inv = invoices.find(i => i.id === invoiceId);
  const total = Math.max(0, Number(inv?.total ?? 0) - Number(inv?.amount_paid ?? 0));
  const downAmt = Math.round(total * Number(down) / 100 * 100) / 100;
  const principal = Math.round((total - downAmt) * 100) / 100;
  const n = Math.max(1, parseInt(count) || 1);
  const termYears = freq === 'monthly' ? n / 12 : freq === 'biweekly' ? n * 14 / 365 : n * 7 / 365;
  const interest = Math.round(principal * Number(rate) / 100 * Math.max(termYears, 0) * 100) / 100;
  const financed = Math.round((principal + interest) * 100) / 100;
  const each = Math.floor(financed / n * 100) / 100;
  const last = Math.round((financed - each * (n - 1)) * 100) / 100;

  const create = async () => {
    if (!inv) return toast.error('Pick an invoice');
    setSaving(true);
    const p = inv.profile || {};
    const { data: c, error } = await supabase.from('financing_contracts').insert({
      client_name: p.full_name || 'Customer', client_contact: [p.phone, p.email].filter(Boolean).join(' · ') || null,
      client_address: [p.address_line1, p.city, p.state].filter(Boolean).join(', ') || null, agreement_date: today(),
      vehicle_info: null, service_description: (inv.line_items || []).map((l: any) => l.description).filter(Boolean).slice(0, 3).join(', ') || `Invoice ${inv.invoice_number || ''}`.trim(),
      total_service_price: total, first_payment_date: first, down_payment: downAmt, principal, interest, total_financed: financed,
      monthly_payment: each, status: 'active', customer_id: inv.customer_id, invoice_id: inv.id,
    } as any).select().single();
    if (error || !c) { setSaving(false); return toast.error(error?.message || 'Could not create'); }
    const step = (i: number) => { const d = new Date(first + 'T12:00'); return format(freq === 'monthly' ? addMonths(d, i) : addDays(d, i * (freq === 'weekly' ? 7 : 14)), 'yyyy-MM-dd'); };
    const rows = [{ contract_id: c.id, customer_id: inv.customer_id, seq: 0, label: 'Down payment', due_date: today(), amount: downAmt, status: 'scheduled' },
      ...Array.from({ length: n }, (_, i) => ({ contract_id: c.id, customer_id: inv.customer_id, seq: i + 1, label: `Payment ${i + 1} of ${n}`, due_date: step(i), amount: i === n - 1 ? last : each, status: 'scheduled' }))];
    const { error: e2 } = await supabase.from('financing_payments').insert(rows as any);
    setSaving(false);
    if (e2) return toast.error(e2.message);
    toast.success('Arrangement created');
    onOpenChange(false); onCreated(c.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader><DialogTitle>New financing arrangement</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Unpaid invoice</Label>
            <Select value={invoiceId} onValueChange={setInvoiceId}><SelectTrigger><SelectValue placeholder="Pick customer invoice" /></SelectTrigger>
              <SelectContent>{invoices.map(i => <SelectItem key={i.id} value={i.id}>{(i.profile?.full_name || 'Customer')} · {money(i.total)} {i.invoice_number ? `· #${i.invoice_number}` : ''}</SelectItem>)}</SelectContent></Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Down payment %</Label><Input type="number" value={down} onChange={e => setDown(e.target.value)} /></div>
            <div><Label>Simple interest % / yr</Label><Input type="number" value={rate} onChange={e => setRate(e.target.value)} /></div>
            <div><Label>Number of payments</Label><Input type="number" value={count} onChange={e => setCount(e.target.value)} /></div>
            <div><Label>How often</Label><Select value={freq} onValueChange={v => setFreq(v as any)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="weekly">Weekly</SelectItem><SelectItem value="biweekly">Every 2 weeks</SelectItem><SelectItem value="monthly">Monthly</SelectItem></SelectContent></Select></div>
            <div className="col-span-2"><Label>First payment date</Label><Input type="date" value={first} onChange={e => setFirst(e.target.value)} /></div>
          </div>
          {inv && <div className="rounded-lg bg-muted p-3 text-sm grid grid-cols-2 gap-1">
            <span>Invoice total</span><span className="text-right">{money(total)}</span>
            <span>Down today</span><span className="text-right">{money(downAmt)}</span>
            <span>Principal</span><span className="text-right">{money(principal)}</span>
            <span>Interest</span><span className="text-right">{money(interest)}</span>
            <span className="font-semibold">Total financed</span><span className="text-right font-semibold">{money(financed)}</span>
            <span>{n} payments</span><span className="text-right">{money(each)}{last !== each ? ` (last ${money(last)})` : ''}</span>
          </div>}
          <Button className="w-full" onClick={create} disabled={saving || !inv}>{saving ? 'Creating…' : 'Create arrangement'}</Button>
          <p className="text-xs text-muted-foreground">Nothing is charged until you press Charge now. Upload the signed agreement after creating.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
