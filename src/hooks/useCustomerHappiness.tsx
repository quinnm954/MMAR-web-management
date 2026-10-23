import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { happinessClass, happinessFor, indexHappiness, type HappinessRow } from "@/lib/customerHappiness";
import { cn } from "@/lib/utils";

let cache: ReturnType<typeof indexHappiness> | null = null;
let pending: Promise<void> | null = null;
const listeners = new Set<() => void>();

function load() {
  if (!pending) {
    pending = (async () => {
      // Server returns rows only for admins; everyone else gets an empty list (default colors).
      const { data } = await (supabase.rpc as any)("customer_happiness");
      cache = indexHappiness((data ?? []) as HappinessRow[]);
      listeners.forEach(l => l());
    })();
  }
  return pending;
}

export function useCustomerHappiness() {
  const [, tick] = useState(0);
  useEffect(() => {
    const l = () => tick(n => n + 1);
    listeners.add(l);
    load();
    return () => { listeners.delete(l); };
  }, []);
  return (id?: string | null, phone?: string | null) => (cache ? happinessClass(happinessFor(cache, id, phone)) : "");
}

export function CustomerName({ id, phone, children, className }: { id?: string | null; phone?: string | null; children: React.ReactNode; className?: string }) {
  const cls = useCustomerHappiness();
  return <span className={cn(className, cls(id, phone))}>{children}</span>;
}
