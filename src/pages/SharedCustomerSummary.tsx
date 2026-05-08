import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Car, Wrench, User } from 'lucide-react';

export default function SharedCustomerSummary() {
  const { token } = useParams();
  const [data, setData] = useState<any>(null);
  const [status, setStatus] = useState<'loading' | 'ok' | 'invalid'>('loading');

  useEffect(() => {
    (async () => {
      if (!token) return setStatus('invalid');
      const { data, error } = await supabase.rpc('get_shared_customer_summary', { _token: token });
      if (error || !data) return setStatus('invalid');
      setData(data);
      setStatus('ok');
    })();
  }, [token]);

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  }
  if (status === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader><CardTitle>Link expired</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            This share link is no longer valid. Please request a new one.
          </CardContent>
        </Card>
      </div>
    );
  }

  const c = data.customer ?? {};
  const vehicles = data.vehicles ?? [];
  const records = data.service_records ?? [];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> {c.full_name || 'Customer'}</CardTitle>
            {c.email && <p className="text-sm text-muted-foreground">{c.email}</p>}
          </CardHeader>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Car className="h-4 w-4" /> Vehicles</CardTitle></CardHeader>
          <CardContent>
            {vehicles.length === 0 ? (
              <p className="text-sm text-muted-foreground">No vehicles on file.</p>
            ) : (
              <ul className="divide-y">
                {vehicles.map((v: any) => (
                  <li key={v.id} className="py-2 flex justify-between text-sm">
                    <span>{[v.year, v.make, v.model].filter(Boolean).join(' ')}</span>
                    <span className="text-xs text-muted-foreground">
                      {v.license_plate ? `${v.license_plate} · ` : ''}{v.current_mileage ? `${v.current_mileage.toLocaleString()} mi` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Wrench className="h-4 w-4" /> Recent service</CardTitle></CardHeader>
          <CardContent>
            {records.length === 0 ? (
              <p className="text-sm text-muted-foreground">No service records yet.</p>
            ) : (
              <ul className="divide-y">
                {records.map((r: any) => (
                  <li key={r.id} className="py-2 flex justify-between text-sm">
                    <div>
                      <div>{r.service_type}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(r.service_date).toLocaleDateString()}
                        {r.mileage_at_service ? ` · ${Number(r.mileage_at_service).toLocaleString()} mi` : ''}
                      </div>
                    </div>
                    {r.invoice_total != null && <Badge variant="secondary">${Number(r.invoice_total).toFixed(2)}</Badge>}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center">
          Shared securely by MMAR Care · expires {new Date(data.expires_at).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
