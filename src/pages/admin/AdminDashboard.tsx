import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, FileText, ShieldCheck, Users, CreditCard, Calendar, CalendarCheck, ClipboardList, Receipt, Wrench, Mail, FileSpreadsheet, ClipboardCheck, Package, Settings, Clock, BarChart3, Share2, Car, AlertTriangle, FileDown, Activity, History, UserCog, DollarSign, RefreshCw, Phone, PhoneCall, ChevronDown, LayoutDashboard, Bell, MessageSquare } from 'lucide-react';
import AdminCalls from '@/components/admin/AdminCalls';
import Softphone from '@/components/admin/Softphone';
import AdminSMS from '@/components/admin/AdminSMS';
import AdminReviewFeedback from '@/components/admin/AdminReviewFeedback';
import AdminProspecting from '@/components/admin/AdminProspecting';
import AdminFleetAccounts from '@/components/admin/AdminFleetAccounts';
import { Search, Star } from 'lucide-react';
import AdminPhoneSettings from '@/components/admin/AdminPhoneSettings';
import AdminPhoneHub from '@/components/admin/AdminPhoneHub';
import AdminTrackingSettings from '@/components/admin/AdminTrackingSettings';
import AdminEmployees from '@/components/admin/AdminEmployees';
import AdminAuditLog from '@/components/admin/AdminAuditLog';
import AdminRoles from '@/components/admin/AdminRoles';
import WarrantyTable from '@/components/admin/WarrantyTable';
import AdminCustomers from '@/components/admin/AdminCustomers';
import AdminMemberships from '@/components/admin/AdminMemberships';
import AdminBookings from '@/components/admin/AdminBookings';
import AdminServiceRecords from '@/components/admin/AdminServiceRecords';
import AdminInvoices from '@/components/admin/AdminInvoices';
import AdminEmails from '@/components/admin/AdminEmails';
import AdminEstimates from '@/components/admin/AdminEstimates';
import AdminShopSettings from '@/components/admin/AdminShopSettings';
import CalendarFeedSettings from '@/components/admin/CalendarFeedSettings';
import AdminReports from '@/components/admin/AdminReports';
import AdminSalesDashboard from '@/components/admin/AdminSalesDashboard';
import { lazy, Suspense } from 'react';
const StreetRun3D = lazy(() => import('@/components/admin/StreetRun3D'));
import AdminCustomerShare from '@/components/admin/AdminCustomerShare';
import AdminGarage from '@/components/admin/AdminGarage';
import AdminDeclinedWork from '@/components/admin/AdminDeclinedWork';
import AdminQuickBooksExport from '@/components/admin/AdminQuickBooksExport';
import AdminRepairOrders from '@/components/admin/AdminRepairOrders';
import AdminCalendar from '@/components/admin/AdminCalendar';
import AdminTechLaborPay from '@/components/admin/AdminTechLaborPay';
import AdminChecklists from '@/components/admin/AdminChecklists';
import { supabase } from '@/integrations/supabase/client';
import mmarLogo from "@/assets/mmar-logo.png";
import PushNotificationCard from '@/components/shell/PushNotificationCard';
import { useNativePushRegistration } from '@/hooks/useNativePushRegistration';
import MessagesBellLink from '@/components/messaging/MessagesBellLink';
import NotificationsBell from '@/components/notifications/NotificationsBell';
import type { AppRole } from '@/hooks/useAuth';

type TabDef = { value: string; label: string; icon: any; roles: AppRole[]; content: JSX.Element };

const ALL: AppRole[] = ['owner', 'admin', 'manager', 'service_advisor', 'technician', 'parts'];
const ADMIN_ONLY: AppRole[] = ['owner', 'admin', 'manager'];
const ADVISOR: AppRole[] = ['owner', 'admin', 'manager', 'service_advisor'];
const PARTS: AppRole[] = ['owner', 'admin', 'manager', 'parts'];
const OWNER_ADMIN: AppRole[] = ['owner', 'admin'];
const SHOP_FLOOR: AppRole[] = ['owner', 'admin', 'manager', 'service_advisor', 'technician'];

