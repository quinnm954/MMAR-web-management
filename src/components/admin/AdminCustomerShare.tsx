import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Share2, User, Car, Wrench, Search, Copy, Link as LinkIcon } from 'lucide-react';

type Customer = { id: string; full_name: string | null; email: string | null };
type Vehicle = { id: string; year: number | null; make: string | null; model: string | null; license_plate: string | null; current_mileage: number | null };
type ServiceRecord = { id: string; service_date: string; service_type: string; mileage_at_service: number | null; invoice_total: number | null };

export default function AdminCustomerShare() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [active, setActive] = useState<Customer | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [creatingShare, setCreatingShare] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name', { ascending: true })
        .limit(500);
      setCustomers(data ?? []);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(c =>
      (c.full_name ?? '').toLowerCase().includes(q) ||
      (c.email ?? '').toLowerCase().includes(q)
    );
  }, [customers, search]);

  const openCustomer = async (c: Customer) => {
    setActive(c);
    setShareUrl(null);
    setLoading(true);
    const [{ data: vs }, { data: rs }] = await Promise.all([
      supabase.from('vehicles').select('id, year, make, model, license_plate, current_mileage').eq('owner_id', c.id).order('created_at', { ascending: false }),
      supabase.from('service_records').select('id, service_date, service_type, mileage_at_service, invoice_total').eq('customer_id', c.id).order('service_date', { ascending: false }).limit(10),
    ]);
    setVehicles(vs ?? []);
    setRecords(rs ?? []);
    setLoading(false);
  };

  const createShare = async () => {
    if (!active) return;
    setCreatingShare(true);
    const { data, error } = await supabase
      .from('customer_shares')
      .insert({ customer_id: active.id })
      .select('token')
      .single();
    setCreatingShare(false);
    if (error || !data) {
      toast.error(error?.message || 'Could not create share link');
      return;
    }
    const url = `${window.location.origin}/share/${data.token}`;
    setShareUrl(url);
    return url;
  };

  const handleShare = async () => {
    const url = shareUrl || (await createShare());
    if (!url || !active) return;
    const title = `${active.full_name ?? 'Customer'} — MMAR Care summary`;
    const text = `${active.full_name ?? 'Customer'} summary from MMAR Care`;
    // Native share sheet (iOS/Android, some desktop browsers)
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      try {
        await (navigator as any).share({ title, text, url });
        return;
      } catch (e: any) {
        if (e?.name === 'AbortError') return;
      }
    }
    // Fallback: copy
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Share link copied to clipboard');
    } catch {
      toast.error('Could not share — copy the link manually');
    }
  };

  const copyLink = async () => {
    const url = shareUrl || (await createShare());
    if (!url) return;
    await navigator.clipboard.writeText(url);
    toast.success('Link copied');
  };

  return (
    <div className="grid md:grid-cols-3 gap-4 h-[600px]">
      <Card className="md:col-span-1 flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><User className="h-4 w-4" /> Customers</CardTitle>
          <div className="relative pt-2">
            <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-8" placeholder="Search by name or email" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-2 space-y-1">
          {filtered.map(c => (
            <button
              key={c.id}
              onClick={() => openCustomer(c)}
              className={`w-full text-left p-2 rounded ${active?.id === c.id ? 'bg-primary/10' : 'hover:bg-muted'}`}
            >
              <div className="font-semibold text-sm truncate">{c.full_name || '(no name)'}</div>
              <div className="text-xs text-muted-foreground truncate">{c.email}</div>
            </button>
          ))}
          {filtered.length === 0 && <p className="text-xs text-muted-foreground p-2">No customers found.</p>}
        </CardContent>
      </Card>

      <Card className="md:col-span-2 flex flex-col">
        {!active ? (
          <CardContent className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a customer to view their summary
          </CardContent>
        ) : (
          <>
            <CardHeader className="pb-2 flex-row items-start justify-between gap-2 space-y-0">
              <div>
                <CardTitle className="text-base">{active.full_name || '(no name)'}</CardTitle>
                <p className="text-xs text-muted-foreground">{active.email}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={copyLink} disabled={creatingShare}>
                  <Copy className="h-4 w-4 mr-1" /> Copy link
                </Button>
                <Button size="sm" onClick={handleShare} disabled={creatingShare}>
                  <Share2 className="h-4 w-4 mr-1" /> Share
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-4">
              {shareUrl && (
                <div className="flex items-center gap-2 rounded border bg-muted/40 px-2 py-1 text-xs">
                  <LinkIcon className="h-3 w-3 text-primary shrink-0" />
                  <span className="truncate font-mono">{shareUrl}</span>
                </div>
              )}

              <section>
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-2"><Car className="h-4 w-4" /> Vehicles</h3>
                {loading ? <p className="text-xs text-muted-foreground">Loading…</p> : vehicles.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No vehicles on file.</p>
                ) : (
                  <ul className="space-y-1">
                    {vehicles.map(v => (
                      <li key={v.id} className="text-sm flex justify-between border-b py-1">
                        <span>{[v.year, v.make, v.model].filter(Boolean).join(' ') || '(unspecified)'}</span>
                        <span className="text-xs text-muted-foreground">
                          {v.license_plate ? `${v.license_plate} · ` : ''}{v.current_mileage ? `${v.current_mileage.toLocaleString()} mi` : ''}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-2"><Wrench className="h-4 w-4" /> Recent service</h3>
                {loading ? <p className="text-xs text-muted-foreground">Loading…</p> : records.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No service records yet.</p>
                ) : (
                  <ul className="space-y-1">
                    {records.map(r => (
                      <li key={r.id} className="text-sm flex justify-between border-b py-1">
                        <div>
                          <div>{r.service_type}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(r.service_date).toLocaleDateString()}
                            {r.mileage_at_service ? ` · ${r.mileage_at_service.toLocaleString()} mi` : ''}
                          </div>
                        </div>
                        {r.invoice_total != null && <Badge variant="secondary">${Number(r.invoice_total).toFixed(2)}</Badge>}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
