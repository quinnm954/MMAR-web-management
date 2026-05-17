import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
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
  phone: z.string().trim().min(7, "Phone is required").max(25),
  address_line1: z.string().trim().min(2, "Address is required").max(200),
  address_line2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(2, "City is required").max(80),
  state: z.string().trim().min(2, "State is required").max(40),
  postal_code: z.string().trim().min(3, "ZIP is required").max(15),
});

const StepAccount = ({ onComplete }: { onComplete: () => void }) => {
  const { signUp, signIn } = useAuth();
  const [busy, setBusy] = useState(false);
  const [signup, setSignup] = useState({
    fullName: "", email: "", password: "",
    phone: "", address_line1: "", address_line2: "",
    city: "", state: "FL", postal_code: "",
  });
  const [login, setLogin] = useState({ email: "", password: "" });

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signupSchema.safeParse(signup);
    if (!parsed.success) return toast.error(parsed.error.errors[0].message);
    setBusy(true);
    const { error } = await signUp(signup.email, signup.password, signup.fullName);
    if (error) {
      setBusy(false);
      return toast.error(error.message);
    }
    // Persist contact + address on the profile so it's saved cleanly for marketing.
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({
        full_name: signup.fullName,
        phone: signup.phone,
        address_line1: signup.address_line1,
        address_line2: signup.address_line2 || null,
        city: signup.city,
        state: signup.state,
        postal_code: signup.postal_code,
      }).eq("id", user.id);
    }
    setBusy(false);
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

  const set = (k: keyof typeof signup) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setSignup({ ...signup, [k]: e.target.value });

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
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" autoComplete="name" autoCapitalize="words" required value={signup.fullName} onChange={set("fullName")} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="su-email">Email</Label>
                <Input id="su-email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} required value={signup.email} onChange={set("email")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="su-phone">Phone</Label>
                <Input id="su-phone" type="tel" inputMode="tel" autoComplete="tel" required value={signup.phone} onChange={set("phone")} placeholder="(813) 555-0123" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="su-pw">Password (8+ chars)</Label>
              <Input id="su-pw" type="password" autoComplete="new-password" minLength={8} required value={signup.password} onChange={set("password")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="su-addr1">Street Address</Label>
              <Input id="su-addr1" autoComplete="address-line1" required value={signup.address_line1} onChange={set("address_line1")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="su-addr2">Apt / Suite (optional)</Label>
              <Input id="su-addr2" autoComplete="address-line2" value={signup.address_line2} onChange={set("address_line2")} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="su-city">City</Label>
                <Input id="su-city" autoComplete="address-level2" required value={signup.city} onChange={set("city")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="su-state">State</Label>
                <Input id="su-state" autoComplete="address-level1" autoCapitalize="characters" required maxLength={2} value={signup.state} onChange={set("state")} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="su-zip">ZIP</Label>
              <Input id="su-zip" inputMode="numeric" pattern="\d*" autoComplete="postal-code" required value={signup.postal_code} onChange={set("postal_code")} />
            </div>
            <Button type="submit" variant="hero" className="w-full" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue"}
            </Button>
          </form>
        </TabsContent>
        <TabsContent value="login">
          <form onSubmit={handleSignIn} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="li-email">Email</Label>
              <Input id="li-email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} required value={login.email} onChange={(e) => setLogin({ ...login, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="li-pw">Password</Label>
              <Input id="li-pw" type="password" autoComplete="current-password" required value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} />
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
