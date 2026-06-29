import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import PortalLayout from "@/components/portal/PortalLayout";
import TechLayout from "@/components/tech/TechLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

/**
 * Wraps a page in the layout that matches the signed-in user's role so
 * shared screens (Messages, Notification Settings) keep portal navigation
 * for every Garage Ace user type.
 */
const RolePortalShell = ({ children }: { children: ReactNode }) => {
  const { isLoading, hasAnyRole } = useAuth();

  if (isLoading) {
    return <div className="p-8 text-muted-foreground">Loading…</div>;
  }

  if (hasAnyRole(["admin", "manager", "owner"])) {
    return (
      <div className="min-h-screen bg-background safe-pt safe-pb">
        <div className="border-b border-border bg-card/60 backdrop-blur">
          <div className="container mx-auto px-4 py-2 flex items-center justify-between">
            <Button asChild variant="ghost" size="sm" className="-ml-2">
              <Link to="/admin/dashboard">
                <ArrowLeft className="h-4 w-4 mr-1" /> Admin
              </Link>
            </Button>
            <div className="text-xs text-muted-foreground">Garage Ace · Admin</div>
          </div>
        </div>
        {children}
      </div>
    );
  }

  if (hasAnyRole(["technician"])) {
    return <TechLayout>{children}</TechLayout>;
  }

  return <PortalLayout>{children}</PortalLayout>;
};

export default RolePortalShell;
