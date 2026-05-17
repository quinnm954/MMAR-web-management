import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PortalLayout from "@/components/portal/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Calendar, Plus, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";

interface Vehicle { id: string; year: number | null; make: string | null; model: string | null }
interface Appointment {
  id: string;
  service_type: string;
  description: string | null;
  service_address: string | null;
  requested_date: string | null;
  requested_time_window: string | null;
  status: string;
  scheduled_at: string | null;
  vehicle: Vehicle | null;
}

import { SERVICE_TYPES } from "@/lib/serviceTypes";

const TIME_WINDOWS = ["Morning (8am-12pm)", "Afternoon (12pm-4pm)", "Evening (4pm-7pm)"];

const statusColor = (s: string) => {
  if (s === "scheduled") return "bg-primary/15 text-primary";
  if (s === "completed") return "bg-accent/15 text-accent-foreground";
  if (s === "cancelled") return "bg-muted text-muted-foreground";
  return "bg-muted text-muted-foreground";
};

const PortalAppointments = () => {
  const { user } = useAuth();
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    vehicle_id: "",
    service_type: "",
    description: "",
    service_address: "",
    requested_date: "",
    requested_time_window: "",
  });

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [a, v] = await Promise.all([
      supabase
        .from("appointments")
        .select("id, service_type, description, service_address, requested_date, requested_time_window, status, scheduled_at, vehicle:vehicles(id, year, make, model)")
        .eq("customer_id", user.id)
        .order("requested_date", { ascending: false, nullsFirst: false }),
      supabase.from("vehicles").select("id, year, make, model").eq("owner_id", user.id).eq("is_active", true),
    ]);
    setAppts((a.data as unknown as Appointment[]) ?? []);
    setVehicles((v.data as Vehicle[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user]);

  const handleSubmit = async () => {
    if (!user) return;
    if (!form.service_type || !form.requested_date) return toast.error("Service type and date required");
    setSaving(true);
    const { error } = await supabase.from("appointments").insert({
      customer_id: user.id,
      vehicle_id: form.vehicle_id || null,
      service_type: form.service_type,
      description: form.description || null,
      service_address: form.service_address || null,
      requested_date: form.requested_date,
      requested_time_window: form.requested_time_window || null,
      status: "requested",
      source: "in_app",
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Appointment requested! We'll confirm shortly.");
    setOpen(false);
    setForm({ vehicle_id: "", service_type: "", description: "", service_address: "", requested_date: "", requested_time_window: "" });
    load();
  };

  return (
    <PortalLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Appointments</h1>
          <p className="text-muted-foreground mt-1">Request and track mobile service visits.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="hero"><Plus className="h-4 w-4 mr-1" /> Request Service</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Request Mobile Service</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Vehicle</Label>
                <Select value={form.vehicle_id} onValueChange={(v) => setForm({ ...form, vehicle_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select vehicle (optional)" /></SelectTrigger>
                  <SelectContent>
                    {vehicles.map((v) => (
                      <SelectItem key={v.id} value={v.id}>{v.year} {v.make} {v.model}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Service Type *</Label>
                <Select value={form.service_type} onValueChange={(v) => setForm({ ...form, service_type: v })}>
                  <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
                  <SelectContent>
                    {SERVICE_TYPES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Preferred Date *</Label>
                  <Input type="date" min={new Date().toISOString().slice(0, 10)} value={form.requested_date} onChange={(e) => setForm({ ...form, requested_date: e.target.value })} />
                </div>
                <div>
                  <Label>Time Window</Label>
                  <Select value={form.requested_time_window} onValueChange={(v) => setForm({ ...form, requested_time_window: v })}>
                    <SelectTrigger><SelectValue placeholder="Anytime" /></SelectTrigger>
                    <SelectContent>
                      {TIME_WINDOWS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Service Address</Label>
                <Input placeholder="123 Main St, Fort Myers, FL" value={form.service_address} onChange={(e) => setForm({ ...form, service_address: e.target.value })} />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea rows={3} placeholder="Symptoms, special instructions, gate codes, etc." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button variant="hero" onClick={handleSubmit} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Request Appointment"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : appts.length === 0 ? (
        <Card className="border-dashed border-border/50">
          <CardContent className="p-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">No appointments yet.</p>
            <Button variant="hero" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Request your first service</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {appts.map((a) => (
            <Card key={a.id} className="border-border/50">
              <CardContent className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold">{a.service_type}</h3>
                      <Badge className={statusColor(a.status)}>{a.status}</Badge>
                    </div>
                    {a.vehicle && <div className="text-xs text-muted-foreground">{a.vehicle.year} {a.vehicle.make} {a.vehicle.model}</div>}
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-medium">{a.scheduled_at ? new Date(a.scheduled_at).toLocaleString() : a.requested_date}</div>
                    {a.requested_time_window && <div className="text-xs text-muted-foreground">{a.requested_time_window}</div>}
                  </div>
                </div>
                {a.service_address && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-2"><MapPin className="h-3 w-3" /> {a.service_address}</div>
                )}
                {a.description && <p className="text-sm mt-2">{a.description}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PortalLayout>
  );
};

export default PortalAppointments;
