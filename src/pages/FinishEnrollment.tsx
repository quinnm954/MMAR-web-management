import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const FinishEnrollment = () => {
  const { token = "" } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState<"loading" | "ready" | "done" | "invalid">("loading");
  const [msg, setMsg] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.functions.invoke("finish-enrollment", { body: { token, check: true } }).then(({ data, error }) => {
      if (data?.ok) { setName(data.name || ""); setState("ready"); return; }
      let body: any = data;
      const ctx = (error as any)?.context;
      if (ctx?.json) ctx.json().then((b: any) => { setMsg(b?.error || "This link is no longer valid"); setState(b?.done ? "done" : "invalid"); });
      else { setMsg(body?.error || "This link is no longer valid"); setState("invalid"); }
    });
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("Use at least 8 characters");
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("finish-enrollment", { body: { token, email, password, name } });
    if (error || !data?.ok) {
      const b = await (error as any)?.context?.json?.().catch(() => null);
      setBusy(false);
      return toast.error(b?.error || "Could not finish setup");
    }
    const { error: se } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    setBusy(false);
    if (se) { toast.success("Account ready — please sign in"); return navigate("/login"); }
    navigate("/portal/estimates");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Finish setting up your account</CardTitle>
          <CardDescription>Add your email and a password to see your estimate, appointments and service history.</CardDescription>
        </CardHeader>
        <CardContent>
          {state === "loading" && <Loader2 className="h-6 w-6 animate-spin mx-auto" />}
          {(state === "invalid" || state === "done") && (
            <div className="space-y-4 text-center">
              <p className="text-muted-foreground">{msg}</p>
              <div className="flex gap-2 justify-center">
                <Button asChild><Link to="/login">Sign in</Link></Button>
                <Button asChild variant="outline"><Link to={`/estimate/${token}`}>View estimate</Link></Button>
              </div>
            </div>
          )}
          {state === "ready" && (
            <form onSubmit={submit} className="space-y-4">
              <div><Label htmlFor="n">Name</Label><Input id="n" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} /></div>
              <div><Label htmlFor="e">Email</Label><Input id="e" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} /></div>
              <div><Label htmlFor="p">Password</Label><Input id="p" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
              <Button type="submit" className="w-full" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Finish setup</Button>
              <p className="text-sm text-center"><Link className="underline" to={`/estimate/${token}`}>Just view my estimate</Link></p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FinishEnrollment;
