import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, FileText, ShieldCheck, Users, CreditCard, Calendar, ClipboardList, Receipt, Wrench, Mail, FileSpreadsheet, ClipboardCheck, Package, Settings, KanbanSquare, Clock, BarChart3, MessageSquare, Car, AlertTriangle, FileDown, Activity, History } from 'lucide-react';
import AdminAuditLog from '@/components/admin/AdminAuditLog';
import AdminRoles from '@/components/admin/AdminRoles';
import FinancingContractsTable from '@/components/admin/FinancingContractsTable';
import WarrantyTable from '@/components/admin/WarrantyTable';
import AdminCustomers from '@/components/admin/AdminCustomers';
import AdminMemberships from '@/components/admin/AdminMemberships';
import AdminAppointments from '@/components/admin/AdminAppointments';
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
import AdminSMS from '@/components/admin/AdminSMS';
import AdminGarage from '@/components/admin/AdminGarage';
import AdminDeclinedWork from '@/components/admin/AdminDeclinedWork';
import AdminQuickBooksExport from '@/components/admin/AdminQuickBooksExport';
import AdminRepairOrders from '@/components/admin/AdminRepairOrders';
import AdminCalendar from '@/components/admin/AdminCalendar';
import AdminTechProductivity from '@/components/admin/AdminTechProductivity';
import { supabase } from '@/integrations/supabase/client';
import mmarLogo from '@/assets/mmar-logo.jpeg';

const AdminDashboard = () => {
  const { signOut, user } = useAuth();
  const [stats, setStats] = useState({ customers: 0, activeMemberships: 0, openAppointments: 0, unpaidInvoices: 0 });
  const [contracts, setContracts] = useState<any[]>([]);
  const [warranties, setWarranties] = useState<any[]>([]);

  const reloadFinancing = async () => {
    const { data } = await supabase.from('financing_contracts').select('*').order('created_at', { ascending: false });
    setContracts(data ?? []);
  };
  const reloadWarranty = async () => {
    const { data } = await supabase.from('warranty_acknowledgments').select('*').order('created_at', { ascending: false });
    setWarranties(data ?? []);
  };

  useEffect(() => {
    (async () => {
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
      reloadFinancing();
      reloadWarranty();
    })();
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
          <Button variant="outline" onClick={() => signOut()}>
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
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

        <Tabs defaultValue="customers" className="space-y-4">
          <TabsList className="flex flex-wrap h-auto">
            <TabsTrigger value="reports"><BarChart3 className="h-4 w-4 mr-1.5" /> Reports</TabsTrigger>
            <TabsTrigger value="kanban"><KanbanSquare className="h-4 w-4 mr-1.5" /> Job Board</TabsTrigger>
            <TabsTrigger value="calendar"><Calendar className="h-4 w-4 mr-1.5" /> Calendar</TabsTrigger>
            <TabsTrigger value="ros"><Wrench className="h-4 w-4 mr-1.5" /> Repair Orders</TabsTrigger>
            <TabsTrigger value="customers"><Users className="h-4 w-4 mr-1.5" /> Customers</TabsTrigger>
            <TabsTrigger value="garage"><Car className="h-4 w-4 mr-1.5" /> Garage</TabsTrigger>
            <TabsTrigger value="memberships"><CreditCard className="h-4 w-4 mr-1.5" /> Memberships</TabsTrigger>
            <TabsTrigger value="appointments"><Calendar className="h-4 w-4 mr-1.5" /> Appointments</TabsTrigger>
            <TabsTrigger value="service"><ClipboardList className="h-4 w-4 mr-1.5" /> Service Records</TabsTrigger>
            <TabsTrigger value="estimates"><FileSpreadsheet className="h-4 w-4 mr-1.5" /> Estimates</TabsTrigger>
            <TabsTrigger value="inspections"><ClipboardCheck className="h-4 w-4 mr-1.5" /> Inspections</TabsTrigger>
            <TabsTrigger value="invoices"><Receipt className="h-4 w-4 mr-1.5" /> Invoices</TabsTrigger>
            <TabsTrigger value="catalog"><Package className="h-4 w-4 mr-1.5" /> Catalog</TabsTrigger>
            <TabsTrigger value="time"><Clock className="h-4 w-4 mr-1.5" /> Time</TabsTrigger>
            <TabsTrigger value="productivity"><Activity className="h-4 w-4 mr-1.5" /> Productivity</TabsTrigger>
            <TabsTrigger value="sms"><MessageSquare className="h-4 w-4 mr-1.5" /> SMS</TabsTrigger>
            <TabsTrigger value="declined"><AlertTriangle className="h-4 w-4 mr-1.5" /> Declined</TabsTrigger>
            <TabsTrigger value="quickbooks"><FileDown className="h-4 w-4 mr-1.5" /> QuickBooks</TabsTrigger>
            <TabsTrigger value="financing"><FileText className="h-4 w-4 mr-1.5" /> Financing</TabsTrigger>
            <TabsTrigger value="warranty"><ShieldCheck className="h-4 w-4 mr-1.5" /> Warranty</TabsTrigger>
            <TabsTrigger value="emails"><Mail className="h-4 w-4 mr-1.5" /> Emails</TabsTrigger>
            <TabsTrigger value="audit"><History className="h-4 w-4 mr-1.5" /> Audit Log</TabsTrigger>
            <TabsTrigger value="roles"><ShieldCheck className="h-4 w-4 mr-1.5" /> Roles</TabsTrigger>
            <TabsTrigger value="settings"><Settings className="h-4 w-4 mr-1.5" /> Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="reports"><AdminReports /></TabsContent>
          <TabsContent value="kanban"><AdminKanban /></TabsContent>
          <TabsContent value="calendar"><AdminCalendar /></TabsContent>
          <TabsContent value="ros"><AdminRepairOrders /></TabsContent>
          <TabsContent value="customers"><AdminCustomers /></TabsContent>
          <TabsContent value="garage"><AdminGarage /></TabsContent>
          <TabsContent value="memberships"><AdminMemberships /></TabsContent>
          <TabsContent value="appointments"><AdminAppointments /></TabsContent>
          <TabsContent value="service"><AdminServiceRecords /></TabsContent>
          <TabsContent value="estimates"><AdminEstimates /></TabsContent>
          <TabsContent value="inspections"><AdminInspections /></TabsContent>
          <TabsContent value="invoices"><AdminInvoices /></TabsContent>
          <TabsContent value="catalog"><AdminCatalog /></TabsContent>
          <TabsContent value="time"><AdminTimeTracking /></TabsContent>
          <TabsContent value="productivity"><AdminTechProductivity /></TabsContent>
          <TabsContent value="sms"><AdminSMS /></TabsContent>
          <TabsContent value="declined"><AdminDeclinedWork /></TabsContent>
          <TabsContent value="quickbooks"><AdminQuickBooksExport /></TabsContent>
          <TabsContent value="financing">
            <FinancingContractsTable data={contracts} onRefresh={reloadFinancing} />
          </TabsContent>
          <TabsContent value="warranty"><WarrantyTable data={warranties} onRefresh={reloadWarranty} /></TabsContent>
          <TabsContent value="emails"><AdminEmails /></TabsContent>
          <TabsContent value="audit"><AdminAuditLog /></TabsContent>
          <TabsContent value="roles"><AdminRoles /></TabsContent>
          <TabsContent value="settings"><AdminShopSettings /></TabsContent>
        </Tabs>
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
