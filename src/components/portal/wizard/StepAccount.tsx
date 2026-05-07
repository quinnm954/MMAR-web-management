import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { z } from "zod";

const signupSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
});

const StepAccount = ({ onComplete }: { onComplete: () => void }) => {
  const { signUp, signIn } = useAuth();
  const [busy, setBusy] = useState(false);
  const [signup, setSignup] = useState({ fullName: "", email: "", password: "" });
  const [login, setLogin] = useState({ email: "", password: "" });

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signupSchema.safeParse(signup);
    if (!parsed.success) return toast.error(parsed.error.errors[0].message);
    setBusy(true);
    const { error } = await signUp(signup.email, signup.password, signup.fullName);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Account created — continuing…");
    onComplete();
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await signIn(login.email, login.password);
    setBusy(false);
    if (error) return toast.error(error.message);
    onComplete();
  };

  const handleGoogle = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/portal/membership-signup",
    });
    if (result.error) {
      toast.error("Google sign-in failed");
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Create your account</h2>
        <p className="text-sm text-muted-foreground">We'll save your vehicle, plan, and service history here.</p>
      </div>

      <Button onClick={handleGoogle} variant="outline" className="w-full" disabled={busy}>
        Continue with Google
      </Button>

      <div className="relative my-2">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">or</span>
        </div>
      </div>

      <Tabs defaultValue="signup">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
          <TabsTrigger value="login">Sign In</TabsTrigger>
        </TabsList>
        <TabsContent value="signup">
          <form onSubmit={handleSignUp} className="space-y-3">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" required value={signup.fullName} onChange={(e) => setSignup({ ...signup, fullName: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="su-email">Email</Label>
              <Input id="su-email" type="email" required value={signup.email} onChange={(e) => setSignup({ ...signup, email: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="su-pw">Password (8+ chars)</Label>
              <Input id="su-pw" type="password" minLength={8} required value={signup.password} onChange={(e) => setSignup({ ...signup, password: e.target.value })} />
            </div>
            <Button type="submit" variant="hero" className="w-full" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue"}
            </Button>
          </form>
        </TabsContent>
        <TabsContent value="login">
          <form onSubmit={handleSignIn} className="space-y-3">
            <div>
              <Label htmlFor="li-email">Email</Label>
              <Input id="li-email" type="email" required value={login.email} onChange={(e) => setLogin({ ...login, email: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="li-pw">Password</Label>
              <Input id="li-pw" type="password" required value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} />
            </div>
            <Button type="submit" variant="hero" className="w-full" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In & Continue"}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StepAccount;
