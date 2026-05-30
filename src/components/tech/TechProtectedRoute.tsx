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

  useEffect(() => {
    if (!user) { setChecking(false); return; }
    (async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["owner", "technician", "service_advisor", "manager", "parts", "admin"]);
      setIsTech((data ?? []).length > 0);
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
  return <>{children}</>;
};

export default TechProtectedRoute;
