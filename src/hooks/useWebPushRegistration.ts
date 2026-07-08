import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { VAPID_PUBLIC_KEY } from "@/lib/webPushConfig";

const SW_PATH = "/sw.js";

// Skip in Lovable preview/dev — service workers must not run there per project rules.
function isRegistrationAllowed(): boolean {
  try {
    if (typeof window === "undefined") return false;
    if (!("serviceWorker" in navigator)) return false;
    if (!("PushManager" in window)) return false;
    if (!("Notification" in window)) return false;

    const host = window.location.hostname;
    if (window.self !== window.top) return false; // inside an iframe
    if (host.startsWith("id-preview--") || host.startsWith("preview--")) return false;
    if (host === "lovableproject.com" || host.endsWith(".lovableproject.com")) return false;
    if (host === "lovableproject-dev.com" || host.endsWith(".lovableproject-dev.com")) return false;
    if (host === "beta.lovable.dev" || host.endsWith(".beta.lovable.dev")) return false;
    if (new URLSearchParams(window.location.search).has("sw") === false) {
      // allow ?sw=off to force-disable
      if (new URLSearchParams(window.location.search).get("sw") === "off") return false;
    }
    return true;
  } catch {
    return false;
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const b64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function bufToBase64Url(buf: ArrayBuffer | null): string {
  if (!buf) return "";
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function subscribeUser(userId: string): Promise<void> {
  const reg = await navigator.serviceWorker.register(SW_PATH, { scope: "/" });
  await navigator.serviceWorker.ready;

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
    });
  }

  const json = sub.toJSON();
  const endpoint = json.endpoint ?? sub.endpoint;
  const p256dh = json.keys?.p256dh ?? bufToBase64Url(sub.getKey("p256dh"));
  const auth = json.keys?.auth ?? bufToBase64Url(sub.getKey("auth"));
  if (!endpoint || !p256dh || !auth) return;

  await supabase
    .from("web_push_subscriptions" as any)
    .upsert(
      {
        user_id: userId,
        endpoint,
        p256dh,
        auth,
        user_agent: navigator.userAgent.slice(0, 500),
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" },
    );
}

/**
 * Register the push service worker and store the user's push subscription so
 * background pushes can deliver banner + badge updates even when the app is
 * closed. Runs after notification permission is granted.
 */
export function useWebPushRegistration() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    if (!isRegistrationAllowed()) return;

    let cancelled = false;

    const tryRegister = async () => {
      try {
        const perm = (window as any).Notification?.permission;
        if (perm !== "granted") return; // handled by useAppBadgeSync gesture prompt
        if (cancelled) return;
        await subscribeUser(user.id);
      } catch (err) {
        console.debug("[webPush] subscription failed", err);
      }
    };

    // First attempt now.
    void tryRegister();

    // Also retry on the first user gesture (iOS grants permission then).
    const onGesture = () => {
      void tryRegister();
    };
    window.addEventListener("pointerdown", onGesture, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener("pointerdown", onGesture);
    };
  }, [user]);
}
