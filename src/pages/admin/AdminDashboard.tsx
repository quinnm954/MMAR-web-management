import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
import { LogOut, FileText, ShieldCheck, Users, CreditCard, Calendar, CalendarCheck, ClipboardList, Receipt, Wrench, Mail, FileSpreadsheet, ClipboardCheck, Package, Settings, KanbanSquare, Clock, BarChart3, Share2, Car, AlertTriangle, FileDown, Activity, History, UserCog, DollarSign, RefreshCw, Phone, PhoneCall, ChevronDown, LayoutDashboard } from 'lucide-react';
import AdminCalls from '@/components/admin/AdminCalls';
import AdminPhoneSettings from '@/components/admin/AdminPhoneSettings';
import AdminTrackingSettings from '@/components/admin/AdminTrackingSettings';
import AdminEmployees from '@/components/admin/AdminEmployees';
import AdminAuditLog from '@/components/admin/AdminAuditLog';
import AdminRoles from '@/components/admin/AdminRoles';
import FinancingContractsTable from '@/components/admin/FinancingContractsTable';
import WarrantyTable from '@/components/admin/WarrantyTable';
import AdminCustomers from '@/components/admin/AdminCustomers';
import AdminMemberships from '@/components/admin/AdminMemberships';
import AdminBookings from '@/components/admin/AdminBookings';
import AdminServiceRecords from '@/components/admin/AdminServiceRecords';
import AdminInvoices from '@/components/admin/AdminInvoices';
import AdminEmails from '@/components/admin/AdminEmails';
import AdminEstimates from '@/components/admin/AdminEstimates';
import AdminInspections from '@/components/admin/AdminInspections';
import AdminCatalog from '@/components/admin/AdminCatalog';
import AdminShopSettings from '@/components/admin/AdminShopSettings';
import AdminKanban from '@/components/admin/AdminKanban';
import AdminReports from '@/components/admin/AdminReports';
import AdminSalesDashboard from '@/components/admin/AdminSalesDashboard';
import AdminCustomerShare from '@/components/admin/AdminCustomerShare';
import AdminGarage from '@/components/admin/AdminGarage';
import AdminDeclinedWork from '@/components/admin/AdminDeclinedWork';
import AdminQuickBooksExport from '@/components/admin/AdminQuickBooksExport';
import AdminRepairOrders from '@/components/admin/AdminRepairOrders';
import AdminCalendar from '@/components/admin/AdminCalendar';
import AdminTechLaborPay from '@/components/admin/AdminTechLaborPay';
import AdminChecklists from '@/components/admin/AdminChecklists';
import AdminVehicleHealth from '@/components/admin/AdminVehicleHealth';
import { supabase } from '@/integrations/supabase/client';
import mmarLogo from '@/assets/mmar-logo.jpeg';
import type { AppRole } from '@/hooks/useAuth';

type TabDef = { value: string; label: string; icon: any; roles: AppRole[]; content: JSX.Element };

const ALL: AppRole[] = ['owner', 'admin', 'manager', 'service_advisor', 'technician', 'parts'];
const ADMIN_ONLY: AppRole[] = ['owner', 'admin', 'manager'];
const ADVISOR: AppRole[] = ['owner', 'admin', 'manager', 'service_advisor'];
const PARTS: AppRole[] = ['owner', 'admin', 'manager', 'parts'];

