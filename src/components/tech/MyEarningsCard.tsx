import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign } from "lucide-react";

type Earn = { rate: number; hours: number; pay: number; jobs: { id: string; date: string; service: string; hours: number; pay: number }[] };
const iso = (d: Date) => d.toISOString().slice(0, 10);
const ranges = {
  week: () => { const d = new Date(); const day = d.getDay(); d.setDate(d.getDate() + ((day === 0 ? -6 : 1) - day)); return d; },
  month: () => { const d = new Date(); d.setDate(1); return d; },
};

export default function MyEarningsCard() {
  const [range, setRange] = useState<keyof typeof ranges>("week");
  const [data, setData] = useState<Earn | null>(null);

  useEffect(() => {
    supabase.rpc("my_tech_earnings" as any, { _from: iso(ranges[range]()), _to: iso(new Date()) })
      .then(({ data }) => setData((data as unknown as Earn) ?? null));
  }, [range]);

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2"><DollarSign className="h-4 w-4 text-primary" /> My labor & pay</h2>
          <div className="flex gap-1">
            <Button size="sm" variant={range === "week" ? "default" : "outline"} onClick={() => setRange("week")}>Week</Button>
            <Button size="sm" variant={range === "month" ? "default" : "outline"} onClick={() => setRange("month")}>Month</Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md bg-muted p-3"><p className="text-xs text-muted-foreground">Labor hours</p><p className="text-xl font-bold">{Number(data?.hours ?? 0).toFixed(1)}</p></div>
          <div className="rounded-md bg-muted p-3"><p className="text-xs text-muted-foreground">Accrued pay</p><p className="text-xl font-bold">${Number(data?.pay ?? 0).toFixed(2)}</p></div>
        </div>
        <p className="text-xs text-muted-foreground">Completed jobs at ${Number(data?.rate ?? 40).toFixed(2)}/labor hr.</p>
        {!!data?.jobs?.length && (
          <ul className="divide-y text-sm">
            {data.jobs.map((j) => (
              <li key={j.id} className="py-2 flex justify-between gap-2">
                <span className="truncate">{new Date(j.date).toLocaleDateString()} · {j.service}</span>
                <span className="shrink-0">{Number(j.hours).toFixed(1)}h · ${Number(j.pay).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
