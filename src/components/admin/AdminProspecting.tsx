import { useEffect, useMemo, useState } from 'react';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { Loader2, Mail, Phone, Search, Sparkles, Globe, Pause, Play } from 'lucide-react';
import { dialInApp } from '@/components/admin/Softphone';

const CATEGORIES = ['Landscaping', 'HVAC', 'Plumbing', 'Pest control', 'Pool service', 'Roofing', 'Electrical', 'Cleaning service', 'Used car dealer', 'Towing', 'Construction', 'Lawn care'];
const CITIES = ['Fort Myers', 'Lehigh Acres'] as const;
const STAGES = ['new', 'contacted', 'interested', 'callback', 'won', 'lost', 'do_not_contact'];
const STAGE_LABEL: Record<string, string> = { new: 'New', contacted: 'Contacted', interested: 'Interested', callback: 'Callback', won: 'Won', lost: 'Lost', do_not_contact: 'Do not contact' };

type Prospect = {
  id: string; name: string; category: string; city: string; phone: string | null; website: string | null;
  email: string | null; address: string | null; rating: number | null; stage: string; do_not_contact: boolean;
  notes: string | null; email_subject: string | null; email_body: string | null; call_script: string | null;
  email_status: string; email_step: number; last_contacted_at: string | null;
};
type EmailState = { paused: boolean; pause_reason: string | null; sent_today: number; sent_day: string | null; daily_cap: number; mailing_address: string | null };

async function invoke(action: string, body: object) {
  const { data, error } = await supabase.functions.invoke(`prospecting?action=${action}`, { body });
  if (error) {
    let msg = error.message;
    if (error instanceof FunctionsHttpError) { try { const j = await error.context.json(); msg = typeof j.error === 'string' ? j.error : JSON.stringify(j.error); } catch { /* */ } }
    throw new Error(msg);
  }
  return data;
}

