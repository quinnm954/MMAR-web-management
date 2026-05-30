import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Loader2, Wrench } from "lucide-react";
import StepAccount from "@/components/portal/wizard/StepAccount";
import StepVehicle from "@/components/portal/wizard/StepVehicle";
import StepPlan from "@/components/portal/wizard/StepPlan";
import StepAgreement from "@/components/portal/wizard/StepAgreement";
import { portalStrings } from "@/lib/portalStrings";

export interface WizardData {
  vehicle: {
    vin?: string;
    year?: number;
    make?: string;
    model?: string;
    trim?: string;
    engine?: string;
    license_plate?: string;
    color?: string;
    current_mileage?: number;
  };
  vehicleId?: string;
  planId?: string;
  achAuthId?: string;
  membershipId?: string;
}

const STEPS = ["Account", "Vehicle", "Plan", "Agreement"] as const;

const MembershipSignup = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>({ vehicle: {} });

  useEffect(() => {
    document.title = "Join MMAR Care Membership | MMAR";
  }, []);

  // If signed in, skip account step
  useEffect(() => {
    if (!isLoading && user && step === 0) setStep(1);
  }, [user, isLoading, step]);

  // Pre-select plan from query param after plans load (handled in StepPlan)

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, user ? 1 : 0));

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-2xl">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 text-sm text-primary font-semibold mb-2">
              <Wrench className="h-4 w-4" /> {portalStrings.product.membershipBadge}
            </div>
            <h1 className="text-3xl font-bold">Join MMAR</h1>
            <p className="text-muted-foreground">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>
          </div>

          <Progress value={((step + 1) / STEPS.length) * 100} className="mb-6" />

          <Card className="border-border/50">
            <CardContent className="p-6">
              {step === 0 && <StepAccount onComplete={next} />}
              {step === 1 && (
                <StepVehicle
                  data={data}
                  setData={setData}
                  onNext={next}
                  onBack={user ? undefined : back}
                  defaultPlanSlug={params.get("plan")}
                />
              )}
              {step === 2 && (
                <StepPlan
                  data={data}
                  setData={setData}
                  onNext={next}
                  onBack={back}
                  defaultPlanSlug={params.get("plan")}
                />
              )}
              {step === 3 && (
                <StepAgreement
                  data={data}
                  setData={setData}
                  onComplete={() => {
                    toast.success("Membership created! Redirecting to checkout…");
                  }}
                  onBack={back}
                />
              )}
            </CardContent>
          </Card>

          {step > 0 && (
            <div className="text-center mt-4">
              <Button variant="ghost" size="sm" onClick={() => navigate("/mmar-care")}>
                Cancel and view plans
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MembershipSignup;
