import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

type OnboardingState = "unknown" | "needed" | "complete";

const CustomerProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, isAdmin, isStaff, isLoading, isPasswordRecovery } = useAuth();
  const location = useLocation();
  const [onboarding, setOnboarding] = useState<OnboardingState>("unknown");

  useEffect(() => {
    if (!user || isAdmin || isStaff) {
      setOnboarding("unknown");
      return;
    }
    // Cached per-session decision so we don't re-query on every nav
    let cached: string | null = null;
    try {
      cached = sessionStorage.getItem(`onboarded:${user.id}`);
    } catch {}
    if (cached === "1" || cached === "skipped") {
      setOnboarding("complete");
      return;
    }

    let cancelled = false;
    (async () => {
      const [{ data: profile }, { count: vehicleCount }] = await Promise.all([
        supabase
          .from("profiles")
          .select("phone, address_line1, postal_code")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("vehicles")
          .select("id", { count: "exact", head: true })
          .eq("owner_id", user.id)
          .eq("is_active", true),
      ]);
      if (cancelled) return;
      const profileComplete =
        !!profile?.phone && !!profile?.address_line1 && !!profile?.postal_code;
      const hasVehicle = (vehicleCount ?? 0) > 0;
      const ready = profileComplete && hasVehicle;
      if (ready) {
        try {
          sessionStorage.setItem(`onboarded:${user.id}`, "1");
        } catch {}
      }
      setOnboarding(ready ? "complete" : "needed");
    })();

    return () => {
      cancelled = true;
    };
  }, [user, isAdmin, isStaff]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (isPasswordRecovery && location.pathname !== "/set-password") {
    return <Navigate to="/set-password" replace />;
  }

  if ((user.user_metadata as any)?.must_set_password && location.pathname !== "/set-password") {
    return <Navigate to="/set-password" replace />;
  }

  // Admin/staff should not land on the customer home, but can view specific portal pages directly.
  if (isAdmin || isStaff) {
    if (location.pathname === "/portal/dashboard" || location.pathname === "/portal/onboarding") {
      return <Navigate to={isAdmin ? "/admin/dashboard" : "/tech"} replace />;
    }
    return <>{children}</>;
  }

  // Wait for onboarding check to resolve before rendering protected content
  if (onboarding === "unknown") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (onboarding === "needed" && location.pathname !== "/portal/onboarding") {
    return <Navigate to="/portal/onboarding" replace />;
  }

  return <>{children}</>;
};

export default CustomerProtectedRoute;
