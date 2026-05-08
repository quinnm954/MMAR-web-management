import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Wrench, ShieldCheck, HardHat, User as UserIcon, Lock } from "lucide-react";
import Navigation from "@/components/Navigation";

type AccountType = "customer" | "employee" | "admin";

const STAFF_ROLES = ["technician", "service_advisor", "manager", "parts"] as const;

const routeForRoles = (roles: string[]): string => {
  if (roles.includes("admin")) return "/admin/dashboard";
  if (roles.some((r) => (STAFF_ROLES as readonly string[]).includes(r))) return "/tech";
  return "/portal/dashboard";
};

const ACCOUNT_INFO: Record<AccountType, { title: string; desc: string; icon: any }> = {
  customer: {
    title: "Customer",
    desc: "Book service, view invoices, and manage your MMAR Care membership.",
    icon: UserIcon,
  },
  employee: {
    title: "Employee",
    desc: "Technicians, advisors, and shop staff. Accounts are created by an admin.",
    icon: HardHat,
  },
  admin: {
    title: "Admin",
    desc: "Shop owners and managers. Accounts are created by an existing admin.",
    icon: ShieldCheck,
  },
};

const Login = () => {
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState<AccountType>("customer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id);
        const roles = (data ?? []).map((r: any) => r.role as string);
        navigate(routeForRoles(roles), { replace: true });
        return;
      }
      setChecking(false);
    });
  }, [navigate]);

  const validateRoleForType = (roles: string[], type: AccountType): { ok: boolean; reason?: string } => {
    if (type === "admin") {
      return roles.includes("admin")
        ? { ok: true }
        : { ok: false, reason: "This account doesn't have admin access. Ask an existing admin to grant the admin role." };
    }
    if (type === "employee") {
      const hasStaff = roles.some((r) => (STAFF_ROLES as readonly string[]).includes(r)) || roles.includes("admin");
      return hasStaff
        ? { ok: true }
        : { ok: false, reason: "This account isn't set up as an employee. Ask an admin to create your staff account." };
    }
    return { ok: true };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !signInData.user) {
      const msg = error?.message || "Sign in failed";
      if (/confirm/i.test(msg) && accountType === "customer") {
        toast.error("Email not confirmed. Use the resend link below.");
      } else {
        toast.error(msg);
      }
      setLoading(false);
      return;
    }
    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", signInData.user.id);
    const roles = (roleRows ?? []).map((r: any) => r.role as string);

    const check = validateRoleForType(roles, accountType);
    if (!check.ok) {
      await supabase.auth.signOut();
      toast.error(check.reason || "Access denied for this account type");
      setLoading(false);
      return;
    }

    toast.success("Welcome back");
    // Honor the chosen account type when routing
    if (accountType === "admin") navigate("/admin/dashboard", { replace: true });
    else if (accountType === "employee") navigate("/tech", { replace: true });
    else navigate(routeForRoles(roles), { replace: true });
  };

  const handleGoogle = async () => {
    if (accountType !== "customer") {
      toast.error("Google sign-in is for customers only. Employees and admins use email + password.");
      return;
    }
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

  const handleResendConfirmation = async () => {
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

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const info = ACCOUNT_INFO[accountType];
  const Icon = info.icon;
  const restricted = accountType !== "customer";

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-24 pb-12 px-4 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md border-border/50">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Wrench className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Sign in</CardTitle>
            <CardDescription>One portal — choose your account type below.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Account type</Label>
              <Select value={accountType} onValueChange={(v) => setAccountType(v as AccountType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/40 rounded-md p-2">
                <Icon className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{info.desc}</span>
              </div>
            </div>

            {accountType === "customer" && (
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
              </>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
              </div>
              <Button type="submit" variant="hero" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : `Sign in as ${info.title}`}
              </Button>
            </form>

            {accountType === "customer" ? (
              <>
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={loading}
                  className="text-xs text-muted-foreground hover:text-primary underline w-full text-center"
                >
                  Didn't get a confirmation email? Resend it
                </button>
                <p className="text-sm text-center text-muted-foreground">
                  New customer?{" "}
                  <Link to="/portal/signup" className="text-primary font-medium hover:underline">
                    Create an account
                  </Link>
                </p>
              </>
            ) : (
              <div className="text-xs text-muted-foreground bg-muted/40 rounded-md p-3 flex gap-2 items-start">
                <Lock className="h-4 w-4 mt-0.5 shrink-0" />
                <span>
                  {info.title} accounts can't self-register. An admin must create your account and assign the
                  {accountType === "admin" ? " admin " : " employee "} role before you can sign in.
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Login;
