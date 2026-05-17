import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Inbox, Send as SendIcon, FileEdit, Mail, RefreshCw, Search, PenSquare,
  Reply, Trash2, Loader2, ArrowLeft, AlertCircle,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Folder = 'inbox' | 'sent' | 'drafts' | 'all';

interface MailItem {
  id: string;
  kind: 'inbound' | 'sent' | 'draft';
  from: string;          // sender email/display
  to: string;            // recipient email
  subject: string;
  snippet: string;
  body_html?: string | null;
  body_text?: string | null;
  thread_id?: string | null;
  status?: string;
  error?: string | null;
  at: string;            // ISO
  unread?: boolean;
  template?: string;
}

const statusBadge = (status?: string) => {
  if (!status) return null;
  const map: Record<string, string> = {
    sent: 'bg-green-500/15 text-green-600 border-green-500/30',
    pending: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
    failed: 'bg-red-500/15 text-red-600 border-red-500/30',
    dlq: 'bg-red-500/15 text-red-600 border-red-500/30',
    bounced: 'bg-red-500/15 text-red-600 border-red-500/30',
    suppressed: 'bg-yellow-500/15 text-yellow-700 border-yellow-500/30',
    draft: 'bg-muted text-muted-foreground',
  };
  return <Badge variant="outline" className={map[status] || 'bg-muted'}>{status}</Badge>;
};

const stripHtml = (html: string) =>
  html.replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

