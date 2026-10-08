import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import {
  ArrowLeft, Bot, FileEdit, Inbox, Mail, MessageCircle, Phone, PhoneCall,
  PhoneIncoming, PhoneMissed, Plus, MessagesSquare, RefreshCw, Reply, Search, Send,
  ChevronLeft, ChevronRight, ArrowUp, Delete, Signal, Wifi, BatteryFull, User,
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
                      <span className="block text-[15px] leading-snug text-[hsl(var(--ios-label-2))] line-clamp-2">{item.kind === 'call' && (missed ? <PhoneMissed className="inline h-3.5 w-3.5 mr-1 -mt-0.5" /> : <PhoneIncoming className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />)}{item.subtitle}</span>
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

function IPhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full lg:w-auto">
      {/* side buttons (desktop only) */}
      <span className="hidden lg:block absolute -left-[3px] top-[120px] h-8 w-[3px] rounded-l bg-[hsl(var(--ios-bezel))]" />
      <span className="hidden lg:block absolute -left-[3px] top-[180px] h-14 w-[3px] rounded-l bg-[hsl(var(--ios-bezel))]" />
      <span className="hidden lg:block absolute -left-[3px] top-[250px] h-14 w-[3px] rounded-l bg-[hsl(var(--ios-bezel))]" />
      <span className="hidden lg:block absolute -right-[3px] top-[200px] h-20 w-[3px] rounded-r bg-[hsl(var(--ios-bezel))]" />
      <div className="ios relative overflow-hidden h-[calc(100dvh-190px)] min-h-[520px] w-full lg:h-[852px] lg:max-h-[calc(100dvh-140px)] lg:w-[393px] lg:rounded-[55px] lg:border-[11px] lg:border-[hsl(var(--ios-bezel))] lg:shadow-[0_30px_80px_-20px_hsl(var(--ios-bg)/0.9)] lg:ring-1 lg:ring-[hsl(var(--ios-separator))]">
        {/* Dynamic Island */}
        <div className="hidden lg:block absolute top-[11px] left-1/2 -translate-x-1/2 h-[34px] w-[122px] rounded-full bg-[hsl(var(--ios-bg))] z-50" />
        {children}
        <div className="hidden lg:block absolute bottom-2 left-1/2 -translate-x-1/2 h-[5px] w-[134px] rounded-full bg-[hsl(var(--ios-label))] z-50 pointer-events-none" />
      </div>
    </div>
  );
}

function StatusBar() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t); }, []);
  return (
    <div className="hidden lg:flex h-[54px] shrink-0 items-center justify-between px-8 pt-1 text-[16px] font-semibold">
      <span className="w-[60px] text-center">{format(now, 'h:mm')}</span>
      <span className="flex items-center gap-1.5"><Signal className="h-4 w-4" /><Wifi className="h-4 w-4" /><BatteryFull className="h-5 w-6" /></span>
    </div>
  );
}

function Sheet({ open, onClose, tall, children }: { open: boolean; onClose: () => void; tall?: boolean; children: React.ReactNode }) {
  return (
    <div className={cn('absolute inset-0 z-40 transition-opacity', open ? 'opacity-100' : 'opacity-0 pointer-events-none')}>
      <div className="absolute inset-0 bg-[hsl(var(--ios-bg)/0.5)]" onClick={onClose} />
      <div className={cn('absolute inset-x-0 bottom-0 flex flex-col rounded-t-[12px] bg-[hsl(var(--ios-grouped))] px-4 pt-2 pb-10 transition-transform duration-300', tall ? 'top-12' : '', open ? 'translate-y-0' : 'translate-y-full')}>
        <div className="mx-auto mb-3 h-[5px] w-9 rounded-full bg-[hsl(var(--ios-separator))]" />
        {children}
      </div>
    </div>
  );
}

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  return (
    <span className="shrink-0 rounded-full grid place-items-center font-semibold text-[hsl(var(--ios-label))] bg-gradient-to-b from-[hsl(var(--ios-label-2))] to-[hsl(var(--ios-separator))]" style={{ height: size, width: size, fontSize: size * 0.4 }}>
      {/[a-z]/i.test(name) ? initials(name) : <User className="h-1/2 w-1/2" fill="currentColor" />}
    </span>
  );
}

