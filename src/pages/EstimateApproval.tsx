import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const EstimateApproval = () => {
  const { token } = useParams();
  const [est, setEst] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState('');
  const [working, setWorking] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('estimates').select('*').eq('approval_token', token).maybeSingle();
      setEst(data);
      setLoading(false);
    })();
  }, [token]);

  const approve = async () => {
    setWorking(true);
    const { error } = await supabase.from('estimates').update({ status: 'approved', approved_at: new Date().toISOString() }).eq('id', est.id);
    setWorking(false);
    if (error) return toast.error('Could not approve. Please contact us.');
    setEst({ ...est, status: 'approved' });
    toast.success('Estimate approved!');
  };

  const decline = async () => {
    setWorking(true);
    const { error } = await supabase.from('estimates').update({ status: 'declined', declined_at: new Date().toISOString(), decline_reason: reason }).eq('id', est.id);
    setWorking(false);
    if (error) return toast.error('Could not decline. Please contact us.');
    setEst({ ...est, status: 'declined' });
    toast.success('Response recorded');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!est) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Estimate not found</div>;

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Estimate {est.estimate_number}</CardTitle>
              <Badge variant="outline">{est.status}</Badge>
            </div>
            {est.valid_until && <p className="text-sm text-muted-foreground">Valid until {est.valid_until}</p>}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {(est.line_items || []).map((l: any, i: number) => (
                <div key={i} className="flex justify-between text-sm border-b pb-2">
                  <div><div className="font-medium">{l.description}</div><div className="text-xs text-muted-foreground">{l.quantity} × ${Number(l.unit_price).toFixed(2)}</div></div>
                  <div>${Number(l.amount).toFixed(2)}</div>
                </div>
              ))}
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>${Number(est.subtotal).toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Shop Supplies</span><span>${Number(est.shop_supplies).toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Tax</span><span>${Number(est.tax).toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t"><span>Total</span><span>${Number(est.total).toFixed(2)}</span></div>
            </div>
            {est.notes && <div className="text-sm bg-muted p-3 rounded">{est.notes}</div>}

            {est.status === 'sent' && !declining && (
              <div className="flex gap-2 pt-3">
                <Button onClick={approve} disabled={working} className="flex-1 bg-green-600 hover:bg-green-700"><CheckCircle2 className="h-4 w-4 mr-1" /> Approve</Button>
                <Button variant="outline" onClick={() => setDeclining(true)} disabled={working} className="flex-1"><XCircle className="h-4 w-4 mr-1" /> Decline</Button>
              </div>
            )}
            {declining && (
              <div className="space-y-2 pt-3">
                <Textarea placeholder="Reason (optional)" value={reason} onChange={e => setReason(e.target.value)} />
                <div className="flex gap-2">
                  <Button variant="destructive" onClick={decline} disabled={working} className="flex-1">Confirm decline</Button>
                  <Button variant="outline" onClick={() => setDeclining(false)} className="flex-1">Cancel</Button>
                </div>
              </div>
            )}
            {est.status === 'approved' && <div className="text-center py-4 text-green-600 font-semibold flex items-center justify-center gap-2"><CheckCircle2 /> Approved — we'll be in touch shortly.</div>}
            {est.status === 'declined' && <div className="text-center py-4 text-muted-foreground">This estimate was declined.</div>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EstimateApproval;
