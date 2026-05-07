import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Download } from 'lucide-react';

export default function AdminQuickBooksExport() {
  const [from, setFrom] = useState(new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10));
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [count, setCount] = useState(0);

  useEffect(() => {
    (async () => {
      const { count: c } = await supabase
        .from('invoices')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', from)
        .lte('created_at', to + 'T23:59:59');
      setCount(c ?? 0);
    })();
  }, [from, to]);

  const exportCsv = async () => {
    const { data, error } = await supabase
      .from('invoices')
      .select('invoice_number, created_at, due_date, total, tax, subtotal, status, paid_at, customer_id, profiles:customer_id(full_name, email)')
      .gte('created_at', from)
      .lte('created_at', to + 'T23:59:59')
      .order('created_at');
    if (error) return toast.error(error.message);

    const headers = ['InvoiceNo', 'Date', 'DueDate', 'Customer', 'Email', 'Subtotal', 'Tax', 'Total', 'Status', 'PaidDate'];
    const rows = (data ?? []).map((i: any) => [
      i.invoice_number || i.id.slice(0, 8),
      i.created_at?.slice(0, 10),
      i.due_date || '',
      (i.profiles?.full_name || '').replace(/,/g, ' '),
      i.profiles?.email || '',
      Number(i.subtotal || 0).toFixed(2),
      Number(i.tax || 0).toFixed(2),
      Number(i.total || 0).toFixed(2),
      i.status,
      i.paid_at?.slice(0, 10) || '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quickbooks-export-${from}_to_${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} invoices`);
  };

  return (
    <Card>
      <CardHeader><CardTitle>QuickBooks / Accounting Export</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Download a CSV of invoices in the date range below. Compatible with QuickBooks Online's invoice import (map columns on upload).
        </p>
        <div className="grid grid-cols-2 gap-3 max-w-md">
          <div><Label>From</Label><Input type="date" value={from} onChange={e => setFrom(e.target.value)} /></div>
          <div><Label>To</Label><Input type="date" value={to} onChange={e => setTo(e.target.value)} /></div>
        </div>
        <p className="text-xs text-muted-foreground">{count} invoices in range</p>
        <Button onClick={exportCsv} disabled={count === 0}>
          <Download className="mr-2 h-4 w-4" /> Download CSV
        </Button>
      </CardContent>
    </Card>
  );
}
