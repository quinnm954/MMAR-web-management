import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { matchLaborToTotal, type QuoteLine } from '@/lib/competitorQuote';

interface CQ {
  id: string; estimate_id: string | null; image_path: string; source_name: string | null; itemized: boolean;
  line_items: { description: string; kind: string; amount: number }[]; total: number | null; status: string;
  customer_name: string | null; address: string | null; vehicle_year: number | null; vehicle_make: string | null; vehicle_model: string | null;
}

/** Owner-only side-by-side view of a customer's competitor quote. Nothing is sent to the customer. */
export default function CompetitorQuotePanel({ estimateId, customerId, lines, total, onApply }: {
  estimateId?: string; customerId?: string | null; lines: QuoteLine[]; total: number; onApply: (lines: QuoteLine[]) => void;
}) {
  const [quotes, setQuotes] = useState<CQ[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!estimateId && !customerId) { setQuotes([]); return; }
    let q = supabase.from('competitor_quotes').select('*').order('created_at', { ascending: false }).limit(5);
    q = estimateId && customerId ? q.or(`estimate_id.eq.${estimateId},and(customer_id.eq.${customerId},status.eq.pending)`)
      : estimateId ? q.eq('estimate_id', estimateId) : q.eq('customer_id', customerId!).eq('status', 'pending');
    q.then(async ({ data }) => {
      const list = (data ?? []) as unknown as CQ[];
      setQuotes(list);
      const map: Record<string, string> = {};
      for (const c of list) {
        const { data: s } = await supabase.storage.from('sms-media').createSignedUrl(c.image_path, 3600);
        if (s?.signedUrl) map[c.id] = s.signedUrl;
      }
      setUrls(map);
    });
  }, [estimateId, customerId]);

  const setStatus = async (c: CQ, status: string) => {
    const { data: u } = await supabase.auth.getUser();
    await supabase.from('competitor_quotes').update({
      status, estimate_id: estimateId ?? c.estimate_id,
      ...(status === 'matched' ? { matched_by: u.user?.id ?? null, matched_at: new Date().toISOString() } : {}),
    }).eq('id', c.id);
    setQuotes((p) => p.map((x) => (x.id === c.id ? { ...x, status } : x)));
  };

  if (!quotes.length) return null;
  return (
    <div className="space-y-3">
      {quotes.map((c) => {
        const theirs = Number(c.total || 0);
        const diff = total - theirs;
        const matched = c.itemized ? matchLaborToTotal(lines, total, theirs) : null;
        const vehicle = [c.vehicle_year, c.vehicle_make, c.vehicle_model].filter(Boolean).join(' ');
        return (
          <div key={c.id} className="border rounded p-3 bg-muted/30 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">Competitor Quote{c.source_name ? ` · ${c.source_name}` : ''}</span>
              {!c.itemized && <Badge variant="destructive">Needs itemized quote</Badge>}
              <Badge variant="outline" className="capitalize">{c.status}</Badge>
            </div>
            {(c.customer_name || c.address || vehicle) && (
              <p className="text-xs text-muted-foreground">{[c.customer_name, c.address, vehicle].filter(Boolean).join(' · ')}</p>
            )}
            <div className="grid sm:grid-cols-3 gap-3 text-sm">
              {urls[c.id] && <a href={urls[c.id]} target="_blank" rel="noreferrer"><img src={urls[c.id]} alt="Customer's competitor quote" className="rounded border max-h-48 object-contain" /></a>}
              <div>
                <div className="font-medium mb-1">Their lines</div>
                {c.line_items.map((l, i) => <div key={i} className="flex justify-between gap-2"><span>{l.description} <span className="text-muted-foreground">({l.kind})</span></span><span>${Number(l.amount).toFixed(2)}</span></div>)}
                <div className="flex justify-between font-bold border-t mt-1 pt-1"><span>Their total</span><span>${theirs.toFixed(2)}</span></div>
              </div>
              <div>
                <div className="font-medium mb-1">Your lines</div>
                {lines.map((l, i) => <div key={i} className="flex justify-between gap-2"><span>{l.description} <span className="text-muted-foreground">({l.kind ?? 'part'})</span></span><span>${Number(l.amount).toFixed(2)}</span></div>)}
                <div className="flex justify-between font-bold border-t mt-1 pt-1"><span>Your total</span><span>${total.toFixed(2)}</span></div>
                <div className="flex justify-between text-xs"><span>Difference</span><span>{diff >= 0 ? '+' : '-'}${Math.abs(diff).toFixed(2)}</span></div>
              </div>
            </div>
            {c.status === 'pending' && (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" disabled={!matched} onClick={() => { onApply(matched!); setStatus(c, 'matched'); toast.success('Labor adjusted to match. Save, then send when ready.'); }}>
                  Match total
                </Button>
                <Button size="sm" variant="outline" onClick={() => setStatus(c, 'ignored')}>Ignore</Button>
                {!matched && c.itemized && <span className="text-xs text-muted-foreground self-center">{diff <= 0 ? 'Your price is already at or below theirs.' : 'Labor alone cannot cover the gap; parts are never lowered.'}</span>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
