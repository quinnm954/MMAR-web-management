import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sparkles, Pencil, Check, X, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const fmt = (n: number) =>
  n.toLocaleString(undefined, { style: "currency", currency: "USD", minimumFractionDigits: 2 });

const AiCreditsBar = () => {
  const [budget, setBudget] = useState<number>(10);
  const [used, setUsed] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("10");

  const load = async () => {
    setLoading(true);
    const { data: settings } = await supabase
      .from("shop_settings")
      .select("ai_budget_usd")
      .eq("id", 1)
      .maybeSingle();
    const b = Number((settings as any)?.ai_budget_usd ?? 10);
    setBudget(b);
    setDraft(String(b));

    const { data: rows } = await supabase
      .from("ai_usage_log")
      .select("cost_usd, created_at")
      .gte("created_at", new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).toISOString());
    const total = (rows || []).reduce((s: number, r: any) => s + Number(r.cost_usd || 0), 0);
    setUsed(total);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    const v = Number(draft);
    if (!isFinite(v) || v <= 0) {
      toast.error("Enter a positive dollar amount");
      return;
    }
    const { error } = await supabase.from("shop_settings").update({ ai_budget_usd: v }).eq("id", 1);
    if (error) return toast.error(error.message);
    setBudget(v);
    setEditing(false);
    toast.success("Budget updated");
  };

  const remaining = Math.max(budget - used, 0);
  const pctUsed = budget > 0 ? Math.min((used / budget) * 100, 100) : 0;
  const pctLeft = 100 - pctUsed;
  const tone = pctLeft < 10 ? "text-destructive" : pctLeft < 25 ? "text-accent" : "text-primary";

  return (
    <div className="rounded-lg border bg-card p-3 sm:p-4 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="h-4 w-4 text-primary" />
          AI credits this month
        </div>
        <div className="flex items-center gap-1">
          {editing ? (
            <>
              <span className="text-xs text-muted-foreground">$</span>
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="h-7 w-20 text-sm"
                inputMode="decimal"
              />
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={save}>
                <Check className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditing(false); setDraft(String(budget)); }}>
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              >
                Budget {fmt(budget)} <Pencil className="h-3 w-3" />
              </button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={load}
                disabled={loading}
                aria-label="Refresh balance"
                title="Refresh balance after topping up"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </>
          )}
        </div>
      </div>
      <Progress value={pctUsed} className="h-2" />
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {loading ? "Loading…" : `${fmt(used)} used · ${fmt(remaining)} left`}
        </span>
        <span className={`font-semibold ${tone}`}>{pctLeft.toFixed(1)}% left</span>
      </div>
    </div>
  );
};

export default AiCreditsBar;
