import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Smartphone, X } from "lucide-react";
import { Link } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "ga_install_banner_dismissed_at";
const DISMISS_DAYS = 14;

const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia?.("(display-mode: standalone)").matches ||
    // @ts-expect-error iOS Safari
    window.navigator.standalone === true);

const isIos = () =>
  typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);

const recentlyDismissed = () => {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    return Date.now() - ts < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
};

/**
 * Small banner that appears inside the portal/admin/tech shell on mobile,
 * inviting the user to install Garage Ace as a PWA.
 * - Android/Desktop Chrome: native install via `beforeinstallprompt`.
 * - iOS Safari: links to the /install page with Add-to-Home-Screen steps.
 */
const InstallAppBanner = () => {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setShow(false));

    // iOS never fires beforeinstallprompt — show a hint instead.
    if (isIos()) {
      setIosHint(true);
      setShow(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {}
    setShow(false);
  };

  const install = async () => {
    if (!prompt) return;
    await prompt.prompt();
    await prompt.userChoice;
    setPrompt(null);
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="md:hidden mx-3 mt-3 mb-2 rounded-xl border border-primary/30 bg-primary/10 p-3 flex items-center gap-3 shadow-sm">
      <div className="h-9 w-9 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
        <Smartphone className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold leading-tight">Install Garage Ace</div>
        <div className="text-[11px] text-muted-foreground leading-tight">
          {iosHint ? "Add to Home Screen for quick access" : "One-tap from your home screen"}
        </div>
      </div>
      {iosHint ? (
        <Button asChild size="sm" variant="hero" className="h-8 px-3 gap-1">
          <Link to="/install">How</Link>
        </Button>
      ) : (
        <Button size="sm" variant="hero" className="h-8 px-3 gap-1" onClick={install}>
          <Download className="h-3.5 w-3.5" /> Install
        </Button>
      )}
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="h-7 w-7 -mr-1 rounded-md hover:bg-foreground/10 flex items-center justify-center text-muted-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default InstallAppBanner;
