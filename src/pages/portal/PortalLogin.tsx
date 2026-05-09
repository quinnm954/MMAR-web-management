import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Wrench } from "lucide-react";
import Navigation from "@/components/Navigation";

const PortalLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const { signIn, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get("redirect") || "/portal/dashboard";

  useEffect(() => {
    if (!isLoading && user) {
      let target = redirect;
      try {
        const stored = sessionStorage.getItem("postLoginRedirect");
        if (stored) {
          target = stored;
          sessionStorage.removeItem("postLoginRedirect");
        }
      } catch {}
      navigate(target, { replace: true });
    }
  }, [user, isLoading, navigate, redirect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await signIn(email, password);
    setBusy(false);
    if (error) {
      const msg = error.message || "";
      if (/confirm/i.test(msg)) {
        toast.error("Email not confirmed. Check your inbox or resend the confirmation below.");
      } else {
        toast.error(msg);
      }
    } else {
      toast.success("Welcome back");
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Enter your email above first");
      return;
    }
    setBusy(true);
    const { error } = await (await import("@/integrations/supabase/client")).supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/set-password",
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Password reset email sent. Check your inbox.");
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      toast.error("Enter your email first");
      return;
    }
    setBusy(true);
    const { error } = await (await import("@/integrations/supabase/client")).supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: window.location.origin + "/portal/dashboard" },
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Confirmation email sent. Check your inbox.");
  };

  const handleGoogle = async () => {
    setBusy(true);
    try { sessionStorage.setItem("postLoginRedirect", redirect); } catch {}
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed");
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-24 pb-12 px-4 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md border-border/50">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Wrench className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">MMAR Care Portal</CardTitle>
            <CardDescription>Sign in to your MMAR account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleGoogle} disabled={busy} variant="outline" className="w-full">
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
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button type="submit" variant="hero" className="w-full" disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
              </Button>
            </form>
            <button
              type="button"
              onClick={handleResendConfirmation}
              disabled={busy}
              className="text-xs text-muted-foreground hover:text-primary underline w-full text-center"
            >
              Didn't get a confirmation email? Resend it
            </button>
            <p className="text-sm text-center text-muted-foreground">
              New to MMAR?{" "}
              <Link to="/portal/signup" className="text-primary font-medium hover:underline">
                Create an account
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PortalLogin;
