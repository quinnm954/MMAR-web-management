import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Bell, BellOff, BellRing, Loader2, Settings, Smartphone, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { isNative, nativePlatform } from "@/lib/native";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type PushStatus = "granted" | "denied" | "prompt" | "unsupported";

const isIosUA = () =>
  typeof navigator !== "undefined" &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && (navigator as Navigator & { maxTouchPoints?: number }).maxTouchPoints! > 1));

const isStandalonePWA = () =>
  typeof window !== "undefined" &&
  (window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true);

const PushNotificationCard = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<PushStatus>("prompt");
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const native = isNative();
  const platform = useMemo(() => nativePlatform(), []);
  const isIos = native ? platform === "ios" : isIosUA();
  const installedPwa = isStandalonePWA();
  // iOS Safari requires the site to be installed to the Home Screen before
  // Notification.permission can ever become "granted" (iOS 16.4+).
  const iosWebNeedsInstall = !native && isIos && !installedPwa;


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

  // Hide the card entirely once notifications are enabled.
  if ((status as PushStatus) === "granted") return null;
  if ((status as PushStatus) === "unsupported" && !native) return null;

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

  const openNativeSettings = async () => {
    try {
      if (isIos) {
        // iOS: app-settings: deep-links straight to this app's Settings page.
        window.location.href = "app-settings:";
      } else {
        // Android fallback: jump to the app's settings page.
        window.location.href = "package:app.lovable.6370c0499e634e0c894716857b255272";
      }
    } catch (err) {
      console.error("openNativeSettings failed", err);
      toast.error("Couldn't open Settings", {
        description: isIos
          ? "Open the Settings app, then tap Garage Ace → Notifications."
          : "Open Settings → Apps → Garage Ace → Notifications.",
      });
    }
  };


  const description = (() => {
    if (status === "granted") {
      return `You're all set${native ? ` on ${platform}` : ""}. We'll notify you about estimates, repair updates and invoices.`;
    }
    if (status === "denied") {
      if (native && isIos) {
        return "Notifications are off for Garage Ace. Tap Open Settings, then turn on Allow Notifications.";
      }
      if (native) {
        return "Notifications are off. Tap Open Settings, then enable notifications for Garage Ace.";
      }
      if (isIos) {
        return "Notifications are blocked in Safari. Open Settings → Safari → Advanced → Website Data is not enough — you'll need to install this site to your Home Screen first, then re-enable here.";
      }
      return "Notifications are blocked in your browser. Allow them in site settings (lock icon → Notifications → Allow) and re-check.";
    }
    if (iosWebNeedsInstall) {
      return "On iPhone, push notifications only work after you add Garage Ace to your Home Screen. Tap How to install, then come back here to enable.";
    }
    return "Get instant updates when an estimate is ready, your repair status changes, or an invoice is sent.";
  })();

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
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">{description}</p>

        {isIos && status !== "granted" && (
          <div className="rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
            <div className="font-medium text-foreground flex items-center gap-1.5">
              <Smartphone className="h-3.5 w-3.5" /> iPhone &amp; iPad steps
            </div>
            {native ? (
              <ol className="list-decimal pl-4 space-y-0.5">
                <li>Tap <span className="font-medium">Open Settings</span> below.</li>
                <li>Tap <span className="font-medium">Notifications</span>.</li>
                <li>Turn on <span className="font-medium">Allow Notifications</span> (Banners, Sounds, Badges).</li>
                <li>Return here and tap <span className="font-medium">Re-check</span>.</li>
              </ol>
            ) : iosWebNeedsInstall ? (
              <ol className="list-decimal pl-4 space-y-0.5">
                <li>Tap the <span className="font-medium">Share</span> icon in Safari.</li>
                <li>Choose <span className="font-medium">Add to Home Screen</span>.</li>
                <li>Open Garage Ace from your Home Screen.</li>
                <li>Come back to this card and tap <span className="font-medium">Enable</span>.</li>
              </ol>
            ) : (
              <ol className="list-decimal pl-4 space-y-0.5">
                <li>Open <span className="font-medium">Settings → Notifications</span>.</li>
                <li>Find <span className="font-medium">Garage Ace</span> and turn on Allow Notifications.</li>
                <li>Return here and tap <span className="font-medium">Re-check</span>.</li>
              </ol>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {status !== "granted" && status !== "denied" && !iosWebNeedsInstall && (
            <Button onClick={enable} disabled={busy || checking} className="tap-44">
              {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Bell className="h-4 w-4 mr-2" />}
              Enable
            </Button>
          )}
          {iosWebNeedsInstall && (
            <Button asChild className="tap-44">
              <Link to="/install">
                <Smartphone className="h-4 w-4 mr-2" /> How to install
              </Link>
            </Button>
          )}
          {status === "denied" && native && (
            <Button onClick={openNativeSettings} className="tap-44">
              <Settings className="h-4 w-4 mr-2" /> Open Settings
            </Button>
          )}
          {status === "denied" && !native && isIos && !installedPwa && (
            <Button asChild className="tap-44">
              <Link to="/install">
                <Smartphone className="h-4 w-4 mr-2" /> How to install
              </Link>
            </Button>
          )}
          {status === "denied" && !native && (!isIos || installedPwa) && (
            <Button asChild variant="outline" className="tap-44">
              <a href="https://support.google.com/chrome/answer/3220216" target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" /> Browser help
              </a>
            </Button>
          )}
          {(status === "denied" || status === "granted") && (
            <Button variant="outline" onClick={refreshStatus} disabled={checking} className="tap-44">
              Re-check
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PushNotificationCard;

