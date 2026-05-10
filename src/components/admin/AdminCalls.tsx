import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Phone, MessageSquare, Voicemail, PhoneMissed, PhoneIncoming, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

type CallLog = {
  id: string;
  twilio_call_sid: string | null;
  direction: string;
  from_number: string | null;
  to_number: string | null;
  status: string;
  duration_seconds: number | null;
  recording_url: string | null;
  transcription: string | null;
  voicemail: boolean;
  customer_id: string | null;
  read_at: string | null;
  created_at: string;
};

type Filter = 'all' | 'missed' | 'voicemail' | 'today';

export default function AdminCalls() {
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('call_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    setCalls((data ?? []) as CallLog[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id: string) => {
    await supabase.from('call_logs').update({ read_at: new Date().toISOString() }).eq('id', id);
    load();
  };

  const filtered = calls.filter(c => {
    if (filter === 'missed') return c.status === 'missed' || (c.status === 'no-answer');
    if (filter === 'voicemail') return c.voicemail;
    if (filter === 'today') {
      const d = new Date(c.created_at);
      const t = new Date();
      return d.toDateString() === t.toDateString();
    }
    return true;
  });

  const fmtDur = (s: number | null) => {
    if (!s) return '—';
    const m = Math.floor(s / 60);
    const r = s % 60;
    return m > 0 ? `${m}m ${r}s` : `${r}s`;
  };

  const statusBadge = (c: CallLog) => {
    if (c.voicemail) return <Badge variant="secondary" className="gap-1"><Voicemail className="h-3 w-3" />Voicemail</Badge>;
    if (c.status === 'missed' || c.status === 'no-answer') return <Badge variant="destructive" className="gap-1"><PhoneMissed className="h-3 w-3" />Missed</Badge>;
    if (c.status === 'completed') return <Badge variant="default" className="gap-1"><PhoneIncoming className="h-3 w-3" />Answered</Badge>;
    return <Badge variant="outline">{c.status}</Badge>;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" /> Calls
        </CardTitle>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="missed">Missed</TabsTrigger>
            <TabsTrigger value="voicemail">Voicemails</TabsTrigger>
          </TabsList>
        </Tabs>

        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
            <Phone className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No calls yet.</p>
            <p className="text-xs mt-1">Calls will appear here once your number is ported and routing is enabled in Phone Settings.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(c => (
              <div
                key={c.id}
                className={`border rounded-lg p-3 ${!c.read_at ? 'border-primary/40 bg-primary/5' : 'border-border'}`}
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-medium">{c.from_number || 'Unknown'}</span>
                      {statusBadge(c)}
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(c.created_at), 'MMM d, h:mm a')} · {fmtDur(c.duration_seconds)}
                      </span>
                    </div>
                    {c.transcription && (
                      <p className="text-sm mt-2 italic text-muted-foreground border-l-2 border-primary/30 pl-2">
                        "{c.transcription}"
                      </p>
                    )}
                    {c.recording_url && (
                      <audio controls preload="none" className="mt-2 w-full max-w-md h-9">
                        <source src={c.recording_url} type="audio/mpeg" />
                      </audio>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    {c.from_number && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={`sms:${c.from_number}`}><MessageSquare className="h-3.5 w-3.5 mr-1" />Text back</a>
                      </Button>
                    )}
                    {c.from_number && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={`tel:${c.from_number}`}><Phone className="h-3.5 w-3.5 mr-1" />Call back</a>
                      </Button>
                    )}
                    {!c.read_at && (
                      <Button variant="ghost" size="sm" onClick={() => markRead(c.id)}>Mark read</Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
