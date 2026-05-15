import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Gauge, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MileageUpdate = () => {
  const { token = "" } = useParams<{ token: string }>();
  const [miles, setMiles] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(miles);
    if (!n || n <= 0) {
      toast.error("Please enter a valid mileage");
      return;
    }
    setSubmitting(true);
    setError(null);
    const { data, error: invErr } = await supabase.functions.invoke("record-mileage-from-token", {
      body: { token, miles: Math.floor(n) },
    });
    setSubmitting(false);
    if (invErr || (data as any)?.error) {
      const msg = (data as any)?.error || invErr?.message || "Could not save your reading";
      setError(msg);
      toast.error(msg);
      return;
    }
    setDone(true);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            {done ? (
              <CheckCircle2 className="h-6 w-6 text-primary" />
            ) : (
              <Gauge className="h-6 w-6 text-primary" />
            )}
          </div>
          <CardTitle>{done ? "Thanks — got it!" : "Update your mileage"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {done ? (
            <>
              <p className="text-center text-sm text-muted-foreground">
                Your service reminders are now tuned to your actual driving.
              </p>
              <Button asChild className="w-full">
                <Link to="/portal/dashboard">Go to your portal</Link>
              </Button>
            </>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="miles">Current odometer reading</Label>
                <Input
                  id="miles"
                  type="text"
                  inputMode="numeric"
                  placeholder="e.g. 47200"
                  value={miles}
                  onChange={(e) => setMiles(e.target.value.replace(/[^\d]/g, ""))}
                  autoFocus
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={submitting || !miles}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save reading
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                We use this to time maintenance reminders. No spam.
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MileageUpdate;
