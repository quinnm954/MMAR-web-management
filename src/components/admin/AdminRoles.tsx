import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ShieldCheck, UserPlus, X, Search } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const ALL_ROLES = ["owner", "admin", "manager", "service_advisor", "technician", "parts", "customer"] as const;
type Role = typeof ALL_ROLES[number];

export default function AdminRoles() {
  const { user: currentUser, hasRole } = useAuth();
  const isOwner = hasRole('owner');
  
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "with_roles" | "no_roles" | Role>("all");
  const [perUserRole, setPerUserRole] = useState<Record<string, Role>>({});

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
    if (role === 'owner' && !isOwner) {
      toast.error('Only an owner can grant the owner role.');
      return;
    }
    const { error } = await supabase.from("user_roles").insert({ user_id: uid, role });
    if (error) return toast.error(error.message);
    toast.success(`Granted ${role}`);
    load();
  };
  const revoke = async (uid: string, role: Role) => {
    const isSelf = currentUser?.id === uid;
    if (role === 'owner' && !isOwner) {
      toast.error('Only an owner can revoke the owner role.');
      return;
    }
    if (isSelf && role === "admin") {
      const adminCount = roles.filter(r => r.role === "admin").length;
      if (adminCount <= 1) {
        toast.error("Can't remove the last admin. Grant admin to another user first.");
        return;
      }
      if (!confirm("⚠️ You are about to remove YOUR OWN admin role. You will immediately lose access to admin tools. Continue?")) return;
    } else if (isSelf) {
      if (!confirm(`Remove ${role} from your own account?`)) return;
    } else {
      if (!confirm(`Remove ${role} from this user?`)) return;
    }
    const { error } = await supabase.from("user_roles").delete().eq("user_id", uid).eq("role", role);
    if (error) return toast.error(error.message);
    load();
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter(u => {
      const ur = rolesByUser(u.id);
      if (filter === "with_roles" && ur.length === 0) return false;
      if (filter === "no_roles" && ur.length > 0) return false;
      if (filter !== "all" && filter !== "with_roles" && filter !== "no_roles" && !ur.includes(filter as Role)) return false;
      if (!q) return true;
      return (u.full_name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q);
    });
  }, [users, roles, search, filter]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> Roles & Permissions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="Search by name or email" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All users</SelectItem>
              <SelectItem value="with_roles">With any role</SelectItem>
              <SelectItem value="no_roles">No roles assigned</SelectItem>
              {ALL_ROLES.map(r => <SelectItem key={r} value={r}>Role: {r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No users match.</p>
        ) : (
          <div className="space-y-1">
            {filtered.map(u => {
              const ur = rolesByUser(u.id);
              const selected = perUserRole[u.id] ?? "service_advisor";
              const available = ALL_ROLES.filter(r => !ur.includes(r));
              return (
                <div key={u.id} className="flex flex-wrap items-center justify-between gap-2 p-3 border border-border/50 rounded">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{u.full_name || "(no name)"}</div>
                    <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {ur.length === 0 && <span className="text-xs text-muted-foreground italic">no roles</span>}
                      {ur.map(role => (
                        <Badge key={role} variant="secondary" className="gap-1">
                          {role}
                          <button onClick={() => revoke(u.id, role)} className="hover:text-destructive" aria-label={`Remove ${role}`}><X className="h-3 w-3" /></button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {available.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Select value={available.includes(selected) ? selected : available[0]} onValueChange={(v) => setPerUserRole(p => ({ ...p, [u.id]: v as Role }))}>
                        <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                        <SelectContent>{available.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                      </Select>
                      <Button size="sm" onClick={() => grant(u.id, perUserRole[u.id] ?? available[0])}>
                        <UserPlus className="h-4 w-4 mr-1" /> Grant
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Roles: <strong>admin</strong> (full access), <strong>manager</strong> (admin-like + audit log), <strong>service_advisor</strong>, <strong>parts</strong>, <strong>technician</strong>, <strong>customer</strong>. New signups default to <strong>customer</strong>.
        </p>
      </CardContent>
    </Card>
  );
}
