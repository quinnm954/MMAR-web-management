import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { AlertTriangle, Bot, CheckCircle2, Copy, Loader2, Phone } from 'lucide-react';

type Hours = { open: string; close: string } | null;
type BusinessHours = Record<'sun'|'mon'|'tue'|'wed'|'thu'|'fri'|'sat', Hours>;

type Settings = {
  id: number;
  routing_enabled: boolean;
  forward_to_number: string | null;
  business_hours: BusinessHours;
  voicemail_greeting: string;
  unavailable_greeting: string;
  record_calls: boolean;
  transcribe_voicemail: boolean;
  ring_timeout_seconds: number;
  ai_enabled: boolean;
  ai_agent_id: string | null;
  ai_greeting: string;
  ai_summary_to_number: string | null;
};

const DAYS: Array<{ key: keyof BusinessHours; label: string }> = [
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
  { key: 'sat', label: 'Sat' },
  { key: 'sun', label: 'Sun' },
];

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const WEBHOOK_URL = `${SUPABASE_URL}/functions/v1/twilio-voice-incoming`;
const STATUS_URL = `${SUPABASE_URL}/functions/v1/twilio-voice-status`;

export default function AdminPhoneSettings() {
  const [s, setS] = useState<Settings | null>(null);
  const [busy, setBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [postcallUrl, setPostcallUrl] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.from('phone_settings').select('*').eq('id', 1).maybeSingle();
    if (data) setS(data as unknown as Settings);
  };
  useEffect(() => { load(); }, []);

  if (!s) return <div className="p-6 text-muted-foreground">Loading…</div>;

  const save = async () => {
    setBusy(true);
    const { error } = await supabase
      .from('phone_settings')
      .update({
        routing_enabled: s.routing_enabled,
        forward_to_number: s.forward_to_number,
        business_hours: s.business_hours,
        voicemail_greeting: s.voicemail_greeting,
        unavailable_greeting: s.unavailable_greeting,
        record_calls: s.record_calls,
        transcribe_voicemail: s.transcribe_voicemail,
        ring_timeout_seconds: Number(s.ring_timeout_seconds) || 20,
        ai_enabled: s.ai_enabled,
        ai_greeting: s.ai_greeting,
        ai_summary_to_number: s.ai_summary_to_number || null,
      })
      .eq('id', 1);
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success('Phone settings saved');
  };

  const setupAi = async () => {
    setAiBusy(true);
    await save();
    const { data, error } = await supabase.functions.invoke('ai-receptionist?action=setup', { body: {} });
    setAiBusy(false);
    if (error || !data?.ok) {
      let msg = error?.message || 'Setup failed';
      try { msg = (await (error as any)?.context?.text?.()) || msg; } catch { /* ignore */ }
      toast.error(msg);
      return;
    }
    setPostcallUrl(data.postcall_webhook_url);
    setS((prev) => prev ? { ...prev, ai_agent_id: data.agent_id } : prev);
    toast.success('AI receptionist is ready');
  };

  const copy = (v: string) => {
    navigator.clipboard.writeText(v);
    toast.success('Copied');
  };

  const setDay = (day: keyof BusinessHours, hours: Hours) => {
    setS({ ...s, business_hours: { ...s.business_hours, [day]: hours } });
  };

  return (
    <div className="space-y-6">
      <Card className={s.routing_enabled ? 'border-primary/50 bg-primary/5' : 'border-destructive/50 bg-destructive/5'}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {s.routing_enabled
              ? <><CheckCircle2 className="h-5 w-5 text-primary" /> Routing is ON</>
              : <><AlertTriangle className="h-5 w-5 text-destructive" /> Routing is OFF</>}
          </CardTitle>
          <CardDescription>
            {s.routing_enabled
              ? 'The AI receptionist answers calls and you get transcripts. Urgent calls transfer to your cell, and missed calls go to voicemail (transcribed, no audio kept).'
              : 'Calls hitting your Twilio number will hear the "system upgrade" greeting and hang up. Nothing is forwarded. Turn this ON only after porting is complete and you have entered a forward-to number.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <Label htmlFor="routing" className="text-base font-medium">Enable call routing</Label>
          <Switch
            id="routing"
            checked={s.routing_enabled}
            onCheckedChange={(v) => setS({ ...s, routing_enabled: v })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Forwarding</CardTitle>
          <CardDescription>Where should calls ring during business hours?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="forward">Forward calls to</Label>
            <Input
              id="forward"
              type="tel"
              placeholder="+18135551234"
              value={s.forward_to_number ?? ''}
              onChange={(e) => setS({ ...s, forward_to_number: e.target.value })}
            />
            <p className="text-xs text-muted-foreground mt-1">Use E.164 format (e.g. +18135551234).</p>
          </div>
          <div>
            <Label htmlFor="ring">Ring timeout (seconds)</Label>
            <Input
              id="ring"
              type="number"
              min={10}
              max={60}
              value={s.ring_timeout_seconds}
              onChange={(e) => setS({ ...s, ring_timeout_seconds: Number(e.target.value) || 20 })}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-accent/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5" />AI answering (missed calls)</CardTitle>
          <CardDescription>When you don't pick up, an AI receptionist answers, answers questions, takes booking requests, and can transfer urgent callers to you. You get a text summary after each call.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="ai" className="text-base">Let AI answer missed calls</Label>
            <Switch id="ai" checked={s.ai_enabled} disabled={!s.ai_agent_id} onCheckedChange={(v) => setS({ ...s, ai_enabled: v })} />
          </div>
          {!s.ai_agent_id && <p className="text-xs text-muted-foreground">Click "Set up AI receptionist" first.</p>}
          <div>
            <Label htmlFor="aig">What the AI says first</Label>
            <Textarea id="aig" rows={2} value={s.ai_greeting} onChange={(e) => setS({ ...s, ai_greeting: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="ais">Text call summaries to</Label>
            <Input id="ais" type="tel" placeholder="Defaults to your forward-to number" value={s.ai_summary_to_number ?? ''} onChange={(e) => setS({ ...s, ai_summary_to_number: e.target.value })} />
          </div>
          <Button onClick={setupAi} disabled={aiBusy} variant="secondary">
            {aiBusy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {s.ai_agent_id ? 'Update AI receptionist' : 'Set up AI receptionist'}
          </Button>
          {postcallUrl && (
            <div className="text-sm space-y-2 border-t pt-3">
              <p>Last step, once: in ElevenLabs → Agents → Settings → Post-call webhook, paste this URL so call summaries arrive here.</p>
              <div className="flex gap-2">
                <Input readOnly value={postcallUrl} className="font-mono text-xs" />
                <Button variant="outline" size="sm" onClick={() => copy(postcallUrl)}><Copy className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Business hours (Eastern)</CardTitle>
          <CardDescription>Outside these hours, calls go straight to voicemail. Leave a day blank to mark closed.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {DAYS.map(({ key, label }) => {
            const h = s.business_hours[key];
            const closed = !h;
            return (
              <div key={key} className="flex items-center gap-2">
                <span className="w-12 text-sm font-medium">{label}</span>
                <Switch
                  checked={!closed}
                  onCheckedChange={(v) => setDay(key, v ? { open: '08:00', close: '18:00' } : null)}
                />
                {closed ? (
                  <span className="text-sm text-muted-foreground">Closed</span>
                ) : (
                  <>
                    <Input
                      type="time"
                      className="w-28"
                      value={h!.open}
                      onChange={(e) => setDay(key, { ...h!, open: e.target.value })}
                    />
                    <span className="text-muted-foreground">–</span>
                    <Input
                      type="time"
                      className="w-28"
                      value={h!.close}
                      onChange={(e) => setDay(key, { ...h!, close: e.target.value })}
                    />
                  </>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Greetings & voicemail</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="vm">Voicemail greeting</Label>
            <Textarea
              id="vm"
              rows={2}
              value={s.voicemail_greeting}
              onChange={(e) => setS({ ...s, voicemail_greeting: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="unav">Greeting when routing is OFF</Label>
            <Textarea
              id="unav"
              rows={2}
              value={s.unavailable_greeting}
              onChange={(e) => setS({ ...s, unavailable_greeting: e.target.value })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Transcribe voicemails</Label>
              <p className="text-xs text-muted-foreground">~$0.05/min when used.</p>
            </div>
            <Switch checked={s.transcribe_voicemail} onCheckedChange={(v) => setS({ ...s, transcribe_voicemail: v })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Phone className="h-5 w-5" />Twilio webhook setup</CardTitle>
          <CardDescription>Copy these URLs into Twilio Console → Phone Numbers → your number → Voice Configuration.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>A call comes in (Webhook, HTTP POST)</Label>
            <div className="flex gap-2 mt-1">
              <Input readOnly value={WEBHOOK_URL} className="font-mono text-xs" />
              <Button variant="outline" size="sm" onClick={() => copy(WEBHOOK_URL)}><Copy className="h-4 w-4" /></Button>
            </div>
          </div>
          <div>
            <Label>Call status changes (Status Callback URL, HTTP POST)</Label>
            <div className="flex gap-2 mt-1">
              <Input readOnly value={STATUS_URL} className="font-mono text-xs" />
              <Button variant="outline" size="sm" onClick={() => copy(STATUS_URL)}><Copy className="h-4 w-4" /></Button>
            </div>
          </div>
          <div className="text-sm text-muted-foreground space-y-1.5 border-t pt-4">
            <p className="font-medium text-foreground">Setup checklist:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Port your Google Voice number to Twilio (5–10 business days, free).</li>
              <li>In Twilio Console, enable <strong>SMS Pumping Protection</strong> and set <strong>SMS Geo Permissions</strong> to US only.</li>
              <li>Open your Twilio number's Voice Configuration.</li>
              <li>Paste the webhook URL above into "A call comes in".</li>
              <li>Paste the status URL into "Call status changes".</li>
              <li>Set forward-to number above and turn ON Routing.</li>
              <li>Test by calling your own Twilio number.</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={busy} size="lg">
          {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save settings
        </Button>
      </div>
    </div>
  );
}
