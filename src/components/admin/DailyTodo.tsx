import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, ChevronRight, ListChecks } from 'lucide-react';

type Item = { label: string; count: number; to: string };

export default function DailyTodo() {
  const [items, setItems] = useState<Item[] | null>(null);

  useEffect(() => {
    (async () => {
      const now = Date.now();
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
      const in3 = new Date(now + 3 * 86400000).toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
      const iso = (ms: number) => new Date(now - ms).toISOString();
      const c = (q: any) => q.then((r: any) => r.count ?? 0);
      const [drafts, expiring, unpaid, bookings, texts, stale] = await Promise.all([
        c(supabase.from('estimates').select('id', { count: 'exact', head: true }).eq('status', 'draft')),
        c(supabase.from('estimates').select('id', { count: 'exact', head: true }).eq('status', 'sent').gte('valid_until', today).lte('valid_until', in3)),
        c(supabase.from('invoices').select('id', { count: 'exact', head: true }).in('status', ['unpaid', 'partial', 'overdue', 'sent']).lt('created_at', iso(7 * 86400000))),
        c(supabase.from('booking_requests').select('id', { count: 'exact', head: true }).in('status', ['new', 'pending'])),
        c(supabase.from('sms_threads').select('id', { count: 'exact', head: true }).gt('unread_count', 0).lt('last_message_at', iso(2 * 3600000))),
        c(supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('status', 'in_progress').lt('updated_at', iso(86400000))),
      ]);
      setItems([
        { label: 'Draft estimates to send', count: drafts, to: '/admin?tab=estimates' },
        { label: 'Estimates expiring in 3 days', count: expiring, to: '/admin?tab=estimates' },
        { label: 'Unpaid invoices over 7 days', count: unpaid, to: '/admin?tab=invoices' },
        { label: 'Booking requests to approve', count: bookings, to: '/admin?tab=bookings' },
        { label: 'Texts waiting over 2 hours', count: texts, to: '/admin/phone' },
        { label: 'Jobs in progress over a day', count: stale, to: '/admin?tab=ros' },
      ]);
    })();
  }, []);

  if (!items) return <Skeleton className="h-20 w-full" />;
  const open = items.filter(i => i.count > 0);

  return (
    <Card className="border-accent/30">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-sm font-semibold mb-2">
          <span className="w-7 h-7 rounded-md bg-accent/15 text-accent flex items-center justify-center"><ListChecks className="h-4 w-4" /></span>
          Today's to-do
        </div>
        {open.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-primary" /> All caught up.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {open.map(i => (
              <Link key={i.label} to={i.to} className="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-background/40 px-3 py-2.5 hover:border-primary/50 transition-colors">
                <span className="flex items-center gap-2 min-w-0 text-sm">
                  <span className="min-w-6 h-6 px-1.5 rounded-full bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center">{i.count}</span>
                  <span className="truncate">{i.label}</span>
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
