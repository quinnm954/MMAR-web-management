import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Wrench, ArrowLeft } from "lucide-react";
import { z } from "zod";

const signupSchema = z.object({
  fullName: z.string().trim().min(2, "Name is too short").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  phone: z.string().trim().max(40).optional(),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

const Login = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { signIn, signUp, user, roles, isAdmin, isStaff, isLoading, isPasswordRecovery } = useAuth();

  const [tab, setTab] = useState<"signin" | "signup">(
    params.get("tab") === "signup" ? "signup" : "signin"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const [signupForm, setSignupForm] = useState({ fullName: "", email: "", phone: "", password: "" });

  // Route based on role once authenticated
  useEffect(() => {
    if (isLoading || !user) return;
    if (isPasswordRecovery) {
      navigate("/set-password", { replace: true });
      return;
    }
    const explicit = params.get("redirect");
    const isExplicitPortalRedirect = explicit?.startsWith("/portal") ?? false;
    let target: string;
    if (explicit && !(isExplicitPortalRedirect && (isAdmin || isStaff))) {
      target = explicit;
    } else if (isAdmin) {
      target = "/admin/dashboard";
    } else if (isStaff) {
      // technician (or other non-admin staff)
      target = "/tech";
    } else {
      target = "/portal/dashboard";
    }
    try {
      const stored = sessionStorage.getItem("postLoginRedirect");
      if (stored) {
        // Ignore a stale portal redirect for admin/staff — they belong in admin/tech.
        const isPortalRedirect = stored.startsWith("/portal");
        if (!(isPortalRedirect && (isAdmin || isStaff))) {
          target = stored;
        }
        sessionStorage.removeItem("postLoginRedirect");
      }
    } catch {}
    navigate(target, { replace: true });
  }, [user, roles, isAdmin, isStaff, isLoading, isPasswordRecovery, navigate, params]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await signIn(email, password);
    setBusy(false);
    if (error) {
      toast.error(error.message || "Sign in failed");
    } else {
      toast.success("Welcome back");
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signupSchema.safeParse(signupForm);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setBusy(true);
    const { error } = await signUp(parsed.data.email, parsed.data.password, parsed.data.fullName);
    if (!error && parsed.data.phone) {
      // Best-effort: store phone on the profile after signup
      try {
        const { data: { user: authedUser } } = await supabase.auth.getUser();
        if (authedUser) {
          await supabase.from("profiles").update({ phone: parsed.data.phone }).eq("id", authedUser.id);
        }
      } catch {}
    }
    setBusy(false);
    if (error) {
      toast.error(error.message || "Sign up failed");
      return;
    }
    toast.success("Account created — check your email to confirm.");
    setTab("signin");
    setEmail(parsed.data.email);
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Enter your email above first");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/set-password",
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Password reset email sent. Check your inbox.");
  };

  const handleGoogle = async () => {
    setBusy(true);
    const explicit = params.get("redirect");
    try { if (explicit) sessionStorage.setItem("postLoginRedirect", explicit); } catch {}
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed");
      setBusy(false);
    }
  };

  if (isLoading && !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Link
        to="/"
        className="absolute top-4 left-4 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>

      <Card className="w-full max-w-md border-border/50">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Wrench className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Garage Ace</CardTitle>
          <CardDescription>Sign in or create your free account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4 pt-4">
              <Button onClick={handleGoogle} disabled={busy} variant="outline" className="w-full">
                Continue with Google
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or email</span>
                </div>
              </div>
              <form onSubmit={handleSignIn} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input id="signin-email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input id="signin-password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button type="submit" variant="hero" className="w-full" disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
                </Button>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={busy}
                  className="text-xs text-primary hover:underline w-full text-center"
                >
                  Forgot password?
                </button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 pt-4">
              <Button onClick={handleGoogle} disabled={busy} variant="outline" className="w-full">
                Sign up with Google
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or email</span>
                </div>
              </div>
              <form onSubmit={handleSignUp} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input id="signup-name" autoComplete="name" autoCapitalize="words" required value={signupForm.fullName} onChange={(e) => setSignupForm({ ...signupForm, fullName: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} required value={signupForm.email} onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-phone">Phone (optional)</Label>
                  <Input id="signup-phone" type="tel" inputMode="tel" autoComplete="tel" value={signupForm.phone} onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input id="signup-password" type="password" autoComplete="new-password" required minLength={8} value={signupForm.password} onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })} />
                </div>
                <Button type="submit" variant="hero" className="w-full" disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
                </Button>
              </form>
              <p className="text-xs text-muted-foreground text-center">
                Customer signup only. Staff accounts are created by an admin.
              </p>
            </TabsContent>
          </Tabs>
          <p className="text-xs text-center text-muted-foreground pt-2">
            New here?{" "}
            <Link to="/why-garage-ace" className="text-primary hover:underline">
              Why do I need this app?
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
