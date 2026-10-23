import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Phone, Calendar, CalendarCheck, FileSpreadsheet, Wrench, Receipt, Users, BarChart3, Bell, CheckCheck, LayoutGrid } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNotifications } from '@/hooks/useNotifications';
import { tabForNotification } from '@/lib/adminTabAlerts';
import { orderShortcuts } from '@/lib/homeShortcuts';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AdminServiceUsage from './AdminServiceUsage';

type Shortcut = { value: string; label: string; icon: any; hint?: string };

const SHORTCUTS: Shortcut[] = [
  { value: 'phone', label: 'Phone', icon: Phone, hint: 'unread' },
  { value: 'calendar', label: 'Calendar', icon: Calendar, hint: 'today' },
  { value: 'bookings', label: 'Bookings', icon: CalendarCheck, hint: 'waiting' },
  { value: 'estimates', label: 'Estimates', icon: FileSpreadsheet, hint: 'open' },
  { value: 'ros', label: 'Repair Orders', icon: Wrench, hint: 'open jobs' },
  { value: 'invoices', label: 'Invoices', icon: Receipt, hint: 'unpaid' },
  { value: 'customers', label: 'Customers', icon: Users },
  { value: 'reports', label: 'Reports', icon: BarChart3 },
];

function easternDayBounds() {
  const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
  const offset = new Date().toLocaleString('en-US', { timeZone: 'America/New_York', timeZoneName: 'shortOffset' }).match(/GMT([+-]\d+)/)?.[1] ?? '-5';
  const tz = `${offset.startsWith('-') ? '-' : '+'}${String(Math.abs(Number(offset))).padStart(2, '0')}:00`;
  const start = new Date(`${ymd}T00:00:00${tz}`);
  return { start: start.toISOString(), end: new Date(start.getTime() + 86400000).toISOString() };
}

const AdminHomeLaunchpad = ({ allowed }: { allowed: string[] }) => {
  const [, setSearchParams] = useSearchParams();
  const { items, markRead, markAllRead } = useNotifications(200);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const usage = (() => { try { return JSON.parse(localStorage.getItem('admin_tab_usage') || '{}'); } catch { return {}; } })();

  useEffect(() => {
    const load = async () => {
      const { start, end } = easternDayBounds();
      const c = (q: any) => q.then((r: any) => r.count ?? 0);
      const [cal, book, est, ros, inv] = await Promise.all([
        c(supabase.from('appointments').select('id', { count: 'exact', head: true }).gte('scheduled_at', start).lt('scheduled_at', end).neq('status', 'cancelled')),
        c(supabase.from('booking_requests').select('id', { count: 'exact', head: true }).in('status', ['new', 'contacted'])),
        c(supabase.from('estimates').select('id', { count: 'exact', head: true }).in('status', ['draft', 'sent'])),
        c(supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('status', 'in_progress')),
        c(supabase.from('invoices').select('id', { count: 'exact', head: true }).in('status', ['unpaid', 'partial', 'overdue'])),
      ]);
      setCounts({ calendar: cal, bookings: book, estimates: est, ros, invoices: inv });
    };
    load();
    const i = setInterval(load, 60000);
    return () => clearInterval(i);
  }, []);

  const unread = items.filter(n => !n.read_at);
  const unreadByTab: Record<string, number> = {};
  for (const n of unread) { const t = tabForNotification(n); unreadByTab[t] = (unreadByTab[t] || 0) + 1; }
  const phoneCount = unreadByTab.phone || 0;

  const open = (value: string) => {
    if (value === 'phone' && window.innerWidth < 1024) { window.location.assign('/admin/phone'); return; }
    try { localStorage.setItem('admin_tab_usage', JSON.stringify({ ...usage, [value]: (usage[value] || 0) + 1 })); } catch {}
    setSearchParams(prev => { const next = new URLSearchParams(prev); next.set('tab', value); return next; });
  };

  const tiles = orderShortcuts(SHORTCUTS.filter(s => allowed.includes(s.value)), usage);

  return (
    <div className="space-y-5">
      <AdminServiceUsage />
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg flex items-center gap-2"><Bell className="h-5 w-5 text-primary" /> Needs attention</h2>
            {unread.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => markAllRead()}><CheckCheck className="h-4 w-4 mr-1" />Mark all read</Button>
            )}
          </div>
          {unread.length === 0 ? (
            <p className="text-sm text-muted-foreground">You're all caught up.</p>
          ) : (
            <ul className="divide-y divide-border">
              {unread.slice(0, 5).map(n => (
                <li key={n.id}>
                  <button
                    className="w-full text-left py-2.5 flex gap-3 items-start"
                    onClick={() => { markRead(n.id); open(tabForNotification(n)); }}
                  >
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-destructive shrink-0" />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium truncate">{n.title}</span>
                      {n.body && <span className="block text-xs text-muted-foreground line-clamp-2">{n.body}</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {tiles.map(s => {
          const count = s.value === 'phone' ? phoneCount : counts[s.value];
          const alert = (unreadByTab[s.value] || 0) > 0;
          const Icon = s.icon;
          return (
            <button
              key={s.value}
              onClick={() => open(s.value)}
              className="relative rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary active:scale-[0.98]"
            >
              {alert && <span className="absolute top-3 right-3 h-2.5 w-2.5 rounded-full bg-destructive" aria-label="New" />}
              <Icon className="h-6 w-6 text-primary" />
              <div className="mt-3 font-medium">{s.label}</div>
              {s.hint && (
                <div className="text-xs text-muted-foreground">
                  <span className="text-lg font-semibold text-foreground mr-1">{count ?? '–'}</span>{s.hint}
                </div>
              )}
            </button>
          );
        })}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="rounded-xl border border-dashed border-border p-4 text-left text-muted-foreground hover:border-primary"
        >
          <LayoutGrid className="h-6 w-6" />
          <div className="mt-3 font-medium">More</div>
        </button>
      </div>
    </div>
  );
};

export default AdminHomeLaunchpad;
