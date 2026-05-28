import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

type Employee = {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  employee_type: string;
  pay_basis: string;
  hourly_rate: number;
  salary_amount: number | null;
  is_active: boolean;
  notes: string | null;
};

const TYPES = ['technician', 'service_advisor', 'manager', 'parts', 'admin', 'other'];
// Maps employee_type -> app_role enum value. Types not in this map cannot
// have a login account provisioned (no corresponding role exists).
const TYPE_TO_ROLE: Record<string, string> = {
  technician: 'technician',
  service_advisor: 'service_advisor',
  manager: 'manager',
  parts: 'parts',
  admin: 'admin',
};
const PAY_BASIS = [
  { value: 'labor_hours', label: 'Per Labor Hour (from estimate)' },
  { value: 'hourly_clock', label: 'Hourly (clock in/out)' },
  { value: 'salary', label: 'Salary' },
  { value: 'flat', label: 'Flat / Per Job' },
];

const empty: Employee = {
  id: '',
  user_id: null,
  full_name: '',
  email: '',
  phone: '',
  employee_type: 'technician',
  pay_basis: 'labor_hours',
  hourly_rate: 0,
  salary_amount: null,
  is_active: true,
  notes: '',
};

export default function AdminEmployees() {
  const [rows, setRows] = useState<Employee[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Employee>(empty);
  const [createLogin, setCreateLogin] = useState(false);
  const [saving, setSaving] = useState(false);
  const [payDefaults, setPayDefaults] = useState<Record<string, any>>({});

  const load = async () => {
    const [{ data, error }, defaults] = await Promise.all([
      supabase.from('employees' as any).select('*').order('full_name'),
      supabase.from('employee_pay_defaults' as any).select('*'),
    ]);
    if (error) {
      toast.error(error.message);
      return;
    }
    setRows((data ?? []) as any);
    const map: Record<string, any> = {};
    ((defaults.data ?? []) as any[]).forEach((d) => { map[d.employee_type] = d; });
    setPayDefaults(map);
  };

  useEffect(() => {
    load();
  }, []);

  const applyDefaults = (type: string, base: Employee): Employee => {
    const d = payDefaults[type];
    if (!d) return { ...base, employee_type: type };
    return {
      ...base,
      employee_type: type,
      pay_basis: d.pay_basis ?? base.pay_basis,
      hourly_rate: Number(d.hourly_rate) || 0,
      salary_amount: d.salary_amount ?? null,
    };
  };

  const openNew = () => {
    setForm(applyDefaults('technician', empty));
    setCreateLogin(false);
    setOpen(true);
  };
  const openEdit = (e: Employee) => {
    setForm(e);
    setCreateLogin(false);
    setOpen(true);
  };

  const onTypeChange = (v: string) => {
    // Only auto-fill defaults when creating a new employee
    setForm(form.id ? { ...form, employee_type: v } : applyDefaults(v, form));
  };

  const save = async () => {
    const fullName = form.full_name.trim();
    const normalizedEmail = form.email?.trim().toLowerCase() || null;
    if (!fullName) {
      toast.error('Name required');
      return;
    }
    setSaving(true);
    try {
      let linkedUserId = form.user_id || null;

      // Optionally provision an auth login for this employee
      if (!form.id && createLogin) {
        if (!normalizedEmail) {
          toast.error('Email is required to create a login account');
          setSaving(false);
          return;
        }
        if (!TYPE_TO_ROLE[form.employee_type]) {
          toast.error(
            `Type "${form.employee_type}" has no login role. Pick one of: ${Object.keys(TYPE_TO_ROLE).join(', ')}.`
          );
          setSaving(false);
          return;
        }
        const { data, error } = await supabase.functions.invoke('admin-create-employee-user', {
          body: {
            email: normalizedEmail,
            full_name: fullName,
            employee_type: form.employee_type,
          },
        });
        if (error || (data as any)?.error) {
          toast.error((data as any)?.error || error?.message || 'Failed to create login');
          setSaving(false);
          return;
        }
        linkedUserId = (data as any).user_id;
        toast.success(
          (data as any).reused
            ? 'Existing account linked — they will be prompted to set a new password on next sign-in'
            : 'Login created — they will be prompted to set a password on first sign-in'
        );
      }

      if (!linkedUserId && normalizedEmail) {
        const { data: matchingProfiles } = await supabase
          .from('profiles')
          .select('id')
          .ilike('email', normalizedEmail)
          .limit(1);
        linkedUserId = (matchingProfiles?.[0] as any)?.id ?? null;
      }

      let saveId = form.id;
      if (!saveId && linkedUserId) {
        const { data: linkedEmployees } = await supabase
          .from('employees' as any)
          .select('id, user_id')
          .eq('user_id', linkedUserId)
          .limit(1);
        saveId = (linkedEmployees?.[0] as any)?.id ?? '';
      }

      if (!saveId && normalizedEmail) {
        const { data: matchingEmployees } = await supabase
          .from('employees' as any)
          .select('id, user_id')
          .ilike('email', normalizedEmail)
          .limit(1);
        const existingEmployee = matchingEmployees?.[0] as any;
        if (existingEmployee?.id) {
          saveId = existingEmployee.id;
          linkedUserId = existingEmployee.user_id || linkedUserId;
        }
      }

      const payload: any = {
        full_name: fullName,
        email: normalizedEmail,
        phone: form.phone?.trim() || null,
        employee_type: form.employee_type,
        pay_basis: form.pay_basis,
        hourly_rate: Number(form.hourly_rate) || 0,
        salary_amount: form.salary_amount ? Number(form.salary_amount) : null,
        is_active: form.is_active,
        notes: form.notes || null,
        user_id: linkedUserId,
      };
      const q = saveId
        ? supabase.from('employees' as any).update(payload).eq('id', saveId)
        : supabase.from('employees' as any).insert(payload);
      const { error } = await q;
      if (error) {
        toast.error(error.message);
        setSaving(false);
        return;
      }

      if (linkedUserId) {
        await supabase
          .from('profiles')
          .update({ full_name: fullName, email: normalizedEmail })
          .eq('id', linkedUserId);
      }

      toast.success(!form.id && saveId ? 'Updated existing employee' : 'Saved');
      setOpen(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm('Delete this employee?')) return;
    const { error } = await supabase.from('employees' as any).delete().eq('id', id);
    if (error) return toast.error(error.message);
    load();
  };

  const fmt = (n: number) =>
    '$' + (Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const payLabel = (b: string) => PAY_BASIS.find((p) => p.value === b)?.label ?? b;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl">Employees</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}>
              <Plus className="h-4 w-4 mr-1" /> Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{form.id ? 'Edit' : 'New'} Employee</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Full Name</Label>
                <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Email</Label>
                  <Input value={form.email ?? ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Type</Label>
                  <Select value={form.employee_type} onValueChange={onTypeChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Pay Basis</Label>
                  <Select value={form.pay_basis} onValueChange={(v) => setForm({ ...form, pay_basis: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PAY_BASIS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Hourly Rate ($/hr)</Label>
                  <Input type="number" step="0.01" value={form.hourly_rate} onChange={(e) => setForm({ ...form, hourly_rate: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <Label>Salary ($/yr)</Label>
                  <Input type="number" step="0.01" value={form.salary_amount ?? ''} onChange={(e) => setForm({ ...form, salary_amount: e.target.value ? parseFloat(e.target.value) : null })} />
                </div>
              </div>
              {!form.id && (
                <div className="rounded-md border p-3 space-y-2 bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={createLogin}
                      onCheckedChange={setCreateLogin}
                      disabled={!TYPE_TO_ROLE[form.employee_type]}
                    />
                    <Label>Create login account for this employee</Label>
                  </div>
                  {TYPE_TO_ROLE[form.employee_type] ? (
                    <p className="text-[11px] text-muted-foreground">
                      A login will be created using the email above. Role:{' '}
                      <span className="font-mono">{TYPE_TO_ROLE[form.employee_type]}</span>.
                      On first sign-in they'll be prompted to set their own password.
                    </p>
                  ) : (
                    <p className="text-[11px] text-destructive">
                      Type "{form.employee_type}" has no login role and cannot be granted portal
                      access. Pick one of: {Object.keys(TYPE_TO_ROLE).join(', ')}.
                    </p>
                  )}
                </div>
              )}
              <div>
                <Label>Linked User ID (optional)</Label>
                <Input
                  placeholder="auth user uuid (auto-filled if creating a login above)"
                  value={form.user_id ?? ''}
                  onChange={(e) => setForm({ ...form, user_id: e.target.value || null })}
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  For techs, set this to the auth user's id so labor hours from their assigned ROs are attributed automatically.
                </p>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={form.notes ?? ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                <Label>Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
              <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Pay Basis</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">Salary</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-6">No employees yet.</TableCell></TableRow>
              ) : rows.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.full_name}</TableCell>
                  <TableCell className="capitalize text-xs">{e.employee_type.replace('_', ' ')}</TableCell>
                  <TableCell className="text-xs">{payLabel(e.pay_basis)}</TableCell>
                  <TableCell className="text-right">{fmt(e.hourly_rate)}/hr</TableCell>
                  <TableCell className="text-right">{e.salary_amount ? fmt(e.salary_amount) : '—'}</TableCell>
                  <TableCell className="text-xs">
                    {e.email && <div>{e.email}</div>}
                    {e.phone && <div>{e.phone}</div>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={e.is_active ? 'default' : 'secondary'}>{e.is_active ? 'Active' : 'Inactive'}</Badge>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(e)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => del(e.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
