import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Droplet,
  Gauge,
  CalendarClock,
  AlertTriangle,
  Wrench,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { MAINTENANCE_INTERVALS } from "@/data/maintenanceIntervals";

interface Vehicle {
  id: string;
  year: number | null;
  make: string | null;
  model: string | null;
  current_mileage: number | null;
  created_at?: string;
}

interface ServiceRecord {
  id: string;
  service_type: string;
  mileage_at_service: number | null;
  service_date: string;
}

const fmt = (n: number) => n.toLocaleString();

const vehicleLabel = (v: Vehicle) =>
  [v.year, v.make, v.model].filter(Boolean).join(" ") || "Vehicle";

const VehicleHealthCard = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState<string>("");
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("vehicles")
        .select("id, year, make, model, current_mileage, created_at")
        .eq("owner_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      const list = (data as Vehicle[]) ?? [];
      setVehicles(list);
      if (list.length && !vehicleId) setVehicleId(list[0].id);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!vehicleId) return;
    (async () => {
      const { data } = await supabase
        .from("service_records")
        .select("id, service_type, mileage_at_service, service_date")
        .eq("vehicle_id", vehicleId)
        .order("service_date", { ascending: false });
      setRecords((data as ServiceRecord[]) ?? []);
    })();
  }, [vehicleId]);

  const vehicle = vehicles.find((v) => v.id === vehicleId);

  // Latest mileage per canonical service name
  const lastByName = useMemo(() => {
    const out: Record<string, { miles: number; date: string }> = {};
    for (const r of records) {
      const match = MAINTENANCE_INTERVALS.find(
        (m) => m.name.toLowerCase() === (r.service_type || "").toLowerCase(),
      );
      if (!match || r.mileage_at_service == null) continue;
      const cur = out[match.name];
      if (!cur || r.mileage_at_service > cur.miles) {
        out[match.name] = { miles: r.mileage_at_service, date: r.service_date };
      }
    }
    return out;
  }, [records]);

  const odo = vehicle?.current_mileage ?? null;

  // Build per-interval status
  const statuses = useMemo(() => {
    return MAINTENANCE_INTERVALS.map((item) => {
      const last = lastByName[item.name];
      const baseline = last?.miles ?? 0;
      const nextDue = baseline + item.intervalMiles;
      const milesRemaining = odo != null ? nextDue - odo : null;
      const overdue = milesRemaining != null && milesRemaining <= 0;
      const dueSoon =
        milesRemaining != null && milesRemaining > 0 && milesRemaining <= 1000;
      return {
        name: item.name,
        category: item.category,
        intervalMiles: item.intervalMiles,
        hasHistory: !!last,
        nextDue,
        milesRemaining,
        overdue,
        dueSoon,
      };
    });
  }, [lastByName, odo]);

  // Pick the closest upcoming/overdue service for "Next Service"
  const nextService = useMemo(() => {
    const known = statuses.filter(
      (s) => s.milesRemaining != null && s.hasHistory,
    );
    if (!known.length) return null;
    return known.sort(
      (a, b) => (a.milesRemaining as number) - (b.milesRemaining as number),
    )[0];
  }, [statuses]);

  // Oil life: % of remaining miles in oil change interval since last change
  const oil = useMemo(() => {
    const interval = MAINTENANCE_INTERVALS.find(
      (m) => m.name === "Oil & filter change",
    )!;
    const last = lastByName[interval.name];
    if (!last || odo == null) return null;
    const used = Math.max(0, odo - last.miles);
    const pct = Math.max(0, Math.min(100, 100 - (used / interval.intervalMiles) * 100));
    return { pct: Math.round(pct), milesRemaining: interval.intervalMiles - used };
  }, [lastByName, odo]);

  // Tire rotation
  const tires = useMemo(() => {
    const interval = MAINTENANCE_INTERVALS.find((m) => m.name === "Tire rotation")!;
    const last = lastByName[interval.name];
    if (!last || odo == null) return null;
    const remaining = last.miles + interval.intervalMiles - odo;
    return { remaining };
  }, [lastByName, odo]);

  const warnings = useMemo(
    () => statuses.filter((s) => s.overdue && s.hasHistory).slice(0, 3),
    [statuses],
  );

  // Upcoming list: prefer those with history & known remaining miles, then ones we have no record of
  const upcoming = useMemo(() => {
    const withMiles = statuses
      .filter((s) => s.hasHistory && s.milesRemaining != null)
      .sort((a, b) => (a.milesRemaining as number) - (b.milesRemaining as number));
    const noHistory = statuses.filter((s) => !s.hasHistory);
    return [...withMiles, ...noHistory].slice(0, 5);
  }, [statuses]);

  if (loading) return null;
  if (!vehicle) return null;

  return (
    <div className="space-y-4 mb-6">
      {/* Vehicle Health */}
      <Card className="border-primary/20 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Gauge className="h-5 w-5 text-primary" />
                Vehicle Health
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {vehicleLabel(vehicle)}
                {odo != null && ` · ${fmt(odo)} mi`}
              </p>
            </div>
            {vehicles.length > 1 && (
              <Select value={vehicleId} onValueChange={setVehicleId}>
                <SelectTrigger className="h-8 w-auto text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {vehicleLabel(v)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Oil Life */}
          <HealthRow
            icon={Droplet}
            label="Oil Life"
            value={
              oil
                ? `${oil.pct}%`
                : odo == null
                ? "Add mileage"
                : "Log oil change"
            }
            tone={
              oil ? (oil.pct < 15 ? "danger" : oil.pct < 35 ? "warn" : "ok") : "muted"
            }
            sub={oil ? `${fmt(Math.max(0, oil.milesRemaining))} mi remaining` : undefined}
            progress={oil?.pct}
          />

          {/* Tire Rotation */}
          <HealthRow
            icon={Wrench}
            label="Tire Rotation Due"
            value={
              tires
                ? tires.remaining <= 0
                  ? "Overdue"
                  : `${fmt(tires.remaining)} mi`
                : "Log a rotation"
            }
            tone={
              tires
                ? tires.remaining <= 0
                  ? "danger"
                  : tires.remaining < 500
                  ? "warn"
                  : "ok"
                : "muted"
            }
          />

          {/* Next Service */}
          <HealthRow
            icon={CalendarClock}
            label="Next Service"
            value={
              nextService
                ? nextService.overdue
                  ? "Overdue"
                  : `${fmt(nextService.milesRemaining as number)} mi`
                : "All caught up"
            }
            tone={
              nextService
                ? nextService.overdue
                  ? "danger"
                  : (nextService.milesRemaining as number) < 500
                  ? "warn"
                  : "ok"
                : "ok"
            }
            sub={nextService?.name}
          />

          {/* Warnings */}
          {warnings.length > 0 ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
              <div className="flex items-center gap-2 text-destructive font-medium text-sm mb-1">
                <AlertTriangle className="h-4 w-4" />
                Active warning{warnings.length > 1 ? "s" : ""}
              </div>
              <ul className="text-xs text-foreground/90 space-y-0.5">
                {warnings.map((w) => (
                  <li key={w.name}>
                    • {w.name} —{" "}
                    {Math.abs(w.milesRemaining as number).toLocaleString()} mi overdue
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              No active warnings
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Recommended Services */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Recommended for your {[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ") || "vehicle"}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Based on mileage and standard service intervals.
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Add your current mileage and service history to see recommendations.
            </p>
          ) : (
            <ul className="divide-y divide-border/60">
              {upcoming.map((s) => {
                const label = !s.hasHistory
                  ? "No record on file"
                  : s.overdue
                  ? `Due now · ${Math.abs(s.milesRemaining as number).toLocaleString()} mi overdue`
                  : `Due in ${fmt(s.milesRemaining as number)} mi`;
                const tone = s.overdue
                  ? "destructive"
                  : s.dueSoon
                  ? "default"
                  : "secondary";
                return (
                  <li
                    key={s.name}
                    className="py-2.5 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{s.name}</div>
                      <div className="text-[11px] text-muted-foreground">
                        every {s.intervalMiles.toLocaleString()} mi
                      </div>
                    </div>
                    <Badge variant={tone as any} className="shrink-0 text-[10px]">
                      {label}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="flex flex-col sm:flex-row gap-2 pt-3">
            <Button asChild className="flex-1">
              <Link to="/book">
                Schedule Service <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link to="/portal/maintenance">Update log</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const HealthRow = ({
  icon: Icon,
  label,
  value,
  sub,
  tone,
  progress,
}: {
  icon: typeof Gauge;
  label: string;
  value: string;
  sub?: string;
  tone: "ok" | "warn" | "danger" | "muted";
  progress?: number;
}) => {
  const toneClass =
    tone === "danger"
      ? "text-destructive"
      : tone === "warn"
      ? "text-accent"
      : tone === "ok"
      ? "text-primary"
      : "text-muted-foreground";
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className={`h-4 w-4 ${toneClass}`} />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <div className={`text-sm font-semibold ${toneClass}`}>{value}</div>
      </div>
      {sub && <div className="text-[11px] text-muted-foreground ml-6 mt-0.5">{sub}</div>}
      {progress != null && (
        <Progress value={progress} className="h-1.5 mt-2" />
      )}
    </div>
  );
};

export default VehicleHealthCard;
