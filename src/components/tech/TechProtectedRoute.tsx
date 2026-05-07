import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

const TechProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, isLoading } = useAuth();
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
        .eq("role", "technician")
        .maybeSingle();
      setIsTech(!!data);
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
  if (!user) return <Navigate to={`/portal/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  if (!isTech) return <Navigate to="/" replace />;
  return <>{children}</>;
};

export default TechProtectedRoute;
