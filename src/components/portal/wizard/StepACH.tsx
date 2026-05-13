import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import SignaturePad from "@/components/financing/SignaturePad";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";
import type { WizardData } from "@/pages/portal/MembershipSignup";
import { portalStrings } from "@/lib/portalStrings";

interface Props {
  data: WizardData;
  setData: (d: WizardData) => void;
  onNext: () => void;
  onBack: () => void;
}

const StepACH = ({ data, setData, onNext, onBack }: Props) => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    account_holder_name: "",
    bank_name: "",
    account_number: "",
    routing_number: "",
    authorized_amount: "",
  });
  const [agreed, setAgreed] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const authText = portalStrings.product.achAuthorization;

  const handleSubmit = async () => {
    if (!user) return toast.error("Please sign in");
    if (!form.account_holder_name.trim()) return toast.error("Account holder name required");
    if (!/^\d{4,17}$/.test(form.account_number)) return toast.error("Invalid account number");
    if (!/^\d{9}$/.test(form.routing_number)) return toast.error("Routing number must be 9 digits");
    if (!agreed) return toast.error("Please accept the ACH authorization");
    if (!signature) return toast.error("Please sign to authorize");

    setSaving(true);
    const { data: row, error } = await supabase
      .from("ach_authorizations")
      .insert({
        customer_id: user.id,
        account_holder_name: form.account_holder_name,
        bank_name: form.bank_name || null,
        account_last4: form.account_number.slice(-4),
        routing_last4: form.routing_number.slice(-4),
        authorization_text: authText,
        authorized_amount: form.authorized_amount ? parseFloat(form.authorized_amount) : null,
        signature_image: signature,
        status: "active",
      })
      .select()
      .single();
    setSaving(false);
    if (error || !row) return toast.error(error?.message || "Failed to save authorization");

    setData({ ...data, achAuthId: row.id });
    onNext();
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Payment authorization</h2>
        <p className="text-sm text-muted-foreground">
          We capture your authorization securely. Account numbers are NOT stored — only the last 4 digits.
        </p>
      </div>

      <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 flex gap-2 text-xs">
        <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <span>Your full account/routing numbers are never saved to our database. We only store the last 4 digits for reference.</span>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <div>
          <Label>Account Holder Name *</Label>
          <Input value={form.account_holder_name} onChange={(e) => setForm({ ...form, account_holder_name: e.target.value })} />
        </div>
        <div>
          <Label>Bank Name</Label>
          <Input value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Routing Number *</Label>
            <Input inputMode="numeric" maxLength={9} value={form.routing_number} onChange={(e) => setForm({ ...form, routing_number: e.target.value.replace(/\D/g, "") })} />
          </div>
          <div>
            <Label>Account Number *</Label>
            <Input inputMode="numeric" maxLength={17} value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value.replace(/\D/g, "") })} />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border p-3 text-xs text-muted-foreground max-h-32 overflow-y-auto">
        {authText}
      </div>

      <label className="flex items-start gap-2 cursor-pointer">
        <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(!!v)} className="mt-0.5" />
        <span className="text-sm">I have read and agree to the ACH Authorization above.</span>
      </label>

      <div>
        <Label className="mb-2 block">Sign to authorize</Label>
        <SignaturePad
          onSignatureComplete={setSignature}
          onClear={() => setSignature(null)}
          existingSignature={signature}
          label="Customer Signature"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button variant="hero" className="flex-1" onClick={handleSubmit} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Authorize & Continue"}
        </Button>
      </div>
    </div>
  );
};

export default StepACH;
