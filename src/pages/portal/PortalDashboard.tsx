import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PortalLayout from "@/components/portal/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Car, CreditCard, Calendar, ArrowRight, RefreshCw, FileText, Wrench, Receipt } from "lucide-react";
import { portalStrings } from "@/lib/portalStrings";

const PortalDashboard = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [counts, setCounts] = useState({ vehicles: 0, memberships: 0, appointments: 0 });
  const [name, setName] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    if (!user) return;
    setRefreshing(true);
    const [v, m, a, p] = await Promise.all([
      supabase.from("vehicles").select("id", { count: "exact", head: true }).eq("owner_id", user.id).eq("is_active", true),
      supabase.from("memberships").select("id", { count: "exact", head: true }).eq("customer_id", user.id).eq("status", "active"),
      supabase.from("appointments").select("id", { count: "exact", head: true }).eq("customer_id", user.id).in("status", ["requested", "scheduled"]),
      supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    ]);
    setCounts({
      vehicles: v.count ?? 0,
      memberships: m.count ?? 0,
      appointments: a.count ?? 0,
    });
    setName(p.data?.full_name ?? "");
    setRefreshing(false);
  };

  useEffect(() => {
    const status = searchParams.get("membership");
    if (status === "success") {
      toast.success(portalStrings.account.membershipActivatedToast);
      searchParams.delete("membership");
      setSearchParams(searchParams, { replace: true });
    } else if (status === "canceled") {
      toast("Checkout canceled. You can resume anytime.", { description: "No charges were made." });
      searchParams.delete("membership");
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user) return;
    refresh();
    const onFocus = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', onFocus);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onFocus);
      window.removeEventListener('focus', onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <PortalLayout>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome{name ? `, ${name.split(" ")[0]}` : ""}</h1>
          <p className="text-muted-foreground mt-1">{portalStrings.account.dashboardSubtitle}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={refresh} disabled={refreshing} aria-label="Refresh">
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard icon={Car} label="Vehicles" value={counts.vehicles} link="/portal/vehicles" />
        <StatCard icon={CreditCard} label="Active Memberships" value={counts.memberships} link="/portal/membership" />
        <StatCard icon={Calendar} label="Upcoming Appointments" value={counts.appointments} link="/portal/appointments" />
      </div>

      <div className="mb-8">
        <div className="text-sm font-medium text-muted-foreground mb-2">Quick links</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <QuickLink icon={FileText} label="Estimates" to="/portal/estimates" />
          <QuickLink icon={Wrench} label="Repair Orders" to="/portal/repair-orders" />
          <QuickLink icon={Receipt} label="Invoices" to="/portal/invoices" />
        </div>
      </div>

      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardHeader>
          <CardTitle>Get started with a Maintenance Membership</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-muted-foreground">
            Lock in predictable mobile maintenance with priority scheduling and member discounts.
          </p>
          <Button variant="hero" asChild>
            <Link to="/memberships">View Plans <ArrowRight className="h-4 w-4 ml-1" /></Link>
          </Button>
        </CardContent>
      </Card>
    </PortalLayout>
  );
};

const StatCard = ({
  icon: Icon,
  label,
  value,
  link,
}: {
  icon: typeof Car;
  label: string;
  value: number;
  link: string;
}) => (
  <Link to={link}>
    <Card className="hover:border-primary/40 transition-colors h-full">
      <CardContent className="p-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <div className="text-lg font-semibold leading-none">{value}</div>
          <div className="text-xs text-muted-foreground mt-1 truncate">{label}</div>
        </div>
      </CardContent>
    </Card>
  </Link>
);

const QuickLink = ({ icon: Icon, label, to }: { icon: typeof Car; label: string; to: string }) => (
  <Link to={to}>
    <Card className="hover:border-primary/40 hover:bg-primary/5 transition-colors h-full">
      <CardContent className="p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div className="font-medium">{label}</div>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </CardContent>
    </Card>
  </Link>
);

export default PortalDashboard;
