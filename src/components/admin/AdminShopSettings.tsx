import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import AiCreditsBar from './AiCreditsBar';

const TITLES = ['technician', 'service_advisor', 'manager', 'parts', 'admin', 'other'];
const PAY_BASIS = [
  { value: 'labor_hours', label: 'Per Labor Hour' },
  { value: 'hourly_clock', label: 'Hourly (clock in/out)' },
  { value: 'salary', label: 'Salary' },
  { value: 'flat', label: 'Flat / Per Job' },
];

const AdminShopSettings = () => {
  const [settings, setSettings] = useState<any>(null);
  const [rates, setRates] = useState<any[]>([]);
  const [newRate, setNewRate] = useState({ name: '', hourly_rate: 0 });
  const [payDefaults, setPayDefaults] = useState<Record<string, any>>({});

  const load = async () => {
    const [s, r, p] = await Promise.all([
      supabase.from('shop_settings').select('*').eq('id', 1).single(),
      supabase.from('labor_rates').select('*').order('created_at'),
      supabase.from('employee_pay_defaults' as any).select('*'),
    ]);
    setSettings(s.data);
    setRates(r.data ?? []);
    const map: Record<string, any> = {};
    TITLES.forEach((t) => { map[t] = { employee_type: t, pay_basis: 'labor_hours', hourly_rate: 0, salary_amount: null }; });
    ((p.data ?? []) as any[]).forEach((d) => { map[d.employee_type] = d; });
    setPayDefaults(map);
  };
  useEffect(() => { load(); }, []);

  const saveSettings = async () => {
    const { id, updated_at, ...up } = settings;
    const { error } = await supabase.from('shop_settings').update({ ...up, updated_at: new Date().toISOString() }).eq('id', 1);
    if (error) return toast.error(error.message);
    toast.success('Settings saved');
  };

  const savePayDefault = async (t: string) => {
    const d = payDefaults[t];
    const { error } = await supabase.from('employee_pay_defaults' as any).upsert({
      employee_type: t,
      pay_basis: d.pay_basis,
      hourly_rate: Number(d.hourly_rate) || 0,
      salary_amount: d.salary_amount ? Number(d.salary_amount) : null,
    }, { onConflict: 'employee_type' });
    if (error) return toast.error(error.message);
    toast.success(`${t.replace('_', ' ')} pay defaults saved`);
  };

  const addRate = async () => {
    if (!newRate.name) return toast.error('Name required');
    await supabase.from('labor_rates').insert(newRate);
    setNewRate({ name: '', hourly_rate: 0 });
    load();
  };

  const setDefault = async (id: string) => {
    await supabase.from('labor_rates').update({ is_default: false }).neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('labor_rates').update({ is_default: true }).eq('id', id);
    load();
  };

  const deleteRate = async (id: string) => {
    await supabase.from('labor_rates').delete().eq('id', id);
    load();
  };

  if (!settings) return <div>Loading…</div>;

  return (
    <div className="space-y-4">
      <AiCreditsBar />
      <Card>
        <CardHeader><CardTitle>Shop Settings</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <div><Label>Sales Tax Rate (decimal, e.g. 0.07 = 7%)</Label>
            <Input type="number" step="0.001" value={settings.tax_rate} onChange={e => setSettings({ ...settings, tax_rate: parseFloat(e.target.value) || 0 })} />
          </div>
          <div><Label>Shop Supplies % (decimal)</Label>
            <Input type="number" step="0.001" value={settings.shop_supplies_pct} onChange={e => setSettings({ ...settings, shop_supplies_pct: parseFloat(e.target.value) || 0 })} />
          </div>
          <div><Label>Shop Supplies Max ($)</Label>
            <Input type="number" step="1" value={settings.shop_supplies_max} onChange={e => setSettings({ ...settings, shop_supplies_max: parseFloat(e.target.value) || 0 })} />
          </div>
          <div><Label>Estimate Valid Days</Label>
            <Input type="number" value={settings.estimate_valid_days} onChange={e => setSettings({ ...settings, estimate_valid_days: parseInt(e.target.value) || 14 })} />
          </div>
          <div><Label>Employee Labor Cost ($/hr)</Label>
            <Input type="number" step="0.01" value={settings.labor_cost_per_hour ?? 35} onChange={e => setSettings({ ...settings, labor_cost_per_hour: parseFloat(e.target.value) || 0 })} />
            <p className="text-xs text-muted-foreground mt-1">Used in profit reports to estimate employee cost per invoice.</p>
          </div>
          <div className="col-span-2"><Button onClick={saveSettings}>Save Settings</Button></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Labor Rates</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Name</TableHead><TableHead>Hourly Rate</TableHead><TableHead>Default</TableHead><TableHead></TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {rates.map(r => (
                <TableRow key={r.id}>
                  <TableCell>{r.name}</TableCell>
                  <TableCell>${Number(r.hourly_rate).toFixed(2)}/hr</TableCell>
                  <TableCell><Switch checked={r.is_default} onCheckedChange={() => setDefault(r.id)} /></TableCell>
                  <TableCell><Button size="icon" variant="ghost" onClick={() => deleteRate(r.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex gap-2 items-end border-t pt-3">
            <div className="flex-1"><Label>Name</Label><Input value={newRate.name} onChange={e => setNewRate({ ...newRate, name: e.target.value })} placeholder="e.g. Diagnostic" /></div>
            <div className="w-32"><Label>$/hr</Label><Input type="number" step="0.01" value={newRate.hourly_rate} onChange={e => setNewRate({ ...newRate, hourly_rate: parseFloat(e.target.value) || 0 })} /></div>
            <Button onClick={addRate}><Plus className="h-4 w-4 mr-1" /> Add</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Default Pay by Job Title</CardTitle>
          <p className="text-xs text-muted-foreground">
            New employees added with a given title will automatically inherit these pay defaults. Edit individual employees to override.
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Pay Basis</TableHead>
                <TableHead className="w-32">Hourly Rate</TableHead>
                <TableHead className="w-36">Salary ($/yr)</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {TITLES.map((t) => {
                const d = payDefaults[t] || { pay_basis: 'labor_hours', hourly_rate: 0, salary_amount: null };
                return (
                  <TableRow key={t}>
                    <TableCell className="capitalize font-medium">{t.replace('_', ' ')}</TableCell>
                    <TableCell>
                      <Select value={d.pay_basis} onValueChange={(v) => setPayDefaults({ ...payDefaults, [t]: { ...d, pay_basis: v } })}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {PAY_BASIS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input type="number" step="0.01" value={d.hourly_rate}
                        onChange={(e) => setPayDefaults({ ...payDefaults, [t]: { ...d, hourly_rate: parseFloat(e.target.value) || 0 } })} />
                    </TableCell>
                    <TableCell>
                      <Input type="number" step="0.01" value={d.salary_amount ?? ''}
                        onChange={(e) => setPayDefaults({ ...payDefaults, [t]: { ...d, salary_amount: e.target.value ? parseFloat(e.target.value) : null } })} />
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => savePayDefault(t)}>Save</Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminShopSettings;