const AdminDashboard = () => {
  const { signOut, user, hasAnyRole, roles } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  useNativePushRegistration();
  const [stats, setStats] = useState({ customers: 0, activeMemberships: 0, openAppointments: 0, unpaidInvoices: 0 });
  const [warranties, setWarranties] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const reloadWarranty = async () => {
    const { data } = await supabase.from('warranty_acknowledgments').select('*').order('created_at', { ascending: false });
    setWarranties(data ?? []);
  };

  const refreshAll = async () => {
    setRefreshing(true);
    const [c, m, a, i] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('memberships').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('appointments').select('id', { count: 'exact', head: true }).in('status', ['requested', 'scheduled', 'in_progress']),
      supabase.from('invoices').select('id', { count: 'exact', head: true }).in('status', ['unpaid', 'partial', 'overdue']),
    ]);
    setStats({
      customers: c.count ?? 0,
      activeMemberships: m.count ?? 0,
      openAppointments: a.count ?? 0,
      unpaidInvoices: i.count ?? 0,
    });
    await reloadWarranty();
    setLastRefreshed(new Date());
    setRefreshing(false);
  };

  useEffect(() => {
    refreshAll();
    const onFocus = () => { if (document.visibilityState === 'visible') refreshAll(); };
    document.addEventListener('visibilitychange', onFocus);
    window.addEventListener('focus', onFocus);
    const interval = setInterval(refreshAll, 60000);
    return () => {
      document.removeEventListener('visibilitychange', onFocus);
      window.removeEventListener('focus', onFocus);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Softphone />
      <header className="border-b border-border bg-card safe-pt">
        <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Link to="/">
              <img src={mmarLogo} alt="MMAR" className="h-9 w-9 sm:h-12 sm:w-12 rounded-full object-cover border border-primary shrink-0" />
            </Link>
            <div>
              <h1 className="text-base sm:text-xl font-display flex items-center gap-2 truncate">
                <Wrench className="h-5 w-5 text-primary hidden sm:block" /> Garage Ace
              </h1>
              <p className="text-sm text-muted-foreground hidden sm:block">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-0.5 sm:gap-2 shrink-0">
            <Button variant="ghost" size="sm" onClick={refreshAll} disabled={refreshing} title={`Last refreshed ${lastRefreshed.toLocaleTimeString()}`}>
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <NotificationsBell />
            <Button
              variant="ghost"
              size="sm"
              title="Phone"
              aria-label="Open Phone"
              onClick={() => { if (window.innerWidth < 1024) { window.location.assign('/admin/phone'); return; } setSearchParams(prev => { const next = new URLSearchParams(prev); next.set('tab', 'phone'); return next; }); }}
            >
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => signOut()} aria-label="Sign out">
              <LogOut className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-2 sm:px-4 py-3 sm:py-8 space-y-4 sm:space-y-6 safe-pb">
        {(() => {
          const tabs: TabDef[] = [
            { value: 'dashboard', label: 'Home', icon: LayoutDashboard, roles: ADMIN_ONLY, content: (
              <Suspense fallback={<div className="h-[60vh] rounded-xl border border-border bg-card animate-pulse" />}>
                <StreetRun3D />
              </Suspense>
            ) },
            { value: 'reports', label: 'Reports', icon: BarChart3, roles: ADMIN_ONLY, content: (
              <div className="space-y-8">
                <AdminSalesDashboard />
                <div className="border-t border-border pt-6">
                  <h2 className="font-display text-xl mb-3">Profit &amp; invoices</h2>
                  <AdminReports />
                </div>
              </div>
            ) },
            { value: 'calendar', label: 'Calendar', icon: Calendar, roles: ALL, content: <AdminCalendar /> },
            { value: 'ros', label: 'Repair Orders', icon: Wrench, roles: ALL, content: <AdminRepairOrders /> },
            { value: 'customers', label: 'Customers', icon: Users, roles: ADVISOR, content: <AdminCustomers /> },
            { value: 'garage', label: 'Garage', icon: Car, roles: ADVISOR, content: <AdminGarage /> },
            { value: 'memberships', label: 'Memberships', icon: CreditCard, roles: ADVISOR, content: <AdminMemberships /> },
            { value: 'bookings', label: 'Bookings', icon: CalendarCheck, roles: ADVISOR, content: <AdminBookings /> },
            { value: 'service', label: 'Service Records', icon: ClipboardList, roles: ADVISOR, content: <AdminServiceRecords /> },
            { value: 'estimates', label: 'Estimates', icon: FileSpreadsheet, roles: ADVISOR, content: <AdminEstimates /> },
            { value: 'inspections', label: 'Inspections', icon: ClipboardCheck, roles: SHOP_FLOOR, content: <AdminChecklists /> },
            { value: 'invoices', label: 'Invoices', icon: Receipt, roles: ADVISOR, content: <AdminInvoices /> },
            { value: 'laborpay', label: 'Labor Pay', icon: DollarSign, roles: ADMIN_ONLY, content: <AdminTechLaborPay /> },
            { value: 'share', label: 'Share', icon: Share2, roles: ADVISOR, content: <AdminCustomerShare /> },
            { value: 'declined', label: 'Declined', icon: AlertTriangle, roles: ADVISOR, content: <AdminDeclinedWork /> },
            { value: 'quickbooks', label: 'QuickBooks', icon: FileDown, roles: ADMIN_ONLY, content: <AdminQuickBooksExport /> },
            { value: 'warranty', label: 'Warranty', icon: ShieldCheck, roles: ADMIN_ONLY, content: <WarrantyTable data={warranties} onRefresh={reloadWarranty} /> },
            { value: 'phone', label: 'Phone', icon: Phone, roles: ADMIN_ONLY, content: <AdminPhoneHub /> },
            { value: 'audit', label: 'Audit Log', icon: History, roles: OWNER_ADMIN, content: <AdminAuditLog /> },
            { value: 'employees', label: 'Employees', icon: UserCog, roles: ADMIN_ONLY, content: <AdminEmployees /> },
            { value: 'roles', label: 'Roles', icon: ShieldCheck, roles: OWNER_ADMIN, content: <AdminRoles /> },
            { value: 'feedback', label: 'Feedback', icon: Star, roles: ADVISOR, content: <AdminReviewFeedback /> },
            { value: 'fleet-accounts', label: 'Fleet Accounts', icon: Car, roles: ADVISOR, content: <AdminFleetAccounts /> },
            { value: 'prospecting', label: 'Prospecting', icon: Search, roles: OWNER_ADMIN, content: <AdminProspecting /> },
            { value: 'phone-settings', label: 'Phone Setup', icon: PhoneCall, roles: OWNER_ADMIN, content: <AdminPhoneSettings /> },
            { value: 'tracking', label: 'Tracking', icon: ShieldCheck, roles: OWNER_ADMIN, content: <AdminTrackingSettings /> },
            { value: 'settings', label: 'Settings', icon: Settings, roles: OWNER_ADMIN, content: <div className="space-y-6"><PushNotificationCard /><CalendarFeedSettings /><AdminShopSettings /></div> },
          ];
          const visible = tabs.filter(t => hasAnyRole(t.roles));
          if (visible.length === 0) {
            return <p className="text-sm text-muted-foreground">No sections available for your role ({roles.join(', ') || 'none'}).</p>;
          }
          const defaultTab = visible.find(t => t.value === 'dashboard')?.value ?? visible.find(t => t.value === 'customers')?.value ?? visible[0].value;
          const rawTab = searchParams.get('tab');
          const tabParam = rawTab === 'checklists' ? 'inspections' : ['calls','texts','emails','messages'].includes(rawTab || '') ? 'phone' : rawTab;
          const initialTab = visible.find(t => t.value === tabParam)?.value ?? defaultTab;
          const [activeTab, setActiveTab] = useState(initialTab);
          const [usage, setUsage] = useState<Record<string, number>>(() => {
            try { return JSON.parse(localStorage.getItem('admin_tab_usage') || '{}'); } catch { return {}; }
          });
          const active = visible.find(t => t.value === activeTab) ?? visible[0];

          useEffect(() => {
            if (tabParam && visible.some(t => t.value === tabParam)) setActiveTab(tabParam);
          }, [tabParam]);

          const selectTab = (value: string) => {
            setActiveTab(value);
            setSearchParams(prev => { const next = new URLSearchParams(prev); next.set('tab', value); return next; }, { replace: true });
            setUsage(prev => {
              const next = { ...prev, [value]: (prev[value] || 0) + 1 };
              try { localStorage.setItem('admin_tab_usage', JSON.stringify(next)); } catch {}
              return next;
            });
          };

          const groups = [
            { label: 'Workshop', values: ['calendar','ros','service','inspections','estimates','invoices','time','shifts','productivity'] },
            { label: 'Front Desk', values: ['customers','garage','memberships','bookings','share','declined','fleet-accounts','feedback','prospecting'] },
            { label: 'Admin', values: ['dashboard','reports','laborpay','quickbooks','warranty','audit','employees','roles','phone-settings','tracking','settings'] },
          ];
          const groupedValues = groups.flatMap(g => g.values);
          const ungrouped = visible.filter(t => !groupedValues.includes(t.value));

          const sortByUsage = (a: TabDef, b: TabDef) =>
            (usage[b.value] || 0) - (usage[a.value] || 0) || a.label.localeCompare(b.label);

          const renderGroup = (label: string, values: string[]) => {
            const items = visible.filter(t => values.includes(t.value)).sort(sortByUsage);
            if (items.length === 0) return null;
            const isActiveGroup = items.some(t => t.value === activeTab);
            return (
              <DropdownMenu key={label}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={isActiveGroup ? 'default' : 'outline'}
                    size="sm"
                    className="justify-between"
                  >
                    {label}
                    <ChevronDown className="h-4 w-4 ml-1 opacity-70" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="max-h-[70vh] overflow-y-auto w-56">
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    {label} · most used first
                  </DropdownMenuLabel>
                  <DropdownMenuGroup>
                    {items.map(t => {
                      const Icon = t.icon;
                      const count = usage[t.value] || 0;
                      return (
                        <DropdownMenuItem
                          key={t.value}
                          className={activeTab === t.value ? 'bg-accent text-accent-foreground' : ''}
                          onClick={() => selectTab(t.value)}
                        >
                          <Icon className="h-4 w-4 mr-2 shrink-0" />
                          <span className="flex-1">{t.label}</span>
                          {count > 0 && (
                            <span className="ml-2 text-[10px] text-muted-foreground">{count}</span>
                          )}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            );
          };

          return (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {groups.map(g => renderGroup(g.label, g.values))}
                {ungrouped.length > 0 && renderGroup('More', ungrouped.map(t => t.value))}
                <div className="ml-auto text-xs text-muted-foreground">
                  Current: <span className="font-medium text-foreground">{active.label}</span>
                </div>
              </div>
              <div className={active.value === 'phone' ? '' : 'border rounded-lg p-2 sm:p-4 bg-card overflow-x-auto'}>
                {active.content}
              </div>
            </div>
          );
        })()}
      </main>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, accent }: { icon: typeof Users; label: string; value: number; accent?: boolean }) => (
  <Card className={accent ? "border-primary/30 bg-primary/5" : "border-border/50"}>
    <CardContent className="p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${accent ? "bg-primary/15" : "bg-muted"}`}>
        <Icon className={`h-5 w-5 ${accent ? "text-primary" : "text-muted-foreground"}`} />
      </div>
      <div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </CardContent>
  </Card>
);

export default AdminDashboard;
