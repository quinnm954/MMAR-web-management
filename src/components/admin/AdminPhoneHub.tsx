import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import {
  ArrowLeft, Bot, FileEdit, Inbox, Mail, MessageCircle, Phone, PhoneCall,
  PhoneIncoming, PhoneMissed, Plus, MessagesSquare, RefreshCw, Reply, Search, Send,
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

type Mode = 'inbox' | 'calls' | 'texts' | 'chat' | 'email';
type EmailFolder = 'inbox' | 'sent' | 'drafts';
type Kind = 'call' | 'text' | 'chat' | 'email';
type Selected = { kind: Kind; id: string } | null;
type ChatThread = { id: string; subject: string | null; customer_id: string | null; tech_id: string | null; created_by: string; last_message_at: string; last_message_preview: string | null };
type ChatMessage = { id: string; thread_id: string; sender_id: string; body: string; created_at: string };

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
  kind: Kind;
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
  const [mode, setMode] = useState<Mode>('calls');
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
  const [chats, setChats] = useState<ChatThread[]>([]);
  const [chatNames, setChatNames] = useState<Record<string, string>>({});
  const [chatMsgs, setChatMsgs] = useState<ChatMessage[]>([]);
  const [chatReads, setChatReads] = useState<Record<string, string>>({});
  const [me, setMe] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [callResult, threadResult, inboundResult, sentResult, draftResult, profileResult, employeeResult, roleResult] = await Promise.all([
      supabase.from('call_logs').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('sms_threads').select('*').order('last_message_at', { ascending: false }).limit(200),
      supabase.from('inbound_messages').select('*').order('received_at', { ascending: false }).limit(200),
      supabase.from('email_send_log').select('*').order('created_at', { ascending: false }).limit(1000),
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
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id || null;
    setMe(uid);
    const { data: ct } = await supabase.from('message_threads').select('*').order('last_message_at', { ascending: false }).limit(200);
    const chatList = (ct ?? []) as ChatThread[];
    setChats(chatList);
    const ids = Array.from(new Set(chatList.flatMap(t => [t.customer_id, t.tech_id, t.created_by]).filter(Boolean))) as string[];
    if (ids.length) {
      const { data: ps } = await supabase.from('profiles').select('id, full_name, email').in('id', ids);
      const map: Record<string, string> = {};
      (ps ?? []).forEach((p: any) => { map[p.id] = p.full_name || p.email || 'Customer'; });
      setChatNames(map);
    }
    if (uid) {
      const { data: rd } = await supabase.from('message_reads').select('thread_id, last_read_at').eq('user_id', uid);
      const rm: Record<string, string> = {};
      (rd ?? []).forEach((x: any) => { rm[x.thread_id] = x.last_read_at; });
      setChatReads(rm);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const channel = supabase.channel('admin-phone-hub')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'call_logs' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sms_messages' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inbound_messages' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'email_send_log' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_threads' }, load)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  const displayPhone = (phone?: string | null) => names[phoneKey(phone)]?.name || phone || 'Unknown caller';
  const displayTag = (phone?: string | null) => names[phoneKey(phone)]?.tag;

  const chatTitle = (t: ChatThread) => {
    const who = t.customer_id ? chatNames[t.customer_id] : t.tech_id ? chatNames[t.tech_id] : chatNames[t.created_by];
    return who || t.subject || 'In-app chat';
  };
  const chatFeed = (t: ChatThread): FeedItem => ({
    kind: 'chat', id: t.id, title: chatTitle(t),
    subtitle: `${t.tech_id ? 'Tech chat' : 'App chat'} · ${t.last_message_preview || t.subject || ''}`,
    at: t.last_message_at, unread: !chatReads[t.id] || chatReads[t.id] < t.last_message_at,
  });

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
    const chatItems: FeedItem[] = chats.map(t => chatFeed(t));
    const emailItems: FeedItem[] = emails.filter(item => item.kind !== 'draft').map(item => ({
      kind: 'email', id: item.id, title: item.kind === 'sent' ? item.to : item.from,
      subtitle: `${item.subject} · ${item.snippet}`, at: item.at, unread: !!item.unread,
    }));
    return [...callItems, ...textItems, ...chatItems, ...emailItems].sort((a, b) => b.at.localeCompare(a.at));
  }, [calls, threads, emails, names, chats, chatNames, chatReads]);

  const q = search.trim().toLowerCase();
  const visibleFeed = feed.filter(item => !q || `${item.title} ${item.subtitle}`.toLowerCase().includes(q));
  const visibleCalls = calls.filter(call => !q || `${displayPhone(call.from_number)} ${call.from_number} ${call.ai_summary || ''}`.toLowerCase().includes(q));
  const visibleThreads = threads.filter(thread => !q || `${displayPhone(thread.phone)} ${thread.phone} ${thread.last_message_preview || ''}`.toLowerCase().includes(q));
  const folderKind = { inbox: 'inbound', sent: 'sent', drafts: 'draft' } as const;
  const visibleEmails = emails.filter(item => item.kind === folderKind[emailFolder])
    .filter(item => !q || `${item.from} ${item.to} ${item.subject} ${item.snippet}`.toLowerCase().includes(q))
    .sort((a, b) => b.at.localeCompare(a.at));

  const activeCall = selected?.kind === 'call' ? calls.find(call => call.id === selected.id) || null : null;
  const activeThread = selected?.kind === 'text' ? threads.find(thread => thread.id === selected.id) || null : null;
  const activeChat = selected?.kind === 'chat' ? chats.find(t => t.id === selected.id) || null : null;
  const activeEmail = selected?.kind === 'email' ? emails.find(email => email.id === selected.id) || null : null;

  const openItem = async (kind: Kind, id: string) => {
    setSelected({ kind, id });
    if (kind === 'chat') {
      const { data } = await supabase.from('messages').select('*').eq('thread_id', id).order('created_at', { ascending: true });
      setChatMsgs((data ?? []) as ChatMessage[]);
      if (me) {
        const now = new Date().toISOString();
        await supabase.from('message_reads').upsert({ thread_id: id, user_id: me, last_read_at: now });
        setChatReads(c => ({ ...c, [id]: now }));
      }
    }
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

  const sendChat = async () => {
    if (!activeChat || !me || !reply.trim()) return;
    setSending(true);
    const { error } = await supabase.from('messages').insert({ thread_id: activeChat.id, sender_id: me, body: reply.trim() });
    setSending(false);
    if (error) return toast.error(error.message);
    setReply('');
    await openItem('chat', activeChat.id);
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

  const switchMode = (next: Mode) => { setMode(next); setSelected(null); setMessages([]); setReply(''); };
  const hasDetail = !!selected;

  const FeedIcon = ({ kind, missed }: { kind: FeedItem['kind']; missed?: boolean }) => {
    if (kind === 'text') return <MessageCircle className="h-5 w-5" />;
    if (kind === 'email') return <Mail className="h-5 w-5" />;
    if (kind === 'chat') return <MessagesSquare className="h-5 w-5" />;
    return missed ? <PhoneMissed className="h-5 w-5" /> : <PhoneIncoming className="h-5 w-5" />;
  };

  const listContent = mode === 'inbox'
    ? visibleFeed
    : mode === 'calls'
      ? visibleCalls.map(call => ({ kind: 'call' as const, id: call.id, title: displayPhone(call.direction === 'outbound' ? call.to_number : call.from_number), subtitle: `${call.status === 'missed' || call.status === 'no-answer' ? 'Missed' : call.direction === 'outbound' ? 'Outgoing' : 'Incoming'} call · ${formatDuration(call.duration_seconds)}`, at: call.created_at, unread: !call.read_at }))
      : mode === 'texts'
        ? visibleThreads.map(thread => ({ kind: 'text' as const, id: thread.id, title: displayPhone(thread.phone), subtitle: thread.last_message_preview || 'New conversation', at: thread.last_message_at, unread: thread.unread_count > 0 }))
        : mode === 'chat'
        ? chats.map(chatFeed).filter(item => !q || `${item.title} ${item.subtitle}`.toLowerCase().includes(q))
        : visibleEmails.map(email => ({ kind: 'email' as const, id: email.id, title: email.kind === 'sent' ? email.to : email.from, subtitle: `${email.subject} · ${email.snippet}`, at: email.at, unread: !!email.unread }));

  const unreadBy = (k: Kind) => feed.filter(f => f.kind === k && f.unread).length;
  const TITLES: Record<Mode, string> = { inbox: 'Recents', calls: 'Recents', texts: 'Messages', chat: 'Chat', email: emailFolder === 'inbox' ? 'Inbox' : emailFolder === 'sent' ? 'Sent' : 'Drafts' };
  const [scrolled, setScrolled] = useState(false);
  const pressKey = (k: string) => setDialNumber(n => (n + k).slice(0, 20));

  return (
    <div className="flex items-center justify-center lg:py-6">
      <IPhoneFrame>
        {/* Screen stack: list (base) + detail (slides in) */}
        <div className="relative h-full w-full overflow-hidden">
          <section className={cn('absolute inset-0 flex flex-col transition-transform duration-300 ease-out', hasDetail && '-translate-x-1/4 opacity-60 pointer-events-none')}>
            <StatusBar />
            {/* Compact nav bar */}
            <div className="relative h-11 shrink-0 flex items-center justify-between px-4">
              <button onClick={load} disabled={loading} className="text-[17px] text-[hsl(var(--ios-blue))]" title="Refresh">{loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : 'Edit'}</button>
              <span className={cn('absolute left-1/2 -translate-x-1/2 text-[17px] font-semibold transition-opacity', scrolled ? 'opacity-100' : 'opacity-0')}>{TITLES[mode]}</span>
              <button onClick={() => mode === 'email' ? openEmailCompose() : setDialOpen(true)} className="text-[hsl(var(--ios-blue))]" title={mode === 'email' ? 'Compose' : 'New'}>
                {mode === 'email' || mode === 'texts' || mode === 'chat' ? <FileEdit className="h-[22px] w-[22px]" /> : <Plus className="h-6 w-6" />}
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain" onScroll={e => setScrolled(e.currentTarget.scrollTop > 30)}>
              <h1 className="px-4 pt-1 pb-2 text-[34px] font-bold tracking-tight leading-tight">{TITLES[mode]}</h1>
              <div className="px-4 pb-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--ios-label-2))]" />
                  <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search" className="w-full h-9 rounded-[10px] bg-[hsl(var(--ios-fill))] pl-8 pr-3 text-[17px] placeholder:text-[hsl(var(--ios-label-2))] outline-none" />
                </div>
                {mode === 'email' && (
                  <div className="grid grid-cols-3 mt-3 p-0.5 rounded-[9px] bg-[hsl(var(--ios-fill))]">
                    {(['inbox', 'sent', 'drafts'] as EmailFolder[]).map(folder => (
                      <button key={folder} onClick={() => setEmailFolder(folder)} className={cn('h-7 rounded-[7px] text-[13px] font-medium capitalize transition-colors', emailFolder === folder && 'bg-[hsl(var(--ios-bubble))] shadow')}>{folder}</button>
                    ))}
                  </div>
                )}
              </div>

              {listContent.length === 0 ? (
                <div className="py-24 text-center text-[hsl(var(--ios-label-2))]">
                  <Phone className="h-9 w-9 mx-auto mb-3 opacity-40" /><p className="text-[15px]">{loading ? 'Loading…' : mode === 'email' && emailFolder === 'inbox' ? 'No incoming email yet.' : 'Nothing here yet'}</p>
                </div>
              ) : listContent.map(item => {
                const missed = item.kind === 'call' && item.subtitle.toLowerCase().includes('missed');
                return (
                  <button key={`${item.kind}:${item.id}`} onClick={() => openItem(item.kind, item.id)} className="w-full flex items-center gap-3 pl-4 text-left active:bg-[hsl(var(--ios-fill))]">
                    <span className="w-2.5 shrink-0 flex justify-center">{item.unread && <span className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--ios-blue))]" />}</span>
                    <Avatar name={item.title} />
                    <span className="min-w-0 flex-1 py-2.5 pr-4 border-b border-[hsl(var(--ios-separator))]">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className={cn('truncate text-[17px] font-semibold', missed && 'text-[hsl(var(--ios-red))]')}>{item.title}</span>
                        <span className="flex items-center gap-1 text-[15px] text-[hsl(var(--ios-label-2))] shrink-0">{shortTime(item.at)}<ChevronRight className="h-4 w-4 opacity-60" /></span>
                      </span>
                      <span className="block text-[15px] leading-snug text-[hsl(var(--ios-label-2))] line-clamp-2">{item.kind === 'call' && <FeedIcon kind={item.kind} missed={missed} />}{item.subtitle}</span>
                    </span>
                  </button>
                );
              })}
              <div className="h-24" />
            </div>

            {/* Tab bar */}
            <nav className="absolute bottom-0 inset-x-0 ios-frost border-t border-[hsl(var(--ios-separator))] grid grid-cols-4 pt-1.5 pb-7">
              {([
                ['calls', PhoneCall, 'Calls', 'call'], ['texts', MessageCircle, 'Texts', 'text'], ['chat', MessagesSquare, 'Chat', 'chat'], ['email', Mail, 'Email', 'email'],
              ] as const).map(([value, Icon, label, kind]) => {
                const n = unreadBy(kind);
                return (
                  <button key={value} onClick={() => switchMode(value)} className={cn('relative flex flex-col items-center gap-0.5 text-[10px] font-medium', mode === value ? 'text-[hsl(var(--ios-blue))]' : 'text-[hsl(var(--ios-label-2))]')}>
                    <Icon className="h-6 w-6" fill={mode === value ? 'currentColor' : 'none'} strokeWidth={mode === value ? 1.5 : 2} />
                    <span>{label}</span>
                    {n > 0 && <span className="absolute -top-1 left-1/2 ml-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[hsl(var(--ios-red))] text-[11px] leading-[18px] text-[hsl(var(--ios-label))] text-center">{n > 99 ? '99+' : n}</span>}
                  </button>
                );
              })}
            </nav>
          </section>

          <section className={cn('absolute inset-0 flex flex-col bg-[hsl(var(--ios-bg))] transition-transform duration-300 ease-out', hasDetail ? 'translate-x-0' : 'translate-x-full')}>
            {selected && <StatusBar />}
            {activeCall ? (
              <CallDetail call={activeCall} name={displayPhone(activeCall.direction === 'outbound' ? activeCall.to_number : activeCall.from_number)} tag={displayTag(activeCall.from_number)} onBack={() => setSelected(null)} onCall={() => activeCall.from_number && dialInApp(activeCall.from_number)} onText={() => activeCall.from_number && startText(activeCall.from_number)} />
            ) : activeThread ? (
              <TextDetail thread={activeThread} name={displayPhone(activeThread.phone)} tag={displayTag(activeThread.phone)} messages={messages} reply={reply} sending={sending} onReply={setReply} onSend={sendText} onBack={() => setSelected(null)} onCall={() => dialInApp(activeThread.phone)} />
            ) : activeChat ? (
              <ChatDetail title={chatTitle(activeChat)} subtitle={activeChat.subject || (activeChat.tech_id ? 'tech chat' : 'app chat')} me={me} messages={chatMsgs} names={chatNames} reply={reply} sending={sending} onReply={setReply} onSend={sendChat} onBack={() => setSelected(null)} />
            ) : activeEmail ? (
              <EmailDetail email={activeEmail} onBack={() => setSelected(null)} onReply={() => openEmailCompose(activeEmail)} onEdit={() => openEmailCompose(activeEmail)} />
            ) : null}
          </section>

          {/* Keypad sheet */}
          <Sheet open={dialOpen} onClose={() => setDialOpen(false)}>
            <div className="text-center pt-2">
              <input value={dialNumber} onChange={e => setDialNumber(e.target.value)} inputMode="tel" placeholder="Enter number" className="w-full bg-transparent text-center text-[32px] font-light tracking-wide outline-none placeholder:text-[hsl(var(--ios-label-2))] placeholder:text-xl" />
              <div className="grid grid-cols-3 gap-x-6 gap-y-3.5 w-fit mx-auto mt-5">
                {[['1', ''], ['2', 'ABC'], ['3', 'DEF'], ['4', 'GHI'], ['5', 'JKL'], ['6', 'MNO'], ['7', 'PQRS'], ['8', 'TUV'], ['9', 'WXYZ'], ['*', ''], ['0', '+'], ['#', '']].map(([d, l]) => (
                  <button key={d} onClick={() => pressKey(d)} className="h-[72px] w-[72px] rounded-full bg-[hsl(var(--ios-bubble))] active:bg-[hsl(var(--ios-separator))] flex flex-col items-center justify-center">
                    <span className="text-[32px] leading-none font-normal">{d}</span>{l && <span className="text-[9px] tracking-[0.2em] font-semibold">{l}</span>}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-x-6 w-fit mx-auto mt-4 items-center">
                <button onClick={() => { setDialOpen(false); startText(dialNumber); }} disabled={!dialNumber} className="h-[72px] w-[72px] rounded-full grid place-items-center text-[hsl(var(--ios-blue))] disabled:opacity-40" title="Text"><MessageCircle className="h-7 w-7" /></button>
                <button onClick={() => { setDialOpen(false); dialInApp(dialNumber); }} disabled={!dialNumber} className="h-[72px] w-[72px] rounded-full bg-[hsl(var(--ios-green))] grid place-items-center text-[hsl(var(--ios-label))] disabled:opacity-60" title="Call"><Phone className="h-8 w-8" fill="currentColor" /></button>
                <button onClick={() => setDialNumber(n => n.slice(0, -1))} className="h-[72px] w-[72px] grid place-items-center text-[hsl(var(--ios-label-2))]" title="Delete"><Delete className="h-7 w-7" /></button>
              </div>
            </div>
          </Sheet>

          {/* Compose sheet */}
          <Sheet open={composeOpen} onClose={() => setComposeOpen(false)} tall>
            <div className="flex items-center justify-between -mt-1 mb-3">
              <button onClick={() => setComposeOpen(false)} className="text-[17px] text-[hsl(var(--ios-blue))]">Cancel</button>
              <span className="text-[17px] font-semibold">{composeDraftId ? 'Edit draft' : composeThreadId ? 'Reply' : 'New Message'}</span>
              <button onClick={sendEmail} disabled={sending} className="h-8 w-8 rounded-full bg-[hsl(var(--ios-blue))] grid place-items-center disabled:opacity-50" title="Send"><ArrowUp className="h-5 w-5" /></button>
            </div>
            <div className="divide-y divide-[hsl(var(--ios-separator))] border-y border-[hsl(var(--ios-separator))] text-[15px]">
              <label className="flex gap-2 py-2.5"><span className="text-[hsl(var(--ios-label-2))]">To:</span><input type="email" value={composeTo} onChange={e => setComposeTo(e.target.value)} className="flex-1 bg-transparent outline-none" /></label>
              <label className="flex gap-2 py-2.5"><span className="text-[hsl(var(--ios-label-2))]">Subject:</span><input value={composeSubject} onChange={e => setComposeSubject(e.target.value)} className="flex-1 bg-transparent outline-none" /></label>
            </div>
            <textarea value={composeBody} onChange={e => setComposeBody(e.target.value)} className="w-full flex-1 min-h-[260px] bg-transparent outline-none text-[16px] pt-3 resize-none" />
            <button onClick={saveDraft} className="text-[15px] text-[hsl(var(--ios-blue))] mt-2">Save draft</button>
          </Sheet>
        </div>
      </IPhoneFrame>
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
  const boxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    const t = setTimeout(() => { el.scrollTop = el.scrollHeight; }, 300); // after images load
    return () => clearTimeout(t);
  }, [messages, thread.id]);
  return (
    <>
      <DetailHeader title={name} subtitle={`${tag || 'text conversation'} · ${thread.phone}`} onBack={onBack} actions={<Button size="icon" className="rounded-full" onClick={onCall} title="Call"><Phone className="h-4 w-4" /></Button>} />
      <div ref={boxRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-3">
        {messages.map(message => <div key={message.id} className={cn('flex', message.direction === 'outbound' ? 'justify-end' : 'justify-start')}><div className={cn('max-w-[82%] rounded-2xl px-4 py-3 text-sm', message.direction === 'outbound' ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted rounded-bl-sm')}><MessageMedia media={message.media_urls} />{message.body && <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{message.body}</p>}<p className="text-[10px] opacity-60 mt-1">{format(new Date(message.created_at), 'MMM d, h:mm a')}{message.status ? ` · ${message.status}` : ''}</p></div></div>)}
        {messages.length === 0 && <div className="h-full grid place-items-center text-sm text-muted-foreground">No messages yet.</div>}
      </div>
      <div className="shrink-0 p-3 sm:p-4 border-t border-border bg-card/70 flex gap-2"><Textarea value={reply} onChange={event => onReply(event.target.value)} placeholder="Text message" rows={1} className="text-base min-h-11 max-h-28 resize-none rounded-2xl" /><Button size="icon" className="rounded-full shrink-0 mt-0.5" onClick={onSend} disabled={sending || !reply.trim()}><Send className="h-4 w-4" /></Button></div>
    </>
  );
}

function ChatDetail({ title, subtitle, me, messages, names, reply, sending, onReply, onSend, onBack }: { title: string; subtitle: string; me: string | null; messages: ChatMessage[]; names: Record<string, string>; reply: string; sending: boolean; onReply: (v: string) => void; onSend: () => void; onBack: () => void }) {
  const boxRef = useRef<HTMLDivElement>(null);
  useEffect(() => { const el = boxRef.current; if (el) el.scrollTop = el.scrollHeight; }, [messages]);
  return (
    <>
      <DetailHeader title={title} subtitle={subtitle} onBack={onBack} />
      <div ref={boxRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-3">
        {messages.map(m => { const mine = m.sender_id === me; return <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}><div className={cn('max-w-[82%] rounded-2xl px-4 py-3 text-sm', mine ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted rounded-bl-sm')}>{!mine && <p className="text-[10px] uppercase font-bold opacity-60 mb-1">{names[m.sender_id] || 'Customer'}</p>}<p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{m.body}</p><p className="text-[10px] opacity-60 mt-1">{format(new Date(m.created_at), 'MMM d, h:mm a')}</p></div></div>; })}
        {messages.length === 0 && <div className="h-full grid place-items-center text-sm text-muted-foreground">No messages yet.</div>}
      </div>
      <div className="shrink-0 p-3 sm:p-4 border-t border-border bg-card/70 flex gap-2"><Textarea value={reply} onChange={e => onReply(e.target.value)} placeholder="Message" rows={1} className="text-base min-h-11 max-h-28 resize-none rounded-2xl" /><Button size="icon" className="rounded-full shrink-0 mt-0.5" onClick={onSend} disabled={sending || !reply.trim()}><Send className="h-4 w-4" /></Button></div>
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
