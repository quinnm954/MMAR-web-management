import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Send, ArrowLeft, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Thread = {
  id: string;
  subject: string | null;
  customer_id: string | null;
  tech_id: string | null;
  created_by: string;
  last_message_at: string;
  last_message_preview: string | null;
};

type Message = {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

type ProfileLite = { id: string; full_name: string | null; email: string | null };

const Messages = () => {
  const { user, isLoading, isStaff, hasAnyRole } = useAuth();
  const [params, setParams] = useSearchParams();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(params.get("t"));
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({});
  const [newOpen, setNewOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<ProfileLite[]>([]);
  const [newSubject, setNewSubject] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newRecipient, setNewRecipient] = useState<ProfileLite | null>(null);
  const [newKind, setNewKind] = useState<"customer" | "tech">("customer");
  const scrollRef = useRef<HTMLDivElement>(null);

  const isAdmin = hasAnyRole(["admin", "manager", "owner"]);

  // Load threads
  const loadThreads = async () => {
    const { data } = await supabase
      .from("message_threads")
      .select("*")
      .order("last_message_at", { ascending: false });
    const list = (data ?? []) as Thread[];
    setThreads(list);
    // hydrate profile names
    const ids = Array.from(new Set(list.flatMap((t) => [t.customer_id, t.tech_id, t.created_by]).filter(Boolean))) as string[];
    if (ids.length) {
      const { data: ps } = await supabase.from("profiles").select("id, full_name, email").in("id", ids);
      const map: Record<string, ProfileLite> = {};
      (ps ?? []).forEach((p: any) => (map[p.id] = p));
      setProfiles((prev) => ({ ...prev, ...map }));
    }
  };

  useEffect(() => {
    if (!user) return;
    loadThreads();
    const ch = supabase
      .channel(`threads-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "message_threads" }, () => loadThreads())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id]);

  // Load messages for active thread + realtime
  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("thread_id", activeId)
        .order("created_at", { ascending: true });
      if (!cancelled) setMessages((data ?? []) as Message[]);
    })();
    // mark read
    if (user) {
      supabase.from("message_reads").upsert({ thread_id: activeId, user_id: user.id, last_read_at: new Date().toISOString() }).then(() => {});
    }
    const ch = supabase
      .channel(`msgs-${activeId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `thread_id=eq.${activeId}` }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
        if (user && (payload.new as Message).sender_id !== user.id) {
          supabase.from("message_reads").upsert({ thread_id: activeId, user_id: user.id, last_read_at: new Date().toISOString() }).then(() => {});
        }
      })
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [activeId, user?.id]);

  useEffect(() => {
    setParams((prev) => {
      const p = new URLSearchParams(prev);
      if (activeId) p.set("t", activeId); else p.delete("t");
      return p;
    }, { replace: true });
  }, [activeId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  // Search for new-thread recipients (staff only)
  useEffect(() => {
    if (!isAdmin || !newOpen) return;
    if (!search.trim()) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      // join profiles with user_roles to filter by role
      const role = newKind === "customer" ? "customer" : "technician";
      const { data: roleRows } = await supabase.from("user_roles").select("user_id").eq("role", role as any);
      const ids = (roleRows ?? []).map((r: any) => r.user_id);
      if (!ids.length) { setSearchResults([]); return; }
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", ids)
        .or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
        .limit(20);
      setSearchResults((data ?? []) as ProfileLite[]);
    }, 200);
    return () => clearTimeout(t);
  }, [search, newKind, isAdmin, newOpen]);

  const send = async () => {
    if (!user || !activeId || !body.trim()) return;
    setSending(true);
    const text = body.trim();
    setBody("");
    const { error } = await supabase.from("messages").insert({ thread_id: activeId, sender_id: user.id, body: text });
    if (error) { toast.error(error.message); setBody(text); }
    // fire-and-forget push
    try {
      const thread = threads.find((t) => t.id === activeId);
      const targets = [thread?.customer_id, thread?.tech_id].filter((id) => id && id !== user.id);
      if (targets.length) {
        supabase.functions.invoke("send-push", {
          body: { user_ids: targets, title: "New message", body: text.slice(0, 120), url: `/messages?t=${activeId}`, category: "message_updates" },
        }).then(() => {});
      }
    } catch {}
    setSending(false);
  };

  const startThread = async () => {
    if (!user || !newRecipient || !newBody.trim()) { toast.error("Pick a recipient and write a message"); return; }
    const insert: any = {
      subject: newSubject.trim() || null,
      created_by: user.id,
      customer_id: newKind === "customer" ? newRecipient.id : null,
      tech_id: newKind === "tech" ? newRecipient.id : null,
    };
    const { data: th, error } = await supabase.from("message_threads").insert(insert).select("*").single();
    if (error || !th) { toast.error(error?.message ?? "Failed"); return; }
    await supabase.from("messages").insert({ thread_id: th.id, sender_id: user.id, body: newBody.trim() });
    setNewOpen(false);
    setNewBody(""); setNewSubject(""); setNewRecipient(null); setSearch("");
    setActiveId(th.id);
    loadThreads();
  };

  // Customers can request a new thread to staff (just creates with customer_id=self)
  const startCustomerThread = async () => {
    if (!user || !newBody.trim()) return;
    const { data: th, error } = await supabase
      .from("message_threads")
      .insert({ created_by: user.id, customer_id: user.id, subject: newSubject.trim() || "New message" })
      .select("*").single();
    if (error || !th) { toast.error(error?.message ?? "Failed"); return; }
    await supabase.from("messages").insert({ thread_id: th.id, sender_id: user.id, body: newBody.trim() });
    setNewOpen(false); setNewBody(""); setNewSubject("");
    setActiveId(th.id);
    loadThreads();
  };

  const startTechThread = async () => {
    if (!user || !newBody.trim()) return;
    const { data: th, error } = await supabase
      .from("message_threads")
      .insert({ created_by: user.id, tech_id: user.id, subject: newSubject.trim() || "New message" })
      .select("*").single();
    if (error || !th) { toast.error(error?.message ?? "Failed"); return; }
    await supabase.from("messages").insert({ thread_id: th.id, sender_id: user.id, body: newBody.trim() });
    setNewOpen(false); setNewBody(""); setNewSubject("");
    setActiveId(th.id);
    loadThreads();
  };

  const threadTitle = (t: Thread) => {
    if (t.subject) return t.subject;
    const otherId = isAdmin
      ? (t.customer_id ?? t.tech_id)
      : (t.customer_id && t.customer_id !== user?.id ? t.customer_id : t.tech_id && t.tech_id !== user?.id ? t.tech_id : t.created_by);
    const p = otherId ? profiles[otherId] : null;
    return p?.full_name || p?.email || "Conversation";
  };

  const activeThread = useMemo(() => threads.find((t) => t.id === activeId) ?? null, [threads, activeId]);

  if (isLoading) return <div className="p-8 text-muted-foreground">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;

  const isTech = hasAnyRole(["technician"]);

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-bold flex items-center gap-2"><MessageCircle className="h-5 w-5 text-primary" /> Messages</h1>
        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> New</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New message</DialogTitle></DialogHeader>
            {isAdmin ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button size="sm" variant={newKind === "customer" ? "default" : "outline"} onClick={() => { setNewKind("customer"); setNewRecipient(null); }}>Customer</Button>
                  <Button size="sm" variant={newKind === "tech" ? "default" : "outline"} onClick={() => { setNewKind("tech"); setNewRecipient(null); }}>Technician</Button>
                </div>
                <Input placeholder={`Search ${newKind}s by name or email`} value={search} onChange={(e) => setSearch(e.target.value)} />
                {searchResults.length > 0 && (
                  <div className="max-h-40 overflow-auto border rounded-md divide-y">
                    {searchResults.map((p) => (
                      <button key={p.id} onClick={() => { setNewRecipient(p); setSearch(p.full_name || p.email || ""); setSearchResults([]); }} className="w-full text-left px-3 py-2 hover:bg-muted text-sm">
                        <div className="font-medium">{p.full_name || "Unnamed"}</div>
                        <div className="text-xs text-muted-foreground">{p.email}</div>
                      </button>
                    ))}
                  </div>
                )}
                {newRecipient && <div className="text-xs text-muted-foreground">To: <span className="font-medium text-foreground">{newRecipient.full_name || newRecipient.email}</span></div>}
                <Input placeholder="Subject (optional)" value={newSubject} onChange={(e) => setNewSubject(e.target.value)} />
                <Textarea placeholder="Write a message…" value={newBody} onChange={(e) => setNewBody(e.target.value)} rows={4} />
                <DialogFooter><Button onClick={startThread}>Send</Button></DialogFooter>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-xs text-muted-foreground">Your message will go to the Garage Ace team.</div>
                <Input placeholder="Subject (optional)" value={newSubject} onChange={(e) => setNewSubject(e.target.value)} />
                <Textarea placeholder="Write a message…" value={newBody} onChange={(e) => setNewBody(e.target.value)} rows={4} />
                <DialogFooter><Button onClick={isTech ? startTechThread : startCustomerThread}>Send</Button></DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-[300px_1fr] gap-3 min-h-0">
        {/* Thread list */}
        <Card className={cn("p-0 overflow-hidden flex flex-col", activeId && "hidden md:flex")}>
          <div className="overflow-y-auto divide-y">
            {threads.length === 0 && <div className="p-6 text-sm text-muted-foreground text-center">No conversations yet.</div>}
            {threads.map((t) => (
              <button key={t.id} onClick={() => setActiveId(t.id)} className={cn("w-full text-left p-3 hover:bg-muted", activeId === t.id && "bg-muted")}>
                <div className="font-medium text-sm truncate">{threadTitle(t)}</div>
                <div className="text-xs text-muted-foreground truncate">{t.last_message_preview ?? "—"}</div>
                <div className="text-[10px] text-muted-foreground mt-1">{new Date(t.last_message_at).toLocaleString()}</div>
              </button>
            ))}
          </div>
        </Card>

        {/* Conversation */}
        <Card className={cn("p-0 overflow-hidden flex flex-col", !activeId && "hidden md:flex")}>
          {!activeThread ? (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground p-6">Select a conversation</div>
          ) : (
            <>
              <div className="p-3 border-b flex items-center gap-2">
                <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setActiveId(null)}><ArrowLeft className="h-4 w-4" /></Button>
                <div className="min-w-0">
                  <div className="font-semibold text-sm truncate">{threadTitle(activeThread)}</div>
                  {activeThread.subject && <div className="text-xs text-muted-foreground truncate">{activeThread.subject}</div>}
                </div>
              </div>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 bg-background">
                {messages.map((m) => {
                  const mine = m.sender_id === user.id;
                  const author = profiles[m.sender_id];
                  return (
                    <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                      <div className={cn("max-w-[80%] rounded-2xl px-3 py-2 text-sm", mine ? "bg-primary text-primary-foreground" : "bg-muted")}>
                        {!mine && <div className="text-[10px] opacity-70 mb-0.5">{author?.full_name || author?.email || "User"}</div>}
                        <div className="whitespace-pre-wrap break-words">{m.body}</div>
                        <div className={cn("text-[10px] mt-1", mine ? "opacity-80" : "text-muted-foreground")}>{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="p-2 border-t flex gap-2">
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                  placeholder="Type a message…"
                  rows={1}
                  className="min-h-[44px] max-h-32 resize-none"
                />
                <Button onClick={send} disabled={sending || !body.trim()} className="tap-44"><Send className="h-4 w-4" /></Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Messages;
