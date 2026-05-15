import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Mail, RefreshCw, Search, Send, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const TEMPLATE_NAMES = [
  'appointment-confirmed',
  'service-completed',
  'invoice-issued',
  'membership-welcome',
  'estimate-ready',
  'inspection-ready',
  'mileage-service-reminder',
  'invoice-paid-receipt',
  'booking-request-received',
  'admin-new-booking-request',
];

interface EmailLog {
  id: string;
  message_id: string | null;
  template_name: string;
  recipient_email: string;
  status: string;
  error_message: string | null;
  metadata: any;
  created_at: string;
}

const RANGES = [
  { label: 'Last 24h', hours: 24 },
  { label: '7 days', hours: 24 * 7 },
  { label: '30 days', hours: 24 * 30 },
  { label: 'All time', hours: 0 },
];

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    sent: 'bg-green-500/15 text-green-600 border-green-500/30',
    pending: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
    failed: 'bg-red-500/15 text-red-600 border-red-500/30',
    dlq: 'bg-red-500/15 text-red-600 border-red-500/30',
    bounced: 'bg-red-500/15 text-red-600 border-red-500/30',
    complained: 'bg-orange-500/15 text-orange-600 border-orange-500/30',
    suppressed: 'bg-yellow-500/15 text-yellow-700 border-yellow-500/30',
  };
  return (
    <Badge variant="outline" className={map[status] || 'bg-muted'}>
      {status}
    </Badge>
  );
};

const AdminEmails = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [rangeHours, setRangeHours] = useState(24 * 7);
  const [templateFilter, setTemplateFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [testOpen, setTestOpen] = useState(false);
  const [testTemplate, setTestTemplate] = useState<string>(TEMPLATE_NAMES[0]);
  const [testEmail, setTestEmail] = useState<string>('');
  const [testBusy, setTestBusy] = useState(false);
  const PAGE_SIZE = 50;

  useEffect(() => {
    if (user?.email && !testEmail) setTestEmail(user.email);
  }, [user?.email]);

  const sendTest = async () => {
    if (!testEmail || !testTemplate) return;
    setTestBusy(true);
    const { error } = await supabase.functions.invoke('send-transactional-email', {
      body: {
        templateName: testTemplate,
        recipientEmail: testEmail,
        idempotencyKey: `test-${testTemplate}-${Date.now()}`,
      },
    });
    setTestBusy(false);
    if (error) {
      toast.error(`Send failed: ${error.message}`);
    } else {
      toast.success('Queued! It should appear in the log within a few seconds.');
      setTestOpen(false);
      setTimeout(load, 4000);
    }
  };


  const load = async () => {
    setLoading(true);
    let q = supabase.from('email_send_log').select('*').order('created_at', { ascending: false }).limit(2000);
    if (rangeHours > 0) {
      const since = new Date(Date.now() - rangeHours * 3600 * 1000).toISOString();
      q = q.gte('created_at', since);
    }
    const { data } = await q;
    setRows((data ?? []) as EmailLog[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [rangeHours]);

  // Deduplicate by message_id (latest per message)
  const deduped = useMemo(() => {
    const seen = new Map<string, EmailLog>();
    for (const r of rows) {
      const key = r.message_id || r.id;
      if (!seen.has(key)) seen.set(key, r);
    }
    return Array.from(seen.values());
  }, [rows]);

  const templates = useMemo(() => {
    const set = new Set(deduped.map(r => r.template_name));
    return Array.from(set).sort();
  }, [deduped]);

  const filtered = useMemo(() => {
    return deduped.filter(r => {
      if (templateFilter !== 'all' && r.template_name !== templateFilter) return false;
      if (statusFilter !== 'all') {
        if (statusFilter === 'failed' && !['failed', 'dlq', 'bounced'].includes(r.status)) return false;
        if (statusFilter !== 'failed' && r.status !== statusFilter) return false;
      }
      if (search && !r.recipient_email.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [deduped, templateFilter, statusFilter, search]);

  const stats = useMemo(() => {
    const s = { total: filtered.length, sent: 0, failed: 0, suppressed: 0, pending: 0 };
    for (const r of filtered) {
      if (r.status === 'sent') s.sent++;
      else if (['failed', 'dlq', 'bounced'].includes(r.status)) s.failed++;
      else if (r.status === 'suppressed') s.suppressed++;
      else if (r.status === 'pending') s.pending++;
    }
    return s;
  }, [filtered]);

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Sent" value={stats.sent} accent="green" />
        <StatCard label="Failed" value={stats.failed} accent="red" />
        <StatCard label="Suppressed" value={stats.suppressed} accent="yellow" />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex flex-wrap gap-3 items-end">
          <div className="flex gap-1">
            {RANGES.map(r => (
              <Button
                key={r.label}
                size="sm"
                variant={rangeHours === r.hours ? 'default' : 'outline'}
                onClick={() => { setRangeHours(r.hours); setPage(0); }}
              >
                {r.label}
              </Button>
            ))}
          </div>
          <div className="min-w-[180px]">
            <Select value={templateFilter} onValueChange={(v) => { setTemplateFilter(v); setPage(0); }}>
              <SelectTrigger><SelectValue placeholder="Template" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All templates</SelectItem>
                {templates.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[140px]">
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="suppressed">Suppressed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search recipient email..."
              className="pl-8"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => setTestOpen(true)} className="gap-1.5">
            <Send className="h-4 w-4" /> Send test
          </Button>
          <Button variant="outline" size="icon" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardContent>
      </Card>

      {/* Send Test dialog */}
      <Dialog open={testOpen} onOpenChange={setTestOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>
              Verify the email pipeline end-to-end. The send is queued and should appear in the log below within a few seconds.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="test-template">Template</Label>
              <Select value={testTemplate} onValueChange={setTestTemplate}>
                <SelectTrigger id="test-template"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TEMPLATE_NAMES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="test-email">Recipient</Label>
              <Input id="test-email" type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="you@example.com" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestOpen(false)} disabled={testBusy}>Cancel</Button>
            <Button onClick={sendTest} disabled={testBusy || !testEmail} className="gap-1.5">
              {testBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent at</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    {loading ? 'Loading…' : 'No emails found'}
                  </TableCell>
                </TableRow>
              )}
              {paged.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.template_name}</TableCell>
                  <TableCell>{r.recipient_email}</TableCell>
                  <TableCell>{statusBadge(r.status)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(r.created_at), 'MMM d, yyyy HH:mm')}
                  </TableCell>
                  <TableCell className="text-xs text-red-600 max-w-[300px] truncate" title={r.error_message || ''}>
                    {r.error_message || '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages} • {filtered.length} emails
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, accent }: { label: string; value: number; accent?: 'green' | 'red' | 'yellow' }) => {
  const accentClasses = {
    green: 'border-green-500/30 bg-green-500/5',
    red: 'border-red-500/30 bg-red-500/5',
    yellow: 'border-yellow-500/30 bg-yellow-500/5',
  };
  return (
    <Card className={accent ? accentClasses[accent] : 'border-border/50'}>
      <CardContent className="p-4">
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
};

export default AdminEmails;
