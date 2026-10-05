import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Send, MessageSquare, Receipt } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminSMS() {
  const [threads, setThreads] = useState<any[]>([]);
  const [active, setActive] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [body, setBody] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const [invoicesById, setInvoicesById] = useState<Record<string, any>>({});

  const loadThreads = async () => {
    const { data } = await supabase
      .from('sms_threads')
      .select('*, profiles:customer_id(full_name, email), last_invoice:last_invoice_id(id, invoice_number, total, amount_paid, status)')
      .order('last_message_at', { ascending: false });
    const list = data ?? [];
    const key = (p?: string | null) => (p || '').replace(/\D/g, '').slice(-10);
    const [{ data: profs }, { data: emps }, { data: roles }] = await Promise.all([
      supabase.from('profiles').select('id, full_name, phone').not('phone', 'is', null),
      supabase.from('employees').select('full_name, phone, user_id').not('phone', 'is', null),
      supabase.from('user_roles').select('user_id, role'),
    ]);
    const roleOf: Record<string, string> = {};
    const rank = ['owner', 'admin', 'manager', 'service_advisor', 'technician', 'parts'];
    (roles ?? []).forEach((r: any) => {
      const cur = roleOf[r.user_id];
      if (rank.includes(r.role) && (!cur || rank.indexOf(r.role) < rank.indexOf(cur))) roleOf[r.user_id] = r.role;
    });
    const byPhone: Record<string, { name: string; tag?: string }> = {};
    (profs ?? []).forEach((p: any) => {
      const k = key(p.phone);
      if (k.length === 10 && p.full_name) byPhone[k] = { name: p.full_name, tag: roleOf[p.id] ? roleOf[p.id].replace('_', ' ') : 'customer' };
    });
    (emps ?? []).forEach((e: any) => {
      const k = key(e.phone);
      if (k.length === 10 && e.full_name) byPhone[k] = { name: e.full_name, tag: (e.user_id && roleOf[e.user_id]?.replace('_', ' ')) || 'employee' };
    });
    setThreads(list.map((t: any) => {
      const m = byPhone[key(t.phone)];
      const name = t.profiles?.full_name || m?.name || null;
      return { ...t, display_name: name, display_tag: name ? (m?.tag || 'customer') : null };
    }));
  };

  useEffect(() => {
    loadThreads();
    const ch = supabase
      .channel('sms-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sms_messages' }, () => {
        loadThreads();
        if (active) loadMessages(active.id);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id]);

  const loadMessages = async (threadId: string) => {
    const { data } = await supabase
      .from('sms_messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });
    const msgs = data ?? [];
    setMessages(msgs);
    const ids = Array.from(new Set(msgs.map((m: any) => m.invoice_id).filter(Boolean)));
    if (ids.length) {
      const { data: invs } = await supabase.from('invoices').select('id, invoice_number, total, amount_paid, status').in('id', ids);
      const map: Record<string, any> = {};
      (invs ?? []).forEach((i: any) => { map[i.id] = i; });
      setInvoicesById(map);
    } else {
      setInvoicesById({});
    }
    await supabase.from('sms_threads').update({ unread_count: 0 }).eq('id', threadId);
  };

  const openThread = async (t: any) => {
    setActive(t);
    loadMessages(t.id);
  };

  const startNew = async () => {
    if (!newPhone) return;
    const phone = newPhone.replace(/\s/g, '');
    const { data: existing } = await supabase.from('sms_threads').select('*').eq('phone', phone).maybeSingle();
    if (existing) { openThread(existing); return; }
    const { data, error } = await supabase.from('sms_threads').insert({ phone }).select().single();
    if (error) return toast.error(error.message);
    setNewPhone('');
    loadThreads();
    openThread(data);
  };

  const send = async () => {
    if (!active || !body.trim()) return;
    const { data, error } = await supabase.functions.invoke('send-sms', {
      body: { thread_id: active.id, to: active.phone, body },
    });
    if (error || data?.error) return toast.error(error?.message || data?.error || 'Send failed');
    setBody('');
    loadMessages(active.id);
  };

  return (
    <div className="grid md:grid-cols-3 gap-4 h-[calc(100dvh-260px)] min-h-[420px] max-h-[800px]">
      <Card className="md:col-span-1 flex flex-col min-h-0 overflow-hidden max-h-[40vh] md:max-h-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Conversations</CardTitle>
          <div className="flex gap-1 pt-2">
            <Input placeholder="+15555551234" value={newPhone} onChange={e => setNewPhone(e.target.value)} />
            <Button size="sm" onClick={startNew}>New</Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1">
          {threads.map(t => (
            <button
              key={t.id}
              onClick={() => openThread(t)}
              className={`w-full text-left p-2 rounded ${active?.id === t.id ? 'bg-primary/10' : 'hover:bg-muted'}`}
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold text-sm truncate">{t.display_name || t.phone}{t.display_tag && <span className="ml-1.5 text-[10px] font-normal uppercase text-muted-foreground">{t.display_tag}</span>}</span>
                {t.unread_count > 0 && <Badge>{t.unread_count}</Badge>}
              </div>
              <div className="text-xs text-muted-foreground truncate">{t.last_message_preview}</div>
              {t.last_invoice && (
                <div className="mt-1 flex items-center gap-1 text-[10px] text-primary">
                  <Receipt className="h-3 w-3" />
                  <span className="font-mono">{t.last_invoice.invoice_number}</span>
                  <span className="text-muted-foreground">· ${Number(t.last_invoice.total - t.last_invoice.amount_paid).toFixed(2)} {t.last_invoice.status}</span>
                </div>
              )}
            </button>
          ))}
          {threads.length === 0 && <p className="text-xs text-muted-foreground p-2">No conversations yet.</p>}
        </CardContent>
      </Card>

      <Card className="md:col-span-2 flex flex-col min-h-0 overflow-hidden max-h-[55vh] md:max-h-none">
        {!active ? (
          <CardContent className="flex-1 flex items-center justify-center text-muted-foreground">Select a conversation</CardContent>
        ) : (
          <>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{active.display_name || active.phone}{active.display_tag && <span className="ml-2 text-[10px] font-normal uppercase text-muted-foreground">{active.display_tag}</span>}</CardTitle>
              <p className="text-xs text-muted-foreground">{active.phone}</p>
              {active.last_invoice && (
                <Link to="/admin/dashboard?tab=invoices" className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1">
                  <Receipt className="h-3 w-3" /> Linked invoice {active.last_invoice.invoice_number} · ${Number(active.last_invoice.total - active.last_invoice.amount_paid).toFixed(2)} {active.last_invoice.status}
                </Link>
              )}
            </CardHeader>
            <CardContent className="flex-1 min-h-0 overflow-y-auto space-y-2">
              {messages.map(m => {
                const inv = m.invoice_id ? invoicesById[m.invoice_id] : null;
                return (
                  <div key={m.id} className={`flex ${m.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`rounded-lg px-3 py-2 max-w-[70%] text-sm ${m.direction === 'outbound' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      <div className="whitespace-pre-wrap">{m.body}</div>
                      <div className="text-[10px] opacity-70 mt-0.5 flex items-center gap-2">
                        <span>{new Date(m.created_at).toLocaleString()}</span>
                        {inv && (
                          <span className="inline-flex items-center gap-1 font-mono">
                            <Receipt className="h-3 w-3" />{inv.invoice_number}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
            <div className="border-t p-2 flex gap-2">
              <Textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Type a message..." className="min-h-[44px] resize-none" />
              <Button onClick={send}><Send className="h-4 w-4" /></Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
