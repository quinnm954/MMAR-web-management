import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Bell, BellOff, BellRing, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { isNative, nativePlatform } from "@/lib/native";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type PushStatus = "granted" | "denied" | "prompt" | "unsupported";

const PushNotificationCard = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<PushStatus>("prompt");
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const native = isNative();

  const refreshStatus = async () => {
    setChecking(true);
    try {
      if (native) {
        const { PushNotifications } = await import("@capacitor/push-notifications");
        const perm = await PushNotifications.checkPermissions();
        if (perm.receive === "granted") setStatus("granted");
        else if (perm.receive === "denied") setStatus("denied");
        else setStatus("prompt");
      } else if (typeof window !== "undefined" && "Notification" in window) {
        const p = Notification.permission;
        setStatus(p === "default" ? "prompt" : (p as PushStatus));
      } else {
        setStatus("unsupported");
      }
    } catch {
      setStatus("unsupported");
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    refreshStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enable = async () => {
    setBusy(true);
    try {
      if (native) {
        const { PushNotifications } = await import("@capacitor/push-notifications");
        let perm = await PushNotifications.checkPermissions();
        if (perm.receive === "prompt" || perm.receive === "prompt-with-rationale") {
          perm = await PushNotifications.requestPermissions();
        }
        if (perm.receive !== "granted") {
          setStatus(perm.receive === "denied" ? "denied" : "prompt");
          toast.error("Push notifications blocked", {
            description: "Enable notifications for Garage Ace in your device settings.",
          });
          return;
        }
        await PushNotifications.register();
        if (user) {
          await supabase.from("notification_preferences").upsert(
            { user_id: user.id, push_enabled: true },
            { onConflict: "user_id" },
          );
        }
        setStatus("granted");
        toast.success("Push notifications enabled", {
          description: "You'll get updates on estimates, repairs and invoices.",
        });
      } else {
        if (!("Notification" in window)) {
          toast.error("Not supported", {
            description: "This browser doesn't support push notifications.",
          });
          setStatus("unsupported");
          return;
        }
        const result = await Notification.requestPermission();
        setStatus(result === "default" ? "prompt" : (result as PushStatus));
        if (result === "granted") {
          if (user) {
            await supabase.from("notification_preferences").upsert(
              { user_id: user.id, push_enabled: true },
              { onConflict: "user_id" },
            );
          }
          toast.success("Notifications enabled");
        } else if (result === "denied") {
          toast.error("Notifications blocked", {
            description: "Allow notifications in your browser settings to re-enable.",
          });
        } else {
          toast("Permission dismissed");
        }
      }
    } catch (err) {
      console.error("Push enable failed", err);
      toast.error("Couldn't enable notifications", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setBusy(false);
    }
  };

  if (status === "unsupported" && !native) return null;

  const StatusBadge = () => {
    if (checking) {
      return (
        <Badge variant="outline" className="gap-1">
          <Loader2 className="h-3 w-3 animate-spin" /> Checking
        </Badge>
      );
    }
    if (status === "granted")
      return (
        <Badge className="gap-1 bg-primary/15 text-primary hover:bg-primary/15 border-primary/30">
          <BellRing className="h-3 w-3" /> Enabled
        </Badge>
      );
    if (status === "denied")
      return (
        <Badge variant="destructive" className="gap-1">
          <BellOff className="h-3 w-3" /> Blocked
        </Badge>
      );
    return (
      <Badge variant="outline" className="gap-1">
        <Bell className="h-3 w-3" /> Not enabled
      </Badge>
    );
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between gap-2 text-base">
          <span className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" /> Push notifications
          </span>
          <StatusBadge />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {status === "granted"
            ? `You're all set${native ? ` on ${nativePlatform()}` : ""}. We'll notify you about estimates, repair updates and invoices.`
            : status === "denied"
              ? native
                ? "Notifications are blocked. Open your device Settings → Garage Ace → Notifications to allow them."
                : "Notifications are blocked in your browser. Allow them in site settings to re-enable."
              : "Get instant updates when an estimate is ready, your repair status changes, or an invoice is sent."}
        </p>
        {status !== "granted" && status !== "denied" && (
          <Button onClick={enable} disabled={busy || checking} className="tap-44 shrink-0">
            {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Bell className="h-4 w-4 mr-2" />}
            Enable
          </Button>
        )}
        {status === "denied" && (
          <Button variant="outline" onClick={refreshStatus} disabled={checking} className="tap-44 shrink-0">
            Re-check
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default PushNotificationCard;
