import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

type Form = {
  full_name: string; phone: string; email: string; address_line1: string; city: string; state: string; postal_code: string;
  year: string; make: string; model: string; engine: string;
};
const blank: Form = { full_name: '', phone: '', email: '', address_line1: '', city: '', state: '', postal_code: '', year: '', make: '', model: '', engine: '' };

export default function AddCustomerFromThread({ open, onOpenChange, threadId, phone, onSaved }: {
  open: boolean; onOpenChange: (v: boolean) => void; threadId: string; phone: string; onSaved?: () => void;
}) {
  const [form, setForm] = useState<Form>(blank);
  const [reading, setReading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({ ...blank, phone });
    setReading(true);
    supabase.functions.invoke('extract-thread-contact', { body: { thread_id: threadId } }).then(({ data, error }) => {
      setReading(false);
      if (error || data?.error) { toast.error(data?.error || 'Could not read the conversation — fill in manually.'); return; }
      const v = data?.vehicle || {};
      setForm(f => ({
        ...f,
        full_name: data?.full_name || '', email: data?.email || '', address_line1: data?.address_line1 || '',
        city: data?.city || '', state: data?.state || '', postal_code: data?.postal_code || '',
        year: v.year ? String(v.year) : '', make: v.make || '', model: v.model || '', engine: v.engine || '',
      }));
    });
  }, [open, threadId, phone]);

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    if (!form.full_name.trim() && !form.email.trim()) return toast.error('Add at least a name.');
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-create-customer', {
        body: { full_name: form.full_name.trim(), email: form.email.trim().toLowerCase(), phone: form.phone.trim() },
      });
      if (error || (data as any)?.error) throw new Error((data as any)?.error || error?.message);
      const customerId = (data as any)?.customer_id as string | undefined;
      if (!customerId) throw new Error('Customer was not created');
      await supabase.from('profiles').update({
        phone: form.phone.trim() || null,
        address_line1: form.address_line1.trim() || null,
        city: form.city.trim() || null,
        state: form.state.trim().toUpperCase() || null,
        postal_code: form.postal_code.trim() || null,
      }).eq('id', customerId);
      if (form.make.trim() && form.model.trim()) {
        await supabase.from('vehicles').insert({
          owner_id: customerId, year: Number(form.year) || new Date().getFullYear(),
          make: form.make.trim(), model: form.model.trim(), engine: form.engine.trim() || null, is_active: true,
        } as any);
      }
      await supabase.from('sms_threads').update({ customer_id: customerId }).eq('id', threadId);
      toast.success('Customer added');
      onOpenChange(false);
      onSaved?.();
    } catch (e: any) {
      toast.error(e?.message || 'Could not save customer');
    } finally {
      setSaving(false);
    }
  };

  const field = (k: keyof Form, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className="space-y-1"><Label className="text-xs">{label}</Label><Input value={form[k]} onChange={set(k)} {...props} /></div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Add to customers</DialogTitle></DialogHeader>
        {reading && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Reading the conversation…</p>}
        <div className="grid gap-3">
          {field('full_name', 'Name')}
          <div className="grid grid-cols-2 gap-3">{field('phone', 'Phone', { inputMode: 'tel' })}{field('email', 'Email', { type: 'email' })}</div>
          {field('address_line1', 'Address')}
          <div className="grid grid-cols-3 gap-3">{field('city', 'City')}{field('state', 'State')}{field('postal_code', 'ZIP', { inputMode: 'numeric' })}</div>
          <p className="text-xs font-medium text-muted-foreground pt-1">Vehicle</p>
          <div className="grid grid-cols-2 gap-3">{field('year', 'Year', { inputMode: 'numeric' })}{field('make', 'Make')}{field('model', 'Model')}{field('engine', 'Engine')}</div>
        </div>
        <Button onClick={save} disabled={saving || reading} className="w-full mt-2">{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Save customer</Button>
      </DialogContent>
    </Dialog>
  );
}
