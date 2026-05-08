import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import SignaturePad from '@/components/SignaturePad';
import BrandedDocLayout from '@/components/BrandedDocLayout';

const EstimateApproval = () => {
  const { token } = useParams();
  const [est, setEst] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [vehicle, setVehicle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [decisions, setDecisions] = useState<Record<number, 'approved' | 'declined'>>({});
  const [reason, setReason] = useState('');
  const [signature, setSignature] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('estimates').select('*').eq('approval_token', token).maybeSingle();
      setEst(data);
      if (data?.customer_id) {
        const { data: c } = await supabase.from('profiles').select('full_name, email').eq('id', data.customer_id).maybeSingle();
        setCustomer(c);
      }
      if (data?.vehicle_id) {
        const { data: v } = await supabase.from('vehicles').select('year, make, model, license_plate, vin').eq('id', data.vehicle_id).maybeSingle();
        setVehicle(v);
      }
      // Pre-fill decisions: existing line.status, otherwise 'approved'
      if (data?.line_items) {
        const init: Record<number, 'approved' | 'declined'> = {};
        (data.line_items as any[]).forEach((l, i) => {
          init[i] = l.status === 'declined' ? 'declined' : 'approved';
        });
        setDecisions(init);
      }
      setLoading(false);
    })();
  }, [token]);

  const lines: any[] = est?.line_items || [];
  const approvedTotal = useMemo(
    () => lines.reduce((s, l, i) => (decisions[i] === 'approved' ? s + Number(l.amount || 0) : s), 0),
    [lines, decisions]
  );
  const allDeclined = lines.length > 0 && lines.every((_, i) => decisions[i] === 'declined');
  const anyApproved = lines.some((_, i) => decisions[i] === 'approved');

  const submit = async () => {
    if (!signature) return toast.error('Please sign to confirm your decision');
    setWorking(true);

    const updatedLines = lines.map((l, i) => ({ ...l, status: decisions[i] }));
    const status = allDeclined ? 'declined' : anyApproved && lines.some((_, i) => decisions[i] === 'declined') ? 'partially_approved' : 'approved';

    const update: any = {
      line_items: updatedLines,
      signature_image: signature,
      signed_at: new Date().toISOString(),
      status,
    };
    if (status === 'declined') {
      update.declined_at = new Date().toISOString();
      update.decline_reason = reason || null;
    } else {
      update.approved_at = new Date().toISOString();
      if (status === 'partially_approved' && reason) update.decline_reason = reason;
    }

    const { error } = await supabase.from('estimates').update(update).eq('id', est.id);
    setWorking(false);
    if (error) return toast.error('Could not submit. Please contact us.');
    setEst({ ...est, ...update });
    toast.success(status === 'declined' ? 'Response recorded' : 'Estimate signed!');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!est) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Estimate not found</div>;

  const submitted = ['approved', 'declined', 'partially_approved'].includes(est.status);

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
            {!submitted && <p className="text-sm text-muted-foreground">Check the items you'd like us to perform. Uncheck any you'd like to decline.</p>}

            <div className="space-y-2">
              {lines.map((l: any, i: number) => {
                const approved = decisions[i] === 'approved';
                return (
                  <label
                    key={i}
                    className={`flex items-start gap-3 p-3 rounded border transition-colors cursor-pointer ${
                      submitted ? 'cursor-default' : approved ? 'border-primary/50 bg-primary/5' : 'border-border bg-muted/20 opacity-60'
                    }`}
                  >
                    <Checkbox
                      checked={approved}
                      disabled={submitted}
                      onCheckedChange={(v) => setDecisions((d) => ({ ...d, [i]: v ? 'approved' : 'declined' }))}
                      className="mt-1"
                    />
                    <div className="flex-1 flex justify-between text-sm">
                      <div>
                        <div className="font-medium">{l.description}</div>
                        <div className="text-xs text-muted-foreground">{l.quantity} × ${Number(l.unit_price).toFixed(2)}</div>
                        {submitted && <Badge variant={approved ? 'default' : 'secondary'} className="mt-1 text-[10px]">{decisions[i]}</Badge>}
                      </div>
                      <div className={approved ? '' : 'line-through text-muted-foreground'}>${Number(l.amount).toFixed(2)}</div>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="space-y-1 text-sm pt-2 border-t">
              <div className="flex justify-between"><span>Selected subtotal</span><span>${approvedTotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-xs text-muted-foreground"><span>Original total (before tax/supplies)</span><span>${Number(est.subtotal).toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t"><span>Original Total</span><span>${Number(est.total).toFixed(2)}</span></div>
              <p className="text-xs text-muted-foreground">Final invoice will reflect approved items plus tax/shop supplies.</p>
            </div>

            {est.notes && <div className="text-sm bg-muted p-3 rounded">{est.notes}</div>}

            {!submitted && (
              <>
                {lines.some((_, i) => decisions[i] === 'declined') && (
                  <Textarea placeholder="Reason for declined items (optional)" value={reason} onChange={(e) => setReason(e.target.value)} />
                )}
                <div>
                  <div className="text-sm font-medium mb-2">Signature</div>
                  <SignaturePad onChange={setSignature} />
                </div>
                <Button onClick={submit} disabled={working || !signature} className="w-full" variant="hero">
                  {working ? <Loader2 className="h-4 w-4 animate-spin" /> : allDeclined ? <><XCircle className="h-4 w-4 mr-1" /> Decline All</> : <><CheckCircle2 className="h-4 w-4 mr-1" /> Sign & Approve</>}
                </Button>
              </>
            )}

            {submitted && est.signature_image && (
              <div className="pt-3 border-t">
                <div className="text-xs text-muted-foreground mb-1">Signed {est.signed_at && new Date(est.signed_at).toLocaleString()}</div>
                <img src={est.signature_image} alt="signature" className="bg-white rounded p-1 max-h-32" />
              </div>
            )}
            {submitted && (
              <div className="text-center py-2 font-semibold flex items-center justify-center gap-2">
                {est.status === 'approved' && <><CheckCircle2 className="text-green-500" /> Approved — we'll be in touch shortly.</>}
                {est.status === 'partially_approved' && <><CheckCircle2 className="text-primary" /> Partial approval recorded.</>}
                {est.status === 'declined' && <span className="text-muted-foreground">This estimate was declined.</span>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EstimateApproval;