const shortTime = (at: string) => {
  const d = new Date(at), now = new Date();
  if (d.toDateString() === now.toDateString()) return format(d, 'h:mm a');
  const y = new Date(now); y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return 'Yesterday';
  if (now.getTime() - d.getTime() < 6 * 864e5) return format(d, 'EEEE');
  return format(d, 'M/d/yy');
};

function NavBar({ onBack, back = 'Back', children, right }: { onBack: () => void; back?: string; children?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="ios-frost shrink-0 border-b border-[hsl(var(--ios-separator))] px-2 pb-2 pt-1 relative z-10">
      <div className="flex items-start justify-between min-h-11">
        <button onClick={onBack} className="flex items-center text-[17px] text-[hsl(var(--ios-blue))] h-11 pr-2"><ChevronLeft className="h-7 w-7 -mr-1" />{back}</button>
        <div className="flex items-center gap-1 h-11 pr-2 text-[hsl(var(--ios-blue))]">{right}</div>
      </div>
      {children}
    </div>
  );
}

function ContactHead({ name, sub }: { name: string; sub?: string }) {
  return <div className="-mt-9 flex flex-col items-center gap-1 pointer-events-none"><Avatar name={name} size={52} /><span className="text-[12px] flex items-center max-w-[220px]"><span className="truncate">{name}</span><ChevronRight className="h-3 w-3 opacity-60" /></span>{sub && <span className="text-[11px] text-[hsl(var(--ios-label-2))] truncate max-w-[240px] capitalize">{sub}</span>}</div>;
}

function Bubbles<T extends { id: string; created_at: string }>({ items, mine, render, boxRef }: { items: T[]; mine: (m: T) => boolean; render: (m: T) => React.ReactNode; boxRef: React.RefObject<HTMLDivElement> }) {
  return (
    <div ref={boxRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-3">
      {items.map((m, i) => {
        const prev = items[i - 1], next = items[i + 1];
        const gap = !prev || new Date(m.created_at).getTime() - new Date(prev.created_at).getTime() > 60 * 60000;
        const out = mine(m);
        const last = !next || mine(next) !== out || new Date(next.created_at).getTime() - new Date(m.created_at).getTime() > 60 * 60000;
        return (
          <div key={m.id}>
            {gap && <p className="text-center text-[11px] text-[hsl(var(--ios-label-2))] my-3"><span className="font-semibold">{shortTime(m.created_at)}</span>{shortTime(m.created_at).includes(':') ? '' : ` ${format(new Date(m.created_at), 'h:mm a')}`}</p>}
            <div className={cn('flex', out ? 'justify-end' : 'justify-start', last ? 'mb-2' : 'mb-0.5')}>
              <div className={cn('max-w-[75%] px-3 py-[7px] text-[17px] leading-[22px] rounded-[18px]', out ? 'bg-[hsl(var(--ios-blue))] text-[hsl(var(--ios-label))]' : 'bg-[hsl(var(--ios-bubble))]', last && (out ? 'rounded-br-[5px]' : 'rounded-bl-[5px]'))}>
                {render(m)}
              </div>
            </div>
          </div>
        );
      })}
      {items.length === 0 && <div className="h-full grid place-items-center text-[15px] text-[hsl(var(--ios-label-2))]">No messages yet.</div>}
    </div>
  );
}

function Composer({ value, onChange, onSend, sending, placeholder }: { value: string; onChange: (v: string) => void; onSend: () => void; sending: boolean; placeholder: string }) {
  return (
    <div className="shrink-0 px-2 pt-1.5 pb-3 lg:pb-8 flex items-end gap-2 bg-[hsl(var(--ios-bg))]">
      <span className="h-9 w-9 shrink-0 rounded-full bg-[hsl(var(--ios-fill))] grid place-items-center text-[hsl(var(--ios-label-2))]"><Plus className="h-5 w-5" /></span>
      <div className="flex-1 flex items-end rounded-[20px] border border-[hsl(var(--ios-separator))] pl-3 pr-1 py-1 min-h-9">
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={1} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (value.trim()) onSend(); } }} className="flex-1 bg-transparent outline-none resize-none text-[17px] leading-[22px] py-0.5 max-h-28 placeholder:text-[hsl(var(--ios-label-2))]" />
        {value.trim() && <button onClick={onSend} disabled={sending} className="h-7 w-7 shrink-0 rounded-full bg-[hsl(var(--ios-blue))] grid place-items-center disabled:opacity-50" title="Send"><ArrowUp className="h-[18px] w-[18px]" strokeWidth={3} /></button>}
      </div>
    </div>
  );
}

