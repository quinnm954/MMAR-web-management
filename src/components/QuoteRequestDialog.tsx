import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { trackConversion, getAttribution } from "@/lib/gtag";
import { SERVICE_TYPES } from "@/lib/serviceTypes";

const currentYear = new Date().getFullYear();
const digitsOnly = (v: string) => v.replace(/\D/g, "");
const TIME_WINDOWS = [
  "Morning (8am – 12pm)",
  "Afternoon (12pm – 5pm)",
  "Evening (5pm – 8pm)",
];

interface QuoteRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceName: string | null;
}

const QuoteRequestDialog = ({
  open,
  onOpenChange,
  serviceName,
}: QuoteRequestDialogProps) => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [mileage, setMileage] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [requestedDate, setRequestedDate] = useState("");
  const [timeWindow, setTimeWindow] = useState("");
  const [serviceTypeOverride, setServiceTypeOverride] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const STORAGE_KEY = "quoteRequest:contactInfo";

  useEffect(() => {
    if (open) {
      setErrors({});
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const v = JSON.parse(saved);
          setName(v.name ?? "");
          setPhone(v.phone ?? "");
          setEmail(v.email ?? "");
          setYear(v.year ?? "");
          setMake(v.make ?? "");
          setModel(v.model ?? "");
          setMileage(v.mileage ?? "");
          setLocation(v.location ?? "");
          return;
        }
      } catch {
        // ignore
      }
    }
  }, [open]);

  const handleSubmit = async () => {
    const next: Record<string, string> = {};
    const finalService = serviceName ?? serviceTypeOverride.trim();
    if (!finalService) next.service = "Tell us what service you need";
    if (!name.trim() || name.trim().length < 2) next.name = "Your name is required";
    if (digitsOnly(phone).length < 10) next.phone = "Enter a valid phone number";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Enter a valid email";
    if (year) {
      const y = Number(year);
      if (!/^\d{4}$/.test(year) || y < 1900 || y > currentYear + 1) {
        next.year = `Enter a 4-digit year (1900–${currentYear + 1})`;
      }
    }
    if (mileage) {
      const m = Number(digitsOnly(mileage));
      if (!Number.isFinite(m) || m < 0 || m > 1_000_000) {
        next.mileage = "Enter a mileage between 0 and 1,000,000";
      }
    }
    if (notes.length > 1000) next.notes = "Notes are too long (1000 max)";
    setErrors(next);
    if (Object.keys(next).length > 0) {
      toast.error("Please fix the highlighted fields");
      return;
    }

    const vehicle = [year, make, model].filter(Boolean).join(" ").trim();
    const description = [
      mileage ? `Mileage: ${mileage}` : "",
      notes ? notes : "",
    ].filter(Boolean).join("\n");

    setBusy(true);
    const { data, error } = await supabase.rpc("submit_booking_request", {
      _name: name.trim(),
      _phone: phone.trim(),
      _email: email.trim() || null,
      _service_type: finalService,
      _description: description || null,
      _service_address: location.trim() || null,
      _vehicle_info: vehicle || null,
      _requested_date: requestedDate || null,
      _requested_time_window: timeWindow || null,
      _source: "in_app",
    });
    setBusy(false);

    if (error || !data) {
      toast.error(error?.message ?? "Could not submit. Please call (813) 501-7572.");
      return;
    }

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ name, phone, email, year, make, model, mileage, location }),
      );
    } catch {
      // ignore
    }

    const token = (data as { token?: string })?.token;
    const requestId = (data as { id?: string })?.id;

    // Attach Google Ads attribution (gclid / utm) for offline conversion uploads
    if (token) {
      const attr = { ...getAttribution(), user_agent: navigator.userAgent };
      void supabase.rpc("set_booking_attribution", { _token: token, _attribution: attr }).then(() => {}, () => {});

      // Auto-create a customer account (profile + login) when an email is provided.
      // Fire-and-forget — failures don't block the booking confirmation.
      if (email.trim()) {
        void supabase.functions
          .invoke("bootstrap-customer-from-booking", { body: { token } })
          .catch(() => {});
      }
    }

    // Fire transactional emails (fire-and-forget).
    if (requestId) {
      const { sendNotification } = await import("@/lib/notify");
      const sharedData = {
        customerName: name.trim(),
        customerPhone: phone.trim(),
        customerEmail: email.trim() || undefined,
        serviceType: finalService,
        vehicle: vehicle || undefined,
        requestedDate: requestedDate || undefined,
        requestedTimeWindow: timeWindow || undefined,
        serviceAddress: location.trim() || undefined,
        description: description || undefined,
        source: "in_app",
      };
      // Customer confirmation (only if email provided)
      if (email.trim()) {
        void sendNotification({
          templateName: "booking-request-received",
          recipientEmail: email.trim(),
          idempotencyKey: `booking-req-customer-${requestId}`,
          templateData: sharedData,
        });
      }
      // Admin alert
      void sendNotification({
        templateName: "admin-new-booking-request",
        recipientEmail: "quinnm954@gmail.com",
        idempotencyKey: `booking-req-admin-${requestId}`,
        templateData: {
          ...sharedData,
          adminUrl: `${window.location.origin}/admin/bookings`,
        },
      });
    }

    // Fire Google Ads "quote submit" conversion
    trackConversion("quote_submit");

    toast.success("Request received! We'll text you to confirm your day & time.");
    onOpenChange(false);
    if (token) navigate(`/appointments/${token}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl tracking-wide">
            <span className="text-sky">REQUEST</span>{" "}
            <span className="text-gold">SERVICE</span>
          </DialogTitle>
          <DialogDescription>
            {serviceName ? (
              <>
                Service: <span className="font-semibold text-foreground">{serviceName}</span>. We'll review and text you to confirm.
              </>
            ) : (
              "Tell us what you need — we'll review and text you to confirm a time."
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!serviceName && (
            <div className="space-y-1.5">
              <Label htmlFor="service">Service needed</Label>
              <Select
                value={serviceTypeOverride}
                onValueChange={(v) => {
                  setServiceTypeOverride(v);
                  if (errors.service) setErrors((p) => ({ ...p, service: "" }));
                }}
              >
                <SelectTrigger
                  id="service"
                  aria-invalid={!!errors.service}
                  className={errors.service ? "border-destructive focus-visible:ring-destructive" : ""}
                >
                  <SelectValue placeholder="Choose a service" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.service && <p className="text-xs text-destructive">{errors.service}</p>}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Your name</Label>
              <Input
                id="name"
                value={name}
                aria-invalid={!!errors.name}
                className={errors.name ? "border-destructive focus-visible:ring-destructive" : ""}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((p) => ({ ...p, name: "" }));
                }}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Mobile</Label>
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                aria-invalid={!!errors.phone}
                className={errors.phone ? "border-destructive focus-visible:ring-destructive" : ""}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (errors.phone) setErrors((p) => ({ ...p, phone: "" }));
                }}
              />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email (optional)</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              aria-invalid={!!errors.email}
              className={errors.email ? "border-destructive focus-visible:ring-destructive" : ""}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((p) => ({ ...p, email: "" }));
              }}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                inputMode="numeric"
                pattern="\d*"
                maxLength={4}
                placeholder="2018"
                value={year}
                aria-invalid={!!errors.year}
                className={errors.year ? "border-destructive focus-visible:ring-destructive" : ""}
                onChange={(e) => {
                  setYear(digitsOnly(e.target.value).slice(0, 4));
                  if (errors.year) setErrors((p) => ({ ...p, year: "" }));
                }}
              />
              {errors.year && <p className="text-xs text-destructive">{errors.year}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="make">Make</Label>
              <Input id="make" placeholder="Toyota" value={make} onChange={(e) => setMake(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="model">Model</Label>
              <Input id="model" placeholder="Camry" value={model} onChange={(e) => setModel(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="mileage">Mileage (optional)</Label>
              <Input
                id="mileage"
                inputMode="numeric"
                pattern="\d*"
                maxLength={7}
                placeholder="85000"
                value={mileage}
                aria-invalid={!!errors.mileage}
                className={errors.mileage ? "border-destructive focus-visible:ring-destructive" : ""}
                onChange={(e) => {
                  setMileage(digitsOnly(e.target.value).slice(0, 7));
                  if (errors.mileage) setErrors((p) => ({ ...p, mileage: "" }));
                }}
              />
              {errors.mileage && <p className="text-xs text-destructive">{errors.mileage}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location">Service address (optional)</Label>
              <Input id="location" placeholder="Fort Myers, FL" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="requested_date">Preferred date (optional)</Label>
              <Input
                id="requested_date"
                type="date"
                value={requestedDate}
                onChange={(e) => setRequestedDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="time_window">Time window (optional)</Label>
              <Select value={timeWindow} onValueChange={setTimeWindow}>
                <SelectTrigger id="time_window"><SelectValue placeholder="Anytime" /></SelectTrigger>
                <SelectContent>
                  {TIME_WINDOWS.map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Symptoms, sounds, when it started…"
              rows={3}
              value={notes}
              aria-invalid={!!errors.notes}
              className={errors.notes ? "border-destructive focus-visible:ring-destructive" : ""}
              onChange={(e) => {
                setNotes(e.target.value);
                if (errors.notes) setErrors((p) => ({ ...p, notes: "" }));
              }}
            />
            {errors.notes && <p className="text-xs text-destructive">{errors.notes}</p>}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button variant="hero" onClick={handleSubmit} disabled={busy} className="gap-2">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarCheck className="w-4 h-4" />}
            Request Service
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuoteRequestDialog;
