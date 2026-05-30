import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import TechLayout from "@/components/tech/TechLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Wrench,
  ClipboardCheck,
  Users,
  History,
  Clock,
  Loader2,
  Calendar,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

interface Stats {
  jobsToday: number;
  inProgress: number;
  completedThisWeek: number;
  hoursThisWeek: number;
}

interface UpcomingAppt {
  id: string;
  service_type: string;
  scheduled_at: string | null;
  status: string;
  customer_name: string | null;
  vehicle_label: string | null;
}

const startOfDayISO = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
};
const endOfDayISO = (d: Date) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x.toISOString();
};
const startOfWeekISO = () => {
  const d = new Date();
  const day = d.getDay(); // 0 Sun
  const diff = (day === 0 ? -6 : 1) - day; // Monday start
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};

const TechDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    jobsToday: 0,
    inProgress: 0,
    completedThisWeek: 0,
    hoursThisWeek: 0,
  });
  const [upcoming, setUpcoming] = useState<UpcomingAppt[]>([]);
  const [greeting, setGreeting] = useState("Hello");

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening");
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const today = new Date();
      const weekStart = startOfWeekISO();

      const [todayRes, inProgRes, doneRes, hoursRes, upcomingRes] = await Promise.all([
        supabase
          .from("appointments")
          .select("id", { count: "exact", head: true })
          .eq("assigned_technician_id", user.id)
          .gte("scheduled_at", startOfDayISO(today))
          .lte("scheduled_at", endOfDayISO(today)),
        supabase
          .from("appointments")
          .select("id", { count: "exact", head: true })
          .eq("assigned_technician_id", user.id)
          .eq("status", "in_progress"),
        supabase
          .from("appointments")
          .select("id", { count: "exact", head: true })
          .eq("assigned_technician_id", user.id)
          .eq("status", "completed")
          .gte("updated_at", weekStart),
        supabase
          .from("time_entries")
          .select("duration_minutes, clock_in, clock_out")
          .eq("technician_id", user.id)
          .gte("clock_in", weekStart),
        supabase
          .from("appointments")
          .select("id, service_type, scheduled_at, status, customer_id, vehicle:vehicles(year, make, model)")
          .eq("assigned_technician_id", user.id)
          .in("status", ["scheduled", "in_progress"])
          .order("scheduled_at", { ascending: true, nullsFirst: false })
          .limit(3),
      ]);

      const totalMinutes = (hoursRes.data ?? []).reduce((acc: number, r: any) => {
        if (r.duration_minutes) return acc + r.duration_minutes;
        if (r.clock_in && r.clock_out) {
          return acc + Math.round((new Date(r.clock_out).getTime() - new Date(r.clock_in).getTime()) / 60000);
        }
        return acc;
      }, 0);

      const upRaw = (upcomingRes.data ?? []) as any[];
      const custIds = Array.from(new Set(upRaw.map((r) => r.customer_id).filter(Boolean)));
      let profMap: Record<string, string> = {};
      if (custIds.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", custIds);
        (profs ?? []).forEach((p: any) => {
          profMap[p.id] = p.full_name || p.email || "Customer";
        });
      }

      setStats({
        jobsToday: todayRes.count ?? 0,
        inProgress: inProgRes.count ?? 0,
        completedThisWeek: doneRes.count ?? 0,
        hoursThisWeek: Math.round((totalMinutes / 60) * 10) / 10,
      });
      setUpcoming(
        upRaw.map((r) => ({
          id: r.id,
          service_type: r.service_type,
          scheduled_at: r.scheduled_at,
          status: r.status,
          customer_name: profMap[r.customer_id] ?? null,
          vehicle_label: r.vehicle ? `${r.vehicle.year ?? ""} ${r.vehicle.make ?? ""} ${r.vehicle.model ?? ""}`.trim() : null,
        })),
      );
      setLoading(false);
    })();
  }, [user]);

  const tiles = [
    { to: "/tech/jobs", label: "My Jobs", icon: Wrench, desc: "Assigned appointments" },
    { to: "/tech/inspections", label: "Inspections & Checklists", icon: ClipboardCheck, desc: "Multi-point inspections" },
    { to: "/tech/customers", label: "Customers & Vehicles", icon: Users, desc: "Look up history" },
    { to: "/tech/history", label: "Service History", icon: History, desc: "Records I logged" },
  ];

  return (
    <TechLayout>
      <div className="space-y-6">
        <div>
          <p className="text-sm text-muted-foreground">{greeting}</p>
          <h1 className="text-2xl font-bold">Tech Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Jobs today" value={stats.jobsToday} icon={Calendar} loading={loading} />
          <StatCard label="In progress" value={stats.inProgress} icon={Wrench} loading={loading} accent />
          <StatCard label="Done this week" value={stats.completedThisWeek} icon={TrendingUp} loading={loading} />
          <StatCard label="Hours this week" value={stats.hoursThisWeek} icon={Clock} loading={loading} />
        </div>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Quick access</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {tiles.map((t) => (
              <Link key={t.to} to={t.to} className="group">
                <Card className="h-full hover:border-primary/50 transition-colors">
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <t.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold flex items-center gap-1">
                        {t.label}
                        <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition" />
                      </div>
                      <p className="text-xs text-muted-foreground">{t.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Next up</h2>
            <Link to="/tech/jobs" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : upcoming.length === 0 ? (
            <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">No upcoming jobs.</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {upcoming.map((u) => (
                <Link key={u.id} to="/tech/jobs">
                  <Card className="hover:border-primary/50 transition-colors">
                    <CardContent className="p-3 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{u.service_type}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {u.customer_name}{u.vehicle_label ? ` · ${u.vehicle_label}` : ""}
                        </div>
                      </div>
                      <div className="text-right text-xs text-muted-foreground shrink-0">
                        {u.scheduled_at
                          ? new Date(u.scheduled_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
                          : "Unscheduled"}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </TechLayout>
  );
};

const StatCard = ({
  label,
  value,
  icon: Icon,
  loading,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  loading: boolean;
  accent?: boolean;
}) => (
  <Card className={accent ? "border-primary/30" : ""}>
    <CardContent className="p-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</span>
        <Icon className={`h-4 w-4 ${accent ? "text-primary" : "text-muted-foreground"}`} />
      </div>
      <div className="text-2xl font-bold mt-1">
        {loading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : value}
      </div>
    </CardContent>
  </Card>
);

export default TechDashboard;