function useBottom(dep: unknown[]) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    el.scrollTop = el.scrollHeight;
    const t = setTimeout(() => { el.scrollTop = el.scrollHeight; }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dep);
  return ref;
}

function Group({ children }: { children: React.ReactNode }) {
  return <div className="rounded-[10px] bg-[hsl(var(--ios-grouped))] overflow-hidden">{children}</div>;
}

function CallDetail({ call, name, tag, onBack, onCall, onText }: { call: CallRow; name: string; tag?: string; onBack: () => void; onCall: () => void; onText: () => void }) {
  const missed = call.status === 'missed' || call.status === 'no-answer';
  const number = call.direction === 'outbound' ? call.to_number : call.from_number;
  return (
    <>
      <NavBar onBack={onBack} back="Recents" />
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 pb-10 space-y-5">
        <div className="text-center pt-4">
          <div className="flex justify-center"><Avatar name={name} size={96} /></div>
          <h3 className="text-[28px] font-semibold mt-3 leading-tight">{name}</h3>
          {tag && <p className="text-[15px] text-[hsl(var(--ios-label-2))]">{tag}</p>}
          <div className="grid grid-cols-3 gap-2 mt-5">
            {([[MessageCircle, 'message', onText], [Phone, 'call', onCall], [Mail, 'mail', undefined]] as const).map(([Icon, label, fn]) => (
              <button key={label} onClick={fn} disabled={!fn} className="rounded-[10px] bg-[hsl(var(--ios-grouped))] py-2.5 flex flex-col items-center gap-1 text-[hsl(var(--ios-blue))] disabled:opacity-40"><Icon className="h-5 w-5" fill="currentColor" /><span className="text-[12px]">{label}</span></button>
            ))}
          </div>
        </div>
        <Group>
          <div className="px-4 py-3">
            <p className="text-[15px] font-semibold">{format(new Date(call.created_at), 'EEEE, MMM d')}</p>
            <div className="flex justify-between text-[15px] mt-1"><span className="text-[hsl(var(--ios-label-2))]">{format(new Date(call.created_at), 'h:mm a')}</span><span className={missed ? 'text-[hsl(var(--ios-red))]' : ''}>{missed ? 'Missed Call' : call.direction === 'outbound' ? 'Outgoing Call' : call.ai_handled ? 'Answered by AI' : 'Incoming Call'}</span><span className="text-[hsl(var(--ios-label-2))]">{formatDuration(call.duration_seconds)}</span></div>
          </div>
          {number && <div className="px-4 py-3 border-t border-[hsl(var(--ios-separator))]"><p className="text-[13px]">phone</p><p className="text-[17px] text-[hsl(var(--ios-blue))]">{number}</p></div>}
        </Group>
        {call.ai_summary && <div><p className="px-4 pb-1.5 text-[13px] uppercase text-[hsl(var(--ios-label-2))] flex items-center gap-1"><Bot className="h-3.5 w-3.5" />AI summary</p><Group><p className="px-4 py-3 text-[15px] leading-relaxed">{call.ai_summary}</p></Group></div>}
        {(call.ai_transcript?.length || call.transcription) && (
          <div>
            <p className="px-4 pb-1.5 text-[13px] uppercase text-[hsl(var(--ios-label-2))]">Transcript</p>
            <Group><div className="p-3 space-y-1.5">
              {call.ai_transcript?.map((line, index) => (
                <div key={index} className={cn('flex', line.role === 'agent' ? 'justify-end' : 'justify-start')}>
                  <div className={cn('max-w-[82%] rounded-[16px] px-3 py-1.5 text-[15px]', line.role === 'agent' ? 'bg-[hsl(var(--ios-blue))]' : 'bg-[hsl(var(--ios-bubble))]')}>{line.message}</div>
                </div>
              ))}
              {call.transcription && <p className="text-[15px] whitespace-pre-wrap">{call.transcription}</p>}
            </div></Group>
          </div>
        )}
      </div>
    </>
  );
}

