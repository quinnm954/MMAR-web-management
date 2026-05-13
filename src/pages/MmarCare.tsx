import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import {
  Wrench,
  ShieldCheck,
  CalendarCheck,
  CarFront,
  ClipboardList,
  CreditCard,
  Loader2,
  ArrowRight,
  Phone,
  Sparkles,
} from "lucide-react";
import mmarLogo from "@/assets/mmar-logo.jpeg";

const FEATURES = [
  {
    icon: CarFront,
    title: "Your Vehicles, Always Up to Date",
    text: "Track every vehicle in your household — service history, mileage, recommended maintenance, and warranty details all in one place.",
  },
  {
    icon: CalendarCheck,
    title: "Effortless Scheduling",
    text: "Request appointments and pick a time window that fits your day. Members get priority booking.",
  },
  {
    icon: ClipboardList,
    title: "Estimates, Inspections & Repair Orders",
    text: "Review and approve estimates, see digital inspection photos, and follow your repair order from drop-off to paid invoice.",
  },
  {
    icon: CreditCard,
    title: "Invoices & Financing in One Place",
    text: "Pay invoices online, view receipts, and manage in-house financing or your monthly membership — no paper, no phone tag.",
  },
  {
    icon: ShieldCheck,
    title: "Warranty & Records on Demand",
    text: "Magnuson-Moss warranty coverage and service records you can pull up any time — perfect for resale or trade-in.",
  },
  {
    icon: Sparkles,
    title: "Member Perks",
    text: "Discounted labor, included oil changes on select plans, and special pricing on tires, brakes, and seasonal services.",
  },
];

const STEPS = [
  { n: "1", title: "Create Your Account", text: "Sign up in under a minute — just an email and password." },
  { n: "2", title: "Add Your Vehicle(s)", text: "Tell us about each vehicle. We'll start your service file." },
  { n: "3", title: "Book or Join a Plan", text: "Request a one-off service or activate an MMAR Care membership." },
  { n: "4", title: "Stay in the Loop", text: "Track repairs, approve estimates, and pay invoices from any device." },
];

const MmarCare = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    document.title = "MMAR Care Portal — Mobile Mechanic Customer Hub | Mike's Mobile Auto Repair";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        "content",
        "MMAR Care is the customer portal for Mike's Mobile Auto Repair. Sign in to manage vehicles, approve estimates, pay invoices, and run your membership in Fort Myers & Lehigh Acres."
      );
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate("/portal/dashboard", { replace: true });
        return;
      }
      setChecking(false);
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      toast.error(error?.message || "Sign in failed");
      setLoading(false);
      return;
    }
    toast.success("Welcome back to Garage Ace");
    navigate("/portal/dashboard", { replace: true });
  };

  const handleGoogle = async () => {
    setLoading(true);
    try { sessionStorage.setItem("postLoginRedirect", "/portal/dashboard"); } catch {}
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed");
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) { toast.error("Enter your email first"); return; }
    setLoading(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: window.location.origin + "/portal/dashboard" },
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Confirmation email sent. Check your inbox.");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="pt-20 lg:pt-24">
        {/* Hero + Login */}
        <section className="relative px-4 py-12 lg:py-20 overflow-hidden">
          <div
            className="absolute inset-0 bg-gradient-to-br from-primary/15 via-background to-accent/10"
            aria-hidden
          />
          <div className="container mx-auto max-w-6xl relative grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Left: Pitch */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img src={mmarLogo} alt="MMAR" className="h-12 w-auto rounded shadow-md" />
                <Badge variant="outline" className="border-primary/30 text-primary">
                  MMAR Care Portal
                </Badge>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-5">
                Your Vehicles.{" "}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  One Smart Hub.
                </span>
              </h1>
              <p className="text-lg text-muted-foreground mb-6 max-w-xl">
                MMAR Care is the customer portal for Mike's Mobile Auto Repair. Manage your
                vehicles, approve estimates, pay invoices, and run your membership — all from
                your phone.
              </p>
              <div className="flex flex-wrap gap-3 mb-6">
                <Button variant="hero" size="lg" asChild>
                  <Link to="/login?tab=signup">
                    Create Free Account <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/memberships">Explore Memberships</Link>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                Prefer to talk?{" "}
                <a href="tel:8135017572" className="text-primary font-medium hover:underline">
                  (813) 501-7572
                </a>
              </p>
            </div>

            {/* Right: Login card */}
            <Card className="border-border/60 shadow-xl">
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <Wrench className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">Sign in to MMAR Care</CardTitle>
                <CardDescription>Customer portal access</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {checking ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    <Button onClick={handleGoogle} disabled={loading} variant="outline" className="w-full">
                      Continue with Google
                    </Button>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">or email</span>
                      </div>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-3">
                      <div>
                        <Label htmlFor="mc-email">Email</Label>
                        <Input id="mc-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                      </div>
                      <div>
                        <Label htmlFor="mc-password">Password</Label>
                        <Input id="mc-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
                      </div>
                      <Button type="submit" variant="hero" className="w-full" disabled={loading}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
                      </Button>
                    </form>
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={loading}
                      className="text-xs text-muted-foreground hover:text-primary underline w-full text-center"
                    >
                      Didn't get a confirmation email? Resend it
                    </button>
                    <p className="text-sm text-center text-muted-foreground">
                      New here?{" "}
                      <Link to="/login?tab=signup" className="text-primary font-medium hover:underline">
                        Create an account
                      </Link>
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* What you get */}
        <section className="px-4 py-16 lg:py-20">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-3 border-accent/40 text-accent">
                What's inside MMAR Care
              </Badge>
              <h2 className="text-3xl lg:text-4xl font-bold mb-3">Everything your car needs, in one app</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                MMAR Care is included free with every service. Membership unlocks priority scheduling and discounts.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <Card key={title} className="border-border/60 hover:border-primary/40 transition-colors">
                  <CardHeader>
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{text}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="px-4 py-16 lg:py-20 bg-muted/30">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold mb-3">How MMAR Care works</h2>
              <p className="text-muted-foreground">Up and running in minutes — no app store needed.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {STEPS.map((s) => (
                <div key={s.n} className="relative bg-card border border-border rounded-xl p-5">
                  <div className="absolute -top-3 -left-3 w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground font-bold flex items-center justify-center shadow-lg">
                    {s.n}
                  </div>
                  <h3 className="font-semibold mb-1 mt-1">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-4 py-16 lg:py-20">
          <div className="container mx-auto max-w-4xl">
            <div className="bg-gradient-to-br from-primary/15 via-card to-accent/10 border border-border rounded-2xl p-8 lg:p-12 text-center">
              <h2 className="text-3xl lg:text-4xl font-bold mb-3">Ready to take control of your car care?</h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Create a free MMAR Care account in under a minute. No credit card required to sign up.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button variant="hero" size="lg" asChild>
                  <Link to="/login?tab=signup">
                    Create Free Account <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/memberships">View Membership Plans</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default MmarCare;
