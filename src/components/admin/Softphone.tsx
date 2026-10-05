import { useEffect, useRef, useState } from 'react';
import { Device, Call } from '@twilio/voice-sdk';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mic, MicOff, Phone, PhoneIncoming, PhoneOff, X } from 'lucide-react';
import { toast } from 'sonner';

/** Open the in-app phone and dial a number from anywhere in admin. */
export const dialInApp = (number: string) =>
  window.dispatchEvent(new CustomEvent('softphone:dial', { detail: { number } }));

type Status = 'offline' | 'ready' | 'incoming' | 'connecting' | 'in-call';

async function fetchToken() {
  const { data, error } = await supabase.functions.invoke('twilio-voice-token', { body: {} });
  if (error || !data?.token) throw new Error(error?.message || 'No token');
  return data.token as string;
}

export default function Softphone() {
  const deviceRef = useRef<Device | null>(null);
  const callRef = useRef<Call | null>(null);
  const [status, setStatus] = useState<Status>('offline');
  const [open, setOpen] = useState(false);
  const [number, setNumber] = useState('');
  const [peer, setPeer] = useState('');
  const [muted, setMuted] = useState(false);
  const [secs, setSecs] = useState(0);

  const attach = (call: Call) => {
    callRef.current = call;
    call.on('accept', () => { setStatus('in-call'); setSecs(0); });
    const end = () => { callRef.current = null; setStatus('ready'); setMuted(false); };
    call.on('disconnect', end);
    call.on('cancel', end);
    call.on('reject', end);
    call.on('error', (e) => { toast.error(e.message); end(); });
  };

  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const device = new Device(await fetchToken(), { closeProtection: true, codecPreferences: [Call.Codec.Opus, Call.Codec.PCMU] });
        if (dead) return;
        deviceRef.current = device;
        device.on('registered', () => setStatus((s) => (s === 'offline' ? 'ready' : s)));
        device.on('error', (e) => console.error('softphone', e));
        device.on('tokenWillExpire', async () => device.updateToken(await fetchToken()));
        device.on('incoming', (call: Call) => {
          attach(call);
          setPeer(call.parameters.From || 'Unknown');
          setStatus('incoming');
          setOpen(true);
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Incoming call', { body: call.parameters.From });
          }
        });
        await device.register();
      } catch (e) {
        console.warn('Softphone unavailable', e);
      }
    })();
    return () => { dead = true; deviceRef.current?.destroy(); };
  }, []);

  useEffect(() => {
    if (status !== 'in-call') return;
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [status]);

  /** Ask for this device's microphone and route audio to its speaker. */
  const ensureAudio = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      s.getTracks().forEach((t) => t.stop());
      const audio = deviceRef.current?.audio;
      if (audio) {
        await audio.setInputDevice('default').catch(() => {});
        if (audio.isOutputSelectionSupported) {
          await audio.speakerDevices.set('default').catch(() => {});
          await audio.ringtoneDevices.set('default').catch(() => {});
        }
      }
      return true;
    } catch {
      toast.error('Allow microphone access for this app to make and take calls');
      return false;
    }
  };

  const dial = async (n: string) => {
    const d = deviceRef.current;
    const to = n.replace(/[^\d+]/g, '');
    if (!d || status === 'offline') return toast.error('Phone is not connected yet');
    if (to.length < 10) return toast.error('Enter a full phone number');
    if (!(await ensureAudio())) return;
    setPeer(to); setStatus('connecting'); setOpen(true);
    try { attach(await d.connect({ params: { To: to } })); }
    catch (e) { toast.error(String(e)); setStatus('ready'); }
  };

  const answer = async () => { if (await ensureAudio()) callRef.current?.accept(); };

  useEffect(() => {
    const h = (e: Event) => { const n = (e as CustomEvent).detail?.number; if (n) { setNumber(n); dial(n); } };
    window.addEventListener('softphone:dial', h);
    return () => window.removeEventListener('softphone:dial', h);
  });

  const hangup = () => { callRef.current?.disconnect(); };
  const fmt = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;

  if (!open) {
    return (
      <button
        onClick={() => { setOpen(true); ensureAudio(); }}
        className="fixed bottom-24 right-4 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center md:bottom-6"
        aria-label="Open phone"
      >
        <Phone className="h-6 w-6" />
        <span className={`absolute top-1 right-1 h-3 w-3 rounded-full border-2 border-background ${status === 'offline' ? 'bg-muted-foreground' : 'bg-accent'}`} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-24 right-4 z-50 w-72 rounded-xl border bg-card text-card-foreground shadow-2xl p-4 space-y-3 md:bottom-6">
      <div className="flex items-center justify-between">
        <span className="font-semibold flex items-center gap-2"><Phone className="h-4 w-4" />Phone</span>
        <span className="text-xs text-muted-foreground">{status === 'offline' ? 'Connecting…' : 'Online'}</span>
        {(status === 'ready' || status === 'offline') && (
          <button onClick={() => setOpen(false)} aria-label="Close"><X className="h-4 w-4" /></button>
        )}
      </div>

      {status === 'incoming' && (
        <div className="space-y-3 text-center">
          <PhoneIncoming className="h-8 w-8 mx-auto text-accent animate-pulse" />
          <p className="font-mono text-lg">{peer}</p>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={answer}>Answer</Button>
            <Button className="flex-1" variant="destructive" onClick={() => callRef.current?.reject()}>Decline</Button>
          </div>
        </div>
      )}

      {(status === 'connecting' || status === 'in-call') && (
        <div className="space-y-3 text-center">
          <p className="font-mono text-lg">{peer}</p>
          <p className="text-sm text-muted-foreground">{status === 'connecting' ? 'Calling…' : fmt}</p>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => { const m = !muted; callRef.current?.mute(m); setMuted(m); }}>
              {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            <Button variant="destructive" className="flex-1" onClick={hangup}><PhoneOff className="h-4 w-4" /></Button>
          </div>
        </div>
      )}

      {(status === 'ready' || status === 'offline') && (
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); dial(number); }}>
          <Input type="tel" placeholder="(239) 555-1234" value={number} onChange={(e) => setNumber(e.target.value)} />
          <Button type="submit" size="icon" disabled={status === 'offline'}><Phone className="h-4 w-4" /></Button>
        </form>
      )}
    </div>
  );
}