export default function AdminProspecting() {
  const [cats, setCats] = useState<string[]>(['Landscaping', 'HVAC', 'Plumbing']);
  const [cities, setCities] = useState<string[]>(['Fort Myers', 'Lehigh Acres']);
  const [rows, setRows] = useState<Prospect[]>([]);
  const [state, setState] = useState<EmailState | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [open, setOpen] = useState<Prospect | null>(null);

  const load = async () => {
    const [{ data }, { data: s }] = await Promise.all([
      supabase.from('prospects').select('*').order('created_at', { ascending: false }).limit(500),
      supabase.from('prospect_email_state').select('*').eq('id', 1).maybeSingle(),
    ]);
    setRows((data as Prospect[]) || []);
    setState(s as EmailState);
  };
  useEffect(() => { load(); }, []);

  const shown = useMemo(() => {
    const visible = filter === 'all' ? rows : rows.filter((r) => r.stage === filter);
    // Businesses we can actually email float to the top of the list.
    const rank = (r: Prospect) => (r.email && !r.do_not_contact ? 0 : r.email ? 1 : 2);
    return [...visible].sort((a, b) => rank(a) - rank(b));
  }, [rows, filter]);
  const drafts = rows.filter((r) => r.email_status === 'draft' && r.email && !r.do_not_contact);
  const now = Date.now();
  const firstPending = rows.filter((r) => r.email_status === 'approved' && r.email_step === 0 && r.email && !r.do_not_contact);
  const followUps = rows.filter((r) => r.email_status === 'approved' && r.email_step > 0 && !r.do_not_contact);
  const nextFollowUp = followUps.map((r) => r.next_email_at).filter(Boolean).sort()[0] as string | undefined;
  const contacted = rows.filter((r) => r.email_step > 0);
  const draftsNoEmail = rows.filter((r) => r.email_status === 'draft' && !r.email && !r.do_not_contact);
  const cantSend = rows.filter((r) => r.email_status === 'approved' && !r.email);
  const emailLabel = (r: Prospect) =>
    r.email_status === 'draft' ? (r.email ? 'Draft · ready' : 'Draft · needs email')
    : r.email_status === 'approved' ? (!r.email ? "Can't send" : r.email_step === 0 ? 'First email pending'
      : `Follow-up ${r.email_step + 1}/3${r.next_email_at ? ` · ${new Date(r.next_email_at).toLocaleDateString()}` : ''}`)
    : r.email_status === 'done' ? (r.email_step > 0 ? `Sent ${r.email_step}/3 · done` : 'Skipped') : r.email_status;
  void now;
  const needPitch = rows.filter((r) => !r.email_body && !r.do_not_contact);

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    try { await fn(); } catch (e) { toast.error((e as Error).message); }
    setBusy(null); load();
  };

  const search = () => run('search', async () => {
    const r = await invoke('search', { categories: cats, cities });
    toast.success(`Found ${r.found}, added ${r.added} new businesses`);
  });

  const enrich = () => run('enrich', async () => {
    const r = await invoke('enrich', {});
    toast.success(`Checked ${r.checked} websites, found ${r.emails} emails. ${r.remaining} left.`);
  });

  const writePitches = () => run('pitch', async () => {
    const byCat = [...new Set(needPitch.map((r) => r.category))];
    for (const c of byCat) {
      const { pitch } = await invoke('pitch', { category: c });
      const ids = needPitch.filter((r) => r.category === c).map((r) => r.id);
      await supabase.from('prospects').update({
        email_subject: pitch.email_subject, email_body: pitch.email_body, call_script: pitch.call_script,
      }).in('id', ids);
      await supabase.from('prospects').update({ email_status: 'draft' }).in('id', ids).eq('email_status', 'none');
    }
    toast.success(`Pitches written for ${byCat.length} business types`);
  });

  const approveAll = () => run('approve', async () => {
    await supabase.from('prospects').update({ email_status: 'approved' }).in('id', drafts.map((d) => d.id));
    toast.success(`${drafts.length} emails queued`);
  });

  const saveState = (patch: Partial<EmailState>) => run('state', async () => {
    const { error } = await supabase.from('prospect_email_state').update({ ...patch, ...(patch.paused === false ? { pause_reason: null } : {}) }).eq('id', 1);
    if (error) throw error;
  });

  const update = async (id: string, patch: Partial<Prospect>) => {
    const { error } = await supabase.from('prospects').update(patch).eq('id', id);
    if (error) return toast.error(error.message);
    setRows((rs) => rs.map((r) => r.id === id ? { ...r, ...patch } : r));
    setOpen((o) => o && o.id === id ? { ...o, ...patch } : o);
  };

  const logCall = async (p: Prospect, outcome: string) => {
    await supabase.from('prospect_touches').insert({ prospect_id: p.id, channel: 'call', outcome });
    const stage = outcome === 'do_not_contact' ? 'do_not_contact' : outcome === 'no_answer' ? (p.stage === 'new' ? 'contacted' : p.stage) : outcome;
    await update(p.id, { stage, last_contacted_at: new Date().toISOString(), ...(outcome === 'do_not_contact' ? { do_not_contact: true, email_status: 'done' } : {}) });
    toast.success('Call logged');
  };

  const toggle = (arr: string[], v: string, set: (a: string[]) => void) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const sentToday = state?.sent_day === new Date().toISOString().slice(0, 10) ? state.sent_today : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Find fleet leads</CardTitle>
          <CardDescription>Search Google Maps for service businesses that run work trucks. Businesses already on your list are skipped.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <Button key={c} size="sm" variant={cats.includes(c) ? 'default' : 'outline'} onClick={() => toggle(cats, c, setCats)} disabled={!cats.includes(c) && cats.length >= 8}>{c}</Button>
            ))}
          </div>
          <div className="flex gap-4">
            {CITIES.map((c) => (
              <label key={c} className="flex items-center gap-2 text-sm"><Checkbox checked={cities.includes(c)} onCheckedChange={() => toggle(cities, c, setCities)} />{c}</label>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={search} disabled={!!busy || !cats.length || !cities.length}>{busy === 'search' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}Search</Button>
            <Button variant="secondary" onClick={enrich} disabled={!!busy}>{busy === 'enrich' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Globe className="h-4 w-4 mr-2" />}Find emails (10 at a time)</Button>
            <Button variant="secondary" onClick={writePitches} disabled={!!busy || !needPitch.length}>{busy === 'pitch' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}Write pitches ({needPitch.length})</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-accent/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5" />Email outreach</CardTitle>
          <CardDescription>Approved emails go out a few per hour, up to your daily limit, with follow-ups on days 4 and 10. Every email has an unsubscribe link.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {state?.paused && <p className="text-sm text-destructive">Paused{state.pause_reason ? `: ${state.pause_reason}` : ''}</p>}
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Business mailing address (required by law in every email)</Label>
              <Input defaultValue={state?.mailing_address ?? ''} placeholder="Street, City, FL ZIP" onBlur={(e) => e.target.value !== (state?.mailing_address ?? '') && saveState({ mailing_address: e.target.value || null })} />
            </div>
            <div>
              <Label>Daily limit</Label>
              <Input type="number" min={1} max={100} defaultValue={state?.daily_cap ?? 30} onBlur={(e) => saveState({ daily_cap: Math.min(100, Math.max(1, Number(e.target.value) || 30)) })} />
            </div>
          </div>
          {!state?.mailing_address && <p className="text-xs text-muted-foreground">Emails won't send until you add your mailing address.</p>}
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="outline">Sent today: {sentToday}/{state?.daily_cap ?? 30}</Badge>
            <Badge variant="outline">Sent: {contacted.length} businesses</Badge>
            <Badge variant="outline">First email pending: {firstPending.length}</Badge>
            <Badge variant="outline">Follow-ups scheduled: {followUps.length}{nextFollowUp ? ` · next ${new Date(nextFollowUp).toLocaleDateString()}` : ''}</Badge>
            <Badge variant="outline">Drafts ready: {drafts.length}</Badge>
            <Badge variant="outline">Drafts needing email: {draftsNoEmail.length}</Badge>
            {cantSend.length > 0 && <Badge variant="destructive">Can't send: {cantSend.length}</Badge>}
            <Button size="sm" onClick={approveAll} disabled={!!busy || !drafts.length}>Approve all drafts</Button>
            <Button size="sm" variant="outline" onClick={() => saveState({ paused: !state?.paused })}>
              {state?.paused ? <><Play className="h-4 w-4 mr-1" />Resume</> : <><Pause className="h-4 w-4 mr-1" />Pause</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="flex max-h-[65vh] min-h-[320px] flex-col overflow-hidden md:max-h-[calc(100dvh-220px)] md:min-h-0">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Leads ({shown.length})</CardTitle>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stages</SelectItem>
              {STAGES.map((s) => <SelectItem key={s} value={s}>{STAGE_LABEL[s]}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 divide-y overflow-y-auto">
          {shown.length === 0 && <p className="text-sm text-muted-foreground py-4">No leads yet. Pick categories above and click Search.</p>}
          {shown.map((p) => (
            <div key={p.id} className="py-3 flex flex-wrap items-center gap-3">
              <button className="flex-1 min-w-[200px] text-left" onClick={() => setOpen(p)}>
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.category} · {p.city}{p.rating ? ` · ★${p.rating}` : ''}{p.email ? ` · ${p.email}` : ''}</div>
              </button>
              <Badge variant={p.stage === 'interested' || p.stage === 'won' ? 'default' : 'secondary'}>{STAGE_LABEL[p.stage] ?? p.stage}</Badge>
              {p.email_status !== 'none' && <Badge variant="outline">{emailLabel(p)}</Badge>}
              {p.phone && !p.do_not_contact && (
                <Button size="sm" variant="outline" onClick={() => { setOpen(p); dialInApp(p.phone!); }}><Phone className="h-4 w-4 mr-1" />Call</Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Sheet open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          {open && (
            <>
              <SheetHeader><SheetTitle>{open.name}</SheetTitle></SheetHeader>
              <div className="space-y-4 mt-4 text-sm">
                <div className="text-muted-foreground">
                  {open.address}<br />{open.phone}{open.website && <> · <a className="text-primary underline" href={open.website} target="_blank" rel="noreferrer">website</a></>}
                </div>
                {open.phone && !open.do_not_contact && <Button onClick={() => dialInApp(open.phone!)}><Phone className="h-4 w-4 mr-2" />Call from Garage Ace</Button>}
                <div>
                  <Label>Call script</Label>
                  <p className="whitespace-pre-wrap rounded-md border p-3 bg-muted/30">{open.call_script || 'Click "Write pitches" to generate one.'}</p>
                </div>
                <div>
                  <Label>Log call result</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {[['interested', 'Interested'], ['callback', 'Callback'], ['no_answer', 'No answer'], ['lost', 'Not interested'], ['do_not_contact', 'Do not contact']].map(([v, l]) => (
                      <Button key={v} size="sm" variant={v === 'do_not_contact' ? 'destructive' : 'outline'} onClick={() => logCall(open, v)}>{l}</Button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Stage</Label>
                  <Select value={open.stage} onValueChange={(v) => update(open.id, { stage: v, ...(v === 'do_not_contact' ? { do_not_contact: true, email_status: 'done' } : {}) })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STAGES.map((s) => <SelectItem key={s} value={s}>{STAGE_LABEL[s]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Email</Label>
                  <Input defaultValue={open.email ?? ''} placeholder="No email found" onBlur={(e) => update(open.id, { email: e.target.value.trim() || null })} />
                </div>
                <div>
                  <Label>Email subject</Label>
                  <Input defaultValue={open.email_subject ?? ''} onBlur={(e) => update(open.id, { email_subject: e.target.value })} />
                </div>
                <div>
                  <Label>Email body ({'{{name}}'} becomes the business name)</Label>
                  <Textarea rows={8} defaultValue={open.email_body ?? ''} onBlur={(e) => update(open.id, { email_body: e.target.value })} />
                </div>
                {open.email_status === 'draft' && open.email && (
                  <Button onClick={() => update(open.id, { email_status: 'approved' })}><Mail className="h-4 w-4 mr-2" />Approve this email</Button>
                )}
                <div>
                  <Label>Notes</Label>
                  <Textarea rows={3} defaultValue={open.notes ?? ''} onBlur={(e) => update(open.id, { notes: e.target.value })} />
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
