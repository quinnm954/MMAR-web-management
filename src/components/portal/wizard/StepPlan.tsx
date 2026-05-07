import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Check, Loader2 } from "lucide-react";
import type { WizardData } from "@/pages/portal/MembershipSignup";

interface Plan {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  monthly_price: number;
  deposit_amount: number;
  total_at_signup: number;
  badge: string | null;
  features: string[];
}

interface Props {
  data: WizardData;
  setData: (d: WizardData) => void;
  onNext: () => void;
  onBack: () => void;
  defaultPlanSlug?: string | null;
}

const StepPlan = ({ data, setData, onNext, onBack, defaultPlanSlug }: Props) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selected, setSelected] = useState<string | undefined>(data.planId);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("membership_plans")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => {
        const list = (data as Plan[]) ?? [];
        setPlans(list);
        if (!selected && defaultPlanSlug) {
          const match = list.find((p) => p.slug === defaultPlanSlug);
          if (match) setSelected(match.id);
        }
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultPlanSlug]);

  const handleNext = () => {
    if (!selected) return;
    setData({ ...data, planId: selected });
    onNext();
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Choose your membership plan</h2>
        <p className="text-sm text-muted-foreground">All plans include mobile service in Fort Myers & Lehigh Acres.</p>
      </div>

      <div className="grid gap-3">
        {plans.map((plan) => {
          const isSelected = selected === plan.id;
          return (
            <Card
              key={plan.id}
              onClick={() => setSelected(plan.id)}
              className={`p-4 cursor-pointer transition-all ${
                isSelected ? "border-primary ring-2 ring-primary/30" : "border-border/50 hover:border-primary/40"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold">{plan.name}</h3>
                    {plan.badge && <Badge className="bg-accent text-accent-foreground text-xs">{plan.badge}</Badge>}
                  </div>
                  {plan.tagline && <p className="text-xs text-muted-foreground">{plan.tagline}</p>}
                  <ul className="mt-2 space-y-1">
                    {plan.features.slice(0, 4).map((f, i) => (
                      <li key={i} className="text-xs flex gap-1.5">
                        <Check className="h-3 w-3 text-primary shrink-0 mt-0.5" /> {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-2xl font-bold">${plan.monthly_price}</div>
                  <div className="text-xs text-muted-foreground">/mo</div>
                  <div className="text-xs mt-2">Today: <span className="font-semibold">${plan.total_at_signup.toFixed(2)}</span></div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button variant="hero" className="flex-1" disabled={!selected} onClick={handleNext}>
          Continue to Payment
        </Button>
      </div>
    </div>
  );
};

export default StepPlan;
