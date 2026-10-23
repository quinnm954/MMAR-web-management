import { useQuery } from '@tanstack/react-query';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { Phone, AudioLines, RefreshCw, ExternalLink, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

type ServiceResult<T> = { data?: T; error?: string };
type Usage = {
  twilio: ServiceResult<{ balance: number; currency: string }>;
  elevenlabs: ServiceResult<{ used: number; limit: number; tier: string; resetAt: string | null }>;
  checkedAt: string;
};

export default function AdminServiceUsage() {
  const { data, error, isFetching, refetch } = useQuery<Usage>({
    queryKey: ['admin-service-usage'], staleTime: 60000, refetchInterval: 300000, retry: false,
    queryFn: async () => {
      const result = await supabase.functions.invoke('admin-service-usage', { body: {} });
      if (result.error) {
        const details = result.error instanceof FunctionsHttpError ? await result.error.context.text() : result.error.message;
        console.error('Service usage failed:', details);
        throw new Error('Unable to refresh service balances');
      }
      return result.data as Usage;
    },
  });
  const twilio = data?.twilio.data;
  const eleven = data?.elevenlabs.data;
  const remaining = eleven ? Math.max(0, eleven.limit - eleven.used) : 0;
  const percent = eleven && eleven.limit > 0 ? Math.min(100, eleven.used / eleven.limit * 100) : 0;
  const twilioLow = twilio?.currency === 'USD' && twilio.balance < 10;
  const twilioTone = twilio?.currency === 'USD' && twilio.balance < 5 ? 'text-destructive' : twilioLow ? 'text-accent' : 'text-foreground';
  const elevenLow = !!eleven && (eleven.limit <= 0 || remaining / eleven.limit < 0.25);
  const elevenTone = eleven && (eleven.limit <= 0 || remaining / eleven.limit < 0.1) ? 'text-destructive' : elevenLow ? 'text-accent' : 'text-foreground';
  const unavailable = (detail?: string) => (
    <div className="space-y-1 py-2" title={detail}>
      <p className="text-sm text-muted-foreground">{isFetching && !data ? 'Loading…' : 'Balance unavailable'}</p>
      {detail && <p className="text-xs text-destructive">Could not load this account. Try refreshing.</p>}
    </div>
  );
  return (
    <section aria-label="Receptionist service balances" className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-lg">Receptionist balances</h2>
          {data && <p className="text-xs text-muted-foreground">Checked {new Date(data.checkedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p>}
        </div>
        <Button variant="ghost" size="icon" aria-label="Refresh service balances" title="Refresh service balances" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin motion-reduce:animate-none' : ''}`} />
        </Button>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">Unable to refresh balances. Try again.</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <article className="rounded-lg border border-border bg-card p-4 flex flex-col gap-3">
          <h3 className="flex items-center gap-2 font-medium"><Phone className="h-4 w-4 text-primary" />Twilio</h3>
          {twilio ? <div>
            <p className={`text-3xl font-semibold ${twilioTone}`}>{new Intl.NumberFormat(undefined, { style: 'currency', currency: twilio.currency }).format(twilio.balance)}</p>
            <p className="text-xs text-muted-foreground mt-1">Account balance · {twilio.currency}</p>
            {twilioLow && <p className={`flex items-center gap-1 text-xs mt-2 ${twilioTone}`}><AlertTriangle className="h-3 w-3" />{twilio.balance < 5 ? 'Top up soon' : 'Balance running low'}</p>}
          </div> : unavailable(data?.twilio.error)}
          <Button variant="outline" size="sm" className="mt-auto self-start" asChild>
            <a href="https://console.twilio.com/us1/billing/manage-billing/billing-overview" target="_blank" rel="noopener noreferrer">Top up Twilio<ExternalLink className="ml-2 h-3 w-3" /></a>
          </Button>
        </article>
        <article className="rounded-lg border border-border bg-card p-4 flex flex-col gap-3">
          <h3 className="flex items-center gap-2 font-medium"><AudioLines className="h-4 w-4 text-accent" />ElevenLabs{eleven && <span className="ml-auto text-xs text-muted-foreground capitalize">{eleven.tier}</span>}</h3>
          {eleven ? <div className="space-y-2">
            <div><p className={`text-3xl font-semibold ${elevenTone}`}>{remaining.toLocaleString()}</p><p className="text-xs text-muted-foreground mt-1">Characters remaining</p></div>
            <Progress value={percent} className="h-2" aria-label="ElevenLabs usage" />
            <p className="text-xs text-muted-foreground">{eleven.used.toLocaleString()} / {eleven.limit.toLocaleString()} used · {percent.toFixed(1)}%</p>
            {eleven.resetAt && <p className="text-xs text-muted-foreground">Resets {new Date(eleven.resetAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</p>}
            {elevenLow && <p className={`flex items-center gap-1 text-xs ${elevenTone}`}><AlertTriangle className="h-3 w-3" />Voice allowance running low</p>}
          </div> : unavailable(data?.elevenlabs.error)}
          <Button variant="outline" size="sm" className="mt-auto self-start" asChild>
            <a href="https://elevenlabs.io/app/subscription" target="_blank" rel="noopener noreferrer">Manage subscription<ExternalLink className="ml-2 h-3 w-3" /></a>
          </Button>
        </article>
      </div>
    </section>
  );
}