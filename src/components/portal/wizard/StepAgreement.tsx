import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import SignaturePad from "@/components/financing/SignaturePad";
import { toast } from "sonner";
import { Loader2, FileText } from "lucide-react";
import type { WizardData } from "@/pages/portal/MembershipSignup";
import { portalStrings } from "@/lib/portalStrings";

interface Plan {
  id: string;
  name: string;
  monthly_price: number;
  deposit_amount: number;
  total_at_signup: number;
  features: string[];
}

interface Props {
  data: WizardData;
  setData: (d: WizardData) => void;
  onComplete: () => void;
  onBack: () => void;
}

const StepAgreement = ({ data, setData, onComplete, onBack }: Props) => {
  const { user } = useAuth();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!data.planId) return;
    supabase
      .from("membership_plans")
      .select("id,name,monthly_price,deposit_amount,total_at_signup,features")
      .eq("id", data.planId)
      .single()
      .then(({ data }) => setPlan(data as Plan));
  }, [data.planId]);

  const handleSubmit = async () => {
    if (!user || !data.planId || !data.vehicleId)
      return toast.error("Missing data — please complete previous steps");
    if (!agreed) return toast.error("Please accept the membership agreement");
    if (!signature) return toast.error("Please sign the agreement");

    setSubmitting(true);
    const today = new Date();
    const startDate = today.toISOString().slice(0, 10);
    const nextBilling = new Date(today);
    nextBilling.setMonth(nextBilling.getMonth() + 1);

    const { data: membership, error } = await supabase
      .from("memberships")
      .insert({
        customer_id: user.id,
        vehicle_id: data.vehicleId,
        plan_id: data.planId,
        ach_authorization_id: data.achAuthId || null,
        status: "pending",
        start_date: startDate,
        next_billing_date: nextBilling.toISOString().slice(0, 10),
        signature_image: signature,
        agreement_signed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error || !membership) {
      setSubmitting(false);
      return toast.error(error?.message || "Failed to create membership");
    }

    setData({ ...data, membershipId: membership.id });

    // Generate PDF in the background
    supabase.functions
      .invoke("generate-membership-agreement", { body: { membership_id: membership.id } })
      .catch((e) => console.error("PDF generation failed", e));

    // Start Stripe Checkout for subscription + deposit
    const { data: checkout, error: cErr } = await supabase.functions.invoke(
      "create-membership-checkout",
      { body: { membership_id: membership.id } }
    );
    if (cErr || !checkout?.url) {
      setSubmitting(false);
      return toast.error(cErr?.message || "Could not start checkout");
    }
    window.location.href = checkout.url;
  };

  if (!plan) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const v = data.vehicle;
  const vehicleStr = `${v.year || ""} ${v.make || ""} ${v.model || ""}${v.trim ? " " + v.trim : ""}`.trim();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" /> Membership Agreement
        </h2>
        <p className="text-sm text-muted-foreground">Review and sign to activate your membership.</p>
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm space-y-3 max-h-72 overflow-y-auto">
        <div>
          <div className="font-semibold mb-1">{portalStrings.product.membershipAgreementTitle}</div>
          <div className="text-xs text-muted-foreground">Mike's Mobile Auto Repair (MMAR) — operated by Capital Services Management, INC.</div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div><span className="text-muted-foreground">Member:</span> {user?.email}</div>
          <div><span className="text-muted-foreground">Vehicle:</span> {vehicleStr}</div>
          <div><span className="text-muted-foreground">Plan:</span> {plan.name}</div>
          <div><span className="text-muted-foreground">Monthly:</span> ${plan.monthly_price.toFixed(2)}</div>
          <div><span className="text-muted-foreground">Deposit:</span> ${plan.deposit_amount.toFixed(2)} (non-refundable)</div>
          <div><span className="text-muted-foreground">Due Today:</span> ${plan.total_at_signup.toFixed(2)}</div>
        </div>

        <ol className="list-decimal pl-5 space-y-1.5 text-xs">
          <li>Membership is tied to one VIN and is non-transferable.</li>
          <li>Recurring monthly billing begins today via the ACH authorization signed in the previous step.</li>
          <li>Services are by appointment, subject to technician availability.</li>
          <li>Oil exceeding included quantity, specialty oils/filters, oversized or diesel vehicles may incur additional charges.</li>
          <li>Membership may be cancelled in writing after 3 months. Outstanding balances for services rendered remain payable.</li>
          <li>Deposit is non-refundable.</li>
          <li>This agreement is governed by the laws of the State of Florida.</li>
        </ol>
      </div>

      <label className="flex items-start gap-2 cursor-pointer">
        <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(!!v)} className="mt-0.5" />
        <span className="text-sm">{portalStrings.product.membershipAgreementConsent}</span>
      </label>

      <div>
        <Label className="mb-2 block">Sign here</Label>
        <SignaturePad
          onSignatureComplete={setSignature}
          onClear={() => setSignature(null)}
          existingSignature={signature}
          label="Member Signature"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={onBack} disabled={submitting}>Back</Button>
        <Button variant="hero" className="flex-1" onClick={handleSubmit} disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Activate Membership"}
        </Button>
      </div>
    </div>
  );
};

export default StepAgreement;