const AdminDashboard = () => {
  const { signOut, user, hasAnyRole, roles } = useAuth();
  const [stats, setStats] = useState({ customers: 0, activeMemberships: 0, openAppointments: 0, unpaidInvoices: 0 });
  const [contracts, setContracts] = useState<any[]>([]);
  const [warranties, setWarranties] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const reloadFinancing = async () => {
    const { data } = await supabase.from('financing_contracts').select('*').order('created_at', { ascending: false });
    setContracts(data ?? []);
  };
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
    await Promise.all([reloadFinancing(), reloadWarranty()]);
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
      <header className="border-b border-border bg-card safe-pt">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <img src={mmarLogo} alt="MMAR" className="h-12 w-12 rounded-full object-cover border border-primary" />
            </Link>
            <div>
              <h1 className="text-xl font-display flex items-center gap-2">
                <Wrench className="h-5 w-5 text-primary" /> Garage Ace Admin
              </h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={refreshAll} disabled={refreshing} title={`Last refreshed ${lastRefreshed.toLocaleTimeString()}`}>
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="outline" onClick={() => signOut()}>
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6 safe-pb">
        {(() => {
          const tabs: TabDef[] = [
            { value: 'dashboard', label: 'Sales Dashboard', icon: LayoutDashboard, roles: ADMIN_ONLY, content: <AdminSalesDashboard /> },
            { value: 'reports', label: 'Reports', icon: BarChart3, roles: ADMIN_ONLY, content: <AdminReports /> },
            { value: 'kanban', label: 'Job Board', icon: KanbanSquare, roles: ALL, content: <AdminKanban /> },
            { value: 'calendar', label: 'Calendar', icon: Calendar, roles: ALL, content: <AdminCalendar /> },
            { value: 'ros', label: 'Repair Orders', icon: Wrench, roles: ALL, content: <AdminRepairOrders /> },
            { value: 'customers', label: 'Customers', icon: Users, roles: ADVISOR, content: <AdminCustomers /> },
            { value: 'garage', label: 'Garage', icon: Car, roles: ADVISOR, content: <AdminGarage /> },
            { value: 'memberships', label: 'Memberships', icon: CreditCard, roles: ADVISOR, content: <AdminMemberships /> },
            { value: 'bookings', label: 'Bookings', icon: CalendarCheck, roles: ADVISOR, content: <AdminBookings /> },
            { value: 'service', label: 'Service Records', icon: ClipboardList, roles: ADVISOR, content: <AdminServiceRecords /> },
            { value: 'estimates', label: 'Estimates', icon: FileSpreadsheet, roles: ADVISOR, content: <AdminEstimates /> },
            { value: 'inspections', label: 'Inspections', icon: ClipboardCheck, roles: ALL, content: <AdminInspections /> },
            { value: 'checklists', label: 'Checklists', icon: ClipboardList, roles: ALL, content: <AdminChecklists /> },
            { value: 'vehicle-health', label: 'Vehicle Health', icon: ClipboardList, roles: ADVISOR, content: <AdminVehicleHealth /> },
            { value: 'invoices', label: 'Invoices', icon: Receipt, roles: ADVISOR, content: <AdminInvoices /> },
            { value: 'catalog', label: 'Catalog', icon: Package, roles: PARTS, content: <AdminCatalog /> },
            { value: 'laborpay', label: 'Labor Pay', icon: DollarSign, roles: ADMIN_ONLY, content: <AdminTechLaborPay /> },
            { value: 'share', label: 'Share', icon: Share2, roles: ADVISOR, content: <AdminCustomerShare /> },
            { value: 'declined', label: 'Declined', icon: AlertTriangle, roles: ADVISOR, content: <AdminDeclinedWork /> },
            { value: 'quickbooks', label: 'QuickBooks', icon: FileDown, roles: ADMIN_ONLY, content: <AdminQuickBooksExport /> },
            { value: 'financing', label: 'Financing', icon: FileText, roles: ADMIN_ONLY, content: <FinancingContractsTable data={contracts} onRefresh={reloadFinancing} /> },
            { value: 'warranty', label: 'Warranty', icon: ShieldCheck, roles: ADMIN_ONLY, content: <WarrantyTable data={warranties} onRefresh={reloadWarranty} /> },
            { value: 'emails', label: 'Emails', icon: Mail, roles: ADMIN_ONLY, content: <AdminEmails /> },
            { value: 'audit', label: 'Audit Log', icon: History, roles: ADMIN_ONLY, content: <AdminAuditLog /> },
            { value: 'employees', label: 'Employees', icon: UserCog, roles: ADMIN_ONLY, content: <AdminEmployees /> },
            { value: 'roles', label: 'Roles', icon: ShieldCheck, roles: ADMIN_ONLY, content: <AdminRoles /> },
            { value: 'calls', label: 'Calls', icon: Phone, roles: ADMIN_ONLY, content: <AdminCalls /> },
            { value: 'phone-settings', label: 'Phone Setup', icon: PhoneCall, roles: ADMIN_ONLY, content: <AdminPhoneSettings /> },
            { value: 'tracking', label: 'Tracking', icon: ShieldCheck, roles: ADMIN_ONLY, content: <AdminTrackingSettings /> },
            { value: 'settings', label: 'Settings', icon: Settings, roles: ADMIN_ONLY, content: <AdminShopSettings /> },
          ];
          const visible = tabs.filter(t => hasAnyRole(t.roles));
          if (visible.length === 0) {
            return <p className="text-sm text-muted-foreground">No sections available for your role ({roles.join(', ') || 'none'}).</p>;
          }
          const defaultTab = visible.find(t => t.value === 'dashboard')?.value ?? visible.find(t => t.value === 'customers')?.value ?? visible[0].value;
          const [activeTab, setActiveTab] = useState(defaultTab);
          const [usage, setUsage] = useState<Record<string, number>>(() => {
            try { return JSON.parse(localStorage.getItem('admin_tab_usage') || '{}'); } catch { return {}; }
          });
          const active = visible.find(t => t.value === activeTab) ?? visible[0];

          const selectTab = (value: string) => {
            setActiveTab(value);
            setUsage(prev => {
              const next = { ...prev, [value]: (prev[value] || 0) + 1 };
              try { localStorage.setItem('admin_tab_usage', JSON.stringify(next)); } catch {}
              return next;
            });
          };

          const groups = [
            { label: 'Workshop', values: ['kanban','calendar','ros','service','inspections','checklists','estimates','invoices','time','shifts','productivity'] },
            { label: 'Front Desk', values: ['customers','garage','memberships','bookings','share','declined','calls'] },
            { label: 'Admin', values: ['dashboard','reports','catalog','laborpay','quickbooks','financing','warranty','emails','audit','employees','roles','phone-settings','tracking','settings'] },
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
              <div className="border rounded-lg p-4 bg-card">
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
