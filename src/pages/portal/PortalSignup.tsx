import { useState } from "react";
import { Link } from "react-router-dom";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Wrench, MailCheck } from "lucide-react";
import Navigation from "@/components/Navigation";
import { z } from "zod";

const schema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
});

const PortalSignup = () => {
  const [form, setForm] = useState({ fullName: "", email: "" });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setBusy(true);
    // Passwordless signup: send a magic link. The user sets a password after first login.
    const { error } = await supabase.auth.signInWithOtp({
      email: form.email,
      options: {
        emailRedirectTo: `${window.location.origin}/portal/dashboard`,
        shouldCreateUser: true,
        data: {
          full_name: form.fullName,
          must_set_password: true,
        },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    toast.success("Check your email for a sign-in link");
  };

  const handleGoogle = async () => {
    setBusy(true);
    try { sessionStorage.setItem("postLoginRedirect", "/portal/dashboard"); } catch {}
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-up failed");
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
            <CardTitle className="text-2xl">Create your account</CardTitle>
            <CardDescription>
              Join MMAR Care — no password needed to sign up. We'll email you a secure link, and you'll set a password on your first sign-in.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sent ? (
              <div className="text-center space-y-3 py-6">
                <div className="mx-auto w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <MailCheck className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-semibold">Check your inbox</h3>
                <p className="text-sm text-muted-foreground">
                  We sent a sign-in link to <span className="font-medium text-foreground">{form.email}</span>. Open it to finish creating your account — you'll choose a password after the first sign-in.
                </p>
                <Button variant="outline" onClick={() => setSent(false)} className="w-full">
                  Use a different email
                </Button>
              </div>
            ) : (
              <>
                <Button onClick={handleGoogle} disabled={busy} variant="outline" className="w-full">
                  Continue with Google
                </Button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">or</span>
                  </div>
                </div>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <Button type="submit" variant="hero" className="w-full" disabled={busy}>
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Email me a sign-in link"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    You'll set your password after clicking the link.
                  </p>
                </form>
              </>
            )}
            <p className="text-sm text-center text-muted-foreground">
              Already have an account?{" "}
              <Link to="/portal/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PortalSignup;
