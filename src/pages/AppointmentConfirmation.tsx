import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import FloatingCallButton from "@/components/FloatingCallButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Car,
  Wrench,
  MapPin,
  Phone,
  AlertCircle,
} from "lucide-react";

interface Confirmation {
  kind: "appointment" | "booking_request";
  id: string;
  token: string;
  source: string;
  status: string;
  service_type: string | null;
  description: string | null;
  service_address: string | null;
  requested_date: string | null;
  requested_time_window: string | null;
  scheduled_at?: string | null;
  vehicle: string | null;
  customer_name: string | null;
  customer_phone?: string | null;
  created_at: string;
}

const STATUS_LABEL: Record<string, { text: string; tone: string }> = {
  new: { text: "Pending review", tone: "bg-amber-500/15 text-amber-500" },
  requested: { text: "Pending review", tone: "bg-amber-500/15 text-amber-500" },
  contacted: { text: "We've reached out", tone: "bg-accent/20 text-accent-foreground" },
  scheduled: { text: "Confirmed", tone: "bg-emerald-500/15 text-emerald-500" },
  confirmed: { text: "Confirmed", tone: "bg-emerald-500/15 text-emerald-500" },
  in_progress: { text: "In progress", tone: "bg-amber-500/15 text-amber-500" },
  completed: { text: "Completed", tone: "bg-emerald-500/15 text-emerald-500" },
  converted: { text: "Confirmed", tone: "bg-emerald-500/15 text-emerald-500" },
  cancelled: { text: "Cancelled", tone: "bg-muted text-muted-foreground" },
  declined: { text: "Declined", tone: "bg-muted text-muted-foreground" },
  spam: { text: "Closed", tone: "bg-muted text-muted-foreground" },
};

const SOURCE_LABEL: Record<string, string> = {
  google: "Google",
  in_app: "Web booking",
  phone: "Phone",
  sms: "SMS",
  walk_in: "Walk-in",
  other: "Other",
};

const fmtDate = (d?: string | null) => {
  if (!d) return null;
  try {
    return new Date(d.length <= 10 ? `${d}T12:00:00` : d).toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return d;
  }
};

const AppointmentConfirmation = () => {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<Confirmation | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!token) return;
    document.title = "Appointment | MMAR Care";
    (async () => {
      const { data: row, error } = await supabase.rpc("get_appointment_confirmation", { _token: token });
      if (error || !row) {
        setNotFound(true);
      } else {
        setData(row as unknown as Confirmation);
      }
      setLoading(false);
    })();
  }, [token]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-24 pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : notFound || !data ? (
            <Card className="border-border/50">
              <CardContent className="p-10 text-center">
                <AlertCircle className="h-10 w-10 text-muted-foreground/60 mx-auto mb-3" />
                <h1 className="text-xl font-semibold">Appointment not found</h1>
                <p className="text-muted-foreground mt-2">
                  This link may have expired. Call us at{" "}
                  <a className="text-primary font-medium" href="tel:8135017572">813-501-7572</a>{" "}
                  and we'll help.
                </p>
                <Button asChild variant="hero" className="mt-5">
                  <Link to="/book">Book a new appointment</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {(() => {
                const isConfirmed = ["confirmed", "scheduled", "converted", "in_progress", "completed"].includes(data.status);
                const isDeclined = ["declined", "cancelled", "spam"].includes(data.status);
                return (
                  <div className="text-center mb-6">
                    <div className={`inline-flex items-center justify-center w-14 h-14 rounded-full mb-3 ${
                      isConfirmed ? "bg-emerald-500/10" : isDeclined ? "bg-muted" : "bg-amber-500/10"
                    }`}>
                      {isConfirmed ? (
                        <CheckCircle2 className="h-7 w-7 text-emerald-500" />
                      ) : isDeclined ? (
                        <AlertCircle className="h-7 w-7 text-muted-foreground" />
                      ) : (
                        <Clock className="h-7 w-7 text-amber-500" />
                      )}
                    </div>
                    <h1 className="text-3xl font-bold">
                      {isConfirmed ? "You're confirmed" : isDeclined ? "Request closed" : "Request received"}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                      {data.customer_name ? `Thanks, ${data.customer_name}.` : "Thanks!"}{" "}
                      {isConfirmed
                        ? "We'll see you at your scheduled time."
                        : isDeclined
                        ? "Please call us if you'd like to reschedule."
                        : "Our team is verifying your preferred day & time — we'll text you shortly to confirm."}
                    </p>
                  </div>
                );
              })()}

              <Card className="border-border/50">
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CalendarCheck className="h-4 w-4 text-primary" /> Appointment details
                  </CardTitle>
                  <span
                    className={`text-[11px] font-semibold px-2 py-1 rounded-full ${
                      STATUS_LABEL[data.status]?.tone ?? "bg-muted text-muted-foreground"
                    }`}
                  >
                    {STATUS_LABEL[data.status]?.text ?? data.status}
                  </span>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-3 text-sm">
                    <Row icon={<Wrench className="h-4 w-4" />} label="Service">
                      <div>{data.service_type || "—"}</div>
                      {data.description && (
                        <div className="text-muted-foreground text-xs mt-1">{data.description}</div>
                      )}
                    </Row>
                    <Row icon={<Car className="h-4 w-4" />} label="Vehicle">
                      {data.vehicle || "—"}
                    </Row>
                    <Row icon={<CalendarCheck className="h-4 w-4" />} label="Preferred date">
                      {fmtDate(data.requested_date) ?? fmtDate(data.scheduled_at) ?? "We'll reach out to schedule"}
                    </Row>
                    {data.requested_time_window && (
                      <Row icon={<Clock className="h-4 w-4" />} label="Time window">
                        {data.requested_time_window}
                      </Row>
                    )}
                    {data.service_address && (
                      <Row icon={<MapPin className="h-4 w-4" />} label="Address">
                        {data.service_address}
                      </Row>
                    )}
                  </dl>

                  <div className="flex flex-wrap items-center justify-between gap-2 mt-6 pt-4 border-t border-border/40 text-xs text-muted-foreground">
                    <span>Source: {SOURCE_LABEL[data.source] ?? data.source}</span>
                    <span>Ref: {data.token.slice(0, 8).toUpperCase()}</span>
                  </div>
                </CardContent>
              </Card>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button asChild variant="hero" size="lg">
                  <a href="tel:8135017572"><Phone className="h-4 w-4 mr-2" /> Call 813-501-7572</a>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/login?tab=signup">Create an account to track</Link>
                </Button>
              </div>

              <p className="text-center text-xs text-muted-foreground mt-6">
                Bookmark this page — it's your live status link.
              </p>
            </>
          )}
        </div>
      </main>
      <Footer />
      <FloatingCallButton />
    </div>
  );
};

const Row = ({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex gap-3">
    <div className="text-primary mt-0.5">{icon}</div>
    <div className="flex-1 min-w-0">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{children}</dd>
    </div>
  </div>
);

export default AppointmentConfirmation;
