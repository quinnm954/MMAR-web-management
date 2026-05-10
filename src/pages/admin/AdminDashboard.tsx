import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, FileText, ShieldCheck, Users, CreditCard, Calendar, CalendarCheck, ClipboardList, Receipt, Wrench, Mail, FileSpreadsheet, ClipboardCheck, Package, Settings, KanbanSquare, Clock, BarChart3, Share2, Car, AlertTriangle, FileDown, Activity, History, UserCog, DollarSign, RefreshCw, Phone, PhoneCall } from 'lucide-react';
import AdminCalls from '@/components/admin/AdminCalls';
import AdminPhoneSettings from '@/components/admin/AdminPhoneSettings';
import AdminEmployees from '@/components/admin/AdminEmployees';
import AdminAuditLog from '@/components/admin/AdminAuditLog';
import AdminRoles from '@/components/admin/AdminRoles';
import FinancingContractsTable from '@/components/admin/FinancingContractsTable';
import WarrantyTable from '@/components/admin/WarrantyTable';
import AdminCustomers from '@/components/admin/AdminCustomers';
import AdminMemberships from '@/components/admin/AdminMemberships';
import AdminAppointments from '@/components/admin/AdminAppointments';
import AdminBookingRequests from '@/components/admin/AdminBookingRequests';
import AdminServiceRecords from '@/components/admin/AdminServiceRecords';
import AdminInvoices from '@/components/admin/AdminInvoices';
import AdminEmails from '@/components/admin/AdminEmails';
import AdminEstimates from '@/components/admin/AdminEstimates';
import AdminInspections from '@/components/admin/AdminInspections';
import AdminCatalog from '@/components/admin/AdminCatalog';
import AdminShopSettings from '@/components/admin/AdminShopSettings';
import AdminKanban from '@/components/admin/AdminKanban';
import AdminTimeTracking from '@/components/admin/AdminTimeTracking';
import AdminReports from '@/components/admin/AdminReports';
import AdminCustomerShare from '@/components/admin/AdminCustomerShare';
import AdminGarage from '@/components/admin/AdminGarage';
import AdminDeclinedWork from '@/components/admin/AdminDeclinedWork';
import AdminQuickBooksExport from '@/components/admin/AdminQuickBooksExport';
import AdminRepairOrders from '@/components/admin/AdminRepairOrders';
import AdminCalendar from '@/components/admin/AdminCalendar';
import AdminTechProductivity from '@/components/admin/AdminTechProductivity';
import AdminShifts from '@/components/admin/AdminShifts';
import AdminTechLaborPay from '@/components/admin/AdminTechLaborPay';
import { supabase } from '@/integrations/supabase/client';
import mmarLogo from '@/assets/mmar-logo.jpeg';
import type { AppRole } from '@/hooks/useAuth';

type TabDef = { value: string; label: string; icon: any; roles: AppRole[]; content: JSX.Element };

const ALL: AppRole[] = ['admin', 'manager', 'service_advisor', 'technician', 'parts'];
const ADMIN_ONLY: AppRole[] = ['admin', 'manager'];
const ADVISOR: AppRole[] = ['admin', 'manager', 'service_advisor'];
const PARTS: AppRole[] = ['admin', 'manager', 'parts'];

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
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <img src={mmarLogo} alt="MMAR" className="h-12 w-12 rounded-full object-cover border border-primary" />
            </Link>
            <div>
              <h1 className="text-xl font-display flex items-center gap-2">
                <Wrench className="h-5 w-5 text-primary" /> MMAR Care Admin
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

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={Users} label="Customers" value={stats.customers} />
          <StatCard icon={CreditCard} label="Active Memberships" value={stats.activeMemberships} accent />
          <StatCard icon={Calendar} label="Open Appointments" value={stats.openAppointments} />
          <StatCard icon={Receipt} label="Unpaid Invoices" value={stats.unpaidInvoices} />
        </div>

        {(() => {
          const tabs: TabDef[] = [
            { value: 'reports', label: 'Reports', icon: BarChart3, roles: ADMIN_ONLY, content: <AdminReports /> },
            { value: 'kanban', label: 'Job Board', icon: KanbanSquare, roles: ALL, content: <AdminKanban /> },
            { value: 'calendar', label: 'Calendar', icon: Calendar, roles: ALL, content: <AdminCalendar /> },
            { value: 'ros', label: 'Repair Orders', icon: Wrench, roles: ALL, content: <AdminRepairOrders /> },
            { value: 'customers', label: 'Customers', icon: Users, roles: ADVISOR, content: <AdminCustomers /> },
            { value: 'garage', label: 'Garage', icon: Car, roles: ADVISOR, content: <AdminGarage /> },
            { value: 'memberships', label: 'Memberships', icon: CreditCard, roles: ADVISOR, content: <AdminMemberships /> },
            { value: 'booking-requests', label: 'Booking Requests', icon: CalendarCheck, roles: ADVISOR, content: <AdminBookingRequests /> },
            { value: 'appointments', label: 'Appointments', icon: Calendar, roles: ADVISOR, content: <AdminAppointments /> },
            { value: 'service', label: 'Service Records', icon: ClipboardList, roles: ADVISOR, content: <AdminServiceRecords /> },
            { value: 'estimates', label: 'Estimates', icon: FileSpreadsheet, roles: ADVISOR, content: <AdminEstimates /> },
            { value: 'inspections', label: 'Inspections', icon: ClipboardCheck, roles: ALL, content: <AdminInspections /> },
            { value: 'invoices', label: 'Invoices', icon: Receipt, roles: ADVISOR, content: <AdminInvoices /> },
            { value: 'catalog', label: 'Catalog', icon: Package, roles: PARTS, content: <AdminCatalog /> },
            { value: 'time', label: 'RO Time', icon: Clock, roles: ADMIN_ONLY, content: <AdminTimeTracking /> },
            { value: 'shifts', label: 'Shifts', icon: Clock, roles: ADMIN_ONLY, content: <AdminShifts /> },
            { value: 'laborpay', label: 'Labor Pay', icon: DollarSign, roles: ADMIN_ONLY, content: <AdminTechLaborPay /> },
            { value: 'productivity', label: 'Productivity', icon: Activity, roles: ADMIN_ONLY, content: <AdminTechProductivity /> },
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
            { value: 'settings', label: 'Settings', icon: Settings, roles: ADMIN_ONLY, content: <AdminShopSettings /> },
          ];
          const visible = tabs.filter(t => hasAnyRole(t.roles));
          if (visible.length === 0) {
            return <p className="text-sm text-muted-foreground">No sections available for your role ({roles.join(', ') || 'none'}).</p>;
          }
          const defaultTab = visible.find(t => t.value === 'customers')?.value ?? visible[0].value;
          return (
            <Tabs defaultValue={defaultTab} className="space-y-4">
              <TabsList className="flex flex-wrap h-auto">
                {visible.map(t => {
                  const Icon = t.icon;
                  return (
                    <TabsTrigger key={t.value} value={t.value}>
                      <Icon className="h-4 w-4 mr-1.5" /> {t.label}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
              {visible.map(t => (
                <TabsContent key={t.value} value={t.value}>{t.content}</TabsContent>
              ))}
            </Tabs>
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
