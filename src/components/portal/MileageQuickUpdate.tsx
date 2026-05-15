import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Gauge, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Vehicle {
  id: string;
  year: number | null;
  make: string | null;
  model: string | null;
  current_mileage: number | null;
  last_mileage_update_at: string | null;
}

const STALE_DAYS = 30;
const fmt = (n: number) => n.toLocaleString();
const daysAgo = (iso: string | null) => {
  if (!iso) return Infinity;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
};

const MileageQuickUpdate = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("vehicles")
      .select("id, year, make, model, current_mileage, last_mileage_update_at")
      .eq("owner_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    setVehicles((data as Vehicle[]) ?? []);
    setLoaded(true);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const stale = useMemo(
    () => vehicles.filter((v) => daysAgo(v.last_mileage_update_at) >= STALE_DAYS),
    [vehicles],
  );

  const submit = async (v: Vehicle) => {
    if (!user) return;
    const raw = drafts[v.id];
    const miles = Number(raw);
    if (!raw || !Number.isFinite(miles) || miles <= 0) {
      toast.error("Enter a valid mileage");
      return;
    }
    if (v.current_mileage && miles < v.current_mileage) {
      if (!confirm(`That's lower than the last reading (${fmt(v.current_mileage)} mi). Save anyway?`)) return;
    }
    setSavingId(v.id);
    const { error } = await supabase.from("vehicle_mileage_logs").insert({
      vehicle_id: v.id,
      customer_id: user.id,
      mileage: miles,
      source: "quick_prompt",
    });
    setSavingId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Mileage updated — reminders are now tuned to your driving");
    setDrafts((d) => ({ ...d, [v.id]: "" }));
    load();
  };

  if (!loaded || stale.length === 0) return null;

  return (
    <Card className="border-accent/40 bg-accent/5 mb-6">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-2">
          <Gauge className="h-5 w-5 text-accent shrink-0 mt-0.5" />
          <div className="min-w-0">
            <h3 className="font-semibold text-sm">Quick odometer check</h3>
            <p className="text-xs text-muted-foreground">
              Keeps your service reminders accurate. Takes 5 seconds.
            </p>
          </div>
        </div>
        <ul className="space-y-2">
          {stale.map((v) => {
            const days = daysAgo(v.last_mileage_update_at);
            return (
              <li key={v.id} className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex-1 min-w-0 text-xs">
                  <div className="font-medium text-sm truncate">
                    {[v.year, v.make, v.model].filter(Boolean).join(" ") || "Vehicle"}
                  </div>
                  <div className="text-muted-foreground">
                    {v.current_mileage ? `Last: ${fmt(v.current_mileage)} mi` : "No reading on file"}
                    {Number.isFinite(days) ? ` · ${days} days ago` : " · never"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="current mi"
                    className="w-32 h-9"
                    value={drafts[v.id] ?? ""}
                    onChange={(e) =>
                      setDrafts((d) => ({ ...d, [v.id]: e.target.value.replace(/[^\d]/g, "") }))
                    }
                  />
                  <Button
                    size="sm"
                    onClick={() => submit(v)}
                    disabled={savingId === v.id || !drafts[v.id]}
                  >
                    {savingId === v.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save"}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
};

export default MileageQuickUpdate;
