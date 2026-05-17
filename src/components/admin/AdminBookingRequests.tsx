import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SERVICE_TYPES } from "@/lib/serviceTypes";
import { toast } from "sonner";
import { CalendarCheck, CheckCircle2, XCircle, Phone, Loader2, RefreshCw, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

interface BookingRequest {
  id: string;
  confirmation_token: string;
  status: string;
  source: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  service_type: string;
  description: string | null;
  vehicle_info: string | null;
  service_address: string | null;
  requested_date: string | null;
  requested_time_window: string | null;
  notes: string | null;
  created_at: string;
}

const STATUS_TONE: Record<string, string> = {
  new: "bg-primary/10 text-primary",
  contacted: "bg-accent/20 text-accent-foreground",
  confirmed: "bg-emerald-500/15 text-emerald-500",
  converted: "bg-emerald-500/15 text-emerald-500",
  declined: "bg-muted text-muted-foreground",
  spam: "bg-muted text-muted-foreground",
};

const EMPTY_EDIT = {
  customer_name: "",
  customer_phone: "",
  customer_email: "",
  service_type: "",
  description: "",
  vehicle_info: "",
  service_address: "",
  requested_date: "",
  requested_time_window: "",
  notes: "",
};

const fmtDate = (d?: string | null) => {
  if (!d) return "—";
  try {
    return new Date(d.length <= 10 ? `${d}T12:00:00` : d).toLocaleDateString();
  } catch {
    return d;
  }
};

const AdminBookingRequests = () => {
  const [rows, setRows] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const [confirming, setConfirming] = useState<BookingRequest | null>(null);
  const [date, setDate] = useState("");
  const [window, setWindow] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<BookingRequest | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT);
  const [savingEdit, setSavingEdit] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("booking_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) toast.error(error.message);
    setRows((data ?? []) as BookingRequest[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openConfirm = (r: BookingRequest) => {
    setConfirming(r);
    setDate(r.requested_date ?? "");
    setWindow(r.requested_time_window ?? "");
    setNotes("");
  };

  const openEdit = (r: BookingRequest) => {
    setEditing(r);
    setEditForm({
      customer_name: r.customer_name ?? "",
      customer_phone: r.customer_phone ?? "",
      customer_email: r.customer_email ?? "",
      service_type: r.service_type ?? "",
      description: r.description ?? "",
      vehicle_info: r.vehicle_info ?? "",
      service_address: r.service_address ?? "",
      requested_date: r.requested_date ?? "",
      requested_time_window: r.requested_time_window ?? "",
      notes: r.notes ?? "",
    });
  };

  const submitEdit = async () => {
    if (!editing) return;
    if (!editForm.customer_name.trim() || !editForm.customer_phone.trim() || !editForm.service_type.trim()) {
      toast.error("Name, phone, and service type are required.");
      return;
    }
    setSavingEdit(true);
    const { error } = await supabase
      .from("booking_requests")
      .update({
        customer_name: editForm.customer_name.trim(),
        customer_phone: editForm.customer_phone.trim(),
        customer_email: editForm.customer_email.trim() || null,
        service_type: editForm.service_type.trim(),
        description: editForm.description.trim() || null,
        vehicle_info: editForm.vehicle_info.trim() || null,
        service_address: editForm.service_address.trim() || null,
        requested_date: editForm.requested_date || null,
        requested_time_window: editForm.requested_time_window.trim() || null,
        notes: editForm.notes.trim() || null,
      })
      .eq("id", editing.id);
    setSavingEdit(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Booking request updated.");
    setEditing(null);
    load();
  };

  const submitConfirm = async () => {
    if (!confirming) return;
    setBusy(true);
    const { error } = await supabase.rpc("admin_confirm_booking_request", {
      _id: confirming.id,
      _requested_date: date || null,
      _requested_time_window: window || null,
      _notes: notes || null,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Booking confirmed. Customer can see updated status.");
    setConfirming(null);
    load();
  };

  const decline = async (r: BookingRequest) => {
    const reason = prompt("Reason for declining (optional, sent to internal notes)?") ?? "";
    const { error } = await supabase.rpc("admin_decline_booking_request", {
      _id: r.id,
      _reason: reason || null,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Booking request declined.");
    load();
  };

  const removeRequest = async (r: BookingRequest) => {
    if (!confirm(`Delete booking request from ${r.customer_name}? This cannot be undone.`)) return;
    const { error } = await supabase.from("booking_requests").delete().eq("id", r.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Booking request deleted.");
    load();
  };

  const visible = filter === "pending"
    ? rows.filter((r) => r.status === "new" || r.status === "contacted")
    : rows;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-primary" /> Booking Requests
          </h2>
          <p className="text-sm text-muted-foreground">
            Public requests from Google &amp; the website. Verify before they're confirmed to the customer.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={filter === "pending" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("pending")}
          >
            Pending
          </Button>
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All
          </Button>
          <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : visible.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No booking requests in this view.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {visible.map((r) => (
            <Card key={r.id} className="border-border/50">
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-base">{r.customer_name}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString()} · via {r.source}
                  </p>
                </div>
                <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${STATUS_TONE[r.status] ?? "bg-muted"}`}>
                  {r.status}
                </span>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div><span className="text-muted-foreground">Service:</span> {r.service_type}</div>
                {r.description && (
                  <div className="text-muted-foreground text-xs">"{r.description}"</div>
                )}
                {r.vehicle_info && <div><span className="text-muted-foreground">Vehicle:</span> {r.vehicle_info}</div>}
                {r.service_address && <div><span className="text-muted-foreground">Address:</span> {r.service_address}</div>}
                <div>
                  <span className="text-muted-foreground">Preferred:</span>{" "}
                  {fmtDate(r.requested_date)}{r.requested_time_window ? ` · ${r.requested_time_window}` : ""}
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <a href={`tel:${r.customer_phone}`} className="text-primary inline-flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {r.customer_phone}
                  </a>
                  {r.customer_email && (
                    <a href={`mailto:${r.customer_email}`} className="text-muted-foreground hover:text-primary">
                      {r.customer_email}
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2 pt-2 flex-wrap">
                  {(r.status === "new" || r.status === "contacted") && (
                    <>
                      <Button size="sm" onClick={() => openConfirm(r)}>
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Confirm
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => decline(r)}>
                        <XCircle className="h-4 w-4 mr-1" /> Decline
                      </Button>
                    </>
                  )}
                  <Button size="sm" variant="outline" onClick={() => openEdit(r)}>
                    <Pencil className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => removeRequest(r)}>
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </Button>
                  <Button size="sm" variant="ghost" asChild>
                    <Link to={`/appointments/${r.confirmation_token}`} target="_blank">
                      <ExternalLink className="h-3 w-3 mr-1" /> Customer view
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!confirming} onOpenChange={(o) => !o && setConfirming(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm booking</DialogTitle>
            <DialogDescription>
              Verify the customer's preferred day &amp; time, adjust if needed, then confirm.
              The customer's status link will update to "Confirmed".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="cdate">Confirmed date</Label>
              <Input id="cdate" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="cwin">Time window</Label>
              <Input id="cwin" placeholder="e.g. Morning (8am – 12pm)" value={window} onChange={(e) => setWindow(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="cnotes">Internal notes (optional)</Label>
              <Textarea id="cnotes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirming(null)}>Cancel</Button>
            <Button onClick={submitConfirm} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit booking request</DialogTitle>
            <DialogDescription>
              Update any details. Changes are visible immediately on the customer's status link.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="ename">Customer name *</Label>
                <Input id="ename" value={editForm.customer_name} onChange={(e) => setEditForm({ ...editForm, customer_name: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="ephone">Phone *</Label>
                <Input id="ephone" value={editForm.customer_phone} onChange={(e) => setEditForm({ ...editForm, customer_phone: e.target.value })} />
              </div>
            </div>
            <div>
              <Label htmlFor="eemail">Email</Label>
              <Input id="eemail" type="email" value={editForm.customer_email} onChange={(e) => setEditForm({ ...editForm, customer_email: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="eservice">Service type *</Label>
              <Select value={editForm.service_type} onValueChange={(v) => setEditForm({ ...editForm, service_type: v })}>
                <SelectTrigger id="eservice"><SelectValue placeholder="Choose a service" /></SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edesc">Description</Label>
              <Textarea id="edesc" rows={2} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="evehicle">Vehicle</Label>
              <Input id="evehicle" placeholder="Year Make Model" value={editForm.vehicle_info} onChange={(e) => setEditForm({ ...editForm, vehicle_info: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="eaddr">Service address</Label>
              <Input id="eaddr" value={editForm.service_address} onChange={(e) => setEditForm({ ...editForm, service_address: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="edate">Preferred date</Label>
                <Input id="edate" type="date" value={editForm.requested_date} onChange={(e) => setEditForm({ ...editForm, requested_date: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="ewin">Time window</Label>
                <Input id="ewin" placeholder="Morning / Afternoon" value={editForm.requested_time_window} onChange={(e) => setEditForm({ ...editForm, requested_time_window: e.target.value })} />
              </div>
            </div>
            <div>
              <Label htmlFor="enotes">Internal notes</Label>
              <Textarea id="enotes" rows={2} value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={submitEdit} disabled={savingEdit}>
              {savingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBookingRequests;
