import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

const TechProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, isLoading, isPasswordRecovery } = useAuth();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [isTech, setIsTech] = useState(false);
  const [agreementToken, setAgreementToken] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setChecking(false); return; }
    (async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["owner", "technician", "service_advisor", "manager", "parts", "admin"]);
      const ok = (data ?? []).length > 0;
      setIsTech(ok);
      if (ok) {
        const { data: ag } = await supabase.rpc("my_tech_agreement" as any);
        const r = ag as { required?: boolean; token?: string } | null;
        if (r?.required && r.token) setAgreementToken(r.token);
      }
      setChecking(false);
    })();
  }, [user]);

  if (isLoading || checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  if (isPasswordRecovery && location.pathname !== "/set-password") {
    return <Navigate to="/set-password" replace />;
  }
  if ((user.user_metadata as any)?.must_set_password && location.pathname !== "/set-password") {
    return <Navigate to="/set-password" replace />;
  }
  if (!isTech) return <Navigate to="/" replace />;
  if (agreementToken) return <Navigate to={`/tech-agreement/${agreementToken}?return=${encodeURIComponent(location.pathname)}`} replace />;
  return <>{children}</>;
};

export default TechProtectedRoute;
