import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, AppRole } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  allowedRoles?: AppRole[];
}

const ProtectedRoute = ({ children, requireAdmin = true, allowedRoles }: ProtectedRouteProps) => {
  const { user, isAdmin, isManager, hasAnyRole, isLoading, isPasswordRecovery } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (isPasswordRecovery && location.pathname !== "/set-password") {
    return <Navigate to="/set-password" replace />;
  }

  if ((user.user_metadata as any)?.must_set_password && location.pathname !== "/set-password") {
    return <Navigate to="/set-password" replace />;
  }

  // Default behavior: admin or manager can access. If allowedRoles passed, use it.
  const allowed = allowedRoles
    ? hasAnyRole(allowedRoles)
    : requireAdmin
      ? (isAdmin || isManager)
      : true;

  if (!allowed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
