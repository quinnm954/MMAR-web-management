import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/** Installed-app start screen: send each person to their own home screen. */
export default function AppLauncher() {
  const { user, isLoading } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (isLoading) return;
    if (!user) { nav("/login?redirect=/app", { replace: true }); return; }
    supabase.from("user_roles").select("role").eq("user_id", user.id).then(({ data }) => {
      const roles = (data ?? []).map((r) => r.role as string);
      if (roles.includes("admin") || roles.includes("owner")) nav("/admin/dashboard", { replace: true });
      else if (roles.includes("technician")) nav("/tech", { replace: true });
      else nav("/portal/dashboard", { replace: true });
    });
  }, [user, isLoading, nav]);
  return <div className="min-h-screen grid place-items-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
}
