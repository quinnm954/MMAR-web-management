import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Bell, Loader2, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import PushNotificationCard from "@/components/shell/PushNotificationCard";

type Prefs = {
  push_enabled: boolean;
  sms_enabled: boolean;
  email_enabled: boolean;
  appointment_reminders: boolean;
  estimate_updates: boolean;
  invoice_updates: boolean;
  inspection_updates: boolean;
  repair_order_updates: boolean;
  membership_updates: boolean;
  marketing_updates: boolean;
};

const DEFAULTS: Prefs = {
  push_enabled: true,
  sms_enabled: true,
  email_enabled: true,
  appointment_reminders: true,
  estimate_updates: true,
  invoice_updates: true,
  inspection_updates: true,
  repair_order_updates: true,
  membership_updates: true,
  marketing_updates: false,
};

const CHANNELS: { key: keyof Prefs; label: string; description: string }[] = [
  { key: "push_enabled", label: "Push notifications", description: "Real-time alerts on this device." },
  { key: "sms_enabled", label: "Text messages (SMS)", description: "Reminders and updates to your phone." },
  { key: "email_enabled", label: "Email", description: "Receipts, estimates and important notices." },
];

const CATEGORIES: { key: keyof Prefs; label: string; description: string }[] = [
  { key: "appointment_reminders", label: "Appointment reminders", description: "Upcoming visits, confirmations and changes." },
  { key: "estimate_updates", label: "Estimate updates", description: "When a new estimate is ready or approved." },
  { key: "inspection_updates", label: "Inspection updates", description: "When a digital inspection is published." },
  { key: "repair_order_updates", label: "Repair order updates", description: "Status changes on active jobs." },
  { key: "invoice_updates", label: "Invoice updates", description: "New invoices, payments and receipts." },
  { key: "membership_updates", label: "Membership & billing", description: "Plan changes, renewals and payment events." },
  { key: "marketing_updates", label: "News & promotions", description: "Occasional tips, offers and shop news." },
];

const NotificationSettings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<keyof Prefs | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) {
        console.error(error);
        toast.error("Couldn't load your preferences");
      } else if (data) {
        setPrefs({ ...DEFAULTS, ...(data as Partial<Prefs>) });
      }
      setLoading(false);
    })();
  }, [user]);

  const update = async (key: keyof Prefs, value: boolean) => {
    if (!user) return;
    const prev = prefs[key];
    setPrefs((p) => ({ ...p, [key]: value }));
    setSaving(key);
    const { error } = await supabase
      .from("notification_preferences")
      .upsert(
        { user_id: user.id, ...prefs, [key]: value },
        { onConflict: "user_id" },
      );
    setSaving(null);
    if (error) {
      setPrefs((p) => ({ ...p, [key]: prev }));
      toast.error("Couldn't save preference", { description: error.message });
    }
  };

  return (
    <div className="min-h-screen bg-background safe-pt safe-pb">
      <div className="container mx-auto px-4 py-6 max-w-2xl space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="-ml-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>

        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Notification settings</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Choose how and when Garage Ace contacts you. Changes save automatically.
        </p>

        <PushNotificationCard />

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Channels</CardTitle>
                <CardDescription>Master switches for each delivery method.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1">
                {CHANNELS.map((c, i) => (
                  <div key={c.key}>
                    {i > 0 && <Separator className="my-2" />}
                    <div className="flex items-start justify-between gap-4 py-2">
                      <div className="min-w-0">
                        <div className="font-medium text-sm">{c.label}</div>
                        <div className="text-xs text-muted-foreground">{c.description}</div>
                      </div>
                      <Switch
                        checked={prefs[c.key] as boolean}
                        disabled={saving === c.key}
                        onCheckedChange={(v) => update(c.key, v)}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">What to notify me about</CardTitle>
                <CardDescription>Toggle individual notification types on or off.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1">
                {CATEGORIES.map((c, i) => (
                  <div key={c.key}>
                    {i > 0 && <Separator className="my-2" />}
                    <div className="flex items-start justify-between gap-4 py-2">
                      <div className="min-w-0">
                        <div className="font-medium text-sm">{c.label}</div>
                        <div className="text-xs text-muted-foreground">{c.description}</div>
                      </div>
                      <Switch
                        checked={prefs[c.key] as boolean}
                        disabled={saving === c.key}
                        onCheckedChange={(v) => update(c.key, v)}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <p className="text-xs text-muted-foreground">
              Critical account and security messages may still be sent regardless of these settings.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationSettings;
