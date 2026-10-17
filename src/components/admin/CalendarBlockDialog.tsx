import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Loader2, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { fromShopTime, toShopTime } from '@/components/calendar/GCalView';
import { toast } from 'sonner';

export interface CalendarBlock {
  id: string;
  starts_at: string;
  ends_at: string;
  reason: string | null;
}

export default function CalendarBlockDialog({ open, block, date, onClose, onSaved }: {
  open: boolean; block: CalendarBlock | null; date: Date; onClose: () => void; onSaved: () => void;
}) {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  useEffect(() => {
    if (!open) return;
    const day = format(date, 'yyyy-MM-dd');
    setStart(block ? format(toShopTime(new Date(block.starts_at)), "yyyy-MM-dd'T'HH:mm") : `${day}T08:00`);
    setEnd(block ? format(toShopTime(new Date(block.ends_at)), "yyyy-MM-dd'T'HH:mm") : `${day}T20:00`);
    setReason(block?.reason || '');
    setError('');
    setConfirmDelete(false);
  }, [open, block, date]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const starts = fromShopTime(new Date(start));
    const ends = fromShopTime(new Date(end));
    if (!Number.isFinite(starts.getTime()) || !Number.isFinite(ends.getTime()) || ends <= starts) {
      setError('End time must be after start time.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const values = { starts_at: starts.toISOString(), ends_at: ends.toISOString(), reason: reason.trim() || null };
      const result = block
        ? await supabase.from('calendar_blocks').update(values).eq('id', block.id).select('id').single()
        : await supabase.from('calendar_blocks').insert({ ...values, region_slug: null }).select('id').single();
      if (result.error) throw result.error;
      toast.success(block ? 'Blocked time updated' : 'Time blocked off');
      onSaved();
      onClose();
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save blocked time. Please try again.'); }
    finally { setBusy(false); }
  };

  const remove = async () => {
    if (!block) return;
    setBusy(true);
    setError('');
    try {
      const result = await supabase.from('calendar_blocks').delete().eq('id', block.id).select('id').single();
      if (result.error) throw result.error;
      toast.success('Blocked time removed');
      onSaved();
      onClose();
    } catch { setError('Could not remove blocked time. Please try again.'); }
    finally { setBusy(false); }
  };

  return <Dialog open={open} onOpenChange={(value) => { if (!value && !busy) onClose(); }}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{block ? 'Edit blocked time' : 'Block off time'}</DialogTitle>
        <DialogDescription>Eastern time · {block ? 'Unavailable time' : 'All regions'}</DialogDescription>
      </DialogHeader>
      <form onSubmit={save} className="space-y-4">
        <div className="space-y-2"><Label htmlFor="block-start">Start</Label><Input id="block-start" type="datetime-local" required value={start} onChange={(e) => setStart(e.target.value)} disabled={busy} className="min-w-0 w-full" /></div>
        <div className="space-y-2"><Label htmlFor="block-end">End</Label><Input id="block-end" type="datetime-local" required value={end} onChange={(e) => setEnd(e.target.value)} disabled={busy} className="min-w-0 w-full" /></div>
        <div className="space-y-2"><Label htmlFor="block-reason">Reason (optional)</Label><Input id="block-reason" maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} disabled={busy} /></div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {confirmDelete && <p className="text-sm text-destructive">Remove this blocked time and reopen it for scheduling?</p>}
        <DialogFooter className="gap-2">
          {block && <Button type="button" variant="destructive" disabled={busy} onClick={() => confirmDelete ? void remove() : setConfirmDelete(true)}><Trash2 className="mr-2 h-4 w-4" />{confirmDelete ? 'Confirm removal' : 'Remove'}</Button>}
          <Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save blocked time</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}