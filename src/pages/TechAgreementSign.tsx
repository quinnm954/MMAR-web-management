import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Printer, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import SignaturePad from "@/components/financing/SignaturePad";
import TechAgreementDocument, { TechAgreementRecord } from "@/components/TechAgreementDocument";
import { INITIAL_LABELS } from "@/lib/techAgreement";

export default function TechAgreementSign() {
  const { token = "" } = useParams();
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const ret = sp.get("return");
  const [a, setA] = useState<TechAgreementRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [initials, setInitials] = useState<Record<string, string>>({});
  const [name, setName] = useState("");
  const [sig, setSig] = useState<string | null>(null);
  const [agree, setAgree] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase.rpc("get_technician_agreement", { _token: token });
    setA((data as unknown as TechAgreementRecord) ?? null);
    setLoading(false);
  };
  useEffect(() => {
    document.title = "Technician Agreement | MMAR";
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const keys = Object.keys(INITIAL_LABELS);
  const ready = keys.every((k) => (initials[k] || "").trim().length >= 2) && name.trim() && sig && agree;

  const submit = async () => {
    if (!ready) return;
    setSaving(true);
    const { error } = await supabase.rpc("sign_technician_agreement", {
      _token: token,
      _signed_name: name.trim(),
      _signature: sig!,
      _initials: Object.fromEntries(keys.map((k) => [k, initials[k].trim().toUpperCase()])),
      _user_agent: navigator.userAgent,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Signed. Thank you!");
    load();
  };

  if (loading) return <div className="min-h-screen grid place-items-center"><Loader2 className="animate-spin" /></div>;
  if (!a) return <div className="min-h-screen grid place-items-center p-6 text-center">This agreement link is invalid or has been removed.</div>;

  const signed = !!a.tech_signed_at;

  return (
    <main className="min-h-screen bg-background py-6 px-3 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-4">
        {!signed && ret && (
          <div className="rounded-lg border border-accent/40 bg-accent/10 p-3 text-sm print:hidden">Before using the technician app, please review and sign your agreement below.</div>
        )}
        {signed && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-primary/40 bg-primary/10 p-3 print:hidden">
            <span className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-primary" /> You signed this agreement. <a href="/install" className="underline text-primary">Add the app to your phone</a></span>
            <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4 mr-1" /> Save PDF</Button>{ret && ret.startsWith("/tech") && <Button size="sm" onClick={() => nav(ret, { replace: true })}>Continue to app</Button>}</div>
          </div>
        )}
        <TechAgreementDocument
          a={a}
          initialsSlot={
            signed
              ? undefined
              : (k) => (
                  <Input
                    aria-label={`Initials: ${INITIAL_LABELS[k]}`}
                    value={initials[k] || ""}
                    maxLength={4}
                    onChange={(e) => setInitials((p) => ({ ...p, [k]: e.target.value }))}
                    className="w-20 h-8 uppercase"
                    placeholder="AB"
                  />
                )
          }
        />
        {!signed && (
          <div className="rounded-lg border border-border bg-card p-4 space-y-4 print:hidden">
            <h2 className="font-semibold">Sign electronically</h2>
            <div className="space-y-1">
              <Label htmlFor="signed-name">Full legal name</Label>
              <Input id="signed-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={a.tech_name} />
            </div>
            <SignaturePad width={300} height={130} label="Draw your signature, then tap Accept & Sign" existingSignature={sig} onSignatureComplete={setSig} onClear={() => setSig(null)} />
            <label className="flex items-start gap-2 text-sm">
              <Checkbox checked={agree} onCheckedChange={(v) => setAgree(!!v)} className="mt-0.5" />
              I have read this agreement, agree to its terms, and agree to sign electronically.
            </label>
            <Button className="w-full" disabled={!ready || saving} onClick={submit}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Sign agreement
            </Button>
            {!ready && <p className="text-xs text-muted-foreground">Initial all {keys.length} sections, enter your name, sign, and check the box.</p>}
          </div>
        )}
      </div>
    </main>
  );
}
