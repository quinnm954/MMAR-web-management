import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import SignaturePad from '@/components/SignaturePad';
import BrandedDocLayout from '@/components/BrandedDocLayout';
import DocReferences from '@/components/DocReferences';

const TIME_WINDOWS = ['Morning (8a–12p)', 'Afternoon (12p–4p)', 'Evening (4p–7p)'];
const GOOGLE_REVIEW_URL = 'https://share.google/bx2Gb42dslCITJdS8';

const EstimateApproval = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isCustomer, setIsCustomer] = useState(false);
  const [redirectIn, setRedirectIn] = useState<number | null>(null);
  const [est, setEst] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [vehicle, setVehicle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [decisions, setDecisions] = useState<Record<number, 'approved' | 'declined'>>({});
  const [reason, setReason] = useState('');
  const [signature, setSignature] = useState<string | null>(null);
  const [requestedDate, setRequestedDate] = useState<Date | undefined>();
  const [timeWindow, setTimeWindow] = useState<string>(TIME_WINDOWS[0]);
  const [editing, setEditing] = useState(false);
  const [decisionLogs, setDecisionLogs] = useState<any[]>([]);
  const [financingChoice, setFinancingChoice] = useState<'yes' | 'no' | null>(null);
  const [reviewPledge, setReviewPledge] = useState(false);

  useEffect(() => {
    (async () => {
      if (!token) { setLoading(false); return; }
      const { data: payload } = await supabase.rpc('get_estimate_by_token', { _token: token });
      const data: any = (payload as any)?.estimate ?? null;
      setEst(data);
      setCustomer((payload as any)?.customer ?? null);
      setVehicle((payload as any)?.vehicle ?? null);
      setDecisionLogs(((payload as any)?.decision_logs as any[]) ?? []);
      // Pre-fill decisions: existing line.status, otherwise 'approved'
      if (data?.line_items) {
        const init: Record<number, 'approved' | 'declined'> = {};
        (data.line_items as any[]).forEach((l, i) => {
          init[i] = l.status === 'declined' ? 'declined' : 'approved';
        });
        setDecisions(init);
      }
      if (searchParams.get('edit') === '1' && ['approved', 'partially_approved'].includes(data?.status)) {
        setEditing(true);
      }
      if (data?.review_discount_pledged) setReviewPledge(true);
      setLoading(false);
    })();
  }, [token, searchParams]);

  const lines: any[] = est?.line_items || [];
  const approvedTotal = useMemo(
    () => lines.reduce((s, l, i) => (decisions[i] === 'approved' ? s + Number(l.amount || 0) : s), 0),
    [lines, decisions]
  );
  const allDeclined = lines.length > 0 && lines.every((_, i) => decisions[i] === 'declined');
  const anyApproved = lines.some((_, i) => decisions[i] === 'approved');

  const getAllDeclinedDecisions = () => {
    const all: Record<number, 'declined'> = {};
    lines.forEach((_, i) => (all[i] = 'declined'));
    return all;
  };

  const submit = async (decisionOverride = decisions, statusOverride?: 'approved' | 'partially_approved' | 'declined') => {
    if (!signature) return toast.error('Please sign to confirm your decision');
    const finalDecisions = statusOverride === 'declined' ? getAllDeclinedDecisions() : decisionOverride;
    const nextAllDeclined = statusOverride === 'declined' || (lines.length > 0 && lines.every((_, i) => finalDecisions[i] === 'declined'));
    const nextAnyApproved = lines.some((_, i) => finalDecisions[i] === 'approved');
    const status = statusOverride ?? (nextAllDeclined ? 'declined' : nextAnyApproved && lines.some((_, i) => finalDecisions[i] === 'declined') ? 'partially_approved' : 'approved');
    const willApprove = status !== 'declined';
    if (willApprove && !requestedDate) return toast.error('Please select a preferred service date');
    setWorking(true);

    const updatedLines = lines.map((l, i) => ({ ...l, status: finalDecisions[i] ?? (status === 'declined' ? 'declined' : 'approved') }));

    const { error } = await supabase.rpc('submit_estimate_decision', {
      _token: token!,
      _line_items: updatedLines,
      _status: status,
      _signature: signature,
      _decline_reason: status === 'declined' || (status === 'partially_approved' && reason) ? (reason || null) : null,
      _requested_date: willApprove && requestedDate ? format(requestedDate, 'yyyy-MM-dd') : null,
      _requested_time_window: willApprove ? timeWindow : null,
    });
    setWorking(false);
    if (error) return toast.error('Could not submit. Please contact us.');

    // Persist 5-star review discount pledge for approvals
    const willPledge = willApprove && reviewPledge;
    if (willPledge) {
      await supabase.from('estimates').update({ review_discount_pledged: true }).eq('id', est.id);
      // Open Google review page so customer can leave their 5-star rating
      try { window.open(GOOGLE_REVIEW_URL, '_blank', 'noopener,noreferrer'); } catch {}
      toast.success('$5 review discount applied — leave us a 5-star review in the new tab!');
    }

    setEst({
      ...est,
      line_items: updatedLines,
      signature_image: signature,
      signed_at: new Date().toISOString(),
      status,
      review_discount_pledged: willPledge ? true : est.review_discount_pledged,
      ...(status === 'declined' ? { declined_at: new Date().toISOString(), decline_reason: reason || null } : { approved_at: new Date().toISOString() }),
    });
    if (!willPledge) toast.success(status === 'declined' ? 'Response recorded' : editing ? 'Decision updated!' : 'Estimate signed!');
    setEditing(false);
    // Refresh decision history
    const { data: refreshed } = await supabase.rpc('get_estimate_by_token', { _token: token! });
    setDecisionLogs(((refreshed as any)?.decision_logs as any[]) ?? []);

    // If signed in as the customer, auto-redirect back to portal
    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.id === est.customer_id) {
      setIsCustomer(true);
      let n = 5;
      setRedirectIn(n);
      const iv = setInterval(() => {
        n -= 1;
        setRedirectIn(n);
        if (n <= 0) {
          clearInterval(iv);
          navigate('/portal/estimates');
        }
      }, 1000);
    }
  };

  const declineEntireEstimate = () => {
    const all = getAllDeclinedDecisions();
    setDecisions(all);
    setRequestedDate(undefined);
    if (!signature) {
      toast.message('All items marked declined. Please sign below, then tap "Decline All" to submit.');
      return;
    }
    submit(all, 'declined');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!est) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Estimate not found</div>;

  const submitted = ['approved', 'declined', 'partially_approved'].includes(est.status);
  const locked = submitted && !editing;

  return (
    <BrandedDocLayout
      docType="ESTIMATE"
      docNumber={est.estimate_number}
      rightMeta={
        <>
          <div>Status: <span className="font-medium uppercase">{est.status}</span></div>
          {est.valid_until && <div>Valid until {est.valid_until}</div>}
        </>
      }
    >
      {/* Bill To / Vehicle */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6 text-sm">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Prepared For</div>
          <div className="font-medium">{customer?.full_name || customer?.email || '—'}</div>
          {customer?.email && customer?.full_name && <div className="text-xs text-muted-foreground">{customer.email}</div>}
        </div>
        {vehicle && (
          <div className="sm:text-right">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Vehicle</div>
            <div className="font-medium">{[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ')}</div>
            <div className="text-xs text-muted-foreground">
              {vehicle.license_plate && <>Plate: {vehicle.license_plate} · </>}
              {vehicle.vin && <>VIN: {vehicle.vin}</>}
            </div>
          </div>
        )}
      </div>

      {!locked && (
        <p className="text-sm text-muted-foreground mb-3">
          For each item below, choose <span className="font-medium text-foreground">Approve</span> or <span className="font-medium text-foreground">Decline</span>. Then sign at the bottom.
        </p>
      )}

      {/* Line Items */}
      <div className="space-y-2">
        {lines.map((l: any, i: number) => {
          const approved = decisions[i] === 'approved';
          const declined = decisions[i] === 'declined';
          return (
            <div
              key={i}
              className={`p-3 rounded border transition-colors ${
                approved ? 'border-primary/50 bg-primary/5' : declined ? 'border-destructive/40 bg-destructive/5 opacity-70' : 'border-border'
              }`}
            >
              <div className="flex justify-between text-sm gap-3">
                <div className="flex-1">
                  <div className="font-medium">{l.description}</div>
                  <div className="text-xs text-muted-foreground">{l.quantity} × ${Number(l.unit_price).toFixed(2)}</div>
                  {locked && <Badge variant={approved ? 'default' : 'secondary'} className="mt-1 text-[10px]">{decisions[i]}</Badge>}
                </div>
                <div className={approved ? 'font-medium' : 'line-through text-muted-foreground'}>${Number(l.amount).toFixed(2)}</div>
              </div>
              {!locked && (
                <div className="flex gap-2 mt-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={approved ? 'hero' : 'outline'}
                    className="flex-1"
                    onClick={() => setDecisions((d) => ({ ...d, [i]: 'approved' }))}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={declined ? 'destructive' : 'outline'}
                    className="flex-1"
                    onClick={() => setDecisions((d) => ({ ...d, [i]: 'declined' }))}
                  >
                    <XCircle className="h-3.5 w-3.5 mr-1" /> Decline
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Totals */}
      <div className="mt-5 space-y-1 text-sm">
        <div className="flex justify-between"><span className="text-muted-foreground">Selected subtotal</span><span>${approvedTotal.toFixed(2)}</span></div>
        <div className="flex justify-between text-xs text-muted-foreground"><span>Original subtotal (before tax/supplies)</span><span>${Number(est.subtotal).toFixed(2)}</span></div>
        {Number(est.shop_supplies) > 0 && <div className="flex justify-between text-xs text-muted-foreground"><span>Shop supplies</span><span>${Number(est.shop_supplies).toFixed(2)}</span></div>}
        {Number(est.tax) > 0 && <div className="flex justify-between text-xs text-muted-foreground"><span>Tax</span><span>${Number(est.tax).toFixed(2)}</span></div>}
        {(reviewPledge || est.review_discount_pledged) && (
          <div className="flex justify-between text-primary font-medium">
            <span>⭐ 5-star Google review discount</span>
            <span>−$5.00</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
          <span>Estimate Total</span>
          <span>${Math.max(0, Number(est.total) - ((reviewPledge || est.review_discount_pledged) ? 5 : 0)).toFixed(2)}</span>
        </div>
        {(reviewPledge || est.review_discount_pledged) && (
          <p className="text-[11px] text-primary">
            $5 will be automatically deducted from your final invoice once you leave a 5-star Google review.
          </p>
        )}
        <p className="text-[11px] text-muted-foreground">Final invoice will reflect approved items plus tax/shop supplies.</p>
      </div>

      {est.notes && <div className="mt-4 text-sm bg-muted/50 border border-border rounded p-3 whitespace-pre-wrap">{est.notes}</div>}

      {!locked && (
        <div className="mt-5 space-y-3">
          {lines.some((_, i) => decisions[i] === 'declined') && (
            <Textarea placeholder="Reason for declined items (optional)" value={reason} onChange={(e) => setReason(e.target.value)} />
          )}

          {!allDeclined && (
            <div className="rounded-md border border-border bg-muted/20 p-3 space-y-3">
              <div className="text-sm font-medium">Schedule the work</div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Preferred date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !requestedDate && 'text-muted-foreground')}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {requestedDate ? format(requestedDate, 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={requestedDate}
                        onSelect={setRequestedDate}
                        disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                        className={cn('p-3 pointer-events-auto')}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Preferred time window</label>
                  <Select value={timeWindow} onValueChange={setTimeWindow}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIME_WINDOWS.map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">We'll confirm the exact arrival time by call or text.</p>
            </div>
          )}

          {!allDeclined && (
            <label className="flex items-start gap-3 rounded-md border-2 border-accent/60 bg-accent/10 p-3 cursor-pointer hover:bg-accent/15 transition-colors">
              <Checkbox
                checked={reviewPledge}
                onCheckedChange={(v) => setReviewPledge(v === true)}
                className="mt-0.5"
              />
              <div className="flex-1 text-sm">
                <div className="font-semibold flex items-center gap-2">
                  <span aria-hidden>⭐</span> Get $5 off for a 5-star Google review
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Check this box and we'll automatically take <strong>$5 off your final invoice</strong>.
                  After you sign, our Google review page opens in a new tab — just tap the 5-star rating to claim it.
                </div>
              </div>
            </label>
          )}

          <div>
            <div className="text-sm font-medium mb-2">Authorization Signature</div>
            <SignaturePad onChange={setSignature} />
            <p className="text-[11px] text-muted-foreground mt-1">
              {allDeclined
                ? 'By signing, you confirm your decision to decline this estimate.'
                : `By signing, you authorize Mike's Mobile Auto Repair to perform the approved work.`}
            </p>
          </div>
          <Button onClick={() => submit()} disabled={working || !signature || (!allDeclined && !requestedDate)} className="w-full" variant="hero">
            {working ? <Loader2 className="h-4 w-4 animate-spin" /> : allDeclined ? <><XCircle className="h-4 w-4 mr-1" /> Decline All</> : <><CheckCircle2 className="h-4 w-4 mr-1" /> Sign &amp; Approve</>}
          </Button>
          {!allDeclined && (
            <Button
              type="button"
              variant="outline"
              className="w-full text-destructive hover:text-destructive"
              onClick={declineEntireEstimate}
            >
              <XCircle className="h-4 w-4 mr-1" /> Decline entire estimate
            </Button>
          )}
        </div>
      )}

      {submitted && est.signature_image && (
        <div className="mt-5 pt-3 border-t border-border">
          <div className="text-xs text-muted-foreground mb-1">Signed {est.signed_at && new Date(est.signed_at).toLocaleString()}</div>
          <img src={est.signature_image} alt="signature" className="bg-white rounded p-1 max-h-32" />
        </div>
      )}
      {submitted && (
        <div className="mt-4 text-center py-2 font-semibold flex items-center justify-center gap-2">
          {est.status === 'approved' && <><CheckCircle2 className="text-primary" /> Approved — we'll be in touch shortly.</>}
          {est.status === 'partially_approved' && <><CheckCircle2 className="text-primary" /> Partial approval recorded.</>}
          {est.status === 'declined' && <span className="text-muted-foreground">This estimate was declined.</span>}
        </div>
      )}
      {locked && (
        <div className="mt-4 flex flex-col items-center gap-2">
          {est.status !== 'declined' && (
            <Button asChild>
              <Link to="/portal/estimates">Return to your portal</Link>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            Change my decision / decline items
          </Button>
          {est.status !== 'declined' && (
            <p className="text-[11px] text-muted-foreground text-center max-w-xs">
              Need to decline the whole estimate or just some services? Tap above to update each line.
            </p>
          )}
          {isCustomer && redirectIn !== null && redirectIn > 0 && (
            <p className="text-xs text-muted-foreground">Redirecting in {redirectIn}s…</p>
          )}
        </div>
      )}

      {decisionLogs.length > 0 && (
        <div className="mt-6 pt-4 border-t border-border">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Decision history</div>
          <ul className="space-y-1.5 text-xs">
            {decisionLogs.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center gap-2 text-muted-foreground">
                <span className="font-mono">{new Date(l.created_at).toLocaleString()}</span>
                <Badge variant="outline" className="uppercase text-[10px]">{l.status.replace('_', ' ')}</Badge>
                {l.requested_date && <span>· requested {l.requested_date}{l.requested_time_window ? ` (${l.requested_time_window})` : ''}</span>}
                {l.decline_reason && <span className="italic">· "{l.decline_reason}"</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Financing opt-in: only shown after approval, only if customer says Yes do we surface the contract link */}
      {locked && est.status !== 'declined' && financingChoice === null && (
        <div className="mt-6 rounded-md border border-border bg-muted/20 p-4 text-sm">
          <div className="font-medium mb-1">Would you like to finance this repair?</div>
          <p className="text-xs text-muted-foreground mb-3">
            We offer in-house financing: 100% parts + 50% labor down, balance over 12 months at 25% APR.
            This is optional — choose No if you'll pay in full.
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="hero" onClick={() => setFinancingChoice('yes')}>Yes, I'd like financing</Button>
            <Button size="sm" variant="outline" onClick={() => setFinancingChoice('no')}>No thanks</Button>
          </div>
        </div>
      )}
      {locked && financingChoice === 'no' && (
        <div className="mt-4 text-xs text-muted-foreground italic text-center">
          Financing declined. <button className="underline" onClick={() => setFinancingChoice(null)}>Change my mind</button>
        </div>
      )}

      <DocReferences
        financingHref={
          financingChoice === 'yes' && est?.id ? `/financing-contract?estimate=${est.id}` : undefined
        }
        hideFinancing={est?.status === 'declined' || !locked || financingChoice !== 'yes'}
        estimateToken={token}
        estimateId={est?.id}
      />
    </BrandedDocLayout>
  );
};

export default EstimateApproval;
