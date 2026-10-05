import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { CalendarDays, Copy, RefreshCw } from 'lucide-react';

const BASE = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/calendar-feed`;

export default function CalendarFeedSettings() {
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async (rotate = false) => {
    setBusy(true);
    const { data, error } = await supabase.rpc('get_calendar_feed_token', { _rotate: rotate });
    setBusy(false);
    if (error) return toast({ title: 'Could not load calendar link', description: error.message, variant: 'destructive' });
    setToken(data as string);
    if (rotate) toast({ title: 'New link made', description: 'The old link no longer works. Re-add the calendar on your devices.' });
  };
  useEffect(() => { load(); }, []);

  const https = token ? `${BASE}?token=${token}` : '';
  const webcal = https.replace(/^https:/, 'webcal:');
  const google = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}`;
  const outlook = `https://outlook.live.com/calendar/0/addfromweb?url=${encodeURIComponent(https)}&name=${encodeURIComponent('Garage Ace Schedule')}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5" /> Calendar feed</CardTitle>
        <CardDescription>See your appointments and pending booking requests in your phone or computer calendar and its widgets. Keep this link private.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input readOnly value={https} placeholder="Loading…" className="font-mono text-xs" />
          <Button variant="outline" size="icon" disabled={!token} onClick={() => { navigator.clipboard.writeText(https); toast({ title: 'Link copied' }); }}><Copy className="h-4 w-4" /></Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild disabled={!token}><a href={webcal}>Add to iPhone / Mac</a></Button>
          <Button asChild variant="secondary" disabled={!token}><a href={google} target="_blank" rel="noreferrer">Add to Google Calendar</a></Button>
          <Button asChild variant="secondary" disabled={!token}><a href={outlook} target="_blank" rel="noreferrer">Add to Outlook / Windows</a></Button>
        </div>
        <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
          <div><p className="font-medium text-foreground">iPhone</p>Tap "Add to iPhone", then Subscribe. In Settings → Calendar → Accounts → Fetch New Data, choose every 15 minutes. Then hold the home screen, tap +, and add the Calendar widget.</div>
          <div><p className="font-medium text-foreground">Android</p>Tap "Add to Google Calendar" while signed in to the Google account on your phone. In the Google Calendar app, turn on "Garage Ace Schedule". Then hold the home screen, tap Widgets, and add Google Calendar. Google refreshes every few hours.</div>
          <div><p className="font-medium text-foreground">Windows</p>Tap "Add to Outlook / Windows" and sign in with your Microsoft account. The calendar shows up in Outlook, Windows Calendar, and the Outlook Calendar widget (press Win + W).</div>
        </div>
        <Button variant="ghost" size="sm" disabled={busy} onClick={() => load(true)}><RefreshCw className="mr-2 h-4 w-4" /> Reset link</Button>
      </CardContent>
    </Card>
  );
}
