import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, MessageSquare, ClipboardList, Megaphone } from "lucide-react";

type Row = { id: string; event_type: string; from_google_ad: boolean; page_path: string | null; utm_campaign: string | null; created_at: string };

const LABEL: Record<string, string> = { phone_call: "Call tap", text_click: "Text tap", quote_submit: "Quote request", lead: "Booking lead" };
const ICON: Record<string, typeof Phone> = { phone_call: Phone, text_click: MessageSquare, quote_submit: ClipboardList, lead: ClipboardList };

export default function AdConversionsCard() {
  const [rows, setRows] = useState<Row[]>([]);
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  useEffect(() => {
    const since = new Date(Date.now() - 30 * 864e5).toISOString();
    supabase.from("ad_conversion_events" as never).select("*").gte("created_at", since).order("created_at", { ascending: false }).limit(500)
      .then(({ data }) => setRows((data as unknown as Row[]) ?? []));
    supabase.from("booking_requests").select("source, gclid, utm_source, utm_medium, converted_appointment_id, appointments:converted_appointment_id(status)")
      .gte("created_at", since).limit(1000)
      .then(({ data }) => setQuotes(((data ?? []) as unknown as (QuoteRow & { appointments: { status: string } | null })[])
        .map((q) => ({ ...q, appointment_status: q.appointments?.status ?? null }))));
  }, []);
  const funnel = quoteFunnel(quotes);
  const pct = (f: Funnel) => (f.rate === null ? "—" : `${Math.round(f.rate * 100)}%`);
  const funnelStat = (label: string, f: Funnel) => (
    <div className="rounded-lg border border-border/50 p-3">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm"><span className="font-semibold text-foreground">{f.quotes}</span> quote requests → <span className="font-semibold text-foreground">{f.confirmed}</span> booked · <span className="font-semibold text-accent">{pct(f)}</span></p>
    </div>
  );
  const ads = rows.filter((r) => r.from_google_ad);
  const count = (list: Row[], t: string) => list.filter((r) => r.event_type === t).length;
  const stat = (label: string, list: Row[]) => (
    <div className="rounded-lg border border-border/50 p-3">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm"><span className="font-semibold text-foreground">{count(list, "phone_call")}</span> calls · <span className="font-semibold text-foreground">{count(list, "quote_submit")}</span> quotes · <span className="font-semibold text-foreground">{count(list, "text_click")}</span> texts</p>
    </div>
  );
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2"><Megaphone className="w-5 h-5 text-primary" /> Website calls &amp; quote requests (30 days)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          {stat("From Google ads", ads)}
          {stat("All website visitors", rows)}
        </div>
        <ul className="divide-y divide-border/40 max-h-64 overflow-y-auto">
          {rows.slice(0, 30).map((r) => {
            const Icon = ICON[r.event_type] ?? Phone;
            return (
              <li key={r.id} className="py-2 flex items-center gap-2 text-sm">
                <Icon className="w-4 h-4 text-primary shrink-0" />
                <span className="font-medium">{LABEL[r.event_type] ?? r.event_type}</span>
                {r.from_google_ad && <span className="text-xs px-1.5 py-0.5 rounded bg-accent/20 text-accent">Google ad</span>}
                <span className="text-muted-foreground truncate flex-1">{r.page_path}</span>
                <span className="text-xs text-muted-foreground shrink-0">{new Date(r.created_at).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
              </li>
            );
          })}
          {rows.length === 0 && <li className="py-3 text-sm text-muted-foreground">No call or quote taps yet.</li>}
        </ul>
      </CardContent>
    </Card>
  );
}
