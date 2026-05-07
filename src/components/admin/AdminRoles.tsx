import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ShieldCheck, UserPlus, X } from "lucide-react";
import { toast } from "sonner";

const ALL_ROLES = ["admin", "manager", "service_advisor", "technician", "parts", "customer"] as const;
type Role = typeof ALL_ROLES[number];

export default function AdminRoles() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addRole, setAddRole] = useState<Role>("service_advisor");
  const [target, setTarget] = useState<string>("");

  const load = async () => {
    setLoading(true);
    const [{ data: profs }, { data: r }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email").order("full_name"),
      supabase.from("user_roles").select("*"),
    ]);
    setUsers(profs ?? []);
    setRoles(r ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const rolesByUser = (uid: string) => roles.filter(r => r.user_id === uid).map(r => r.role as Role);

  const grant = async (uid: string, role: Role) => {
    const { error } = await supabase.from("user_roles").insert({ user_id: uid, role });
    if (error) return toast.error(error.message);
    toast.success(`Granted ${role}`);
    load();
  };
  const revoke = async (uid: string, role: Role) => {
    if (!confirm(`Remove ${role} from this user?`)) return;
    const { error } = await supabase.from("user_roles").delete().eq("user_id", uid).eq("role", role);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> Roles & Permissions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-2 p-3 border border-border/50 rounded">
          <div className="flex-1 min-w-[220px]">
            <div className="text-xs text-muted-foreground mb-1">User</div>
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
              <SelectContent>{users.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Role</div>
            <Select value={addRole} onValueChange={(v) => setAddRole(v as Role)}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>{ALL_ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button onClick={() => target && grant(target, addRole)} disabled={!target}>
            <UserPlus className="h-4 w-4 mr-1" /> Grant
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-1">
            {users.map(u => {
              const ur = rolesByUser(u.id);
              if (ur.length === 0) return null;
              return (
                <div key={u.id} className="flex items-center justify-between gap-2 p-2 border border-border/50 rounded">
                  <div>
                    <div className="text-sm font-medium">{u.full_name || u.email}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {ur.map(role => (
                      <Badge key={role} variant="secondary" className="gap-1">
                        {role}
                        <button onClick={() => revoke(u.id, role)} className="hover:text-destructive"><X className="h-3 w-3" /></button>
                      </Badge>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Roles: <strong>admin</strong> (full access), <strong>manager</strong> (admin-like + audit log), <strong>service_advisor</strong>, <strong>parts</strong>, <strong>technician</strong>, <strong>customer</strong>.
        </p>
      </CardContent>
    </Card>
  );
}