function TextDetail({ thread, name, tag, messages, reply, sending, onReply, onSend, onBack, onCall }: { thread: TextThread; name: string; tag?: string; messages: SmsMessage[]; reply: string; sending: boolean; onReply: (value: string) => void; onSend: () => void; onBack: () => void; onCall: () => void }) {
  const boxRef = useBottom([messages, thread.id]);
  return (
    <>
      <NavBar onBack={onBack} right={<button onClick={onCall} title="Call" className="p-1"><Phone className="h-5 w-5" /></button>}><ContactHead name={name} sub={tag || thread.phone} /></NavBar>
      <Bubbles items={messages} boxRef={boxRef} mine={m => m.direction === 'outbound'} render={m => (
        <>
          <MessageMedia media={m.media_urls} />
          {m.body && <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{m.body}</p>}
          {m.direction === 'outbound' && m.status && /fail|undeliver/i.test(m.status) && <p className="text-[10px] opacity-70 mt-0.5 capitalize">{m.status}</p>}
        </>
      )} />
      <Composer value={reply} onChange={onReply} onSend={onSend} sending={sending} placeholder="Text Message" />
    </>
  );
}

function ChatDetail({ title, subtitle, me, messages, names, reply, sending, onReply, onSend, onBack }: { title: string; subtitle: string; me: string | null; messages: ChatMessage[]; names: Record<string, string>; reply: string; sending: boolean; onReply: (v: string) => void; onSend: () => void; onBack: () => void }) {
  const boxRef = useBottom([messages]);
  return (
    <>
      <NavBar onBack={onBack}><ContactHead name={title} sub={subtitle} /></NavBar>
      <Bubbles items={messages} boxRef={boxRef} mine={m => m.sender_id === me} render={m => (
        <>
          {m.sender_id !== me && names[m.sender_id] && <p className="text-[11px] text-[hsl(var(--ios-label-2))] -mb-0.5">{names[m.sender_id]}</p>}
          <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{m.body}</p>
        </>
      )} />
      <Composer value={reply} onChange={onReply} onSend={onSend} sending={sending} placeholder="iMessage" />
    </>
  );
}

function EmailDetail({ email, onBack, onReply, onEdit }: { email: EmailItem; onBack: () => void; onReply: () => void; onEdit: () => void }) {
  const who = email.kind === 'sent' ? email.to : email.from;
  return (
    <>
      <NavBar onBack={onBack} back="Mail" right={<button onClick={email.kind === 'draft' ? onEdit : onReply} className="p-1" title={email.kind === 'draft' ? 'Edit' : 'Reply'}>{email.kind === 'draft' ? <FileEdit className="h-5 w-5" /> : <Reply className="h-5 w-5" />}</button>} />
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 pb-10">
        <div className="flex gap-3 py-3 border-b border-[hsl(var(--ios-separator))]">
          <Avatar name={who} />
          <div className="min-w-0 flex-1">
            <div className="flex justify-between gap-2"><p className="text-[15px] font-semibold truncate">{email.from}</p><p className="text-[13px] text-[hsl(var(--ios-label-2))] shrink-0">{shortTime(email.at)}</p></div>
            {email.to && <p className="text-[13px] text-[hsl(var(--ios-label-2))] truncate">To: {email.to}</p>}
            {email.status && <p className="text-[12px] text-[hsl(var(--ios-label-2))] capitalize">{email.status}</p>}
          </div>
        </div>
        <h3 className="text-[20px] font-semibold leading-tight py-3">{email.subject}</h3>
        {email.bodyHtml ? <EmailFrame html={email.bodyHtml} /> : <div className="text-[16px] whitespace-pre-wrap leading-relaxed">{email.bodyText || email.snippet || 'No content available.'}</div>}
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
      className="w-full rounded-[10px] bg-[hsl(var(--ios-label))]"
      style={{ height, colorScheme: 'light' }}
      onLoad={event => {
        const doc = (event.currentTarget as HTMLIFrameElement).contentDocument;
        if (doc) setHeight(Math.max(400, doc.documentElement.scrollHeight + 16));
      }}
    />
  );
}