const AdminEmails = () => {
  const { user } = useAuth();
  const [folder, setFolder] = useState<Folder>('inbox');
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<MailItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeBusy, setComposeBusy] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composeThreadId, setComposeThreadId] = useState<string | null>(null);
  const [composeDraftId, setComposeDraftId] = useState<string | null>(null);
  const [inboundCount, setInboundCount] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    const [inbound, sent, drafts] = await Promise.all([
      supabase.from('inbound_messages').select('*').order('received_at', { ascending: false }).limit(500),
      supabase.from('email_send_log').select('*').order('created_at', { ascending: false }).limit(500),
      supabase.from('email_drafts').select('*').order('updated_at', { ascending: false }).limit(200),
    ]);

    const inboundItems: MailItem[] = (inbound.data ?? []).map((r: any) => ({
      id: `in:${r.id}`,
      kind: 'inbound',
      from: r.from_name ? `${r.from_name} <${r.from_email}>` : r.from_email,
      to: r.to_email || '',
      subject: r.subject || '(no subject)',
      snippet: (r.body_text || (r.body_html ? stripHtml(r.body_html) : '')).slice(0, 140),
      body_html: r.body_html,
      body_text: r.body_text,
      thread_id: r.thread_id,
      at: r.received_at,
      unread: !r.read_at,
    }));

    // Dedupe sent by message_id (latest status wins, merge metadata across rows)
    const seen = new Map<string, any>();
    for (const r of (sent.data ?? [])) {
      const key = r.message_id || r.id;
      const existing = seen.get(key);
      if (!existing) {
        seen.set(key, { ...r });
      } else if (r.metadata && !existing.metadata) {
        existing.metadata = r.metadata;
      }
    }
    const sentItems: MailItem[] = Array.from(seen.values()).map((r: any) => ({
      id: `out:${r.id}`,
      kind: 'sent',
      from: 'You',
      to: r.recipient_email,
      subject: r.metadata?.subject || r.template_name,
      snippet: r.metadata?.preview || r.template_name,
      body_html: r.metadata?.body_html || null,
      body_text: r.metadata?.body_text || null,
      thread_id: r.metadata?.thread_id || null,
      status: r.status,
      error: r.error_message,
      at: r.created_at,
      template: r.template_name,
    }));

    const draftItems: MailItem[] = (drafts.data ?? []).map((r: any) => ({
      id: `draft:${r.id}`,
      kind: 'draft',
      from: 'You',
      to: r.recipient_email || '',
      subject: r.subject || '(no subject)',
      snippet: (r.body || '').slice(0, 140),
      body_text: r.body,
      thread_id: r.thread_id,
      status: 'draft',
      at: r.updated_at,
    }));

    setItems([...inboundItems, ...sentItems, ...draftItems]);
    setInboundCount(inboundItems.filter(i => i.unread).length);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Realtime updates for inbound
  useEffect(() => {
    const ch = supabase
      .channel('mailbox')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inbound_messages' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  const filtered = useMemo(() => {
    let list = items;
    if (folder === 'inbox') list = list.filter(i => i.kind === 'inbound');
    else if (folder === 'sent') list = list.filter(i => i.kind === 'sent');
    else if (folder === 'drafts') list = list.filter(i => i.kind === 'draft');
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(i =>
        i.subject.toLowerCase().includes(s) ||
        i.from.toLowerCase().includes(s) ||
        i.to.toLowerCase().includes(s) ||
        i.snippet.toLowerCase().includes(s)
      );
    }
    return list.sort((a, b) => b.at.localeCompare(a.at));
  }, [items, folder, search]);

  const selected = useMemo(() => items.find(i => i.id === selectedId) || null, [items, selectedId]);

  // Mark inbound as read when opened
  useEffect(() => {
    if (selected?.kind === 'inbound' && selected.unread) {
      const realId = selected.id.replace(/^in:/, '');
      supabase.from('inbound_messages').update({ read_at: new Date().toISOString() }).eq('id', realId)
        .then(() => load());
    }
  }, [selected, load]);

  const openCompose = (prefill?: { to?: string; subject?: string; body?: string; threadId?: string | null; draftId?: string | null }) => {
    setComposeTo(prefill?.to ?? '');
    setComposeSubject(prefill?.subject ?? '');
    setComposeBody(prefill?.body ?? '');
    setComposeThreadId(prefill?.threadId ?? null);
    setComposeDraftId(prefill?.draftId ?? null);
    setComposeOpen(true);
  };

  const handleReply = () => {
    if (!selected) return;
    const fromEmail = selected.kind === 'inbound'
      ? (selected.from.match(/<([^>]+)>/)?.[1] || selected.from)
      : selected.to;
    const quoted = selected.body_text || (selected.body_html ? stripHtml(selected.body_html) : '');
    openCompose({
      to: fromEmail,
      subject: selected.subject.startsWith('Re:') ? selected.subject : `Re: ${selected.subject}`,
      body: `\n\n\n----- Original message -----\n${quoted}`,
      threadId: selected.thread_id ?? null,
    });
  };

  const saveDraft = async () => {
    if (!user) return;
    const payload = {
      author_id: user.id,
      recipient_email: composeTo || null,
      subject: composeSubject || null,
      body: composeBody || null,
      thread_id: composeThreadId,
    };
    if (composeDraftId) {
      await supabase.from('email_drafts').update(payload).eq('id', composeDraftId);
    } else {
      const { data } = await supabase.from('email_drafts').insert(payload).select('id').single();
      if (data) setComposeDraftId(data.id);
    }
    toast.success('Draft saved');
    load();
  };

  const sendCompose = async () => {
    if (!composeTo || !composeSubject || !composeBody) {
      toast.error('Recipient, subject, and message are required');
      return;
    }
    setComposeBusy(true);
    const threadId = composeThreadId || crypto.randomUUID();
    const { error } = await supabase.functions.invoke('send-transactional-email', {
      body: {
        templateName: 'admin-message',
        recipientEmail: composeTo,
        idempotencyKey: `admin-msg-${crypto.randomUUID()}`,
        templateData: { subject: composeSubject, body: composeBody },
        metadata: {
          subject: composeSubject,
          body_text: composeBody,
          preview: composeBody.slice(0, 140),
          thread_id: threadId,
        },
      },
    });
    setComposeBusy(false);
    if (error) {
      toast.error(`Send failed: ${error.message}`);
      return;
    }
    if (composeDraftId) {
      await supabase.from('email_drafts').delete().eq('id', composeDraftId);
    }
    toast.success('Message sent');
    setComposeOpen(false);
    setTimeout(load, 2500);
  };

  const deleteSelected = async () => {
    if (!selected) return;
    if (selected.kind === 'inbound') {
      const realId = selected.id.replace(/^in:/, '');
      await supabase.from('inbound_messages').delete().eq('id', realId);
    } else if (selected.kind === 'draft') {
      const realId = selected.id.replace(/^draft:/, '');
      await supabase.from('email_drafts').delete().eq('id', realId);
    } else {
      toast.info('Sent messages cannot be deleted from the log');
      return;
    }
    setSelectedId(null);
    load();
  };

  const folderCounts = useMemo(() => ({
    inbox: items.filter(i => i.kind === 'inbound').length,
    sent: items.filter(i => i.kind === 'sent').length,
    drafts: items.filter(i => i.kind === 'draft').length,
    all: items.length,
  }), [items]);

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] min-h-[600px] gap-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => openCompose()} className="gap-1.5">
          <PenSquare className="h-4 w-4" /> Compose
        </Button>
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search mail..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon" onClick={load} disabled={loading} title="Refresh">
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
        </Button>
      </div>

      {/* 3-pane layout */}
      <div className="grid grid-cols-12 gap-3 flex-1 min-h-0">
        {/* Folder rail */}
        <Card className="col-span-12 md:col-span-2 p-2">
          <FolderButton icon={<Inbox className="h-4 w-4" />} label="Inbox" count={folderCounts.inbox} unread={inboundCount} active={folder === 'inbox'} onClick={() => { setFolder('inbox'); setSelectedId(null); }} />
          <FolderButton icon={<SendIcon className="h-4 w-4" />} label="Sent" count={folderCounts.sent} active={folder === 'sent'} onClick={() => { setFolder('sent'); setSelectedId(null); }} />
          <FolderButton icon={<FileEdit className="h-4 w-4" />} label="Drafts" count={folderCounts.drafts} active={folder === 'drafts'} onClick={() => { setFolder('drafts'); setSelectedId(null); }} />
          <FolderButton icon={<Mail className="h-4 w-4" />} label="All" count={folderCounts.all} active={folder === 'all'} onClick={() => { setFolder('all'); setSelectedId(null); }} />

          {folder === 'inbox' && items.filter(i => i.kind === 'inbound').length === 0 && (
            <div className="mt-3 p-2 rounded-md bg-muted/50 text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-1 font-medium text-foreground">
                <AlertCircle className="h-3 w-3" /> Inbox empty
              </div>
              <p>Customer replies will appear here once inbound email routing is set up at your domain (Cloudflare Email Routing → <code className="text-[10px]">receive-inbound-email</code> webhook).</p>
            </div>
          )}
        </Card>

        {/* Message list */}
        <Card className="col-span-12 md:col-span-4 p-0 overflow-hidden flex flex-col">
          <div className="p-3 border-b text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {folder} · {filtered.length}
          </div>
          <ScrollArea className="flex-1">
            {filtered.length === 0 && (
              <div className="p-8 text-center text-muted-foreground text-sm">
                <Mail className="h-8 w-8 mx-auto mb-2 opacity-40" />
                {loading ? 'Loading…' : 'No messages'}
              </div>
            )}
            {filtered.map(item => (
              <button
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className={cn(
                  'w-full text-left p-3 border-b hover:bg-muted/50 transition-colors',
                  selectedId === item.id && 'bg-muted',
                  item.unread && 'bg-primary/5'
                )}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className={cn('text-sm truncate', item.unread && 'font-semibold')}>
                    {item.kind === 'sent' ? `→ ${item.to}` : item.from}
                  </span>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(item.at), { addSuffix: false })}
                  </span>
                </div>
                <div className={cn('text-sm truncate', item.unread ? 'font-medium' : 'text-foreground/80')}>
                  {item.subject}
                </div>
                <div className="text-xs text-muted-foreground truncate mt-0.5">{item.snippet}</div>
                {item.status && item.kind === 'sent' && (
                  <div className="mt-1">{statusBadge(item.status)}</div>
                )}
              </button>
            ))}
          </ScrollArea>
        </Card>

        {/* Reading pane */}
        <Card className="col-span-12 md:col-span-6 p-0 overflow-hidden flex flex-col">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              <div className="text-center">
                <Mail className="h-10 w-10 mx-auto mb-2 opacity-30" />
                Select a message to read
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 border-b space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-lg font-semibold leading-snug">{selected.subject}</h2>
                  <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSelectedId(null)}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span><strong className="text-foreground">From:</strong> {selected.from}</span>
                  {selected.to && <span><strong className="text-foreground">To:</strong> {selected.to}</span>}
                  <span>{format(new Date(selected.at), 'MMM d, yyyy h:mm a')}</span>
                  {statusBadge(selected.status)}
                </div>
                {selected.error && (
                  <div className="text-xs text-red-600 bg-red-500/10 border border-red-500/30 rounded p-2">
                    {selected.error}
                  </div>
                )}
                <div className="flex gap-2 pt-1">
                  {selected.kind !== 'draft' && (
                    <Button size="sm" variant="outline" onClick={handleReply} className="gap-1.5">
                      <Reply className="h-3.5 w-3.5" /> Reply
                    </Button>
                  )}
                  {selected.kind === 'draft' && (
                    <Button size="sm" onClick={() => openCompose({
                      to: selected.to,
                      subject: selected.subject === '(no subject)' ? '' : selected.subject,
                      body: selected.body_text || '',
                      threadId: selected.thread_id,
                      draftId: selected.id.replace(/^draft:/, ''),
                    })} className="gap-1.5">
                      <PenSquare className="h-3.5 w-3.5" /> Edit draft
                    </Button>
                  )}
                  {selected.kind !== 'sent' && (
                    <Button size="sm" variant="ghost" onClick={deleteSelected} className="gap-1.5 text-destructive hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </Button>
                  )}
                </div>
              </div>
              <ScrollArea className="flex-1 p-4">
                {selected.body_html ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: selected.body_html }} />
                ) : selected.body_text ? (
                  <pre className="whitespace-pre-wrap font-sans text-sm text-foreground">{selected.body_text}</pre>
                ) : (
                  <div className="text-sm text-muted-foreground italic">
                    {selected.kind === 'sent'
                      ? `Sent via template "${selected.template}". The full rendered body isn't stored — open the recipient's inbox to view.`
                      : 'No content.'}
                  </div>
                )}
              </ScrollArea>
            </>
          )}
        </Card>
      </div>

      {/* Compose sheet */}
      <Sheet open={composeOpen} onOpenChange={setComposeOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col">
          <SheetHeader>
            <SheetTitle>{composeDraftId ? 'Edit draft' : composeThreadId ? 'Reply' : 'New message'}</SheetTitle>
            <SheetDescription>
              Sent from your verified mailbox. Recipient can reply directly — replies land in Inbox once routing is connected.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-auto space-y-3 py-3">
            <div className="space-y-1.5">
              <Label htmlFor="c-to">To</Label>
              <Input id="c-to" type="email" placeholder="customer@example.com" value={composeTo} onChange={(e) => setComposeTo(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-subject">Subject</Label>
              <Input id="c-subject" value={composeSubject} onChange={(e) => setComposeSubject(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-body">Message</Label>
              <Textarea id="c-body" rows={14} value={composeBody} onChange={(e) => setComposeBody(e.target.value)} className="font-sans" />
            </div>
          </div>
          <SheetFooter className="flex-row gap-2 sm:justify-between">
            <Button variant="outline" onClick={saveDraft} disabled={composeBusy}>Save draft</Button>
            <Button onClick={sendCompose} disabled={composeBusy} className="gap-1.5">
              {composeBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendIcon className="h-4 w-4" />}
              Send
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};

const FolderButton = ({ icon, label, count, unread, active, onClick }: {
  icon: React.ReactNode; label: string; count: number; unread?: number; active: boolean; onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={cn(
      'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
      active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
    )}
  >
    {icon}
    <span className="flex-1 text-left">{label}</span>
    {!!unread && unread > 0 ? (
      <Badge className="h-5 px-1.5 text-[10px]">{unread}</Badge>
    ) : (
      <span className="text-xs opacity-60">{count}</span>
    )}
  </button>
);

export default AdminEmails;
