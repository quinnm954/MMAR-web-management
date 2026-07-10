import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Download, Share2, Plus, Smartphone, Sparkles, Check } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const LOCAL_KEY = "ga_pwa_tutorial_seen";

const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia?.("(display-mode: standalone)").matches ||
    // @ts-expect-error iOS Safari
    window.navigator.standalone === true);

type Platform = "ios" | "android-chrome" | "desktop" | "other";

const detectPlatform = (): Platform => {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android-chrome";
  if (/Windows|Macintosh|Linux/.test(ua)) return "desktop";
  return "other";
};

const PwaInstallTutorial = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const platform = useMemo(detectPlatform, []);

  // Capture the install prompt if available (Chromium)
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Decide whether to show
  useEffect(() => {
    if (!user) return;
    if (isStandalone()) {
      // Silently mark seen so we never show later
      markSeen(user.id, true);
      return;
    }
    try {
      if (localStorage.getItem(LOCAL_KEY)) return;
    } catch {}

    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("pwa_tutorial_seen_at")
        .eq("id", user.id)
        .maybeSingle();
      if (!data || !(data as any).pwa_tutorial_seen_at) {
        // Small delay so it doesn't feel jarring on first load
        setTimeout(() => setOpen(true), 700);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const markSeen = async (uid: string, silent = false) => {
    try {
      localStorage.setItem(LOCAL_KEY, String(Date.now()));
    } catch {}
    await supabase
      .from("profiles")
      .update({ pwa_tutorial_seen_at: new Date().toISOString() } as any)
      .eq("id", uid);
    if (!silent) setOpen(false);
  };

  const handleClose = () => {
    if (user) markSeen(user.id);
    else setOpen(false);
  };

  const handleInstall = async () => {
    if (!prompt) return;
    await prompt.prompt();
    const choice = await prompt.userChoice;
    setPrompt(null);
    if (choice.outcome === "accepted") {
      toast.success("Installed! Look for Garage Ace on your home screen.");
      if (user) markSeen(user.id);
    }
  };

  const steps = useMemo(() => {
    const welcome = {
      icon: <Sparkles className="h-10 w-10 text-primary" />,
      title: "Welcome to Garage Ace",
      body: (
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            Install Garage Ace on your phone to get a one-tap app icon, faster loading, and push
            reminders for appointments, estimates, and invoices.
          </p>
          <ul className="space-y-1.5">
            <li className="flex gap-2"><Check className="h-4 w-4 text-primary mt-0.5" /> Instant access from your home screen</li>
            <li className="flex gap-2"><Check className="h-4 w-4 text-primary mt-0.5" /> Real-time updates from your shop</li>
            <li className="flex gap-2"><Check className="h-4 w-4 text-primary mt-0.5" /> Full-screen, app-like experience</li>
          </ul>
        </div>
      ),
    };

    if (platform === "ios") {
      return [
        welcome,
        {
          icon: <Share2 className="h-10 w-10 text-primary" />,
          title: "Tap the Share button",
          body: (
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>In Safari, tap the <strong>Share</strong> icon at the bottom of the screen — it looks like a square with an arrow pointing up.</p>
              <div className="rounded-md border border-border bg-muted/30 p-3 text-xs">
                If you don't see it, make sure you opened this page in <strong>Safari</strong> (not inside Instagram, Facebook, or Gmail).
              </div>
            </div>
          ),
        },
        {
          icon: <Plus className="h-10 w-10 text-primary" />,
          title: "Add to Home Screen",
          body: (
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>Scroll the share sheet and tap <strong>Add to Home Screen</strong>, then tap <strong>Add</strong> in the top-right corner.</p>
              <p>The Garage Ace icon will appear on your home screen — tap it any time to open the app.</p>
            </div>
          ),
        },
      ];
    }

    if (platform === "android-chrome" || platform === "desktop") {
      const installStep = prompt
        ? {
            icon: <Download className="h-10 w-10 text-primary" />,
            title: "One-tap install",
            body: (
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>Your browser can install Garage Ace right now — just tap the button below.</p>
                <Button onClick={handleInstall} className="w-full" variant="hero" size="lg">
                  <Download className="h-4 w-4 mr-2" /> Install Garage Ace
                </Button>
                <p className="text-xs">You'll see a confirmation from your browser. Tap <strong>Install</strong>.</p>
              </div>
            ),
          }
        : {
            icon: <Smartphone className="h-10 w-10 text-primary" />,
            title: "Install from the browser menu",
            body: (
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>Tap the menu icon (<strong>⋮</strong>) in the top-right of your browser.</p>
                <p>Then tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.</p>
              </div>
            ),
          };

      return [
        welcome,
        installStep,
        {
          icon: <Check className="h-10 w-10 text-primary" />,
          title: "You're all set",
          body: (
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>Open Garage Ace from your home screen any time. Signed-in and ready to go.</p>
              <p className="text-xs">You can always reinstall later from the Install App page in your portal.</p>
            </div>
          ),
        },
      ];
    }

    return [
      welcome,
      {
        icon: <Smartphone className="h-10 w-10 text-primary" />,
        title: "Open in your main browser",
        body: (
          <p className="text-sm text-muted-foreground">
            To install the app, open this page in <strong>Chrome</strong> (Android) or <strong>Safari</strong> (iPhone), then use the browser's Install / Add to Home Screen option.
          </p>
        ),
      },
    ];
  }, [platform, prompt]);

  const current = steps[Math.min(step, steps.length - 1)];
  const isLast = step >= steps.length - 1;

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : handleClose())}>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center text-center pt-2">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            {current.icon}
          </div>
          <DialogTitle className="text-xl">{current.title}</DialogTitle>
          <DialogDescription className="sr-only">Guide to installing Garage Ace as an app</DialogDescription>
          <div className="mt-3 w-full text-left">{current.body}</div>

          <div className="flex items-center gap-1.5 mt-5">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"}`}
              />
            ))}
          </div>

          <div className="flex gap-2 w-full mt-5">
            <Button variant="ghost" size="sm" onClick={handleClose} className="flex-1">
              Skip for now
            </Button>
            {step > 0 && (
              <Button variant="outline" size="sm" onClick={() => setStep((s) => s - 1)} className="flex-1">
                Back
              </Button>
            )}
            {!isLast ? (
              <Button size="sm" onClick={() => setStep((s) => s + 1)} className="flex-1" variant="hero">
                Next
              </Button>
            ) : (
              <Button size="sm" onClick={handleClose} className="flex-1" variant="hero">
                Done
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PwaInstallTutorial;
