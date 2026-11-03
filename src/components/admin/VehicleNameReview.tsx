import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Car, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
type Review = { id: string; owner_id: string; year: number; make: string; model: string; suggestedMake: string; suggestions: string[] };
export default function VehicleNameReview({ customerName }: { customerName: (id: string) => string }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Review[]>([]);
  const [busy, setBusy] = useState(false);
  const [choices, setChoices] = useState<Record<string, { make: string; model: string }>>({});
  const call = async (body: object) => {
    const { data, error } = await supabase.functions.invoke('vehicle-name-corrections', { body });
    if (error || data?.error) throw new Error(data?.error || error?.message);
    return data;
  };
  const load = async () => {
    setOpen(true); setBusy(true);
    try {
      const data = await call({ action: 'review' });
      setRows(data.reviews || []);
      setChoices(Object.fromEntries((data.reviews || []).map((r: Review) => [r.id, { make: r.suggestedMake, model: r.model }])));
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not load vehicles'); }
    finally { setBusy(false); }
  };
  const save = async (r: Review) => {
    setBusy(true);
    try {
      await call({ action: 'apply', id: r.id, oldMake: r.make, oldModel: r.model, ...choices[r.id] });
      setRows(prev => prev.filter(v => v.id !== r.id)); toast.success('Vehicle corrected');
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not save vehicle'); }
    finally { setBusy(false); }
  };
  return <>
    <Button variant="outline" size="sm" onClick={load}><Car className="h-3.5 w-3.5 mr-1" /> Vehicle Corrections</Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Review uncertain vehicles</DialogTitle></DialogHeader>
        {busy && <Loader2 className="h-5 w-5 animate-spin" />}
        {!busy && !rows.length && <p className="text-sm text-muted-foreground">No uncertain vehicles.</p>}
        {rows.map(r => <div key={r.id} className="border-b py-3 space-y-2">
          <p className="text-sm font-medium">{customerName(r.owner_id)} · {r.year} {r.make} {r.model}</p>
          <div className="grid grid-cols-2 gap-2">
            <Input aria-label={`Make for ${r.id}`} value={choices[r.id]?.make || ''} onChange={e => setChoices(prev => ({ ...prev, [r.id]: { ...prev[r.id], make: e.target.value } }))} />
            <Input aria-label={`Model for ${r.id}`} value={choices[r.id]?.model || ''} onChange={e => setChoices(prev => ({ ...prev, [r.id]: { ...prev[r.id], model: e.target.value } }))} />
          </div>
          <div className="flex gap-2">
            {!!r.suggestions.length && <Select onValueChange={model => setChoices(prev => ({ ...prev, [r.id]: { ...prev[r.id], model } }))}>
              <SelectTrigger className="flex-1"><SelectValue placeholder="Possible models" /></SelectTrigger>
              <SelectContent>{r.suggestions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>}
            <Button size="sm" disabled={busy} onClick={() => save(r)}>Save correction</Button>
          </div>
        </div>)}
      </DialogContent>
    </Dialog>
  </>;
}