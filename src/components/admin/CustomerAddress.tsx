import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Addr = { address_line1: string | null; address_line2: string | null; city: string | null; state: string | null; postal_code: string | null };
const cache = new Map<string, string>();
const waiting = new Map<string, ((v: string) => void)[]>();
let queued = new Set<string>();
let timer: ReturnType<typeof setTimeout> | null = null;

export const formatAddress = (p?: Partial<Addr> | null) => {
  if (!p) return "";
  const street = [p.address_line1, p.address_line2].filter(Boolean).join(", ");
  const cityLine = [p.city, [p.state, p.postal_code].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  return [street, cityLine].filter(Boolean).join(", ");
};

/** Batches lookups so long lists make one request. */
function loadAddress(id: string): Promise<string> {
  if (cache.has(id)) return Promise.resolve(cache.get(id)!);
  return new Promise((resolve) => {
    waiting.set(id, [...(waiting.get(id) || []), resolve]);
    queued.add(id);
    if (timer) return;
    timer = setTimeout(async () => {
      const ids = Array.from(queued); queued = new Set(); timer = null;
      const { data } = await supabase.from("profiles").select("id,address_line1,address_line2,city,state,postal_code").in("id", ids);
      const byId = new Map((data || []).map((p: any) => [p.id, formatAddress(p)]));
      ids.forEach((i) => { const v = byId.get(i) || ""; cache.set(i, v); (waiting.get(i) || []).forEach((r) => r(v)); waiting.delete(i); });
    }, 30);
  });
}

export function useCustomerAddress(id?: string | null) {
  const [addr, setAddr] = useState(() => (id && cache.get(id)) || "");
  useEffect(() => { if (!id) { setAddr(""); return; } let on = true; loadAddress(id).then((v) => on && setAddr(v)); return () => { on = false; }; }, [id]);
  return addr;
}

/** Customer's saved address from their file, linked to maps. Renders nothing if none is saved. */
export function CustomerAddress({ customerId, fallback, className = "" }: { customerId?: string | null; fallback?: string | null; className?: string }) {
  const saved = useCustomerAddress(customerId);
  const addr = saved || fallback || "";
  if (!addr) return null;
  return (
    <a href={`https://maps.google.com/?q=${encodeURIComponent(addr)}`} target="_blank" rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={`inline-flex items-start gap-1 text-xs text-muted-foreground hover:text-foreground break-words ${className}`}>
      <MapPin className="h-3 w-3 mt-0.5 shrink-0" /><span>{addr}</span>
    </a>
  );
}
