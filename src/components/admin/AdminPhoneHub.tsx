import { useCallback, useEffect, useMemo, useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import {
  ArrowLeft, Bot, FileEdit, Inbox, Mail, MessageCircle, Phone, PhoneCall,
  PhoneIncoming, PhoneMissed, Plus, RefreshCw, Reply, Search, Send,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { dialInApp } from '@/components/admin/Softphone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Mode = 'inbox' | 'calls' | 'texts' | 'email';
type EmailFolder = 'inbox' | 'sent' | 'drafts';
type Selected = { kind: 'call' | 'text' | 'email'; id: string } | null;

type NamedPhone = { name: string; tag: string };

type CallRow = {
  id: string;
  direction: string;
  from_number: string | null;
  to_number: string | null;
  status: string;
  duration_seconds: number | null;
  transcription: string | null;
  voicemail: boolean;
  read_at: string | null;
  created_at: string;
  ai_handled: boolean;
  ai_summary: string | null;
  ai_transcript: Array<{ role?: string; message?: string }> | null;
};

type TextThread = {
  id: string;
  phone: string;
  customer_id: string | null;
  last_message_at: string;
  last_message_preview: string | null;
  unread_count: number;
};

type SmsMessage = {
  id: string;
  body: string;
  media_urls?: unknown;
  direction: string;
  status: string | null;
  created_at: string;
};

type EmailItem = {
  id: string;
  kind: 'inbound' | 'sent' | 'draft';
  from: string;
  to: string;
  subject: string;
  snippet: string;
  bodyHtml?: string | null;
  bodyText?: string | null;
  threadId?: string | null;
  status?: string;
  at: string;
  unread?: boolean;
};

type FeedItem = {
  kind: 'call' | 'text' | 'email';
  id: string;
  title: string;
  subtitle: string;
  at: string;
  unread: boolean;
};

const phoneKey = (value?: string | null) => (value || '').replace(/\D/g, '').slice(-10);
const stripHtml = (html: string) => html.replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join('') || '?';
const formatDuration = (seconds: number | null) => {
  if (!seconds) return '0:00';
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
};
const relativeTime = (at: string) => formatDistanceToNow(new Date(at), { addSuffix: true });

export default function AdminPhoneHub() {
  const [mode, setMode] = useState<Mode>('inbox');
  const [emailFolder, setEmailFolder] = useState<EmailFolder>('inbox');
  const [calls, setCalls] = useState<CallRow[]>([]);
  const [threads, setThreads] = useState<TextThread[]>([]);
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [names, setNames] = useState<Record<string, NamedPhone>>({});
  const [messages, setMessages] = useState<SmsMessage[]>([]);
  const [selected, setSelected] = useState<Selected>(null);
  const [search, setSearch] = useState('');
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialOpen, setDialOpen] = useState(false);
  const [dialNumber, setDialNumber] = useState('');
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composeThreadId, setComposeThreadId] = useState<string | null>(null);
  const [composeDraftId, setComposeDraftId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [callResult, threadResult, inboundResult, sentResult, draftResult, profileResult, employeeResult, roleResult] = await Promise.all([
      supabase.from('call_logs').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('sms_threads').select('*').order('last_message_at', { ascending: false }).limit(200),
      supabase.from('inbound_messages').select('*').order('received_at', { ascending: false }).limit(200),
      supabase.from('email_send_log').select('*').order('created_at', { ascending: false }),
      supabase.from('email_drafts').select('*').order('updated_at', { ascending: false }).limit(100),
      supabase.from('profiles').select('id, full_name, phone').not('phone', 'is', null),
      supabase.from('employees').select('full_name, phone, user_id').not('phone', 'is', null),
      supabase.from('user_roles').select('user_id, role'),
    ]);

    const roleByUser: Record<string, string> = {};
    (roleResult.data ?? []).forEach((row: any) => { roleByUser[row.user_id] = row.role; });
    const nextNames: Record<string, NamedPhone> = {};
    (profileResult.data ?? []).forEach((row: any) => {
      const key = phoneKey(row.phone);
      if (key && row.full_name) nextNames[key] = { name: row.full_name, tag: roleByUser[row.id] || 'customer' };
    });
    (employeeResult.data ?? []).forEach((row: any) => {
      const key = phoneKey(row.phone);
      if (key && row.full_name) nextNames[key] = { name: row.full_name, tag: roleByUser[row.user_id] || 'employee' };
    });
    setNames(nextNames);
    setCalls((callResult.data ?? []).map((row: any) => ({ ...row, ai_transcript: Array.isArray(row.ai_transcript) ? row.ai_transcript : null })) as CallRow[]);
    setThreads((threadResult.data ?? []) as TextThread[]);

    const inbound: EmailItem[] = (inboundResult.data ?? []).map((row: any) => ({
      id: `in:${row.id}`, kind: 'inbound', from: row.from_name || row.from_email, to: row.to_email || '',
      subject: row.subject || '(no subject)', snippet: (row.body_text || (row.body_html ? stripHtml(row.body_html) : '')).slice(0, 140),
      bodyHtml: row.body_html, bodyText: row.body_text, threadId: row.thread_id, at: row.received_at, unread: !row.read_at,
    }));
    const sentSeen = new Map<string, any>();
    (sentResult.data ?? []).forEach((row: any) => { if (!sentSeen.has(row.message_id || row.id)) sentSeen.set(row.message_id || row.id, row); });
    const sent: EmailItem[] = Array.from(sentSeen.values()).map((row: any) => ({
      id: `out:${row.id}`, kind: 'sent', from: 'MMAR', to: row.recipient_email,
      subject: row.metadata?.subject || row.template_name, snippet: row.metadata?.preview || row.template_name,
      bodyHtml: row.metadata?.body_html || null, bodyText: row.metadata?.body_text || null,
      threadId: row.metadata?.thread_id || null, status: row.status, at: row.created_at,
    }));
    const drafts: EmailItem[] = (draftResult.data ?? []).map((row: any) => ({
      id: `draft:${row.id}`, kind: 'draft', from: 'MMAR', to: row.recipient_email || '',
      subject: row.subject || '(no subject)', snippet: (row.body || '').slice(0, 140), bodyText: row.body,
      threadId: row.thread_id, status: 'draft', at: row.updated_at,
    }));
    setEmails([...inbound, ...sent, ...drafts]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const channel = supabase.channel('admin-phone-hub')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'call_logs' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sms_messages' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inbound_messages' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'email_send_log' }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  const displayPhone = (phone?: string | null) => names[phoneKey(phone)]?.name || phone || 'Unknown caller';
  const displayTag = (phone?: string | null) => names[phoneKey(phone)]?.tag;

  const feed = useMemo<FeedItem[]>(() => {
    const callItems: FeedItem[] = calls.map(call => ({
      kind: 'call', id: call.id, title: displayPhone(call.direction === 'outbound' ? call.to_number : call.from_number),
      subtitle: `${call.status === 'missed' || call.status === 'no-answer' ? 'Missed' : call.direction === 'outbound' ? 'Outgoing' : 'Incoming'} call${call.ai_handled ? ' · AI answered' : ''}`,
      at: call.created_at, unread: !call.read_at,
    }));
    const textItems: FeedItem[] = threads.map(thread => ({
      kind: 'text', id: thread.id, title: displayPhone(thread.phone), subtitle: thread.last_message_preview || 'Text conversation',
      at: thread.last_message_at, unread: thread.unread_count > 0,
    }));
    const emailItems: FeedItem[] = emails.filter(item => item.kind !== 'draft').map(item => ({
      kind: 'email', id: item.id, title: item.kind === 'sent' ? item.to : item.from,
      subtitle: `${item.subject} · ${item.snippet}`, at: item.at, unread: !!item.unread,
    }));
    return [...callItems, ...textItems, ...emailItems].sort((a, b) => b.at.localeCompare(a.at));
  }, [calls, threads, emails, names]);

  const q = search.trim().toLowerCase();
  const visibleFeed = feed.filter(item => !q || `${item.title} ${item.subtitle}`.toLowerCase().includes(q));
  const visibleCalls = calls.filter(call => !q || `${displayPhone(call.from_number)} ${call.from_number} ${call.ai_summary || ''}`.toLowerCase().includes(q));
  const visibleThreads = threads.filter(thread => !q || `${displayPhone(thread.phone)} ${thread.phone} ${thread.last_message_preview || ''}`.toLowerCase().includes(q));
  const visibleEmails = emails.filter(item => item.kind === emailFolder.slice(0, -1) || (emailFolder === 'inbox' && item.kind === 'inbound'))
    .filter(item => !q || `${item.from} ${item.to} ${item.subject} ${item.snippet}`.toLowerCase().includes(q))
    .sort((a, b) => b.at.localeCompare(a.at));

  const activeCall = selected?.kind === 'call' ? calls.find(call => call.id === selected.id) || null : null;
  const activeThread = selected?.kind === 'text' ? threads.find(thread => thread.id === selected.id) || null : null;
  const activeEmail = selected?.kind === 'email' ? emails.find(email => email.id === selected.id) || null : null;

  const openItem = async (kind: 'call' | 'text' | 'email', id: string) => {
    setSelected({ kind, id });
    if (kind === 'text') {
      const { data } = await supabase.from('sms_messages').select('*').eq('thread_id', id).order('created_at', { ascending: true });
      setMessages((data ?? []) as SmsMessage[]);
      await supabase.from('sms_threads').update({ unread_count: 0 }).eq('id', id);
      setThreads(current => current.map(thread => thread.id === id ? { ...thread, unread_count: 0 } : thread));
    }
    if (kind === 'call') {
      const call = calls.find(item => item.id === id);
      if (call && !call.read_at) {
        const readAt = new Date().toISOString();
        await supabase.from('call_logs').update({ read_at: readAt }).eq('id', id);
        setCalls(current => current.map(item => item.id === id ? { ...item, read_at: readAt } : item));
      }
    }
    if (kind === 'email' && id.startsWith('in:')) {
      await supabase.from('inbound_messages').update({ read_at: new Date().toISOString() }).eq('id', id.slice(3));
      setEmails(current => current.map(item => item.id === id ? { ...item, unread: false } : item));
    }
  };

  const sendText = async () => {
    if (!activeThread || !reply.trim()) return;
    setSending(true);
    const { data, error } = await supabase.functions.invoke('send-sms', { body: { thread_id: activeThread.id, to: activeThread.phone, body: reply } });
    setSending(false);
    if (error || data?.error) return toast.error(error?.message || data?.error || 'Text failed');
    setReply('');
    await openItem('text', activeThread.id);
  };

  const startText = async (phone: string) => {
    const clean = phone.replace(/\s/g, '');
    if (!clean) return;
    const existing = threads.find(thread => phoneKey(thread.phone) === phoneKey(clean));
    if (existing) {
      setMode('texts');
      await openItem('text', existing.id);
      return;
    }
    const { data, error } = await supabase.from('sms_threads').insert({ phone: clean }).select().single();
    if (error || !data) return toast.error(error?.message || 'Could not start conversation');
    setThreads(current => [data as TextThread, ...current]);
    setMode('texts');
    await openItem('text', data.id);
  };

  const openEmailCompose = (email?: EmailItem | null) => {
    setComposeDraftId(email?.kind === 'draft' ? email.id.slice(6) : null);
    setComposeTo(email ? (email.kind === 'inbound' ? (email.from.match(/<([^>]+)>/)?.[1] || email.from) : email.to) : '');
    setComposeSubject(email ? (email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`) : '');
    setComposeBody(email?.kind === 'draft' ? email.bodyText || '' : '');
    setComposeThreadId(email?.threadId || null);
    setComposeOpen(true);
  };

  const saveDraft = async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const payload = { author_id: auth.user.id, recipient_email: composeTo || null, subject: composeSubject || null, body: composeBody || null, thread_id: composeThreadId };
    if (composeDraftId) await supabase.from('email_drafts').update(payload).eq('id', composeDraftId);
    else await supabase.from('email_drafts').insert(payload);
    toast.success('Draft saved');
    setComposeOpen(false);
    load();
  };

  const sendEmail = async () => {
    if (!composeTo || !composeSubject || !composeBody) return toast.error('Recipient, subject, and message are required');
    setSending(true);
    const { error } = await supabase.functions.invoke('send-admin-message', { body: { to: composeTo, subject: composeSubject, body: composeBody, threadId: composeThreadId || crypto.randomUUID() } });
    setSending(false);
    if (error) return toast.error(error.message);
    if (composeDraftId) await supabase.from('email_drafts').delete().eq('id', composeDraftId);
    toast.success('Email sent');
    setComposeOpen(false);
    setTimeout(load, 2000);
  };

  const switchMode = (next: Mode) => { setMode(next); setSelected(null); setMessages([]); };
  const hasDetail = !!selected;

  const FeedIcon = ({ kind, missed }: { kind: FeedItem['kind']; missed?: boolean }) => {
    if (kind === 'text') return <MessageCircle className="h-5 w-5" />;
    if (kind === 'email') return <Mail className="h-5 w-5" />;
    return missed ? <PhoneMissed className="h-5 w-5" /> : <PhoneIncoming className="h-5 w-5" />;
  };

  const listContent = mode === 'inbox'
    ? visibleFeed
    : mode === 'calls'
      ? visibleCalls.map(call => ({ kind: 'call' as const, id: call.id, title: displayPhone(call.direction === 'outbound' ? call.to_number : call.from_number), subtitle: `${call.status === 'missed' || call.status === 'no-answer' ? 'Missed' : call.direction === 'outbound' ? 'Outgoing' : 'Incoming'} call · ${formatDuration(call.duration_seconds)}`, at: call.created_at, unread: !call.read_at }))
      : mode === 'texts'
        ? visibleThreads.map(thread => ({ kind: 'text' as const, id: thread.id, title: displayPhone(thread.phone), subtitle: thread.last_message_preview || 'New conversation', at: thread.last_message_at, unread: thread.unread_count > 0 }))
        : visibleEmails.map(email => ({ kind: 'email' as const, id: email.id, title: email.kind === 'sent' ? email.to : email.from, subtitle: `${email.subject} · ${email.snippet}`, at: email.at, unread: !!email.unread }));

  return (
    <div className="min-h-[620px] lg:h-[calc(100dvh-230px)] lg:min-h-[680px] lg:max-h-[900px] flex items-center justify-center">
      <div className="w-full h-[min(760px,calc(100dvh-140px))] min-h-[520px] lg:h-full grid grid-rows-[minmax(0,1fr)] lg:grid-cols-[400px_minmax(0,1fr)] overflow-hidden rounded-[2.75rem] border-[7px] border-secondary bg-card shadow-elevated ring-1 ring-border">
        <section className={cn('relative min-w-0 min-h-0 flex flex-col bg-card overflow-hidden', hasDetail && 'hidden lg:flex')}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-32 rounded-b-2xl bg-secondary z-20" />
          <div className="h-11 px-7 pt-4 flex items-center justify-between text-[11px] font-semibold z-10">
            <span>{format(new Date(), 'h:mm')}</span>
            <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /><span className="h-2.5 w-5 rounded-sm border border-muted-foreground p-px"><span className="block h-full w-3/4 rounded-[1px] bg-foreground" /></span></div>
          </div>

          <div className="px-5 pt-2 pb-4 border-b border-border/60">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-primary font-bold">Garage Ace</p>
                <h2 className="text-2xl font-display">Phone</h2>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="rounded-full" onClick={load} disabled={loading} title="Refresh"><RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} /></Button>
                <Button size="icon" className="rounded-full" onClick={() => mode === 'email' ? openEmailCompose() : setDialOpen(true)} title={mode === 'email' ? 'Compose email' : 'Dial or text'}><Plus className="h-5 w-5" /></Button>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search names or numbers" className="pl-9 rounded-2xl bg-muted/60 border-border/60" />
            </div>
            {mode === 'email' && (
              <div className="grid grid-cols-3 gap-1 mt-3 p-1 rounded-xl bg-muted/60">
                {(['inbox', 'sent', 'drafts'] as EmailFolder[]).map(folder => (
                  <Button key={folder} size="sm" variant={emailFolder === folder ? 'secondary' : 'ghost'} className="h-8 capitalize rounded-lg" onClick={() => setEmailFolder(folder)}>{folder}</Button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            {listContent.length === 0 ? (
              <div className="h-full grid place-items-center text-center p-8 text-muted-foreground">
                <div><Phone className="h-9 w-9 mx-auto mb-3 opacity-40" /><p className="text-sm">{loading ? 'Loading…' : 'Nothing here yet'}</p></div>
              </div>
            ) : listContent.map((item, index) => {
              const missed = item.kind === 'call' && item.subtitle.toLowerCase().includes('missed');
              return (
                <Button key={`${item.kind}:${item.id}`} variant="ghost" onClick={() => openItem(item.kind, item.id)} className="w-full h-auto rounded-none px-5 py-3.5 justify-start gap-3 border-b border-border/45 hover:bg-muted/45">
                  <span className={cn('h-11 w-11 shrink-0 rounded-2xl grid place-items-center', item.kind === 'text' && 'bg-primary/15 text-primary', item.kind === 'email' && 'bg-accent/15 text-accent', item.kind === 'call' && !missed && 'bg-primary/15 text-primary', missed && 'bg-destructive/15 text-destructive')}>
                    <FeedIcon kind={item.kind} missed={missed} />
                  </span>
                  <span className="min-w-0 flex-1 text-left">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className={cn('truncate text-sm', item.unread ? 'font-bold text-foreground' : 'font-semibold')}>{item.title}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">{relativeTime(item.at)}</span>
                    </span>
                    <span className={cn('block truncate text-xs mt-1', missed ? 'text-destructive' : 'text-muted-foreground')}>{item.subtitle}</span>
                  </span>
                  {item.unread && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                </Button>
              );
            })}
          </div>

          <div className="h-20 border-t border-border/60 grid grid-cols-4 px-2 pb-3 bg-card/95">
            {([
              ['inbox', Inbox, 'Inbox'], ['calls', PhoneCall, 'Calls'], ['texts', MessageCircle, 'Texts'], ['email', Mail, 'Email'],
            ] as const).map(([value, Icon, label]) => (
              <Button key={value} variant="ghost" className={cn('h-full flex-col gap-1 rounded-xl text-[10px]', mode === value ? 'text-primary' : 'text-muted-foreground')} onClick={() => switchMode(value)}>
                <Icon className="h-5 w-5" /><span>{label}</span>
              </Button>
            ))}
          </div>
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 h-1 w-24 rounded-full bg-muted-foreground/40" />
        </section>

        <section className={cn('min-w-0 min-h-0 overflow-hidden flex-col bg-background lg:border-l border-border', hasDetail ? 'flex' : 'hidden lg:flex')}>
          {!selected ? (
            <div className="flex-1 grid place-items-center text-center text-muted-foreground p-8">
              <div><Phone className="h-12 w-12 mx-auto mb-4 text-primary/50" /><h3 className="text-xl font-display text-foreground">Your shop phone</h3><p className="text-sm mt-1">Open a call, text, or email to respond.</p></div>
            </div>
          ) : activeCall ? (
            <CallDetail call={activeCall} name={displayPhone(activeCall.direction === 'outbound' ? activeCall.to_number : activeCall.from_number)} tag={displayTag(activeCall.from_number)} onBack={() => setSelected(null)} onCall={() => activeCall.from_number && dialInApp(activeCall.from_number)} onText={() => activeCall.from_number && startText(activeCall.from_number)} />
          ) : activeThread ? (
            <TextDetail thread={activeThread} name={displayPhone(activeThread.phone)} tag={displayTag(activeThread.phone)} messages={messages} reply={reply} sending={sending} onReply={setReply} onSend={sendText} onBack={() => setSelected(null)} onCall={() => dialInApp(activeThread.phone)} />
          ) : activeEmail ? (
            <EmailDetail email={activeEmail} onBack={() => setSelected(null)} onReply={() => openEmailCompose(activeEmail)} onEdit={() => openEmailCompose(activeEmail)} />
          ) : null}
        </section>
      </div>

      <Dialog open={dialOpen} onOpenChange={setDialOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>New conversation</DialogTitle><DialogDescription>Enter a phone number to call or text.</DialogDescription></DialogHeader>
          <Label htmlFor="phone-number">Phone number</Label>
          <Input id="phone-number" type="tel" value={dialNumber} onChange={event => setDialNumber(event.target.value)} placeholder="(239) 555-1234" autoFocus />
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => { setDialOpen(false); startText(dialNumber); }}><MessageCircle className="h-4 w-4 mr-2" />Text</Button>
            <Button onClick={() => { setDialOpen(false); dialInApp(dialNumber); }}><Phone className="h-4 w-4 mr-2" />Call</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle>{composeDraftId ? 'Edit draft' : composeThreadId ? 'Reply' : 'New email'}</DialogTitle><DialogDescription>Send from MMAR's verified mailbox.</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label htmlFor="email-to">To</Label><Input id="email-to" type="email" value={composeTo} onChange={event => setComposeTo(event.target.value)} /></div>
            <div className="space-y-1"><Label htmlFor="email-subject">Subject</Label><Input id="email-subject" value={composeSubject} onChange={event => setComposeSubject(event.target.value)} /></div>
            <div className="space-y-1"><Label htmlFor="email-body">Message</Label><Textarea id="email-body" rows={10} value={composeBody} onChange={event => setComposeBody(event.target.value)} /></div>
          </div>
          <div className="flex justify-between gap-2"><Button variant="outline" onClick={saveDraft}>Save draft</Button><Button onClick={sendEmail} disabled={sending}><Send className="h-4 w-4 mr-2" />Send</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailHeader({ title, subtitle, onBack, actions }: { title: string; subtitle?: string; onBack: () => void; actions?: React.ReactNode }) {
  return (
    <div className="h-20 px-4 sm:px-6 flex items-center gap-3 border-b border-border bg-card/70">
      <Button variant="ghost" size="icon" className="lg:hidden rounded-full" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
      <div className="h-11 w-11 rounded-full bg-primary/15 text-primary grid place-items-center font-bold shrink-0">{initials(title)}</div>
      <div className="min-w-0 flex-1"><h3 className="font-semibold truncate">{title}</h3>{subtitle && <p className="text-xs text-muted-foreground truncate capitalize">{subtitle}</p>}</div>
      {actions}
    </div>
  );
}

function CallDetail({ call, name, tag, onBack, onCall, onText }: { call: CallRow; name: string; tag?: string; onBack: () => void; onCall: () => void; onText: () => void }) {
  const missed = call.status === 'missed' || call.status === 'no-answer';
  return (
    <>
      <DetailHeader title={name} subtitle={tag || call.from_number || undefined} onBack={onBack} actions={<div className="flex gap-1"><Button size="icon" variant="outline" className="rounded-full" onClick={onText} title="Text"><MessageCircle className="h-4 w-4" /></Button><Button size="icon" className="rounded-full" onClick={onCall} title="Call"><Phone className="h-4 w-4" /></Button></div>} />
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-8 space-y-5">
        <div className="text-center py-5">
          <div className={cn('h-20 w-20 mx-auto rounded-full grid place-items-center mb-4', missed ? 'bg-destructive/15 text-destructive' : 'bg-primary/15 text-primary')}>{missed ? <PhoneMissed className="h-9 w-9" /> : <PhoneIncoming className="h-9 w-9" />}</div>
          <h3 className="text-2xl font-display">{missed ? 'Missed call' : call.ai_handled ? 'AI answered' : 'Call completed'}</h3>
          <p className="text-sm text-muted-foreground mt-1">{format(new Date(call.created_at), 'MMM d, yyyy · h:mm a')} · {formatDuration(call.duration_seconds)}</p>
        </div>
        {call.ai_summary && <div className="rounded-2xl border border-accent/30 bg-accent/5 p-4"><div className="flex items-center gap-2 text-accent text-xs font-bold uppercase mb-2"><Bot className="h-4 w-4" />AI summary</div><p className="text-sm leading-relaxed">{call.ai_summary}</p></div>}
        {(call.ai_transcript?.length || call.transcription) && <div><h4 className="font-display text-lg mb-3">Transcript</h4><div className="space-y-3">{call.ai_transcript?.map((line, index) => <div key={index} className={cn('flex', line.role === 'agent' ? 'justify-end' : 'justify-start')}><div className={cn('max-w-[82%] rounded-2xl px-4 py-3 text-sm', line.role === 'agent' ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted rounded-bl-sm')}><p className="text-[10px] uppercase font-bold opacity-60 mb-1">{line.role === 'agent' ? 'Receptionist' : 'Caller'}</p>{line.message}</div></div>)}{call.transcription && <div className="rounded-2xl bg-muted p-4 text-sm whitespace-pre-wrap">{call.transcription}</div>}</div></div>}
      </div>
    </>
  );
}

function TextDetail({ thread, name, tag, messages, reply, sending, onReply, onSend, onBack, onCall }: { thread: TextThread; name: string; tag?: string; messages: SmsMessage[]; reply: string; sending: boolean; onReply: (value: string) => void; onSend: () => void; onBack: () => void; onCall: () => void }) {
  return (
    <>
      <DetailHeader title={name} subtitle={`${tag || 'text conversation'} · ${thread.phone}`} onBack={onBack} actions={<Button size="icon" className="rounded-full" onClick={onCall} title="Call"><Phone className="h-4 w-4" /></Button>} />
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-3">
        {messages.map(message => <div key={message.id} className={cn('flex', message.direction === 'outbound' ? 'justify-end' : 'justify-start')}><div className={cn('max-w-[82%] rounded-2xl px-4 py-3 text-sm', message.direction === 'outbound' ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted rounded-bl-sm')}><MessageMedia media={message.media_urls} />{message.body && <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{message.body}</p>}<p className="text-[10px] opacity-60 mt-1">{format(new Date(message.created_at), 'MMM d, h:mm a')}{message.status ? ` · ${message.status}` : ''}</p></div></div>)}
        {messages.length === 0 && <div className="h-full grid place-items-center text-sm text-muted-foreground">No messages yet.</div>}
      </div>
      <div className="shrink-0 p-3 sm:p-4 border-t border-border bg-card/70 flex gap-2"><Textarea value={reply} onChange={event => onReply(event.target.value)} placeholder="Text message" rows={1} className="text-base min-h-11 max-h-28 resize-none rounded-2xl" /><Button size="icon" className="rounded-full shrink-0 mt-0.5" onClick={onSend} disabled={sending || !reply.trim()}><Send className="h-4 w-4" /></Button></div>
    </>
  );
}

function EmailDetail({ email, onBack, onReply, onEdit }: { email: EmailItem; onBack: () => void; onReply: () => void; onEdit: () => void }) {
  return (
    <>
      <DetailHeader title={email.kind === 'sent' ? email.to : email.from} subtitle={email.kind} onBack={onBack} actions={<Button size="sm" variant="outline" onClick={email.kind === 'draft' ? onEdit : onReply}>{email.kind === 'draft' ? <FileEdit className="h-4 w-4 mr-2" /> : <Reply className="h-4 w-4 mr-2" />}{email.kind === 'draft' ? 'Edit' : 'Reply'}</Button>} />
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-8">
        <div className="pb-5 mb-5 border-b border-border"><div className="flex items-start justify-between gap-3"><h3 className="text-xl font-display leading-tight">{email.subject}</h3>{email.status && <Badge variant="outline" className="capitalize">{email.status}</Badge>}</div><p className="text-xs text-muted-foreground mt-3">{format(new Date(email.at), 'MMM d, yyyy · h:mm a')}</p><p className="text-xs text-muted-foreground mt-1">From: {email.from}</p>{email.to && <p className="text-xs text-muted-foreground">To: {email.to}</p>}</div>
        {email.bodyHtml ? <EmailFrame html={email.bodyHtml} /> : <div className="text-sm whitespace-pre-wrap leading-relaxed">{email.bodyText || email.snippet || 'No content available.'}</div>}
      </div>
    </>
  );
}
type MediaItem = { path?: string; url?: string; type?: string };

function MessageMedia({ media }: { media: unknown }) {
  const items = (Array.isArray(media) ? media : []) as MediaItem[];
  const [urls, setUrls] = useState<string[]>([]);
  useEffect(() => {
    let alive = true;
    Promise.all(items.map(async item => {
      if (item.url) return item.url;
      if (!item.path) return '';
      const { data } = await supabase.storage.from('sms-media').createSignedUrl(item.path, 3600);
      return data?.signedUrl || '';
    })).then(list => { if (alive) setUrls(list); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(items)]);
  if (!items.length) return null;
  return (
    <div className="grid gap-2 mb-2">
      {items.map((item, i) => {
        const url = urls[i];
        if (!url) return <div key={i} className="h-40 w-56 max-w-full rounded-xl bg-background/30 animate-pulse" />;
        if (item.type?.startsWith('video')) return <video key={i} src={url} controls playsInline className="max-h-80 w-full rounded-xl bg-background" />;
        if (item.type?.startsWith('image')) return <a key={i} href={url} target="_blank" rel="noreferrer"><img src={url} alt="Attachment" className="max-h-80 w-full rounded-xl object-contain bg-background/30" /></a>;
        return <a key={i} href={url} target="_blank" rel="noreferrer" className="underline text-xs">Open attachment</a>;
      })}
    </div>
  );
}

function EmailFrame({ html }: { html: string }) {
  const [height, setHeight] = useState(600);
  return (
    <iframe
      title="Email preview"
      srcDoc={`<base target="_blank">${html}`}
      sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      className="w-full rounded-xl border border-border bg-background"
      style={{ height, colorScheme: 'light' }}
      onLoad={event => {
        const doc = (event.currentTarget as HTMLIFrameElement).contentDocument;
        if (doc) setHeight(Math.max(400, doc.documentElement.scrollHeight + 16));
      }}
    />
  );
}
