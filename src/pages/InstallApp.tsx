import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import FloatingCallButton from "@/components/FloatingCallButton";
import { Button } from "@/components/ui/button";
import { Smartphone, Share, Plus, Download, Phone, MessageCircle, CheckCircle2 } from "lucide-react";
import { useSeo } from "@/lib/useSeo";
import { trackConversion } from "@/lib/gtag";

const SITE = "https://mikesmautorepair.com";

type Platform = "ios" | "android" | "desktop";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const detectPlatform = (): Platform => {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "desktop";
};

const InstallApp = () => {
  useSeo({
    title: "Install the Mike's Auto App | Add to Home Screen",
    description:
      "Install Mike's Mobile Auto Repair to your phone's home screen. Fast access to call or text Mike — no app store required.",
    canonical: `${SITE}/install`,
  });

  const [platform, setPlatform] = useState<Platform>("desktop");
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform());

    const isStandalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      // @ts-expect-error iOS Safari
      window.navigator.standalone === true;
    if (isStandalone) setInstalled(true);

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setInstalled(true));
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setInstallPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-12 md:py-16 max-w-3xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 mb-4">
            <Smartphone className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl tracking-wide mb-3">
            <span className="text-sky">INSTALL THE</span>{" "}
            <span className="text-gold">MIKE'S AUTO APP</span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
            Add Mike's to your home screen — one tap to call or text, no app store needed.
          </p>
        </div>

        {installed && (
          <div className="glass-card border border-primary/30 rounded-xl p-5 mb-8 flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
            <div>
              <p className="font-semibold text-foreground">App installed</p>
              <p className="text-sm text-muted-foreground">
                Look for the Mike's Auto icon on your home screen.
              </p>
            </div>
          </div>
        )}

        {/* Android one-tap install */}
        {installPrompt && !installed && (
          <div className="glass-card border border-primary/30 rounded-xl p-6 mb-8 text-center">
            <p className="text-foreground mb-4 font-medium">
              Your browser can install the app right now:
            </p>
            <Button variant="hero" size="lg" onClick={handleInstall} className="gap-2">
              <Download className="w-5 h-5" /> Install Mike's Auto
            </Button>
          </div>
        )}

        {/* iOS instructions */}
        <section
          className={`glass-card rounded-xl p-6 md:p-8 mb-6 border ${platform === "ios" ? "border-gold/40" : "border-border"}`}
        >
          <h2 className="font-display text-2xl tracking-wide mb-4 text-gold">
            iPhone & iPad
          </h2>
          <ol className="space-y-4 text-foreground">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/15 text-primary font-semibold text-sm flex items-center justify-center">1</span>
              <span>Open this page in <strong>Safari</strong> (not Chrome).</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/15 text-primary font-semibold text-sm flex items-center justify-center">2</span>
              <span className="flex items-center gap-2 flex-wrap">
                Tap the <Share className="inline w-4 h-4" /> <strong>Share</strong> button at the bottom of the screen.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/15 text-primary font-semibold text-sm flex items-center justify-center">3</span>
              <span className="flex items-center gap-2 flex-wrap">
                Scroll down and tap <Plus className="inline w-4 h-4" /> <strong>Add to Home Screen</strong>.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/15 text-primary font-semibold text-sm flex items-center justify-center">4</span>
              <span>Tap <strong>Add</strong>. The Mike's Auto icon appears on your home screen.</span>
            </li>
          </ol>
        </section>

        {/* Android instructions */}
        <section
          className={`glass-card rounded-xl p-6 md:p-8 mb-6 border ${platform === "android" ? "border-gold/40" : "border-border"}`}
        >
          <h2 className="font-display text-2xl tracking-wide mb-4 text-gold">
            Android
          </h2>
          <ol className="space-y-4 text-foreground">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/15 text-primary font-semibold text-sm flex items-center justify-center">1</span>
              <span>Open this page in <strong>Chrome</strong>.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/15 text-primary font-semibold text-sm flex items-center justify-center">2</span>
              <span>Tap the <strong>⋮ menu</strong> in the top right.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/15 text-primary font-semibold text-sm flex items-center justify-center">3</span>
              <span>Tap <strong>Install app</strong> (or <strong>Add to Home screen</strong>).</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/15 text-primary font-semibold text-sm flex items-center justify-center">4</span>
              <span>Confirm <strong>Install</strong>. The Mike's Auto icon appears on your home screen.</span>
            </li>
          </ol>
        </section>

        <section className="glass-card border border-primary/20 rounded-xl p-6 text-center">
          <h2 className="font-display text-xl tracking-wide mb-3 text-sky">
            PREFER TO JUST CALL OR TEXT?
          </h2>
          <p className="text-muted-foreground text-sm mb-5">
            You don't have to install anything to reach Mike.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="hero" size="lg" asChild>
              <a href="tel:8135017572" onClick={() => trackConversion("phone_call")}>
                <Phone className="w-5 h-5 mr-2" /> Call (813) 501-7572
              </a>
            </Button>
            <Button variant="heroOutline" size="lg" asChild>
              <a href="sms:8135017572" onClick={() => trackConversion("text_click")}>
                <MessageCircle className="w-5 h-5 mr-2" /> Text for Quote
              </a>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
      <FloatingCallButton />
    </div>
  );
};

export default InstallApp;
